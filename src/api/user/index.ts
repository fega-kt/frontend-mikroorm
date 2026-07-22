import type { UserEntity, UserSearchParams } from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export type { LoginInfo } from "#src/api/auth";
export * from "./types";

export class UserService extends CrudServiceBase<UserEntity> {
	constructor() {
		super({ endpoint: "user", populate: ["department"], service: ApiService.Core });
	}

	/** Lấy thông tin user hiện tại */
	async fetchUserInfo() {
		return this.get<UserEntity>("current-user");
	}

	/** Lấy danh sách user có phân trang */
	async fetchUserList(params?: UserSearchParams) {
		return this.get<{ data: UserEntity[], total: number }>("", {
			searchParams: params,
			ignoreLoading: true,
		});
	}

	/**
	 * Lấy danh sách user qua một path cụ thể
	 * @param path Đường dẫn phụ hoặc truyền module name
	 * @param keyword Từ khóa tìm kiếm
	 */
	async fetchUserByApi(path: string, keyword?: string) {
		return this.get<{ data: UserEntity[], total: number }>(path, {
			searchParams: (keyword ? { keyword } : undefined) as any,
			ignoreLoading: true,
		});
	}

	/** Thêm user */
	async fetchAddUser(data: Partial<UserEntity>) {
		return this.post<void>("", { json: data, ignoreLoading: true });
	}

	/** Sửa user */
	async fetchUpdateUser(id: string, data: Partial<UserEntity>) {
		return this.put<void>(id, { json: data, ignoreLoading: true });
	}

	/** Xóa user */
	async fetchDeleteUser(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}

	/** Kích hoạt/vô hiệu hóa user */
	async fetchUpdateUserActive(id: string, isActive: boolean) {
		return this.patch<void>(`${id}/active`, { json: { isActive }, ignoreLoading: true });
	}

	/** Lấy chi tiết user */
	async fetchUserItem(id: string) {
		return this.get<UserEntity>(id, { ignoreLoading: true });
	}

	/** Cập nhật thông tin cá nhân */
	async updateProfile(data: { fullName: string, workEmail: string, phoneNumber: string, description?: string }) {
		return this.patch<void>("profile", { json: data });
	}

	/** Upload avatar */
	async uploadAvatar(file: File) {
		const formData = new FormData();
		formData.append("file", file);
		await this.post<void>("avatar", { body: formData });
	}
}

export const userService = new UserService();
