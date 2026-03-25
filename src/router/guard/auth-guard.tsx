import { fetchAsyncRoutes } from "#src/api/route";
import { healthCheck } from "#src/api/system/health";
import { useCurrentRoute } from "#src/hooks/use-current-route";
import Exception500 from "#src/pages/exception/500";
import { hideLoading } from "#src/plugins/hide-loading";
import { setupLoading } from "#src/plugins/loading";
import { exception403Path, exception404Path, loginPath } from "#src/router/extra-info";
import { accessRoutes, whiteRouteNames } from "#src/router/routes";
import { isSendRoutingRequest } from "#src/router/routes/config";
import { generateRoutesFromBackend } from "#src/router/utils/generate-routes-from-backend";
import { generateRoutesByFrontend } from "#src/router/utils/generate-routes-from-frontend";

import { useAccessStore } from "#src/store/access";
import { usePreferencesStore } from "#src/store/preferences";

import { supabase } from "#src/store/supabaseClient";
import { useUserStore } from "#src/store/user";
import { useCallback, useEffect, useState } from "react";
import { matchRoutes, Navigate, useLocation, useNavigate, useSearchParams } from "react-router";
import { removeDuplicateRoutes } from "./utils";

/**
 * @zh 路由白名单 1. 不进行权限校验， 2. 不会触发请求，例如用户信息接口
 * @en Routes whitelist 1. No permission verification, 2. Will not trigger requests, such as user information interface
 * @example "privacy-policy", "terms-of-service" and so on.
 */
const noLoginWhiteList = Array.from(whiteRouteNames).filter(item => item !== loginPath);

interface AuthGuardProps {
	children?: React.ReactNode
}

/**
 * @zh AuthGuard 组件，用于权限验证，代码的顺序很重要，不要随意调整
 * @en AuthGuard component, used for permission verification. The order of the code is important and should not be arbitrarily adjusted
 */
export function AuthGuard({ children }: AuthGuardProps) {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const currentRoute = useCurrentRoute();
	const { pathname, search } = useLocation();
	const [isLogin, setIsLogin] = useState<boolean | null>(null);
	const [isServerHealth, setIsServerHealth] = useState(true);
	const [hasErrorAuth, setHasErrorAuth] = useState(false);

	const isAuthorized = useUserStore(state => Boolean(state.id));

	const getUserInfo = useUserStore(state => state.getUserInfo);
	const userPermissions = useUserStore(state => state.permissions);
	const { setAccessStore, isAccessChecked, routeList } = useAccessStore();
	const { enableBackendAccess, enableFrontendAceess } = usePreferencesStore(state => state);

	const isPathInNoLoginWhiteList = noLoginWhiteList.includes(pathname);

	useEffect(() => {
		const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
			setIsLogin(Boolean(session));
		});

		return () => listener.subscription.unsubscribe();
	}, []);

	useEffect(() => {
		async function checkSystem() {
			try {
				await healthCheck();
				setIsServerHealth(true);
			}
			catch {
				setIsServerHealth(false);
			}
		}

		checkSystem();

		const interval = setInterval(() => {
			checkSystem();
		}, 5 * 60 * 1000);

		return () => clearInterval(interval);
	}, []);

	const fetchUserInfoAndRoutes = useCallback(async (hasLoading?: boolean) => {
		/**
		 * @zh 登录跳转，防止闪烁
		 * @en Login redirect, prevent flicker
		 */
		if (hasLoading)
			setupLoading();

		/**
		 * @zh 初始化一个空数组来存放 Promise 对象
		 * @en Initialize an empty array to hold Promise objects
		 */
		const promises = [];

		/**
		 * @zh 获取用户信息
		 * @en Fetch user information
		 */
		promises.push(getUserInfo());

		/**
		 * @zh 启用了后端路由，且路由从单独接口中获取，则发起请求
		 * @en If backend routing is enabled and the route is obtained from a separate interface, then initiate a request
		 */
		if (enableBackendAccess && isSendRoutingRequest) {
			promises.push(fetchAsyncRoutes());
		}

		const results = await Promise.allSettled(promises);
		const [userInfoResult, routeResult] = results;
		const routes = [];
		const latestPermssions: string[] = [];
		/**
		 * @zh 从用户接口中获取角色信息
		 * @en Fetch role information from the user interface
		 */

		if (userInfoResult.status === "fulfilled" && "permissions" in userInfoResult.value) {
			latestPermssions.push(...userInfoResult.value?.permissions ?? []);
		}
		/**
		 * @zh 启用了后端路由且路由从用户接口中获取
		 * @en If backend routing is enabled and the route is obtained from the user interface
		 */
		if (enableBackendAccess && !isSendRoutingRequest && userInfoResult.status === "fulfilled" && "menus" in userInfoResult.value) {
			routes.push(...await generateRoutesFromBackend(userInfoResult.value?.menus ?? []));
		}
		/**
		 * @zh 启用了后端路由且路由从单独接口中获取
		 * @en If backend routing is enabled and the route is obtained from a separate interface
		 */
		if (enableBackendAccess && isSendRoutingRequest && routeResult.status === "fulfilled" && "result" in routeResult.value) {
			routes.push(...await generateRoutesFromBackend(routeResult.value?.result ?? []));
		}

		/**
		 * @zh 启用了前端路由
		 * @en If frontend routing is enabled
		 */
		if (enableFrontendAceess) {
			routes.push(...generateRoutesByFrontend(accessRoutes, latestPermssions));
		}

		const uniqueRoutes = removeDuplicateRoutes(routes);
		setAccessStore(uniqueRoutes);

		const hasError = results.some(result => result.status === "rejected");
		/**
		 * @zh 网络请求失败，跳转到 500 页面
		 * @en Network request failed, redirect to 500 page
		 */
		setHasErrorAuth(!!hasError);
		if (hasError) {
			return;
		}

		/**
		 *
		 * @zh 添加完动态路由后，使用 replace 替换当前路由，触发程序重新匹配到正确的路由
		 * 1. 浏览器导航进入动态路由地址，例如 /system/user
		 * 2. 动态路由未添加到路由，所以地址栏中依然是 /system/user 但匹配到的路由是 fallback (path = "*") 路由
		 * 3. 添加完动态路由后，使用 replace 替换当前路由，触发程序重新匹配到 /system/user 路由
		 *
		 * @en After adding dynamic routes, use replace to force the router to re-match the current URL against the newly added routes
		 */
		navigate(`${pathname}${search}`, {
			replace: true,
			/**
			 * @zh 保证替换路由前不会显示 404 页面（登录页面，网速切换为 3G 会闪烁显示 404 页面）
			 * @en Ensure that the 404 page will not be displayed before replacing the route
			 */
			flushSync: true,
		});
	}, []);
	/**
	 * @zh 异步获取用户信息和路由配置
	 * @en Fetch user information and route configuration asynchronously
	 */
	useEffect(() => {
		if (whiteRouteNames.includes(pathname) || !isLogin || isAuthorized)
			return;

		fetchUserInfoAndRoutes(true);
	}, [pathname, isLogin, isAuthorized]);

	useEffect(() => {
		if (!isLogin)
			return;

		const interval = setInterval(() => {
			fetchUserInfoAndRoutes();
		}, 5 * 60 * 1000);

		return () => clearInterval(interval);
	}, [isLogin]);

	if (!isServerHealth || hasErrorAuth) {
		return <Exception500 hiddenBtnBackHome />;
	}

	/**
	 * @zh 路由白名单
	 * @en Route whitelist
	 * @see {noLoginWhiteList}
	 */
	if (isPathInNoLoginWhiteList) {
		hideLoading();
		return children;
	}

	/**
	 * @zh 未登录条件下的处理逻辑
	 * @en Processing logic under unlogged conditions
	 */
	/* --------------- Start ------------------ */
	if (isLogin === false) {
		hideLoading();
		// 未登录且目标页不是登录页，则跳转到登录页
		if (pathname !== loginPath) {
			// pathname 长度大于 1，则携带当前路径跳转登录页，否则直接跳转登录页
			const redirectPath = pathname.length > 1 ? `${loginPath}?redirect=${pathname}${search}` : loginPath;
			return (
				<Navigate
					to={redirectPath}
					replace
				/>
			);
		}
		// 未登录且目标页是登录页，保留登录页
		else {
			return children;
		}
	}
	/* --------------- End ------------------ */

	/**
	 * @zh 登录条件下的处理逻辑
	 * @en Processing logic under logged conditions
	 */
	/* --------------- Start ------------------ */

	/**
	 * @zh 已登录条件下，匹配 login 路由，跳转到首页
	 * 放到用户信息前，因为 login 路由不会请求用户信息，所以放在前面判断
	 *
	 * @en Under logged conditions, match the login route and jump to the home page
	 * Put it before user information, because the login route will not request user information, so put it in front to judge
	 */
	if (pathname === loginPath) {
		/**
		 * @example login?redirect=/system/user
		 */
		const redirectPath = searchParams.get("redirect");
		if (redirectPath?.length && redirectPath !== pathname) {
			return (
				<Navigate
					to={redirectPath}
					replace
				/>
			);
		}
		return (
			<Navigate
				to={import.meta.env.VITE_BASE_HOME_PATH}
				replace
			/>
		);
	}

	/**
	 * @zh 等待获取用户信息
	 * @en  Waiting for user information to be obtained
	 */
	if (!isAuthorized) {
		return null;
	}
	/**
	 * @zh 等待获取路由信息
	 * @en Waiting for route information to be obtained
	 */
	if (!isAccessChecked) {
		return null;
	}

	/**
	 * @zh 隐藏加载动画
	 * @en Hide loading animation
	 */
	hideLoading();

	/**
	 * @zh 如果是根路由则跳转到首页（获取完用户信息之后跳转到默认首页，防止请求两次用户信息接口）
	 * @en If it is the root route, jump to the home page (jump to the default home page after obtaining user information to prevent requesting twice for user information interface)
	 * @zh pathname 返回的是相对 import.meta.env.BASE_URL 的路径，所以这里是相对于 BASE_URL 的根路由 "/"
	 * @en pathname returns the path relative to import.meta.env.BASE_URL, so here is the root route "/" relative to BASE_URL
	 */
	if (pathname === "/") {
		return (
			<Navigate
				to={import.meta.env.VITE_BASE_HOME_PATH}
				replace
			/>
		);
	}

	/* --------------- End ------------------ */

	/**
	 * @zh 路由权限校验逻辑
	 * @en Route permission verification logic
	 */
	const routeRoles = currentRoute?.handle?.roles;
	const ignoreAccess = currentRoute?.handle?.ignoreAccess;

	/**
	 * @zh 忽略权限校验
	 * @en Ignore permission verification
	 */
	if (ignoreAccess === true) {
		return children;
	}

	const matches = matchRoutes(
		routeList,
		pathname,
		/**
		 * @zh pathname 返回的是相对 import.meta.env.BASE_URL 的路径，所以不需要指定第三个参数 basename 了
		 * @en pathname returns the path relative to import.meta.env.BASE_URL, so there is no need to specify the third parameter basename
		 */
	) ?? [];

	const hasChildren = matches[matches.length - 1]?.route?.children?.filter(item => !item.index)?.length;
	/**
	 * @zh 如果当前路由有子路由，则跳转到 404 页面
	 * @en If the current route has sub-routes, jump to the 404 page
	 */
	if (hasChildren && hasChildren > 0) {
		return (
			<Navigate
				to={exception404Path}
				replace
			/>
		);
	}

	/**
	 * @zh 角色权限校验
	 * @en Role permission verification
	 */
	const hasRoutePermission = userPermissions.some(role => routeRoles?.includes(role));
	/**
	 * @zh 权限校验逻辑：
	 * 1. 如果路由上没有携带 roles，视为无权限路由，等同于 ignoreAccess 为 true
	 * 2. 未通过权限校验的路由，取消当前路由导航，并转到 403 页面
	 *
	 * @en Role permission verification logic:
	 * 1. If there is no role on the route, it is considered as a permissionless route, equivalent to ignoreAccess being true
	 * 2. For routes that do not pass permission verification, cancel the current route navigation and jump to the 403 page
	 */
	if (routeRoles && routeRoles.length && !hasRoutePermission) {
		return (
			<Navigate
				to={exception403Path}
				replace
			/>
		);
	}

	return children;
}
/**
 * 验证路由跳转是否正确的步骤：
 * 1. 未登录情况下，输入 login 路由
 * 2. 未登录情况下，输入非 login 路由
 * 3. 已登录情况下，使用系统的退出登录，然后再次登录
 * 4. 任选一个非 home 页面，使用开发者工具清除 localStorage，刷新页面之后进行登录
 * 5. 已登录情况下，输入 login 路由
 * 6. 已登录情况下，输入非 login 路由
 * 7. 已登录情况下，输入 http://localhost:3333 跳转到 /home 路由，用户接口发送一次
 * 8. 已登录情况下，输入 http://localhost:3333/ 跳转到 /home 路由，用户接口发送一次
 * 9. 已登录情况下，输入 http://localhost:3333/home 跳转到 /home 路由，用户接口发送一次
 */
