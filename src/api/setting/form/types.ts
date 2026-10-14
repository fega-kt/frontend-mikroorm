import type { EntityBase } from "#src/api/entity-base.js";
import type { SearchParamsBase } from "#src/api/service-base.js";
import type { FormField } from "#src/api/setting/request-type/types";

/** Form (danh sách trường nhập liệu) dùng chung cho nhiều loại tờ trình; sửa form chỉ ảnh hưởng phiếu tạo sau đó */
export interface FormEntity extends EntityBase {
	code: string
	name: string
	description?: string | null
	formSchema?: FormField[]
}

export interface FormSearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	search?: string
}

/** Một phiên bản của form (danh sách, chưa kèm trường); isCurrent = bản hiện hành */
export interface FormVersionBrief {
	id: string
	version: number
	createdAt: string
	createdBy: { id: string, fullName: string } | null
	fieldCount: number
	isCurrent: boolean
}

export interface FormVersionDetail extends Omit<FormVersionBrief, "fieldCount" | "isCurrent"> {
	formSchema: FormField[]
}

/** Danh sách rút gọn cho ô chọn form */
export type FormOption = Pick<FormEntity, "id" | "code" | "name">;
