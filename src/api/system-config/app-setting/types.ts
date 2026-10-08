import type { EntityBase } from "../../entity-base";
import type { SearchParamsBase } from "../../service-base";

export interface AppSettingSearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	/** Tìm theo key hoặc ghi chú */
	keyword?: string
}

export type AppSettingValue = string | number | boolean | Record<string, unknown> | unknown[];

/** Must stay in sync with `AppSettingValueType` in backend `app-setting.meta.ts`. */
export type AppSettingValueType = "string" | "number" | "boolean" | "date" | "emails" | "string_array" | "json";

/**
 * Ràng buộc của value, khai báo ở backend `APP_SETTING_META`.
 * Mỗi type chỉ dùng các field của nó; với `date`, min/max đã được backend đổi sẵn sang "YYYY-MM-DD".
 */
export interface AppSettingRule {
	/** string */
	minLength?: number
	maxLength?: number
	pattern?: string
	/** number: giá trị; date: "YYYY-MM-DD" */
	min?: number | string
	max?: number | string
	/** number */
	integer?: boolean
	/** emails, string_array */
	minItems?: number
	maxItems?: number
}

/** Một dòng trên trang quản lý: backend trả đủ mọi key hiển thị, key chưa cấu hình thì value = null. */
export interface AppSettingRow extends Partial<Pick<EntityBase, "id" | "createdAt" | "updatedAt" | "updatedBy">> {
	key: string
	type: AppSettingValueType
	rule: AppSettingRule | null
	value: AppSettingValue | null
	description?: string
}

export interface AppSettingPayload {
	key: string
	value: AppSettingValue
	description?: string
}
