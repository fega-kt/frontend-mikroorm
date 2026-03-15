import { request } from "#src/utils/request";

/* 获取菜单列表 */
export async function healthCheck() {
	await request.get("health");
	// return request.get<ApiListResponse<MenuItemType>>("menu-list", { searchParams: data, ignoreLoading: true }).json();
}
