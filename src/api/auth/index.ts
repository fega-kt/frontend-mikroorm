import type { ChangePasswordParams, ForgotPasswordParams, VerifyOtpParams } from "./types";

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

	/** Gửi OTP quên mật khẩu */
	forgotPassword(data: ForgotPasswordParams): Promise<void> {
		return this.post<void>("forgot-password", { json: data });
	}

	/** Xác minh OTP — backend tự generate & gửi password mới qua email */
	verifyOtp(data: VerifyOtpParams): Promise<void> {
		return this.post<void>("verify-otp", { json: data });
	}
}

export const authService = new AuthService();
