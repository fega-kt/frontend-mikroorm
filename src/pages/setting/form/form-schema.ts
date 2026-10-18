import type { FormField, TableColumn, TableFormula } from "#src/api/setting/request-type/types";
import { FormFieldType, FormulaOperator } from "#src/api/setting/request-type/types";
import { isFormulaOperand } from "#src/pages/approval/lib/table-field";

/** Giống backend form-schema.ts: bắt đầu bằng chữ, chỉ gồm chữ, số, _ và dài tối đa 64 ký tự */
export const FIELD_KEY_PATTERN = /^[a-z]\w{0,63}$/i;

/**
 * Chuẩn hoá chữ gõ vào ô mã trường / mã cột về dạng hợp lệ: bỏ dấu tiếng Việt (đ → d),
 * khoảng trắng / gạch ngang → "_", bỏ ký tự đặc biệt, tối đa 64 ký tự. Ví dụ "Thành tiền" → "Thanh_tien".
 * Mở đầu bằng số vẫn giữ để người dùng thấy lỗi và tự sửa.
 */
export function toFieldKey(text: string) {
	return text
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.replace(/đ/g, "d")
		.replace(/Đ/g, "D")
		.replace(/[\s-]+/g, "_")
		.replace(/\W/g, "")
		.slice(0, 64);
}

export type KeyIssue = "empty" | "unicode" | "special" | "startDigit" | "tooLong";

/** Lý do mã trường / mã cột sai mẫu (undefined: hợp lệ) — để báo cụ thể thay cho một câu chung */
export function keyPatternIssue(key: string): KeyIssue | undefined {
	if (!key)
		return "empty";
	if ([...key].some(ch => ch.charCodeAt(0) > 127))
		return "unicode";
	if (/\W/.test(key))
		return "special";
	if (!/^[a-z]/i.test(key))
		return "startDigit";
	if (key.length > 64)
		return "tooLong";
	return undefined;
}

/**
 * Mã gợi ý cho mã đang sai: chuẩn hoá (bỏ dấu, khoảng trắng → _), mở đầu bằng số thì thêm "f_",
 * trùng mã đã có thì thêm hậu tố _2, _3…; không gợi ý được thì undefined.
 */
export function suggestFieldKey(key: string, taken: string[] = []) {
	let suggestion = toFieldKey(key);
	if (suggestion && !/^[a-z]/i.test(suggestion))
		suggestion = `f_${suggestion}`.slice(0, 64);
	if (!FIELD_KEY_PATTERN.test(suggestion))
		return undefined;
	let candidate = suggestion;
	for (let n = 2; taken.includes(candidate); n++)
		candidate = `${suggestion}_${n}`;
	return candidate === key ? undefined : candidate;
}

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
		if (field.minDate && field.maxDate && field.minDate !== "today" && field.maxDate !== "today" && field.minDate > field.maxDate)
			return `${field.key}: ${t("approval.formSchema.dateBoundInvalid")}`;
		if (field.type === FormFieldType.Select && !field.options?.length)
			return `${field.key}: ${t("approval.formSchema.optionsRequired")}`;
		if (field.type === FormFieldType.Table && tableFieldInvalid(field))
			return `${field.key}: ${t(field.columns?.length ? "approval.formSchema.table.columnInvalid" : "approval.formSchema.table.noColumns")}`;
		if (field.type === FormFieldType.Table && field.minRows !== undefined && field.maxRows !== undefined && field.minRows > field.maxRows)
			return `${field.key}: ${t("approval.formSchema.table.rowsInvalid")}`;
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

/** Cột bảng chưa hợp lệ: thiếu nhãn, mã sai mẫu / trùng, cột lựa chọn chưa có lựa chọn */
export function columnInvalid(column: TableColumn, columns: TableColumn[]) {
	const duplicated = columns.filter(c => c.key === column.key).length > 1;
	const missingOptions = column.type === FormFieldType.Select && !column.options?.length;
	const badFormula = column.type === FormFieldType.Formula && !formulaValid(column, columns);
	return !column.label.trim() || !FIELD_KEY_PATTERN.test(column.key) || duplicated || missingOptions || badFormula;
}

/** Công thức tham chiếu cột số / số tiền của cùng bảng (vế phải có thể là số cố định) — giống kiểm tra ở backend */
function formulaValid(column: TableColumn, columns: TableColumn[]) {
	const formula = column.formula;
	const isOperand = (key: string) => columns.some(c => c.key === key && isFormulaOperand(c));
	return !!formula && isOperand(formula.left) && (typeof formula.right === "number" || isOperand(formula.right));
}

/** Trường bảng chưa hợp lệ: chưa có cột hoặc có cột chưa hợp lệ */
export function tableFieldInvalid(field: FormField) {
	const columns = field.columns ?? [];
	return !columns.length || columns.some(column => columnInvalid(column, columns));
}

/** Cột mặc định khi thêm trường bảng: một cột văn bản bắt buộc */
export function defaultTableColumns(t: (key: string) => string): TableColumn[] {
	return [{ key: "name", label: t("approval.formSchema.table.defaultColumn"), type: FormFieldType.Text, required: true }];
}

/** Công thức mặc định khi đổi cột sang kiểu công thức: hai cột số đầu tiên nhân nhau (chỉ có một cột thì nhân 1) */
export function defaultFormula(columns: TableColumn[]): TableFormula | undefined {
	const [left, right] = columns.filter(isFormulaOperand);
	return left ? { left: left.key, op: FormulaOperator.Multiply, right: right?.key ?? 1 } : undefined;
}
