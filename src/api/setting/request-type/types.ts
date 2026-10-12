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
}
