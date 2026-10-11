import { authProvider } from "#src/api/auth";
import { PageError } from "#src/components/page-error";
import { usePreferences } from "#src/hooks/use-preferences";
import { isThemeViewTransitionRunning } from "#src/layout/layout-header/components/theme-switch-state";
import { AuthGuard } from "#src/router/guard";
import { whiteRouteNames } from "#src/router/routes";
import { useAccessStore } from "#src/store/access";
import { useUserStore } from "#src/store/user";
import { isString } from "#src/utils/is";
import { NProgress } from "#src/utils/progress";
import { toggleHtmlClass } from "#src/utils/toggle-html-class";

import { useEffect, useLayoutEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useMatches } from "react-router";

/**
 * @zh 根布局组件
 * @en Root layout component
 */
export default function LayoutRoot() {
	const matches = useMatches();
	const { t } = useTranslation();
	const location = useLocation();
	const { language, isDark, enableDynamicTitle } = usePreferences();
	const [isLogin, setIsLogin] = useState(false);
	const isAccessChecked = useAccessStore(state => state.isAccessChecked);
	const isAuthorized = useUserStore(state => Boolean(state.id));

	useEffect(() => {
		const unsubscribe = authProvider.onAuthStateChange(session => setIsLogin(Boolean(session)));
		return unsubscribe;
	}, []);

	/* document title */
	useEffect(() => {
		if (!enableDynamicTitle) {
			return;
		}
		/**
		 * @zh authGuardDependencies 为将要请求用户信息的 useEffect 的依赖项，如果为 true 当前路由为 404 路由，则不替换 document.title
		 * @en authGuardDependencies is the dependency of useEffect that will request user information. If it's true,
		 */
		const authGuardDependencies = !whiteRouteNames.includes(location.pathname) && isLogin && !isAuthorized;

		// ❗ chưa load xong routes thì không set title
		if (!isAccessChecked || authGuardDependencies) {
			return;
		}

		if (!authGuardDependencies) {
			const currentRoute = matches[matches.length - 1];
			const documentTitle = currentRoute.handle?.title as React.ReactElement<{ children: string }> | string;
			const newTitle = isString(documentTitle) ? documentTitle : documentTitle?.props?.children;
			document.title = t(newTitle) || document.title;
		}
	}, [enableDynamicTitle, language, location, isAccessChecked, isAuthorized, isLogin, matches, t]);

	/* tailwind theme */
	// useLayoutEffect: gắn class trước khi trình duyệt tính lại style, để kịp tắt transition
	useLayoutEffect(() => {
		// Tắt mọi CSS transition trong lúc đổi theme — nếu không, các phần tử có transition màu
		// (Card, Button, Tag…) chuyển màu chậm hơn phần còn lại → chỗ đen chỗ trắng trong vài trăm ms
		const root = document.documentElement;
		root.classList.add("stop-transition");
		if (isDark) {
			toggleHtmlClass("dark").add();
		}
		else {
			toggleHtmlClass("dark").remove();
		}
		root.style.colorScheme = isDark ? "dark" : "light";
		// Đang chạy hiệu ứng vòng tròn của nút đổi theme thì để theme-button tự gỡ khi hiệu ứng xong —
		// gỡ sớm thì header / sidebar / tab (transition-all) có style cập nhật trễ sẽ chuyển màu chậm ngay trong vòng tròn
		const releaseTransition = () => {
			if (!isThemeViewTransitionRunning())
				root.classList.remove("stop-transition");
		};
		// Đợi 2 frame cho màu mới áp xong rồi mới bật lại transition
		let frame = requestAnimationFrame(() => {
			frame = requestAnimationFrame(releaseTransition);
		});
		return () => {
			cancelAnimationFrame(frame);
			// Không để class kẹt lại (mất transition toàn app) nếu theme đổi tiếp hoặc component bị gỡ giữa chừng
			releaseTransition();
		};
	}, [isDark]);

	/**
	 * @zh 关闭页面加载进度条，配合 ROOT_ROUTE_ID 路由的 loader 和 shouldRevalidate 使用
	 * @en Close the page loading progress bar, used with the loader and shouldRevalidate of the ROOT_ROUTE_ID route
	 */
	useEffect(() => {
		NProgress.done();
	}, [location.pathname]);

	return (
		<ErrorBoundary FallbackComponent={PageError}>
			<AuthGuard>
				<Outlet />
			</AuthGuard>
		</ErrorBoundary>
	);
}
