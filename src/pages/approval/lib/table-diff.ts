import type { FormField, TableColumn, TableRow } from "#src/api/setting/request-type/types";
import { FormFieldType } from "#src/api/setting/request-type/types";
import { formatMoney, formatPayloadValue } from "./payload";
import { asTableRows, isEmptyCell, isMoneyColumn, numericCell, tableRowId } from "./table-field";

export enum TableDiffKind {
	Same = "same",
	Changed = "changed",
	Added = "added",
	Removed = "removed",
}

export interface TableDiffRow {
	kind: TableDiffKind
	/** Số thứ tự trong bảng mới (1-based); dòng bị xoá không có */
	index?: number
	before?: TableRow
	after?: TableRow
	/** Mã các cột đổi giá trị (chỉ dòng sửa) */
	changed: Set<string>
}

/** Giá trị so sánh của một ô: cột công thức tính lại từ dòng, ô trống coi như nhau */
function cellValue(column: TableColumn, row: TableRow) {
	if (column.type === FormFieldType.Formula)
		return numericCell(column, row);
	return isEmptyCell(row[column.key]) ? undefined : row[column.key];
}

/** Cùng một dòng ở hai lần lưu: giữ nguyên hay sửa (kèm các cột đổi) */
function compareRows(columns: TableColumn[], prev: TableRow, next: TableRow, index: number): TableDiffRow {
	// Giá trị ô là kiểu đơn giản (chuỗi, số, mảng ngày) nên so bằng JSON là đủ
	const changed = new Set(columns.filter(column => JSON.stringify(cellValue(column, prev)) !== JSON.stringify(cellValue(column, next))).map(column => column.key));
	return { kind: changed.size ? TableDiffKind.Changed : TableDiffKind.Same, index, before: prev, after: next, changed };
}

/**
 * So hai lần lưu của trường bảng theo mã dòng (bắt buộc; dữ liệu cũ đã được migrate):
 * cùng mã là sửa / giữ nguyên, mã chỉ có ở bảng mới là thêm, chỉ có ở bảng cũ là xoá (đặt lại đúng chỗ cũ, giữa các dòng còn lại).
 */
export function diffTableRows(columns: TableColumn[], before: unknown, after: unknown): TableDiffRow[] {
	const oldRows = asTableRows(before);
	const newRows = asTableRows(after);
	const oldIndex = new Map(oldRows.map((row, i) => [tableRowId(row), i]));
	const kept = new Set(newRows.map(row => tableRowId(row)));
	const result: TableDiffRow[] = [];
	// Dòng cũ tiếp theo chưa xét: dòng bị xoá được chèn vào trước dòng còn lại đứng sau nó
	let nextOld = 0;
	const flushRemoved = (until: number) => {
		for (; nextOld < until; nextOld++) {
			if (!kept.has(tableRowId(oldRows[nextOld])))
				result.push({ kind: TableDiffKind.Removed, before: oldRows[nextOld], changed: new Set() });
		}
	};
	newRows.forEach((row, i) => {
		const at = oldIndex.get(tableRowId(row));
		if (at === undefined) {
			// Dòng thay vào chỗ dòng bị xoá: hiện dòng xoá trước (đỏ) rồi mới tới dòng thêm (xanh)
			const nextKept = newRows.slice(i + 1).map(item => oldIndex.get(tableRowId(item))).find(index => index !== undefined);
			flushRemoved(nextKept ?? oldRows.length);
			result.push({ kind: TableDiffKind.Added, index: i + 1, after: row, changed: new Set() });
			return;
		}
		flushRemoved(at);
		nextOld = Math.max(nextOld, at + 1);
		result.push(compareRows(columns, oldRows[at], row, i + 1));
	});
	flushRemoved(oldRows.length);
	return result;
}

/** Chữ hiển thị của một ô bảng (số / tiền / công thức định dạng như bảng chỉ đọc) */
export function formatTableCell(column: TableColumn, row: TableRow | undefined, t: (key: string) => string) {
	if (!row)
		return "";
	if (column.type === FormFieldType.Formula || column.type === FormFieldType.Number || column.type === FormFieldType.Money) {
		const value = numericCell(column, row);
		if (value === undefined)
			return "";
		return isMoneyColumn(column) ? formatMoney(value) : value.toLocaleString("vi-VN");
	}
	return isEmptyCell(row[column.key]) ? "" : formatPayloadValue(column as FormField, row[column.key], t);
}
