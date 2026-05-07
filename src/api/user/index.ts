import type { LoginInfo, UserEntity, UserSearchParams } from "./types";

import { supabase } from "#src/store/supabaseClient";
import { CrudServiceBase } from "../service-base";

export * from "./types";

export class UserService extends CrudServiceBase<UserEntity> {
	constructor() {
		super({ endpoint: "user", populate: ["department"] });
	}

	/** Đăng nhập */
	login(data: LoginInfo) {
		return supabase.auth.signInWithPassword({ email: data.username, password: data.password });
	}

	/** Đăng xuất */
	logout() {
		return supabase.auth.signOut();
	}

	/** Lấy thông tin user hiện tại */
	async fetchUserInfo() {
		return this.get<UserEntity>("current-user");
	}

	/** Lấy danh sách user có phân trang */
	async fetchUserList(params?: UserSearchParams) {
		return this.get<{ data: UserEntity[], total: number }>("", {
			searchParams: params as any,
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
		return this.patch<void>(id, { json: data, ignoreLoading: true });
	}

	/** Xóa user */
	async fetchDeleteUser(id: string) {
		return this.delete<void>(id, { ignoreLoading: true });
	}

	/** Lấy chi tiết user */
	async fetchUserItem(id: string) {
		return this.get<UserEntity>(id, { ignoreLoading: true });
	}

	/** Làm mời token */
	async fetchRefreshToken() {
		return supabase.auth.refreshSession();
	}

	/** Cập nhật thông tin cá nhân */
	async updateProfile(data: { fullName: string, workEmail: string, phoneNumber: string, description?: string }) {
		return this.patch<void>("profile", { json: data });
	}

	/** Upload file */
	async uploadAvatar(file: File) {
		const formData = new FormData();
		formData.append("file", file);
		// Note: we call this on the base 'avatar' endpoint, not 'user/avatar'
		await this.post<void>("avatar", {
			body: formData,
			// When using FormData, we should NOT send 'json' option
		});
	}
}

export const userService = new UserService();
