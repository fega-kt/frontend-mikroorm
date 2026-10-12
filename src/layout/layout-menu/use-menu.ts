import type { MenuProps } from "antd";

import { useCurrentRoute } from "#src/hooks/use-current-route";
import { removeTrailingSlash } from "#src/router/utils/remove-trailing-slash";
import { useAccessStore } from "#src/store/access";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useMatches, useNavigate } from "react-router";

import { useLayout } from "../hooks";
import { ADMIN_BACK_KEY, ADMIN_ENTRY_KEY, firstAdminPath, isAdminPath, scopeMenus } from "./admin-scope";
import { findDeepestFirstItem, findRootMenuByPath, translateMenus } from "./utils";

export function useMenu() {
	const wholeMenus = useAccessStore(state => state.wholeMenus);
	const { isMixedNav, isTwoColumnNav } = useLayout();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const allMenus = useMemo(() => translateMenus(wholeMenus, t), [wholeMenus, t]);

	const { pathname } = useCurrentRoute();
	const matches = useMatches();
	/**
	 * 混合菜单模式下需要拆分 menu 的 items
	 */
	const shouldSplitMenuItems = useMemo(
		() => isMixedNav || isTwoColumnNav,
		[isMixedNav, isTwoColumnNav],
	);

	/** Đang ở khu quản trị (theo currentActiveMenu nếu có, không thì theo pathname) → sidebar hiện menu quản trị */
	const activePath = removeTrailingSlash(matches.findLast(m => m.handle?.currentActiveMenu)?.handle?.currentActiveMenu ?? pathname);
	const inAdminScope = isAdminPath(activePath);
	const translatedMenus = useMemo(
		() => scopeMenus(allMenus, { admin: inAdminScope, t }),
		[allMenus, inAdminScope, t],
	);

	/**
	 * 混合导航模式下，侧边导航的顶级菜单 key
	 */
	const sideNavMenuKeyInSplitMode = useMemo(() => {
		if (!shouldSplitMenuItems)
			return "";

		// Try to find active menu from currentActiveMenu first
		const activeMenuPath = matches.findLast(routeItem =>
			routeItem.handle?.currentActiveMenu,
		)?.handle?.currentActiveMenu;

		// Fallback to current pathname if no currentActiveMenu found
		const targetPath = activeMenuPath ? removeTrailingSlash(activeMenuPath) : removeTrailingSlash(pathname);

		const { rootMenuPath } = findRootMenuByPath(translatedMenus, targetPath);
		return rootMenuPath ?? "";
	}, [shouldSplitMenuItems, pathname, matches, translatedMenus]);

	/* 混合菜单模式下需要拆分 menu 的 items */
	const splitSideNavItems = useMemo(
		() => {
			const foundMenu = translatedMenus.find(item => item?.key === sideNavMenuKeyInSplitMode);
			if (!foundMenu) {
				return [];
			}
			return foundMenu?.children ?? [foundMenu];
		},
		[sideNavMenuKeyInSplitMode, translatedMenus],
	);

	/**
	 * 头部菜单
	 */
	const topNavItems = useMemo(() => {
		if (!shouldSplitMenuItems) {
			return translatedMenus;
		}
		return translatedMenus.map((item) => {
			return {
				...item,
				/* children 为空数组，无法触发 menu 的 onSelect 事件 */
				children: undefined,
			};
		});
	}, [shouldSplitMenuItems, translatedMenus]);

	/**
	 * 侧边菜单
	 */
	const sideNavItems = useMemo(() => {
		return shouldSplitMenuItems ? splitSideNavItems : translatedMenus;
	}, [shouldSplitMenuItems, splitSideNavItems, translatedMenus]);

	/**
	 * 菜单点击事件处理
	 */
	const handleMenuSelect = (key: string, mode: MenuProps["mode"]) => {
		if (key === ADMIN_BACK_KEY) {
			navigate(import.meta.env.VITE_BASE_HOME_PATH || "/home");
			return;
		}
		if (key === ADMIN_ENTRY_KEY) {
			const target = firstAdminPath(allMenus);
			if (target)
				navigate(target);
			return;
		}
		if (key === removeTrailingSlash(pathname)) {
			return;
		}
		/* 1. 非混合导航模式 2. 混合导航模式下的侧边导航 */
		if (!shouldSplitMenuItems || mode !== "horizontal") {
			// eslint-disable-next-line regexp/no-unused-capturing-group
			if (/http(s)?:/.test(key)) {
				window.open(key);
			}
			else {
				navigate(key);
			}
		}
		else {
			/* 混合导航模式下的顶部导航 */
			const rootMenu = translatedMenus.find(item => item?.key === key);
			const targetMenu = findDeepestFirstItem(rootMenu?.children ?? []);
			/* 点击顶部的导航默认跳转到菜单下的第一个子项 */
			if (!targetMenu) {
				navigate(key);
			}
			else {
				navigate(targetMenu.key);
			}
		}
	};

	return {
		handleMenuSelect,
		sideNavMenuKeyInSplitMode,
		topNavItems,
		sideNavItems,
	};
}
