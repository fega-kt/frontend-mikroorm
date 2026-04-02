import type { DepartmentEntity } from "./types";
import { request } from "#src/utils/request";

export * from "./types";

/* 获取部门列表 */
export function fetchDeptList(data: any) {
	return request.get<DepartmentEntity[]>("department", { searchParams: data, ignoreLoading: true }).json();
}

/* 新增部门 */
export function fetchAddDeptItem(data: DepartmentEntity) {
	return request.post<void>("department", { json: data, ignoreLoading: true }).json();
}

/* 修改部门 */
export function fetchUpdateDeptItem(id: string, data: DepartmentEntity) {
	return request.patch<void>(`department/${id}`, { json: data, ignoreLoading: true }).json();
}

/* 删除部门 */
export function fetchDeleteDeptItem(id: string) {
	return request.delete<void>("dept-item", { json: id, ignoreLoading: true }).json();
}

/* 获取部门详情 */
export function fetchDeptItem(id: string) {
	return request.get<DepartmentEntity>(`department/${id}`, { ignoreLoading: true }).json();
}
