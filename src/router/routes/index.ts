import type { AppRouteRecordRaw, RouteFileModule } from "#src/router/types";

import { mergeRouteModules } from "#src/router/utils/merge-route-modules";

export { baseRoutes, externalRouteFiles, externalRoutes, whiteRouteNames } from "./base";

export const staticRouteFiles: RouteFileModule = import.meta.glob("./static/**/*.ts", { eager: true });
export const dynamicRouteFiles: RouteFileModule = import.meta.glob("./modules/**/*.ts", { eager: true });

export const dynamicRoutes: AppRouteRecordRaw[] = mergeRouteModules(dynamicRouteFiles);
export const staticRoutes: AppRouteRecordRaw[] = mergeRouteModules(staticRouteFiles);

export const accessRoutes = [
	...dynamicRoutes,
	...staticRoutes,
];
