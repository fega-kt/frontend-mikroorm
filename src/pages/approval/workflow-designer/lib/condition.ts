import type { JsonLogic } from "#src/api/approval-workflow/types";
import type { FormField } from "#src/api/setting/request-type/types";
import { FormFieldType } from "#src/api/setting/request-type/types";

/**
 * Chuyển đổi giữa biểu thức json-logic của cạnh rẽ nhánh và dạng "hàng điều kiện" của trình tạo điều kiện.
 * Chỉ hỗ trợ dạng phẳng: một phép so sánh, hoặc and/or của nhiều phép so sánh { op: [{ var: "payload.x" }, value] }.
 * Biểu thức khác (lồng nhau, so sánh hai biến…) → logicToRows trả null, UI chuyển sang sửa JSON thô.
 */

export type ConditionOperator = ">" | ">=" | "<" | "<=" | "==" | "!=" | "in";
export type Combinator = "and" | "or";

export const CONDITION_OPERATORS: ConditionOperator[] = [">", ">=", "<", "<=", "==", "!=", "in"];

/** Khóa i18n của toán tử: workflowDesigner.operators.<key> */
export const OPERATOR_I18N_KEY: Record<ConditionOperator, string> = {
	">": "gt",
	">=": "gte",
	"<": "lt",
	"<=": "lte",
	"==": "eq",
	"!=": "neq",
	"in": "in",
};

export const OPERATOR_SYMBOL: Record<ConditionOperator, string> = {
	">": ">",
	">=": "≥",
	"<": "<",
	"<=": "≤",
	"==": "=",
	"!=": "≠",
	"in": "∈",
};

export interface ConditionRow {
	field: string
	operator: ConditionOperator
	value: unknown
}

export interface ConditionGroup {
	combinator: Combinator
	rows: ConditionRow[]
}

export const PAYLOAD_PREFIX = "payload.";

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return !!v && typeof v === "object" && !Array.isArray(v);
}

export function rowToLogic(row: ConditionRow): JsonLogic {
	return { [row.operator]: [{ var: `${PAYLOAD_PREFIX}${row.field}` }, row.value ?? null] };
}

/** Hàng chưa chọn trường bị bỏ qua; không còn hàng nào → undefined */
export function rowsToLogic(group: ConditionGroup): JsonLogic | undefined {
	const rows = group.rows.filter(r => !!r.field);
	if (!rows.length)
		return undefined;
	if (rows.length === 1)
		return rowToLogic(rows[0]);
	return { [group.combinator]: rows.map(rowToLogic) };
}

function parseRow(logic: unknown): ConditionRow | null {
	if (!isPlainObject(logic))
		return null;
	const keys = Object.keys(logic);
	if (keys.length !== 1)
		return null;
	const rawOp = keys[0];
	const op = (rawOp === "===" ? "==" : rawOp === "!==" ? "!=" : rawOp) as ConditionOperator;
	if (!CONDITION_OPERATORS.includes(op))
		return null;
	const args = logic[rawOp];
	if (!Array.isArray(args) || args.length !== 2)
		return null;
	const [left, right] = args;
	if (!isPlainObject(left) || Object.keys(left).length !== 1 || !("var" in left))
		return null;
	const path = Array.isArray(left.var) ? left.var[0] : left.var;
	if (typeof path !== "string" || !path.startsWith(PAYLOAD_PREFIX))
		return null;
	if (isPlainObject(right))
		return null;
	if (op === "in" && !Array.isArray(right))
		return null;
	return { field: path.slice(PAYLOAD_PREFIX.length), operator: op, value: right };
}

/** null = không biểu diễn được bằng trình tạo (cần sửa JSON thô) */
export function logicToRows(logic?: JsonLogic | null): ConditionGroup | null {
	if (logic === undefined || logic === null)
		return { combinator: "and", rows: [] };
	const single = parseRow(logic);
	if (single)
		return { combinator: "and", rows: [single] };
	if (isPlainObject(logic) && Object.keys(logic).length === 1) {
		const key = Object.keys(logic)[0];
		const items = logic[key];
		if ((key === "and" || key === "or") && Array.isArray(items) && items.length > 0) {
			const rows = items.map(parseRow);
			if (rows.every(r => r !== null))
				return { combinator: key, rows: rows as ConditionRow[] };
		}
	}
	return null;
}

/** Toán tử dùng được cho từng kiểu trường */
export function operatorsFor(type?: FormFieldType): ConditionOperator[] {
	switch (type) {
		case FormFieldType.Number:
		case FormFieldType.Money:
		case FormFieldType.Date:
			return [">", ">=", "<", "<=", "==", "!="];
		case FormFieldType.Switch:
			return ["==", "!="];
		case FormFieldType.Select:
		case FormFieldType.Text:
		case FormFieldType.Textarea:
			return ["==", "!=", "in"];
		default:
			return CONDITION_OPERATORS;
	}
}

/** Giá trị mặc định hợp lý khi tạo hàng điều kiện mới cho một trường */
export function defaultValueFor(field?: FormField, operator?: ConditionOperator): unknown {
	if (operator === "in")
		return field?.options?.length ? [field.options[0].value] : [];
	switch (field?.type) {
		case FormFieldType.Number:
		case FormFieldType.Money:
			return 0;
		case FormFieldType.Switch:
			return true;
		case FormFieldType.Select:
			return field.options?.[0]?.value ?? "";
		default:
			return "";
	}
}

/** Hàng điều kiện khởi tạo cho một trường (dùng khi chèn nút điều kiện mới) */
export function initialRowFor(field: FormField): ConditionRow {
	const operator = operatorsFor(field.type)[0];
	return { field: field.key, operator, value: defaultValueFor(field, operator) };
}

export interface SummaryOptions {
	/** Danh sách trường của loại đơn — dùng để hiện nhãn trường và nhãn lựa chọn thay cho key */
	fields?: FormField[]
	and?: string
	or?: string
	yes?: string
	no?: string
}

function formatValue(value: unknown, field: FormField | undefined, opts: SummaryOptions): string {
	if (Array.isArray(value))
		return `{${value.map(v => formatValue(v, field, opts)).join(", ")}}`;
	if (value === true)
		return opts.yes ?? "true";
	if (value === false)
		return opts.no ?? "false";
	if (value === null || value === undefined || value === "")
		return "∅";
	const option = field?.options?.find(o => o.value === value);
	if (option)
		return option.label;
	if (typeof value === "number" && field?.type === FormFieldType.Money)
		return value.toLocaleString("vi-VN");
	return String(value);
}

/** Mô tả ngắn cho người đọc, ví dụ "Số ngày > 3 và Loại nghỉ = Phép năm" */
export function summarizeCondition(logic: JsonLogic | undefined | null, opts: SummaryOptions = {}): string {
	if (!logic)
		return "";
	const group = logicToRows(logic);
	if (!group) {
		const raw = JSON.stringify(logic);
		return raw.length > 60 ? `${raw.slice(0, 57)}...` : raw;
	}
	const joiner = group.combinator === "and" ? (opts.and ?? "and") : (opts.or ?? "or");
	return group.rows
		.map((row) => {
			const field = opts.fields?.find(f => f.key === row.field);
			return `${field?.label ?? row.field} ${OPERATOR_SYMBOL[row.operator]} ${formatValue(row.value, field, opts)}`;
		})
		.join(` ${joiner} `);
}
