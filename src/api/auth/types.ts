export interface ChangePasswordParams {
	oldPassword: string
	newPassword: string
}

export interface ForgotPasswordParams {
	email: string
}

export interface VerifyOtpParams {
	email: string
	otp: string
}

export interface OtpSendParams {
	email: string
}

export interface OtpLoginParams {
	email: string
	otp: string
}

export interface OtpLoginResult {
	access_token: string
	refresh_token: string
	expires_at: number
}
