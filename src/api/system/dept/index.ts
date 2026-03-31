import type { DepartmentEntity } from "./types";
import { request } from "#src/utils/request";

export * from "./types";

/* 获取部门列表 */
export function fetchDeptList(data: any) {
	return request.get<ApiListAllResponse<DepartmentEntity>>("department", { searchParams: data, ignoreLoading: true }).json();
}

/* 新增部门 */
export function fetchAddDeptItem(data: DepartmentEntity) {
	return request.post<ApiResponse<string>>("department", { json: data, ignoreLoading: true }).json();
}

/* 修改部门 */
export function fetchUpdateDeptItem(id: string, data: DepartmentEntity) {
	return request.patch<ApiResponse<string>>(`department/${id}`, { json: data, ignoreLoading: true }).json();
}

/* 删除部门 */
export function fetchDeleteDeptItem(id: string) {
	return request.delete<ApiResponse<string>>("dept-item", { json: id, ignoreLoading: true }).json();
}
