/** Nhóm mẫu theo tiền tố mã (đồng bộ backend EmailTemplateCategory) */
export type EmailTemplateCategory = "approval" | "auth" | "system" | "custom";

export const EMAIL_TEMPLATE_CATEGORIES: EmailTemplateCategory[] = ["approval", "auth", "system", "custom"];

/** Mẫu email (đồng bộ backend email-template.service.ts) */
export interface EmailTemplate {
	code: string
	name: string
	subject: string
	/** Toàn bộ email (HTML: header, thẻ, footer), chứa biến {{...}} — khi gửi chỉ bọc thêm nền xám */
	body: string
	description?: string | null
	category: EmailTemplateCategory
	/** Mẫu hệ thống (gắn với một sự kiện: tờ trình, đăng nhập, mật khẩu…) */
	system: boolean
	/** Mẫu hệ thống đã được sửa so với mặc định */
	customized: boolean
	/** Biến bắt buộc phải còn trong mẫu (vd: {{otp.code}} của email OTP) */
	requiredVariables: string[]
	updatedAt?: string
}

export interface EmailTemplatePayload {
	name: string
	subject: string
	body: string
	description?: string | null
}

export interface TemplateVariable {
	key: string
	sample: string
}

export interface EmailTemplatePreview {
	subject: string
	html: string
	unknownVariables: string[]
}

/** Tên app, logo, link — header / footer của email */
export interface EmailBrand {
	appName: string
	logoUrl: string
	appLink: string
}

/** Mã mẫu mặc định của bước Thông báo */
export const NOTIFY_DEFAULT_TEMPLATE = "approval.notify";
