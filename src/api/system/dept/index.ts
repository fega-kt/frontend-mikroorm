import type { DepartmentEntity } from "./types";
import { CrudServiceBase } from "../../service-base";

export * from "./types";

export class DepartmentService extends CrudServiceBase<DepartmentEntity> {
	constructor() {
		super({ endpoint: "department" });
	}

	/** Lấy danh sách bộ phận */
	async fetchDeptList(searchParams?: any) {
		return this.get<DepartmentEntity[]>("", { searchParams, ignoreLoading: true });
	}

	/**
	 * Lấy bộ phận qua một path cụ thể hoặc keyword
	 * @param path Đường dẫn phụ hoặc truyền module name
	 * @param keyword Từ khóa tìm kiếm
	 */
	async fetchDeptByApi(path: string, keyword?: string) {
		return this.get<DepartmentEntity[]>(path, {
			searchParams: keyword ? { keyword } : undefined,
			ignoreLoading: true,
		});
	}

	/** Thêm bộ phận */
	async fetchAddDeptItem(data: DepartmentEntity) {
		return this.post<void>("", { json: data, ignoreLoading: true });
	}

	/** Sửa bộ phận */
	async fetchUpdateDeptItem(id: string, data: DepartmentEntity) {
		return this.patch<void>(id, { json: data, ignoreLoading: true });
	}

	/** Xóa bộ phận */
	async fetchDeleteDeptItem(id: string) {
		return this.delete<void>("dept-item", { json: id, ignoreLoading: true });
	}

	/** Lấy chi tiết bộ phận */
	async fetchDeptItem(id: string) {
		return this.get<DepartmentEntity>(id, { ignoreLoading: true });
	}
}

export const departmentService = new DepartmentService();
