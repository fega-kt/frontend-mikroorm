import type { EntityBase } from "#src/api/entity-base.js";
import type { SearchParamsBase } from "#src/api/service-base.js";
import type { CategoryEntity } from "#src/api/setting/category";

export enum RequestTypeStatus {
	Draft = "draft",
	Published = "published",
	Cancelled = "cancelled",
}

/** Kiểu trường trong form của loại đơn — đồng bộ với backend form-schema.ts */
export enum FormFieldType {
	Text = "text",
	Textarea = "textarea",
	Number = "number",
	Money = "money",
	Date = "date",
	DateRange = "dateRange",
	Select = "select",
	Switch = "switch",
}

export interface FormField {
	/** Tên trường trong payload, dùng trong điều kiện quy trình: { var: "payload.<key>" } */
	key: string
	label: string
	type: FormFieldType
	required?: boolean
	options?: { label: string, value: string }[]
	min?: number
	max?: number
	placeholder?: string
}

/** Nhóm loại tệp — đồng bộ với backend attachment-config.ts */
export enum FileKind {
	Pdf = "pdf",
	Word = "word",
	Excel = "excel",
	PowerPoint = "powerpoint",
	Image = "image",
	Zip = "zip",
}

export const FILE_KIND_EXTENSIONS: Record<FileKind, string[]> = {
	[FileKind.Pdf]: ["pdf"],
	[FileKind.Word]: ["doc", "docx"],
	[FileKind.Excel]: ["xls", "xlsx", "csv"],
	[FileKind.PowerPoint]: ["ppt", "pptx"],
	[FileKind.Image]: ["png", "jpg", "jpeg", "gif", "webp"],
	[FileKind.Zip]: ["zip", "rar", "7z"],
};

/** Cấu hình một khối tệp ở màn tạo tờ trình */
export interface FileBlockConfig {
	enabled: boolean
	required: boolean
	minFiles: number
	maxFiles: number
	maxSizeMb: number
	fileTypes: FileKind[]
	hint?: string | null
}

export interface AttachmentConfig {
	/** Văn bản tờ trình */
	documents: FileBlockConfig
	/** Tài liệu đính kèm */
	attachments: FileBlockConfig
}

export const DEFAULT_ATTACHMENT_CONFIG: AttachmentConfig = {
	documents: { enabled: true, required: false, minFiles: 1, maxFiles: 5, maxSizeMb: 10, fileTypes: [FileKind.Pdf, FileKind.Word], hint: null },
	attachments: { enabled: true, required: false, minFiles: 0, maxFiles: 20, maxSizeMb: 10, fileTypes: Object.values(FileKind), hint: null },
};

export interface RequestTypeSearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	name?: string
	code?: string
	keyword?: string
	status?: RequestTypeStatus
}

export interface RequestTypeEntity extends EntityBase {
	code: string
	name: string
	category: CategoryEntity
	prefix: string
	description?: string
	status: RequestTypeStatus
	formSchema?: FormField[]
	attachmentConfig?: AttachmentConfig | null
}
