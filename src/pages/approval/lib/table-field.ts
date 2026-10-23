import type { FormField, TableColumn, TableFormula, TableRow } from "#src/api/setting/request-type/types";
import { FormFieldType, FormulaOperator, TABLE_MAX_ROWS } from "#src/api/setting/request-type/types";

/** Ô trống: chưa nhập gì (0 vẫn là giá trị) */
export const isEmptyCell = (value: unknown) => value === undefined || value === null || (typeof value === "string" && !value.trim());

/** Giá trị form → mảng dòng (giá trị lạ / chưa có thì coi như bảng rỗng) */
export const asTableRows = (value: unknown): TableRow[] => (Array.isArray(value) ? (value as TableRow[]) : []);

/**
 * Mã riêng của dòng: sinh khi thêm dòng, giữ nguyên khi sửa — lịch sử so hai lần lưu theo mã này để phân biệt sửa / thêm / xoá.
 * Mã cột luôn bắt đầu bằng chữ cái nên không trùng khóa này.
 */
export const TABLE_ROW_ID = "_id";

export const newTableRowId = () => crypto.randomUUID();

/** Mã của dòng (mọi dòng đều có: dòng mới sinh lúc thêm, dữ liệu cũ đã được migrate) */
export const tableRowId = (row: TableRow) => row[TABLE_ROW_ID] as string;

/**
 * Dòng gửi lên API: chỉ giữ mã dòng và các cột có trong cấu hình, bỏ ô trống và bỏ dòng không nhập gì.
 * Backend vẫn kiểm lại từng ô theo cột.
 */
export function cleanTableRows(field: FormField, value: unknown): TableRow[] {
	const columns = field.columns ?? [];
	return asTableRows(value)
		.map((row) => {
			const cleaned: TableRow = {};
			for (const column of columns) {
				// Cột công thức do server tính lại
				if (column.type === FormFieldType.Formula)
					continue;
				const cell = row[column.key];
				if (!isEmptyCell(cell))
					cleaned[column.key] = typeof cell === "string" ? cell.trim() : cell;
			}
			return { row, cleaned };
		})
		.filter(({ cleaned }) => Object.keys(cleaned).length > 0)
		.map(({ row, cleaned }) => ({ [TABLE_ROW_ID]: tableRowId(row), ...cleaned }));
}

/** Một dòng mới: chưa có giá trị ô nào */
export const emptyTableRow = (): TableRow => ({ [TABLE_ROW_ID]: newTableRowId() });

/** Số dòng tối thiểu: cấu hình riêng, không thì bắt buộc là 1 dòng */
export const tableMinRows = (field: FormField) => field.minRows ?? (field.required ? 1 : 0);
export const tableMaxRows = (field: FormField) => field.maxRows ?? TABLE_MAX_ROWS;

/** Ô bắt buộc chưa nhập của một dòng (dòng trống hoàn toàn không tính: sẽ bị bỏ khi gửi) */
export function missingRequiredCells(columns: TableColumn[], row: TableRow) {
	const inputs = columns.filter(column => column.type !== FormFieldType.Formula);
	if (inputs.every(column => isEmptyCell(row[column.key])))
		return [];
	return inputs.filter(column => column.required && isEmptyCell(row[column.key]));
}

/** Lỗi của bảng; các trường còn lại là tham số cho thông báo i18n `approval.formSchema.table.errors.<code>` */
export interface TableRowsError {
	code: "required" | "minRows" | "maxRows" | "cell" | "duplicate"
	count?: number
	row?: number
	column?: string
	/** duplicate: dòng có giá trị trùng xuất hiện trước */
	first?: number
}

/** Khóa so trùng của một ô — giống backend uniqueKey: ô trống không tính; văn bản bỏ khoảng trắng, không phân biệt hoa thường */
export function uniqueKey(value: unknown): string | undefined {
	if (value === undefined || value === null)
		return undefined;
	if (typeof value === "string") {
		const text = value.trim().toLowerCase();
		return text ? `s:${text}` : undefined;
	}
	return `${typeof value}:${String(value)}`;
}

/** Ô trùng ở các cột bật "không được trùng": mỗi ô trùng (từ lần xuất hiện thứ hai) kèm dòng gặp giá trị đó lần đầu */
export function duplicateCells(columns: TableColumn[], rows: TableRow[]) {
	const result: { row: number, column: TableColumn, first: number }[] = [];
	for (const column of columns) {
		if (!column.unique || column.type === FormFieldType.Formula)
			continue;
		const seen = new Map<string, number>();
		rows.forEach((row, index) => {
			const key = uniqueKey(row[column.key]);
			if (key === undefined)
				return;
			const first = seen.get(key);
			if (first === undefined)
				seen.set(key, index);
			else
				result.push({ row: index, column, first });
		});
	}
	return result;
}

/** Lỗi đầu tiên của bảng (số dòng, ô bắt buộc); không lỗi trả undefined */
export function tableRowsError(field: FormField, value: unknown): TableRowsError | undefined {
	const columns = field.columns ?? [];
	const rows = asTableRows(value);
	for (let index = 0; index < rows.length; index++) {
		const [missing] = missingRequiredCells(columns, rows[index]);
		if (missing)
			return { code: "cell", row: index + 1, column: missing.label };
	}
	const [duplicate] = duplicateCells(columns, rows);
	if (duplicate)
		return { code: "duplicate", row: duplicate.row + 1, column: duplicate.column.label, first: duplicate.first + 1 };
	const filled = cleanTableRows(field, rows).length;
	const min = tableMinRows(field);
	if (filled < min)
		return min <= 1 ? { code: "required" } : { code: "minRows", count: min };
	if (filled > tableMaxRows(field))
		return { code: "maxRows", count: tableMaxRows(field) };
	return undefined;
}

/** Cột cộng được: số / số tiền */
export const isSummableColumn = (column: TableColumn) => column.type === FormFieldType.Number || column.type === FormFieldType.Money || column.type === FormFieldType.Formula;

/** Kiểu cột làm toán hạng của công thức: số nhập tay (không lấy cột công thức khác để khỏi vòng lặp) */
export const isFormulaOperand = (column: TableColumn) => column.type === FormFieldType.Number || column.type === FormFieldType.Money;

/** Kết quả cột công thức của một dòng — giống backend computeFormula (thiếu toán hạng / chia 0: không có giá trị, làm tròn 2 số lẻ) */
export function computeFormula(row: TableRow, formula?: TableFormula): number | undefined {
	if (!formula)
		return undefined;
	const left = row[formula.left];
	const right = typeof formula.right === "number" ? formula.right : row[formula.right];
	if (typeof left !== "number" || typeof right !== "number" || !Number.isFinite(left) || !Number.isFinite(right))
		return undefined;
	const ops: Record<FormulaOperator, () => number | undefined> = {
		[FormulaOperator.Add]: () => left + right,
		[FormulaOperator.Subtract]: () => left - right,
		[FormulaOperator.Multiply]: () => left * right,
		[FormulaOperator.Divide]: () => (right === 0 ? undefined : left / right),
	};
	const result = ops[formula.op]?.();
	return result === undefined ? undefined : Math.round(result * 100) / 100;
}

/** Giá trị số của một ô để cộng tổng / hiển thị: cột công thức tính từ dòng, cột khác lấy giá trị đã nhập */
export function numericCell(column: TableColumn, row: TableRow): number | undefined {
	const value = column.type === FormFieldType.Formula ? computeFormula(row, column.formula) : row[column.key];
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** Tổng một cột số của các dòng (bỏ qua ô trống; cột công thức tính từng dòng) */
export function columnTotal(rows: TableRow[], column: TableColumn) {
	return Math.round(rows.reduce((sum, row) => sum + (numericCell(column, row) ?? 0), 0) * 100) / 100;
}

/** Cột hiển thị dạng tiền: số tiền, hoặc công thức có kết quả là số tiền (mặc định) */
export const isMoneyColumn = (column: TableColumn) => column.type === FormFieldType.Money || (column.type === FormFieldType.Formula && column.resultType !== FormFieldType.Number);

/** Bảng có dòng tổng khi ít nhất một cột số bật "hiện tổng" */
export const hasTotalRow = (columns: TableColumn[]) => columns.some(column => column.showTotal && isSummableColumn(column));
