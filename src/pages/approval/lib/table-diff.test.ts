import type { FormField, TableColumn } from "#src/api/setting/request-type/types";
import { FormFieldType, FormulaOperator } from "#src/api/setting/request-type/types";
import { describe, expect, it } from "vitest";
import { diffTableRows, formatTableCell, TableDiffKind } from "./table-diff";
import { cleanTableRows, TABLE_ROW_ID } from "./table-field";

const columns: TableColumn[] = [
	{ key: "device", label: "Thiết bị", type: FormFieldType.Text },
	{ key: "price", label: "Đơn giá", type: FormFieldType.Money },
	{ key: "qty", label: "Số lượng", type: FormFieldType.Number, showTotal: true },
	{ key: "amount", label: "Thành tiền", type: FormFieldType.Formula, formula: { left: "price", op: FormulaOperator.Multiply, right: "qty" }, showTotal: true },
];
const t = (key: string) => key;

describe("diffTableRows", () => {
	it("marks edited cells, including formula columns", () => {
		const rows = diffTableRows(columns, [{ _id: "a", device: "Laptop", price: 2, qty: 2222 }], [{ _id: "a", device: "Laptop", price: 25000000, qty: 2 }]);
		expect(rows[0].kind).toBe(TableDiffKind.Changed);
		expect([...rows[0].changed].sort()).toEqual(["amount", "price", "qty"]);
	});

	it("treats empty and missing cells as equal", () => {
		const rows = diffTableRows(columns, [{ _id: "a", device: "Laptop", price: "" }], [{ _id: "a", device: "Laptop" }]);
		expect(rows[0].kind).toBe(TableDiffKind.Same);
	});

	it("keeps rows after a removed middle row as unchanged", () => {
		const before = [{ _id: "a", device: "Laptop" }, { _id: "b", device: "Chuột" }, { _id: "c", device: "SSD" }];
		const after = [{ _id: "a", device: "Laptop" }, { _id: "c", device: "SSD" }];
		// Dòng bị xoá đứng đúng chỗ cũ, dòng sau nó không bị coi là sửa
		expect(diffTableRows(columns, before, after).map(row => [row.kind, row.index])).toEqual([
			[TableDiffKind.Same, 1],
			[TableDiffKind.Removed, undefined],
			[TableDiffKind.Same, 2],
		]);
	});

	it("shows a replaced row as removed + added instead of edited", () => {
		const before = [{ _id: "a", device: "Laptop" }, { _id: "b", device: "Màn hình" }];
		const after = [{ _id: "a", device: "Laptop" }, { _id: "x", device: "Máy tính bảng" }];
		expect(diffTableRows(columns, before, after).map(row => row.kind)).toEqual([TableDiffKind.Same, TableDiffKind.Removed, TableDiffKind.Added]);
	});

	it("marks rows appended to the end as added", () => {
		const rows = diffTableRows(columns, [{ _id: "a", device: "Laptop" }], [{ _id: "a", device: "Laptop" }, { _id: "b", device: "Màn hình" }]);
		expect(rows.map(row => [row.kind, row.index])).toEqual([[TableDiffKind.Same, 1], [TableDiffKind.Added, 2]]);
	});

	it("matches an edited row by id even when it moved", () => {
		const before = [{ _id: "a", device: "Laptop", qty: 1 }, { _id: "b", device: "Chuột" }];
		const after = [{ _id: "b", device: "Chuột" }, { _id: "a", device: "Laptop", qty: 3 }];
		const rows = diffTableRows(columns, before, after);
		expect(rows.map(row => [row.kind, row.index])).toEqual([[TableDiffKind.Same, 1], [TableDiffKind.Changed, 2]]);
		expect([...rows[1].changed]).toEqual(["qty"]);
	});
});

describe("cleanTableRows", () => {
	it("keeps the row id and drops empty rows", () => {
		const field = { key: "items", label: "Bảng", type: FormFieldType.Table, columns } as FormField;
		const rows = cleanTableRows(field, [{ [TABLE_ROW_ID]: "a", device: " Laptop ", qty: 2, amount: 99 }, { [TABLE_ROW_ID]: "b", device: "" }]);
		// Cột công thức do server tính lại nên không gửi
		expect(rows).toEqual([{ [TABLE_ROW_ID]: "a", device: "Laptop", qty: 2 }]);
	});
});

describe("formatTableCell", () => {
	it("formats money and formula cells", () => {
		const row = { _id: "a", device: "Laptop", price: 25000000, qty: 2 };
		expect(formatTableCell(columns[1], row, t)).toBe("25,000,000");
		expect(formatTableCell(columns[3], row, t)).toBe("50,000,000");
		expect(formatTableCell(columns[0], undefined, t)).toBe("");
	});
});
