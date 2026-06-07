export interface LoginInfo {
	username: string
	password: string
}

export interface AuthType {
	token: string
	refreshToken: string
}

export interface SetSessionParams {
	access_token: string
	refresh_token: string
}

export interface RefreshResult {
	data: { session: { access_token: string } | null }
	error: Error | null
}

export interface IAuthProvider {
	login: (data: LoginInfo) => Promise<{ error?: Error | null }>
	logout: () => Promise<void>
	setSession: (params: SetSessionParams) => Promise<void>
	onAuthStateChange: (callback: (session: { access_token: string } | null) => void) => () => void
	getToken: () => Promise<string | undefined>
	refreshSession: () => Promise<RefreshResult>
}

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
