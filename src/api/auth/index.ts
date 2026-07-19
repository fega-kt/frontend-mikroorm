import type { ChangePasswordParams, ForgotPasswordParams, OtpLoginParams, OtpLoginResult, OtpSendParams, VerifyOtpParams } from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export { authProvider } from "./provider";
export * from "./types";

export class AuthService extends CrudServiceBase {
	constructor() {
		super({ endpoint: "auth", service: ApiService.Core });
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

	/** Gửi OTP đăng nhập */
	sendOtp(data: OtpSendParams): Promise<void> {
		return this.post<void>("otp/send", { json: data });
	}

	/** Đăng nhập bằng OTP — trả về access_token, refresh_token, expires_at */
	otpLogin(data: OtpLoginParams): Promise<OtpLoginResult> {
		return this.post<OtpLoginResult>("otp/login", { json: data });
	}
}

export const authService = new AuthService();
