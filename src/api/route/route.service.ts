import type { AppRouteRecordRaw } from "#src/router/types";
import { request } from "#src/utils/request";

const module = "route";

export function fetchAsyncRoutes() {
	return request.get(`${module}/get-async-routes`).json<ApiResponse<AppRouteRecordRaw[]>>();
}
