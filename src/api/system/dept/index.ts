import type { DepartmentEntity, DepartmentSearchParams, DepartmentTreeNode } from "./types";
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

	/** Thêm bộ phận */
	async fetchAddDeptItem(data: DepartmentEntity) {
		return this.post<void>("", { json: data, ignoreLoading: true });
	}

	/** Sửa bộ phận */
	async fetchUpdateDeptItem(id: string, data: DepartmentEntity) {
		return this.put<void>(id, { json: data, ignoreLoading: true });
	}

	/** Xóa bộ phận */
	async fetchDeleteDeptItem(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}

	/** Lấy chi tiết bộ phận */
	async fetchDeptItem(id: string) {
		return this.get<DepartmentEntity>(id, { ignoreLoading: true });
	}
}

export const departmentService = new DepartmentService();
