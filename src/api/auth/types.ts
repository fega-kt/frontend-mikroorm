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
