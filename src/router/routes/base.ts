import type { AppRouteRecordRaw, RouteFileModule } from "#src/router/types";

import { loginPath } from "#src/router/extra-info";
import { ascending } from "#src/router/utils/ascending";
import { mergeRouteModules } from "#src/router/utils/merge-route-modules";
import { traverseTreeValues } from "#src/utils/tree";

import { coreRoutes } from "./core";

// Only core + external routes — NO modules/static glob, so this file is safe
// to import from store/access.ts without creating a circular dependency.
export const externalRouteFiles: RouteFileModule = import.meta.glob("./external/**/*.ts", { eager: true });
export const externalRoutes: AppRouteRecordRaw[] = mergeRouteModules(externalRouteFiles);

export const baseRoutes: AppRouteRecordRaw[] = ascending([
	...coreRoutes,
	...externalRoutes,
]);

export const whiteRouteNames = [
	loginPath,
	...traverseTreeValues(externalRoutes, route => route.path),
];
