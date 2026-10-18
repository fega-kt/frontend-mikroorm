import type { FormField, TableColumn, TableRow } from "#src/api/setting/request-type/types";
import type { TableColumnsType } from "antd";
import { FormFieldType } from "#src/api/setting/request-type/types";
import { CopyOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, DatePicker, Form, Input, InputNumber, Select, Table, Tooltip, Typography } from "antd";
import { NoFormStyle } from "antd/es/form/context";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { DATE_FORMAT, formatMoney, formatPayloadValue, parseMoney } from "../lib/payload";
import { asTableRows, columnTotal, duplicateCells, emptyTableRow, hasTotalRow, isEmptyCell, isMoneyColumn, isSummableColumn, missingRequiredCells, numericCell, tableMaxRows } from "../lib/table-field";

const { Text } = Typography;
const API_DATE = "YYYY-MM-DD";

/** Số hiển thị của cột số / tiền / công thức */
const formatNumberCell = (column: TableColumn, value: number) => (isMoneyColumn(column) ? formatMoney(value) : value.toLocaleString("vi-VN"));

/** Ô công thức: chỉ đọc, tính lại theo các ô của dòng mỗi khi nhập */
function FormulaCell({ column, row }: { column: TableColumn, row: TableRow }) {
	const value = numericCell(column, row);
	return <Text type={value === undefined ? "secondary" : undefined} className="block px-[11px] text-right tabular-nums">{value === undefined ? "—" : formatNumberCell(column, value)}</Text>;
}

/**
 * Dòng "Tổng cộng" cuối bảng: cột bật hiện tổng thì cộng giá trị các dòng, nhãn đặt ở cột đầu tiên không có tổng.
 * `trailing`: số ô sau các cột dữ liệu (cột thao tác ở bảng nhập).
 */
function TotalRow({ columns, rows, trailing = 0 }: { columns: TableColumn[], rows: TableRow[], trailing?: number }) {
	const { t } = useTranslation();
	const labelAt = columns.findIndex(column => !(column.showTotal && isSummableColumn(column)));
	return (
		<Table.Summary.Row className="font-semibold">
			<Table.Summary.Cell index={0} />
			{columns.map((column, index) => {
				const total = column.showTotal && isSummableColumn(column);
				return (
					<Table.Summary.Cell key={column.key} index={index + 1} align={total ? "right" : undefined}>
						{total
							? formatNumberCell(column, columnTotal(rows, column))
							: index === labelAt ? t("approval.formSchema.table.total") : null}
					</Table.Summary.Cell>
				);
			})}
			{Array.from({ length: trailing }, (_, i) => <Table.Summary.Cell key={`trailing-${i}`} index={columns.length + 1 + i} />)}
		</Table.Summary.Row>
	);
}

/** Cột số / số tiền / công thức căn phải để dễ so hàng */
const isNumeric = isSummableColumn;

/** Độ rộng tối thiểu của cột theo kiểu: bảng nhiều cột thì cuộn ngang thay vì bóp ô */
const MIN_WIDTH: Record<TableColumn["type"], number> = {
	[FormFieldType.Text]: 180,
	[FormFieldType.Number]: 100,
	[FormFieldType.Money]: 140,
	[FormFieldType.Date]: 140,
	[FormFieldType.Select]: 150,
	[FormFieldType.Formula]: 140,
};

interface CellInputProps {
	column: TableColumn
	value: unknown
	disabled?: boolean
	invalid?: boolean
	/** Cột lựa chọn không được trùng: giá trị đã chọn ở dòng khác (bị làm mờ trong danh sách) */
	taken?: Set<unknown>
	onChange: (value: unknown) => void
}

/** Ô nhập của một cột; ngày giữ dạng YYYY-MM-DD trong dòng (đúng như payload), chỉ đổi sang dayjs để hiển thị */
function CellInput({ column, value, disabled, invalid, taken, onChange }: CellInputProps) {
	const status = invalid ? "error" : undefined;
	const common = { disabled, status, "aria-label": column.label, "placeholder": column.placeholder } as const;
	switch (column.type) {
		case FormFieldType.Number:
			return <InputNumber {...common} className="w-full" min={column.min} max={column.max} value={value as number} onChange={v => onChange(v ?? undefined)} />;
		case FormFieldType.Money:
			return (
				<InputNumber<number>
					{...common}
					className="w-full"
					min={column.min}
					max={column.max}
					formatter={formatMoney}
					parser={parseMoney}
					value={value as number}
					onChange={v => onChange(v ?? undefined)}
				/>
			);
		case FormFieldType.Date:
			return (
				<DatePicker
					{...common}
					className="w-full"
					format={DATE_FORMAT}
					value={typeof value === "string" && value ? dayjs(value) : null}
					onChange={date => onChange(date ? date.format(API_DATE) : undefined)}
				/>
			);
		case FormFieldType.Select:
			return (
				<Select
					{...common}
					className="w-full"
					allowClear
					options={column.options?.map(option => ({ ...option, disabled: !!taken?.has(option.value) && option.value !== value }))}
					value={value as string}
					onChange={v => onChange(v)}
				/>
			);
		case FormFieldType.Text:
		default:
			return <Input {...common} maxLength={column.max ?? 500} value={(value as string) ?? ""} onChange={e => onChange(e.target.value)} />;
	}
}

interface TableFieldInputProps {
	field: FormField
	value?: unknown
	onChange?: (rows: TableRow[]) => void
	disabled?: boolean
}

/**
 * Ô nhập trường bảng: mỗi dòng một hàng ô nhập theo cấu hình cột, thêm / nhân bản / xóa dòng.
 * `value` / `onChange` do Form.Item truyền xuống; khi Form.Item báo lỗi, ô bắt buộc còn trống được tô đỏ.
 */
export function TableFieldInput({ field, value, onChange, disabled }: TableFieldInputProps) {
	const { t } = useTranslation();
	const { status } = Form.Item.useStatus();
	const columns = field.columns ?? [];
	const rows = asTableRows(value);
	const max = tableMaxRows(field);
	// Ô trùng tô đỏ ngay khi nhập (không chờ bấm gửi): "dòng:mã cột"
	const duplicates = new Set(duplicateCells(columns, rows).map(item => `${item.row}:${item.column.key}`));
	/** Cột lựa chọn không được trùng: các giá trị đang dùng trong cột */
	const takenOf = (column: TableColumn) => (column.unique && column.type === FormFieldType.Select ? new Set(rows.map(row => row[column.key])) : undefined);
	const full = rows.length >= max;

	const setRows = (next: TableRow[]) => onChange?.(next);
	const setCell = (index: number, key: string, cell: unknown) => setRows(rows.map((row, i) => (i === index ? { ...row, [key]: cell } : row)));

	const tableColumns: TableColumnsType<TableRow> = [
		{ key: "__index", title: "#", width: 48, align: "center", render: (_, __, index) => <Text type="secondary">{index + 1}</Text> },
		...columns.map(column => ({
			key: column.key,
			title: (
				<span className="whitespace-nowrap">
					{column.label}
					{column.required && <span className="ml-1 text-[var(--ant-color-error)]">*</span>}
				</span>
			),
			align: isNumeric(column) ? "right" as const : undefined,
			onCell: () => ({ style: { minWidth: MIN_WIDTH[column.type] } }),
			render: (_: unknown, row: TableRow, index: number) => {
				if (column.type === FormFieldType.Formula)
					return <FormulaCell column={column} row={row} />;
				const invalid = duplicates.has(`${index}:${column.key}`) || (status === "error" && missingRequiredCells(columns, row).includes(column));
				return <CellInput column={column} value={row[column.key]} disabled={disabled} invalid={invalid} taken={takenOf(column)} onChange={cell => setCell(index, column.key, cell)} />;
			},
		})),
	];
	if (!disabled) {
		tableColumns.push({
			key: "__actions",
			width: 80,
			align: "center",
			render: (_, row, index) => (
				<div className="flex justify-center">
					<Tooltip title={t("approval.formSchema.table.copyRow")}>
						<Button
							type="text"
							size="small"
							aria-label={t("approval.formSchema.table.copyRow")}
							icon={<CopyOutlined />}
							disabled={full}
							onClick={() => setRows([...rows.slice(0, index + 1), { ...row }, ...rows.slice(index + 1)])}
						/>
					</Tooltip>
					<Tooltip title={t("approval.formSchema.table.deleteRow")}>
						<Button type="text" size="small" danger aria-label={t("approval.formSchema.table.deleteRow")} icon={<DeleteOutlined />} onClick={() => setRows(rows.filter((_, i) => i !== index))} />
					</Tooltip>
				</div>
			),
		});
	}

	return (
		<div className="flex flex-col gap-2">
			{/* Lỗi của cả trường (thiếu dòng, ô bắt buộc…) không tô đỏ mọi ô: từng ô tự đặt trạng thái theo lỗi của chính nó */}
			<NoFormStyle status>
				<Table<TableRow>
					size="small"
					bordered
					pagination={false}
					scroll={{ x: "max-content" }}
					columns={tableColumns}
					dataSource={rows}
					// Dòng chưa có id riêng (payload chỉ lưu giá trị ô); thứ tự dòng là định danh
					rowKey={row => String(rows.indexOf(row))}
					locale={{ emptyText: <Text type="secondary">{t("approval.formSchema.table.empty")}</Text> }}
					summary={hasTotalRow(columns) ? () => <TotalRow columns={columns} rows={rows} trailing={disabled ? 0 : 1} /> : undefined}
				/>
			</NoFormStyle>
			<div className="flex items-center gap-3">
				{!disabled && (
					<Button type="dashed" icon={<PlusOutlined />} disabled={full} onClick={() => setRows([...rows, emptyTableRow()])}>
						{t("approval.formSchema.table.addRow")}
					</Button>
				)}
				<Text type="secondary" className="text-xs">
					{field.maxRows ? t("approval.formSchema.table.rowCountMax", { count: rows.length, max }) : t("approval.formSchema.table.rowCount", { count: rows.length })}
				</Text>
			</div>
		</div>
	);
}

/** Bảng chỉ đọc (chi tiết tờ trình): giá trị định dạng như trường thường cùng kiểu */
export function TableFieldView({ field, value }: { field: FormField, value: unknown }) {
	const { t } = useTranslation();
	const columns = field.columns ?? [];
	const rows = asTableRows(value);
	const tableColumns: TableColumnsType<TableRow> = [
		{ key: "__index", title: "#", width: 48, align: "center", render: (_, __, index) => <Text type="secondary">{index + 1}</Text> },
		...columns.map(column => ({
			key: column.key,
			title: <span className="whitespace-nowrap">{column.label}</span>,
			align: isNumeric(column) ? "right" as const : undefined,
			render: (_: unknown, row: TableRow) => {
				if (column.type === FormFieldType.Formula)
					return <FormulaCell column={column} row={row} />;
				return isEmptyCell(row[column.key]) ? "" : formatPayloadValue(column as FormField, row[column.key], t);
			},
		})),
	];
	return (
		<Table<TableRow>
			size="small"
			bordered
			pagination={false}
			scroll={{ x: "max-content" }}
			columns={tableColumns}
			dataSource={rows}
			rowKey={row => String(rows.indexOf(row))}
			locale={{ emptyText: <Text type="secondary">{t("approval.formSchema.table.empty")}</Text> }}
			summary={hasTotalRow(columns) ? () => <TotalRow columns={columns} rows={rows} /> : undefined}
		/>
	);
}
