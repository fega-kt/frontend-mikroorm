import type { ChangePasswordParams } from "./types";

import { CrudServiceBase } from "../service-base";

export * from "./types";

export class AuthService extends CrudServiceBase {
	constructor() {
		super({ endpoint: "auth" });
	}

	/** Đổi mật khẩu */
	changePassword(data: ChangePasswordParams): Promise<void> {
		return this.patch<void>("change-password", { json: data });
	}
}

export const authService = new AuthService();
