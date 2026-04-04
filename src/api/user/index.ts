import type { LoginInfo, UserEntity } from "./types";

import { supabase } from "#src/store/supabaseClient";
import { CrudServiceBase } from "../service-base";

export * from "./types";

export class UserService extends CrudServiceBase<UserEntity> {
	constructor() {
		super({ endpoint: "user" });
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

	/** Lấy danh sách user */
	async fetchUserList() {
		return this.get<UserEntity[]>("");
	}

	/**
	 * Lấy danh sách user qua một path cụ thể
	 * @param path Đường dẫn phụ hoặc truyền module name
	 * @param keyword Từ khóa tìm kiếm
	 */
	async fetchUserByApi(path: string, keyword?: string) {
		return this.get<UserEntity[]>(path, {
			searchParams: keyword ? { keyword } : undefined,
		});
	}

	/** Làm mới token */
	async fetchRefreshToken() {
		return supabase.auth.refreshSession();
	}
}

export const userService = new UserService();
