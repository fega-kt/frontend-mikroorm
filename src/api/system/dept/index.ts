import type { DeptItemType } from "./types";
import { request } from "#src/utils/request";

export * from "./types";

/* 获取部门列表 */
export function fetchDeptList(data: any) {
	return request.get<ApiListResponse<DeptItemType>>("dept-list", { searchParams: data, ignoreLoading: true }).json();
}

/* 新增部门 */
export function fetchAddDeptItem(data: DeptItemType) {
	return request.post<ApiResponse<string>>("dept-item", { json: data, ignoreLoading: true }).json();
}

/* 修改部门 */
export function fetchUpdateDeptItem(data: DeptItemType) {
	return request.put<ApiResponse<string>>("dept-item", { json: data, ignoreLoading: true }).json();
}

/* 删除部门 */
export function fetchDeleteDeptItem(id: number) {
	return request.delete<ApiResponse<string>>("dept-item", { json: id, ignoreLoading: true }).json();
}
