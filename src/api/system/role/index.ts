import type { ActivityLogEntity } from "../../activity-log/types";
import type { RoleEntity, RoleSearchParams } from "./types";
import { ApiService, CrudServiceBase } from "../../service-base";

export * from "./types";

export class RoleService extends CrudServiceBase<RoleEntity> {
	constructor() {
		super({ endpoint: "role", populate: ["usersAndGroups"], service: ApiService.Core,
		});
	}

	/** Lấy danh sách role có phân trang */
	async fetchRoleList(params?: RoleSearchParams) {
		return this.get<{ data: RoleEntity[], total: number }>("", {
			searchParams: params,
			ignoreLoading: true,
		});
	}

	/** Thêm role */
	async fetchAddRole(data: Partial<RoleEntity>) {
		return this.post<void>("", { json: data, ignoreLoading: true });
	}

	/** Sửa role */
	async fetchUpdateRole(id: string, data: Partial<RoleEntity>) {
		return this.patch<void>(id, { json: data, ignoreLoading: true });
	}

	/** Xóa role */
	async fetchDeleteRole(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}

	/** Lấy chi tiết role */
	async fetchRoleItem(id: string) {
		return this.get<RoleEntity>(id, { ignoreLoading: true });
	}

	/** Lịch sử thao tác (activity log), mới nhất trước. */
	async fetchHistory(id: string, params?: { page?: number, limit?: number }) {
		return this.get<{ data: ActivityLogEntity[], total: number }>(`${id}/history`, {
			searchParams: { page: 1, limit: 50, ...params },
			ignoreLoading: true,
		});
	}
}

export const roleService = new RoleService();
