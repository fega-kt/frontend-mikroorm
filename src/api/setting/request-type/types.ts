import type { EntityBase } from "#src/api/entity-base.js";
import type { SearchParamsBase } from "#src/api/service-base.js";
import type { CategoryEntity } from "#src/api/setting/category";
import type { FormOption } from "#src/api/setting/form/types";
import type { PrincipalType } from "#src/api/system/principal/types";

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
	/** Chọn người dùng / phòng ban / người-nhóm: giá trị { id, name } (mảng khi multiple) */
	User = "user",
	Department = "department",
	Principal = "principal",
	/** Bảng nhiều dòng: giá trị là mảng các dòng { <mã cột>: giá trị } */
	Table = "table",
	/** Chỉ dùng làm cột của bảng: giá trị tính từ các cột số khác của dòng (server tự tính lại) */
	Formula = "formula",
}

/** Phép tính của cột công thức — đồng bộ backend */
export enum FormulaOperator {
	Add = "+",
	Subtract = "-",
	Multiply = "*",
	Divide = "/",
}

/** Công thức của cột: <cột left> <op> <cột right | số cố định> */
export interface TableFormula {
	left: string
	op: FormulaOperator
	right: string | number
}

/** Kiểu dùng được làm cột của bảng — đồng bộ TABLE_COLUMN_TYPES ở backend */
export const TABLE_COLUMN_TYPES = [FormFieldType.Text, FormFieldType.Number, FormFieldType.Money, FormFieldType.Date, FormFieldType.Select, FormFieldType.Formula] as const;
export type TableColumnType = typeof TABLE_COLUMN_TYPES[number];

/** Số cột tối đa / số dòng tối đa mặc định của bảng — đồng bộ backend */
export const TABLE_MAX_COLUMNS = 10;
export const TABLE_MAX_ROWS = 200;

/** Một cột của trường bảng */
export interface TableColumn {
	key: string
	label: string
	type: TableColumnType
	required?: boolean
	options?: { label: string, value: string }[]
	min?: number
	max?: number
	placeholder?: string
	/** Cột số / số tiền / công thức: hiện tổng ở dòng cuối bảng */
	showTotal?: boolean
	/** Giá trị trong cột không được lặp lại giữa các dòng (ô trống không tính; văn bản không phân biệt hoa thường) */
	unique?: boolean
	/** Cột công thức */
	formula?: TableFormula
	/** Cột công thức: hiển thị kết quả dạng số hay số tiền (mặc định số tiền) */
	resultType?: FormFieldType.Number | FormFieldType.Money
}

/** Một dòng của trường bảng */
export type TableRow = Record<string, unknown>;

/** Loại trường chọn thực thể (payload lưu { id, name }) */
export const REFERENCE_FIELD_TYPES: ReadonlySet<FormFieldType> = new Set([FormFieldType.User, FormFieldType.Department, FormFieldType.Principal]);

export interface FormReference {
	id: string
	name: string
	/** Chỉ trường Người / nhóm: principal là người hay nhóm (payload cũ không có) */
	type?: PrincipalType
	/** Chỉ trường Người / nhóm, principal là người: id user để tra avatar / email mới nhất */
	userId?: string
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
	/** Ngày sớm nhất / muộn nhất (date, dateRange): "YYYY-MM-DD" hoặc "today" */
	minDate?: string
	maxDate?: string
	/** Cho chọn nhiều (chỉ với user / department / principal) */
	multiple?: boolean
	/** Độ rộng trên lưới 12 cột; bỏ trống = nửa hàng (đoạn văn: cả hàng) */
	span?: number
	/** Bảng: các cột theo thứ tự hiển thị */
	columns?: TableColumn[]
	/** Bảng: số dòng tối thiểu / tối đa (bỏ trống: bắt buộc thì ≥ 1, tối đa TABLE_MAX_ROWS) */
	minRows?: number
	maxRows?: number
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

/** Một phiên bản cấu hình của loại tờ trình (danh sách); isCurrent = bản hiện hành */
export interface RequestTypeVersionBrief {
	id: string
	version: number
	name: string
	status: RequestTypeStatus
	form: { id: string, name: string }
	createdAt: string
	createdBy: { id: string, fullName: string } | null
	isCurrent: boolean
}

export interface RequestTypeVersionDetail {
	id: string
	version: number
	code: string
	name: string
	prefix: string
	status: RequestTypeStatus
	description?: string | null
	category: { id: string, name: string }
	form: { id: string, code: string, name: string }
	attachmentConfig: AttachmentConfig | null
	createdAt: string
	createdBy: { id: string, fullName: string } | null
}

export interface RequestTypeEntity extends EntityBase {
	code: string
	name: string
	category: CategoryEntity
	prefix: string
	description?: string | null
	status: RequestTypeStatus
	/** Biểu mẫu loại tờ trình dùng (nhiều loại có thể dùng chung một biểu mẫu) */
	form: FormOption
	attachmentConfig?: AttachmentConfig | null
}
