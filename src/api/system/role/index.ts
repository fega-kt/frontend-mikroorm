import type { RoleItemType } from "./types";
import { request } from "#src/utils/request";

export * from "./types";

/* 获取角色列表 */
export function fetchRoleList(data: any) {
	return request.get<ApiListResult<RoleItemType>>("role-list", { searchParams: data, ignoreLoading: true }).json();
}

/* 新增角色 */
export function fetchAddRoleItem(data: RoleItemType) {
	return request.post<void>("role-item", { json: data, ignoreLoading: true }).json();
}

/* 修改角色 */
export function fetchUpdateRoleItem(data: RoleItemType) {
	return request.put<void>("role-item", { json: data, ignoreLoading: true }).json();
}

/* 删除角色 */
export function fetchDeleteRoleItem(id: number) {
	return request.delete<void>("role-item", { json: id, ignoreLoading: true }).json();
}

/* 获取菜单 */
export function fetchRoleMenu() {
	return request.get<RoleItemType[]>("role-menu", { ignoreLoading: true }).json();
}

/* 角色绑定的菜单 id */
export function fetchMenuByRoleId(data: { id: number }) {
	return request.get<string[]>("menu-by-role-id", { searchParams: data, ignoreLoading: false }).json();
}
