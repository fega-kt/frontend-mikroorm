import type { RouteObject } from "react-router";

import { exception500Path } from "#src/router/extra-info/route-path";
import { lazy } from "react";

const NotFound = lazy(() => import("#src/pages/exception/404"));
const Exception500 = lazy(() => import("#src/pages/exception/500"));

const routes: RouteObject[] = [
	{
		path: exception500Path,
		id: "500",
		Component: Exception500,
		handle: {
			title: "500",
			hideInMenu: true,
		},
	},
	{
		path: "*",
		id: "404",
		Component: NotFound,
		handle: {
			title: "404",
			hideInMenu: true,
		},
	},
];

export default routes;
