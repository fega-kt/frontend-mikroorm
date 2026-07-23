import type { UserEntity } from "../../user";
import type { DepartmentEntity, DepartmentSearchParams, DepartmentTreeNode, DepartmentUsersSearchParams } from "./types";
import { ApiService, CrudServiceBase } from "../../service-base";

export * from "./types";

export class DepartmentService extends CrudServiceBase<DepartmentEntity> {
	constructor() {
		super({ endpoint: "department", populate: ["manager", "deputy", "parent"], service: ApiService.Core });
	}

	/** Lấy danh sách bộ phận */
	async fetchDeptList(searchParams?: DepartmentSearchParams) {
		return this.get<DepartmentEntity[]>("", { searchParams, ignoreLoading: true });
	}

	/**
	 * Lấy bộ phận qua một path cụ thể hoặc keyword
	 * @param path Đường dẫn phụ hoặc truyền module name
	 * @param keyword Từ khóa tìm kiếm
	 */
	async fetchDeptByApi(path: string, keyword?: string) {
		return this.get<DepartmentEntity[]>(path, {
			searchParams: (keyword ? { keyword } : undefined),
			ignoreLoading: true,
		});
	}

	/** Lấy toàn bộ cây phòng ban (có populate parent để build tree) */
	async fetchDeptTree(keyword?: string) {
		return this.get<DepartmentEntity[]>("", {
			searchParams: (keyword ? { keyword } : undefined),
			ignoreLoading: true,
		});
	}

	/** Lấy cây phòng ban từ endpoint department-tree (server đã build sẵn) */
	async fetchDeptTreeList(params?: DepartmentSearchParams) {
		return this.get<DepartmentTreeNode[]>("department-tree", { searchParams: params, ignoreLoading: true });
	}

	/** Lấy cây phòng ban chỉ gồm các phòng ban active (và có cha cũng active) */
	async fetchActiveDeptTreeList(params?: Pick<DepartmentSearchParams, "keyword" | "name" | "code">) {
		return this.get<DepartmentTreeNode[]>("department-tree/active", { searchParams: params, ignoreLoading: true });
	}

	/** Thêm bộ phận */
	async fetchAddDeptItem(data: DepartmentEntity) {
		return this.post<void>("", { json: data, ignoreLoading: true });
	}

	/** Sửa bộ phận */
	async fetchUpdateDeptItem(id: string, data: DepartmentEntity) {
		return this.put<void>(id, { json: data, ignoreLoading: true });
	}

	/** Kích hoạt/vô hiệu hóa bộ phận (cascade xuống toàn bộ bộ phận con) */
	async fetchUpdateDeptActive(id: string, status: 0 | 1) {
		return this.patch<void>(`${id}/active`, { json: { status }, ignoreLoading: true });
	}

	/** Xóa bộ phận */
	async fetchDeleteDeptItem(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}

	/** Lấy chi tiết bộ phận */
	async fetchDeptItem(id: string) {
		return this.get<DepartmentEntity>(id, { ignoreLoading: true });
	}

	/** Lấy danh sách nhân viên của bộ phận có phân trang */
	async fetchDeptUsers(id: string, params?: DepartmentUsersSearchParams) {
		return this.get<{ data: UserEntity[], total: number }>(`${id}/users`, {
			searchParams: params,
			ignoreLoading: true,
		});
	}
}

export const departmentService = new DepartmentService();
