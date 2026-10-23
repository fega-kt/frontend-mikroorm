import type { HistoryFieldChange } from "#src/api/approval-request";
import type { FormField, TableColumn } from "#src/api/setting/request-type/types";
import type { TableDiffRow } from "../../lib/table-diff";
import { FormFieldType, REFERENCE_FIELD_TYPES } from "#src/api/setting/request-type/types";
import { ArrowRightOutlined } from "@ant-design/icons";
import { Button, theme, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatMoney, formatPayloadValue } from "../../lib/payload";
import { diffTableRows, formatTableCell, TableDiffKind } from "../../lib/table-diff";
import { asTableRows, columnTotal, hasTotalRow, isMoneyColumn, isSummableColumn } from "../../lib/table-field";

const { Text } = Typography;

/** Văn bản dài hơn mức này hiện dạng khối (cũ trên, mới dưới) thay vì cùng một dòng */
const LONG_TEXT = 80;
/** Văn bản dài hơn mức này thu gọn 3 dòng, có nút xem đầy đủ */
const CLAMP_TEXT = 240;

type Translate = (key: string, options?: Record<string, unknown>) => string;

interface ChangeRow {
	key: string
	label: string
	/** Trường eform (định dạng theo kiểu); không có = trường chung của tờ trình */
	def?: FormField
	from: unknown
	to: unknown
}

/** Nhãn và định nghĩa của một trường đổi; trường eform tra theo formSchema nên nhãn theo ngôn ngữ hiện tại */
function resolveChange(change: HistoryFieldChange, formSchema: FormField[], t: Translate): ChangeRow {
	const { field, from, to } = change;
	/** Trường lưu dạng { id, name } (nhóm, đơn vị trình): hiện tên */
	const briefName = (value: unknown) => (value && typeof value === "object" ? (value as { name?: string }).name : value);
	if (field.startsWith("payload.")) {
		const key = field.slice("payload.".length);
		const def = formSchema.find(item => item.key === key);
		// Trường đã bị gỡ khỏi eform: không còn nhãn để tra nên hiện khóa kỹ thuật
		return { key: field, label: def?.label ?? key, def, from, to };
	}
	switch (field) {
		case "title":
			return { key: field, label: t("approval.fields.title"), from, to };
		case "priority":
			return { key: field, label: t("approval.form.priority"), from: from == null ? from : t(`approval.priority.${from}`), to: to == null ? to : t(`approval.priority.${to}`) };
		case "category":
			return { key: field, label: t("approval.form.category"), from: briefName(from), to: briefName(to) };
		case "department":
			return { key: field, label: t("approval.form.submitUnit"), from: briefName(from), to: briefName(to) };
		default:
			return { key: field, label: field, from, to };
	}
}

const isEmpty = (value: unknown) => value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);

function OldValue({ children, block }: { children: React.ReactNode, block?: boolean }) {
	const { token } = theme.useToken();
	return (
		<span
			className={block ? "block whitespace-pre-wrap rounded-md px-2.5 py-1.5" : "rounded px-1.5"}
			style={{ background: token.colorErrorBg, color: token.colorTextSecondary, textDecoration: "line-through" }}
		>
			{children}
		</span>
	);
}

function NewValue({ children, block }: { children: React.ReactNode, block?: boolean }) {
	const { token } = theme.useToken();
	return (
		<span className={block ? "block whitespace-pre-wrap rounded-md px-2.5 py-1.5" : "rounded px-1.5 font-medium"} style={{ background: token.colorSuccessBg }}>
			{children}
		</span>
	);
}

const Arrow = () => <ArrowRightOutlined className="text-xs opacity-60" aria-hidden />;

/** Văn bản dài: thu gọn 3 dòng, bấm để xem đầy đủ */
function ClampText({ text }: { text: string }) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const long = text.length > CLAMP_TEXT;
	return (
		<>
			<span className={long && !open ? "line-clamp-3" : undefined}>{text}</span>
			{long && (
				<Button type="link" size="small" className="!h-auto !p-0" onClick={() => setOpen(!open)}>
					{open ? t("approval.history.changes.showLess") : t("approval.history.changes.showMore")}
				</Button>
			)}
		</>
	);
}

/** Người / phòng ban / nhóm: chip tên (giá trị { id, name } hoặc mảng) */
function referenceNames(value: unknown) {
	return (Array.isArray(value) ? value : [value]).map(item => (item as { name?: string } | null)?.name).filter(Boolean) as string[];
}

function ReferenceChips({ value, old }: { value: unknown, old?: boolean }) {
	const { token } = theme.useToken();
	const names = referenceNames(value);
	if (!names.length)
		return <Text type="secondary">—</Text>;
	return (
		<>
			{names.map(name => (
				<span
					key={name}
					className="inline-flex items-center rounded-full px-2.5 py-0.5"
					style={old
						? { background: token.colorErrorBg, color: token.colorTextSecondary, textDecoration: "line-through" }
						: { background: token.colorSuccessBg, fontWeight: 500 }}
				>
					{name}
				</span>
			))}
		</>
	);
}

/** Một ô số / chữ trong bảng so sánh: ô đổi hiện giá trị cũ gạch ngang nhỏ phía trên */
function DiffCell({ column, row, t }: { column: TableColumn, row: TableDiffRow, t: Translate }) {
	const { token } = theme.useToken();
	const next = formatTableCell(column, row.after, t);
	if (row.kind === TableDiffKind.Removed)
		return <span style={{ textDecoration: "line-through" }}>{formatTableCell(column, row.before, t)}</span>;
	if (row.kind !== TableDiffKind.Changed || !row.changed.has(column.key))
		return <>{next}</>;
	const prev = formatTableCell(column, row.before, t);
	return (
		<span className="inline-flex flex-col gap-0.5" style={{ alignItems: isSummableColumn(column) ? "flex-end" : "flex-start" }}>
			<span className="text-xs" style={{ color: token.colorTextSecondary, textDecoration: "line-through" }}>{prev || "—"}</span>
			<span className="font-semibold">{next || "—"}</span>
		</span>
	);
}

const formatTotal = (column: TableColumn, value: number) => (isMoneyColumn(column) ? formatMoney(value) : value.toLocaleString("vi-VN"));

/**
 * Trường bảng: tạo tờ trình thì hiện cả bảng; cập nhật thì so từng dòng (sửa / thêm / xoá),
 * mặc định ẩn dòng giữ nguyên.
 */
function TableChange({ field, from, to, created }: { field: FormField, from: unknown, to: unknown, created: boolean }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [showAll, setShowAll] = useState(false);
	const columns = field.columns ?? [];
	const rows = created
		? asTableRows(to).map((row, i): TableDiffRow => ({ kind: TableDiffKind.Same, index: i + 1, after: row, changed: new Set() }))
		: diffTableRows(columns, from, to);
	const count = (kind: TableDiffKind) => rows.filter(row => row.kind === kind).length;
	const sameCount = created ? 0 : count(TableDiffKind.Same);
	const visible = showAll || created ? rows : rows.filter(row => row.kind !== TableDiffKind.Same);
	const tone: Record<TableDiffKind, { bg?: string, bar?: string }> = {
		[TableDiffKind.Same]: {},
		[TableDiffKind.Changed]: { bg: token.colorWarningBg, bar: token.colorWarning },
		[TableDiffKind.Added]: { bg: token.colorSuccessBg, bar: token.colorSuccess },
		[TableDiffKind.Removed]: { bg: token.colorErrorBg, bar: token.colorError },
	};
	const totalColumns = hasTotalRow(columns) ? columns : [];
	const labelAt = columns.findIndex(column => !(column.showTotal && isSummableColumn(column)));
	const border = `1px solid ${token.colorBorderSecondary}`;
	const cellClass = "px-3 py-2 align-top";

	return (
		<div className="flex min-w-0 flex-col gap-2">
			{!created && (
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: token.colorTextSecondary }}>
					{[TableDiffKind.Changed, TableDiffKind.Added, TableDiffKind.Removed].map(kind => count(kind) > 0 && (
						<span key={kind} className="inline-flex items-center gap-1.5">
							<span className="size-2 rounded-sm" style={{ background: tone[kind].bar }} />
							{t(`approval.history.changes.rows.${kind}`, { count: count(kind) })}
						</span>
					))}
				</div>
			)}
			{/* Bảng dài cuộn trong khung, giữ tiêu đề cột */}
			<div className="max-h-[480px] overflow-auto rounded-lg" style={{ border }}>
				<table className="w-full border-collapse text-[13px]" style={{ minWidth: 120 + columns.length * 120 }}>
					<thead className="sticky top-0 z-[1]" style={{ background: token.colorFillAlter }}>
						<tr>
							<th scope="col" className="w-10 px-2 py-2 text-center font-semibold" style={{ color: token.colorTextSecondary, borderBottom: border, background: token.colorBgContainer }}>#</th>
							{columns.map(column => (
								<th
									key={column.key}
									scope="col"
									className="whitespace-nowrap px-3 py-2 font-semibold"
									style={{ color: token.colorTextSecondary, borderBottom: border, background: token.colorBgContainer, textAlign: isSummableColumn(column) ? "right" : "left" }}
								>
									{column.label}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{visible.map((row, i) => {
							const removed = row.kind === TableDiffKind.Removed;
							return (
								<tr key={`${row.kind}-${row.index ?? `r${i}`}`} style={{ background: tone[row.kind].bg, color: removed ? token.colorTextSecondary : undefined }}>
									<td
										className="px-2 py-2 text-center align-top tabular-nums"
										style={{
											borderBottom: border,
											boxShadow: tone[row.kind].bar ? `inset 3px 0 0 ${tone[row.kind].bar}` : undefined,
											color: tone[row.kind].bar ?? token.colorTextSecondary,
											fontWeight: row.kind === TableDiffKind.Added || removed ? 600 : undefined,
										}}
									>
										{removed ? "−" : row.kind === TableDiffKind.Added ? `+${row.index}` : row.index}
									</td>
									{columns.map(column => (
										<td key={column.key} className={`${cellClass} tabular-nums`} style={{ borderBottom: border, textAlign: isSummableColumn(column) ? "right" : "left" }}>
											<DiffCell column={column} row={row} t={t} />
										</td>
									))}
								</tr>
							);
						})}
						{totalColumns.length > 0 && (
							<tr style={{ background: token.colorFillAlter }}>
								<td className="px-2 py-2" />
								{columns.map((column, index) => {
									if (!(column.showTotal && isSummableColumn(column)))
										return <td key={column.key} className={`${cellClass} font-semibold`}>{index === labelAt ? t("approval.formSchema.table.total") : null}</td>;
									const next = columnTotal(asTableRows(to), column);
									const prev = columnTotal(asTableRows(from), column);
									return (
										<td key={column.key} className={`${cellClass} text-right tabular-nums`}>
											{created || prev === next
												? <span className="font-bold">{formatTotal(column, next)}</span>
												: (
													<span className="inline-flex flex-col items-end gap-0.5">
														<span className="text-xs" style={{ color: token.colorTextSecondary, textDecoration: "line-through" }}>{formatTotal(column, prev)}</span>
														<span className="font-bold">{formatTotal(column, next)}</span>
													</span>
												)}
										</td>
									);
								})}
							</tr>
						)}
					</tbody>
				</table>
			</div>
			{sameCount > 0 && (
				<div className="flex items-center gap-2 text-xs" style={{ color: token.colorTextSecondary }}>
					<span>{showAll ? t("approval.history.changes.showingAll", { count: asTableRows(to).length }) : t("approval.history.changes.sameHidden", { count: sameCount })}</span>
					<Button type="link" size="small" className="!h-auto !p-0 !text-xs" onClick={() => setShowAll(!showAll)}>
						{showAll ? t("approval.history.changes.showChanged") : t("approval.history.changes.showAll")}
					</Button>
				</div>
			)}
		</div>
	);
}

/** Giá trị của một trường: lúc tạo chỉ có giá trị ban đầu; lúc cập nhật là cũ → mới */
function ChangeValue({ row, created }: { row: ChangeRow, created: boolean }) {
	const { t } = useTranslation();
	const { def, from, to } = row;
	if (def?.type === FormFieldType.Table)
		return <TableChange field={def} from={from} to={to} created={created} />;
	if (def && REFERENCE_FIELD_TYPES.has(def.type)) {
		if (created)
			return <div className="flex flex-wrap gap-1.5">{referenceNames(to).map(name => <span key={name} className="rounded-full bg-black/[0.04] px-2.5 py-0.5 dark:bg-white/[0.08]">{name}</span>)}</div>;
		return (
			<div className="flex flex-wrap items-center gap-2">
				{!isEmpty(from) && <ReferenceChips value={from} old />}
				{!isEmpty(from) && <Arrow />}
				<ReferenceChips value={to} />
			</div>
		);
	}
	const text = (value: unknown) => (isEmpty(value) ? "—" : def ? formatPayloadValue(def, value, t) : String(value));
	const prev = text(from);
	const next = text(to);
	if (created)
		return <span className="whitespace-pre-wrap"><ClampText text={next} /></span>;
	if (def?.type === FormFieldType.Textarea || prev.length > LONG_TEXT || next.length > LONG_TEXT) {
		return (
			<div className="flex flex-col gap-1.5">
				{!isEmpty(from) && <OldValue block><ClampText text={prev} /></OldValue>}
				<NewValue block><ClampText text={next} /></NewValue>
			</div>
		);
	}
	return (
		<div className="flex flex-wrap items-center gap-2">
			{!isEmpty(from) && <OldValue>{prev}</OldValue>}
			{!isEmpty(from) && <Arrow />}
			<NewValue>{next}</NewValue>
		</div>
	);
}

/**
 * Các trường đổi của một dòng lịch sử: nhãn bên trái, giá trị bên phải.
 * Dòng "tạo": trường chung trước, rồi nhóm "Nội dung tờ trình" (eform) thu gọn được.
 */
export function HistoryChanges({ changes, formSchema, created }: { changes: HistoryFieldChange[], formSchema: FormField[], created: boolean }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [contentOpen, setContentOpen] = useState(true);
	const rows = changes.map(change => resolveChange(change, formSchema, t));
	// Trường eform theo thứ tự cấu hình của loại tờ trình
	const order = new Map(formSchema.map((field, index) => [`payload.${field.key}`, index]));
	const general = rows.filter(row => !row.key.startsWith("payload."));
	const content = rows.filter(row => row.key.startsWith("payload.")).sort((a, b) => (order.get(a.key) ?? 999) - (order.get(b.key) ?? 999));
	const border = `1px solid ${token.colorBorderSecondary}`;

	const renderRows = (list: ChangeRow[]) => list.map((row, index) => (
		<div key={row.key} className="grid grid-cols-[minmax(0,160px)_minmax(0,1fr)] max-sm:grid-cols-1" style={{ borderTop: index ? border : undefined }}>
			<div className="px-3.5 py-2.5 text-[13px]" style={{ color: token.colorTextSecondary, background: token.colorFillAlter }}>{row.label}</div>
			<div className="min-w-0 px-3.5 py-2 text-[13px] leading-6">
				<ChangeValue row={row} created={created} />
			</div>
		</div>
	));

	return (
		<div className="overflow-hidden rounded-[10px]" style={{ border }}>
			{renderRows(general)}
			{created && content.length > 0 && (
				<div className="flex items-center justify-between px-3.5 py-1.5" style={{ borderTop: general.length ? border : undefined, background: token.colorFillTertiary }}>
					<span className="text-xs font-semibold uppercase" style={{ color: token.colorTextSecondary }}>{t("approval.history.changes.content")}</span>
					<Button type="link" size="small" className="!h-auto !p-0 !text-xs" aria-expanded={contentOpen} onClick={() => setContentOpen(!contentOpen)}>
						{contentOpen ? t("approval.history.changes.showLess") : t("approval.history.changes.showMore")}
					</Button>
				</div>
			)}
			{(!created || contentOpen) && content.length > 0 && <div style={{ borderTop: general.length || created ? border : undefined }}>{renderRows(content)}</div>}
		</div>
	);
}
