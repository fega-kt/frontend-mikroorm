import type { RouteObject } from "react-router";

import { $t } from "#src/locales";
import { exception403Path, exception404Path, exception500Path, exceptionUnknownComponentPath } from "#src/router/extra-info/route-path";
import { lazy } from "react";

const NotFound = lazy(() => import("#src/pages/exception/404"));
const Exception403 = lazy(() => import("#src/pages/exception/403"));
const Exception500 = lazy(() => import("#src/pages/exception/500"));
const ExceptionUnknownComponent = lazy(() => import("#src/pages/exception/unknown-component"));

const routes: RouteObject[] = [
	{
		path: exception403Path,
		id: "403",
		Component: Exception403,
		handle: {
			title: $t("common.menu.exception_403"),
			hideInMenu: true,
		},
	},
	{
		path: exception404Path,
		id: "404-page",
		Component: NotFound,
		handle: {
			title: $t("common.menu.exception_404"),
			hideInMenu: true,
		},
	},
	{
		path: exception500Path,
		id: "500",
		Component: Exception500,
		handle: {
			title: $t("common.menu.exception_500"),
			hideInMenu: true,
		},
	},
	{
		path: exceptionUnknownComponentPath,
		id: "not-found-component",
		Component: ExceptionUnknownComponent,
		handle: {
			title: $t("common.menu.exceptionUnknownComponent"),
			hideInMenu: true,
		},
	},
	{
		path: "*",
		id: "404",
		Component: NotFound,
		handle: {
			title: $t("common.menu.exception_404"),
			hideInMenu: true,
		},
	},
];

export default routes;
