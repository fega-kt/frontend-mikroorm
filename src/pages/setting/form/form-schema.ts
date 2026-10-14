import type { FormField } from "#src/api/setting/request-type/types";
import { FormFieldType } from "#src/api/setting/request-type/types";

/** Giống backend form-schema.ts: bắt đầu bằng chữ, chỉ gồm chữ, số, _ */
export const FIELD_KEY_PATTERN = /^[a-z]\w*$/i;

/** Lỗi đầu tiên của formSchema (null nếu hợp lệ) — dùng chặn lưu loại đơn */
export function validateFormSchema(fields: FormField[], t: (key: string) => string): string | null {
	const seen = new Set<string>();
	for (const field of fields) {
		if (!field.key || !FIELD_KEY_PATTERN.test(field.key))
			return `${field.label || field.key || "?"}: ${t("approval.formSchema.keyPattern")}`;
		if (seen.has(field.key))
			return `${field.key}: ${t("approval.formSchema.keyDuplicate")}`;
		seen.add(field.key);
		if (!field.label?.trim())
			return `${field.key}: ${t("approval.formSchema.label")}`;
		if (field.type === FormFieldType.Select && !field.options?.length)
			return `${field.key}: ${t("approval.formSchema.optionsRequired")}`;
	}
	return null;
}

export function optionsToText(options?: FormField["options"]) {
	return (options ?? []).map(o => (o.label === o.value ? o.value : `${o.value}|${o.label}`)).join("\n");
}

/** Mỗi dòng "giá_trị|Nhãn" (thiếu nhãn thì lấy giá trị) */
export function textToOptions(text: string) {
	return text
		.split("\n")
		.map(line => line.trim())
		.filter(Boolean)
		.map((line) => {
			const [value, ...label] = line.split("|");
			return { value: value.trim(), label: (label.join("|") || value).trim() };
		});
}
