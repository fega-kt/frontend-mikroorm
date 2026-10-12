/** Mẫu email (đồng bộ backend email-template.service.ts) */
export interface EmailTemplate {
	code: string
	name: string
	subject: string
	/** HTML, chứa biến {{...}} */
	body: string
	description?: string | null
	/** Mẫu hệ thống (gắn với sự kiện tờ trình) */
	system: boolean
	/** Mẫu hệ thống đã được sửa so với mặc định */
	customized: boolean
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

/** Mã mẫu mặc định của bước Thông báo */
export const NOTIFY_DEFAULT_TEMPLATE = "approval.notify";
