import type { AppRouteRecordRaw } from "#src/router/types";
import type { ComponentType, LazyExoticComponent } from "react";
import { Iframe } from "#src/components/iframe";
import { PageSkeleton } from "#src/components/page-skeleton";
import ContainerLayout from "#src/layout/container-layout";
import { createElement, lazy, Suspense, useState } from "react";
import { Outlet } from "react-router";
import { addRouteIdByPath } from "./add-route-id-by-path";

const ExceptionUnknownComponent = lazy(() => import("#src/pages/exception/unknown-component"));

/**
 * @zh 异步获取页面组件
 * @en Async load page components
 */
const pageModules = import.meta.glob([
	"/src/pages/**/*.tsx",
	// Exclude exception pages from lazy loading
	"!/src/pages/exception/**/*.tsx",
	"!/src/pages/**/loading.tsx",
]);

/** Khung chờ riêng của trang: loading.tsx cạnh file trang (nhỏ, nạp sẵn để hiện được ngay khi trang đang tải) */
const loadingModules = import.meta.glob<{ default: ComponentType }>("/src/pages/**/loading.tsx", { eager: true });

function getPageLoading(key: string): ComponentType {
	return loadingModules[key.replace(/[^/]+\.tsx$/, "loading.tsx")]?.default ?? PageSkeleton;
}

/** Trang đã tải xong chunk: render thẳng, không qua Suspense */
const loadedPages = new Map<string, ComponentType>();
const pageLoads = new Map<string, Promise<ComponentType>>();
const pageComponents = new Map<string, ComponentType>();

function loadPage(key: string) {
	let promise = pageLoads.get(key);
	if (!promise) {
		// glob chỉ biết trả về Promise<unknown>; mọi file trong pages đều export default là component
		promise = (pageModules[key] as () => Promise<{ default: ComponentType }>)().then((mod) => {
			loadedPages.set(key, mod.default);
			return mod.default;
		});
		promise.catch(() => pageLoads.delete(key));
		pageLoads.set(key, promise);
	}
	return promise;
}

/**
 * Một component cho mỗi file trang (nhiều route dùng chung một trang thì dùng chung, tránh suspend lại).
 * Chunk đã tải sẵn thì render thẳng; chưa thì qua lazy, trong lúc chờ hiện loading.tsx của trang (không có thì khung trung tính).
 */
function getPageComponent(key: string) {
	let Page = pageComponents.get(key);
	if (!Page) {
		const LazyPage: LazyExoticComponent<ComponentType> = lazy(() => loadPage(key).then(component => ({ default: component })));
		const Loading = getPageLoading(key);
		Page = (props: object) => {
			// Chốt lúc mount: đổi type giữa chừng sẽ mount lại trang và mất state
			const [Loaded] = useState(() => loadedPages.get(key));
			return Loaded
				? createElement(Loaded, props)
				: createElement(Suspense, { fallback: createElement(Loading) }, createElement(LazyPage, props));
		};
		pageComponents.set(key, Page);
	}
	return Page;
}

let preloadInFlight = false;

/** Đang tải sẵn chạy nền — handler vite:preloadError dựa vào đây để không reload trang vì lỗi của tải sẵn */
export function isPreloadingPages() {
	return preloadInFlight;
}

/**
 * Tải sẵn chunk các trang lúc trình duyệt rảnh, lần lượt từng trang để không tranh băng thông với request đang chạy.
 * Chỉ bật ở bản build: ở dev mỗi trang phải biên dịch, tải sẵn cả app làm máy nặng.
 */
function preloadPages(keys: string[]) {
	if (!import.meta.env.PROD)
		return;
	const queue = [...new Set(keys)].filter(key => !loadedPages.has(key));
	const idle = (callback: () => void) => ("requestIdleCallback" in window ? window.requestIdleCallback(callback) : setTimeout(callback, 200));
	const next = () => {
		const key = queue.shift();
		if (!key)
			return;
		preloadInFlight = true;
		loadPage(key)
			.then(() => idle(next))
			// Lỗi (thường do vừa deploy, chunk cũ không còn): dừng tải sẵn, trang sẽ tải khi người dùng mở
			.catch(() => {})
			.finally(() => {
				preloadInFlight = false;
			});
	};
	idle(next);
}

/**
 * @zh 根据路由获取组件路径
 * @en Get component path based on route
 */
export function getComponentPathByRoute(route: AppRouteRecordRaw & { component?: string }) {
	if (route.component) {
		return `/src/pages${route.component}`;
	}
	else {
		return `/src/pages${route.path}/index.tsx`;
	}
}

/**
 * @zh 根据后端路由配置生成前端路由
 * @en Generate frontend routes based on backend route configurations
 */
export async function generateRoutesFromBackend(backendRoutes: Array<AppRouteRecordRaw>) {
	const pageModulePaths = Object.keys(pageModules);
	if (!backendRoutes?.length)
		return [];
	const usedPageKeys: string[] = [];

	/**
	 * @zh 动态加载并设置路由组件
	 * @en Dynamically load and set route components
	 * @param route 路由配置对象
	 * @param componentPath 组件文件路径
	 */
	const loadRouteComponent = async (route: AppRouteRecordRaw, componentPath: string) => {
		const modulePath = componentPath;
		const moduleIndex = pageModulePaths.findIndex(path => path === modulePath);

		if (moduleIndex !== -1) {
			const modulePathKey = pageModulePaths[moduleIndex];
			usedPageKeys.push(modulePathKey);
			route.Component = getPageComponent(modulePathKey);
		}
		else {
			console.warn(`[Frontend component not found]: ${componentPath}`);
			route.Component = ExceptionUnknownComponent;
		}
	};

	/**
	 * 转换路由配置
	 * @param route 原始路由配置
	 * @param parentPath 父级路径（用于嵌套路由）
	 * @returns 转换后的路由配置
	 */
	const transformRoute = async (route: AppRouteRecordRaw, parentComponentPath?: string): Promise<AppRouteRecordRaw> => {
		const transformedRoute: AppRouteRecordRaw = {
			...route,
			handle: {
				...route.handle,
				backstage: true,
			},
		};

		// 处理 index 路由（继承父级路径）
		if (transformedRoute.index === true && parentComponentPath) {
			await loadRouteComponent(transformedRoute, parentComponentPath);
		}
		// 处理 iframe 路由
		else if (transformedRoute.handle?.iframeLink) {
			transformedRoute.Component = Iframe;
		}
		// 处理外部链接路由
		else if (transformedRoute.handle?.externalLink) {
			// 外部链接不需要组件
		}
		// 处理有子路由的情况
		else if (transformedRoute.children?.length) {
			transformedRoute.Component = parentComponentPath ? Outlet : ContainerLayout;
		}
		// 处理普通路由
		else {
			await loadRouteComponent(transformedRoute, getComponentPathByRoute(transformedRoute));
		}

		// 递归处理子路由
		if (transformedRoute.children?.length) {
			transformedRoute.children = await Promise.all(
				transformedRoute.children.map(child =>
					transformRoute(child, getComponentPathByRoute(transformedRoute)),
				),
			);
		}

		return transformedRoute;
	};

	/**
	 * 标准化路由配置，确保每个路由都有子路由
	 */
	const normalizeRouteStructure = (route: AppRouteRecordRaw): AppRouteRecordRaw => {
		if (!route.children?.length) {
			return {
				...route,
				children: [{
					index: true,
					handle: { ...route.handle },
				}],
			} as AppRouteRecordRaw;
		}
		return route;
	};

	// 处理路由配置
	const normalizedRoutes = backendRoutes.map(normalizeRouteStructure);
	const transformedRoutes = await Promise.all(
		normalizedRoutes.map(route => transformRoute(route)),
	);
	preloadPages(usedPageKeys);

	return addRouteIdByPath(transformedRoutes);
}
