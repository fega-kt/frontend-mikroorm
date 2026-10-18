import type { TableColumn, TableFormula } from "#src/api/setting/request-type/types";
import { FormFieldType, FormulaOperator, TABLE_COLUMN_TYPES, TABLE_MAX_COLUMNS } from "#src/api/setting/request-type/types";
import { isFormulaOperand, isSummableColumn } from "#src/pages/approval/lib/table-field";
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useDebounceFn } from "ahooks";
import { Button, Checkbox, Input, InputNumber, Segmented, Select, theme, Tooltip, Typography } from "antd";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { columnInvalid, defaultFormula, keyPatternIssue, optionsToText, suggestFieldKey, textToOptions } from "../../form-schema";
import { KeyError } from "./key-error";

const { Text } = Typography;

/** Mã cột mới không trùng: col1, col2, … */
function nextColumnKey(columns: TableColumn[]) {
	let n = columns.length + 1;
	while (columns.some(c => c.key === `col${n}`)) n++;
	return `col${n}`;
}

const OPERATOR_LABEL: Record<FormulaOperator, string> = {
	[FormulaOperator.Multiply]: "×",
	[FormulaOperator.Divide]: "÷",
	[FormulaOperator.Add]: "+",
	[FormulaOperator.Subtract]: "−",
};

/** Công thức của cột: <cột> <phép tính> <cột | số cố định>, kết quả hiển thị dạng số tiền / số */
function FormulaEditor({ column, columns, onChange }: { column: TableColumn, columns: TableColumn[], onChange: (patch: Partial<TableColumn>) => void }) {
	const { t } = useTranslation();
	const operands = columns.filter(isFormulaOperand).map(c => ({ value: c.key, label: c.label || c.key }));
	const formula: TableFormula = column.formula ?? { left: operands[0]?.value ?? "", op: FormulaOperator.Multiply, right: operands[1]?.value ?? 1 };
	const setFormula = (patch: Partial<TableFormula>) => onChange({ formula: { ...formula, ...patch } });
	const constant = typeof formula.right === "number";
	if (!operands.length)
		return <Text type="warning" className="text-xs">{t("approval.formSchema.table.formulaNoOperand")}</Text>;
	return (
		<div className="flex flex-col gap-2">
			<Text type="secondary" className="text-xs">{t("approval.formSchema.table.formula")}</Text>
			<div className="flex gap-1.5">
				<Select size="small" className="min-w-0 flex-1" value={formula.left || undefined} options={operands} onChange={left => setFormula({ left })} />
				<Select
					size="small"
					className="w-14 shrink-0"
					value={formula.op}
					options={Object.values(FormulaOperator).map(op => ({ value: op, label: OPERATOR_LABEL[op] }))}
					onChange={op => setFormula({ op })}
				/>
			</div>
			<Segmented
				block
				size="small"
				value={constant ? "number" : "column"}
				options={[
					{ value: "column", label: t("approval.formSchema.table.formulaColumn") },
					{ value: "number", label: t("approval.formSchema.table.formulaConstant") },
				]}
				// Chuyển sang "với cột": lấy cột khác vế trái (cùng cột thì thành bình phương, hiếm khi đúng ý)
				onChange={mode => setFormula({ right: mode === "number" ? 1 : (operands.find(o => o.value !== formula.left) ?? operands[0]).value })}
			/>
			{constant
				? <InputNumber size="small" className="w-full" value={formula.right as number} onChange={right => setFormula({ right: right ?? 0 })} />
				: <Select size="small" className="w-full" value={formula.right as string} options={operands} onChange={right => setFormula({ right })} />}
			<Segmented
				block
				size="small"
				value={column.resultType ?? FormFieldType.Money}
				options={[
					{ value: FormFieldType.Money, label: t("approval.formSchema.types.money") },
					{ value: FormFieldType.Number, label: t("approval.formSchema.types.number") },
				]}
				onChange={resultType => onChange({ resultType: resultType as FormFieldType.Number | FormFieldType.Money })}
			/>
		</div>
	);
}

/**
 * Ô sửa nhãn / mã cột: gõ đổi ngay trong ô, ngừng gõ ~300ms (hoặc rời ô / Enter) mới lưu vào formSchema
 * — mỗi lần lưu dựng lại cả form xem trước nên lưu theo từng phím sẽ chậm.
 */
function DebouncedInput({ value, onCommit, normalize, ...props }: {
	value: string
	onCommit: (value: string) => void
	/** Chuẩn hoá ngay khi gõ (vd: mã cột chỉ gồm chữ không dấu, số, _) */
	normalize?: (value: string) => string
	className?: string
	status?: "error" | "warning"
}) {
	const [draft, setDraft] = useState(value);
	const [synced, setSynced] = useState(value);
	const editing = useRef(false);
	// Giá trị lưu đổi từ nơi khác (không phải do đang gõ ở ô này) thì nạp lại vào ô
	if (value !== synced && !editing.current) {
		setSynced(value);
		setDraft(value);
	}
	const { run, flush } = useDebounceFn((next: string) => {
		if (next !== value)
			onCommit(next);
	}, { wait: 300 });
	return (
		<Input
			{...props}
			size="small"
			value={draft}
			onFocus={() => {
				editing.current = true;
			}}
			onChange={(e) => {
				const next = normalize ? normalize(e.target.value) : e.target.value;
				setDraft(next);
				run(next);
			}}
			onBlur={() => {
				flush();
				editing.current = false;
			}}
			onPressEnter={e => e.currentTarget.blur()}
		/>
	);
}

interface TableColumnsEditorProps {
	columns: TableColumn[]
	onChange: (columns: TableColumn[]) => void
}

/** Danh sách cột của trường bảng: bấm một cột để mở chi tiết; sắp xếp bằng nút lên / xuống */
export function TableColumnsEditor({ columns, onChange }: TableColumnsEditorProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [open, setOpen] = useState<number | null>(columns.length ? 0 : null);
	// Id ổn định của từng cột cho key React: mã cột sửa được nên không dùng làm key (đổi mã sẽ dựng lại khung, mất focus)
	const counter = useRef(0);
	const ids = useRef<string[]>([]);
	const newId = () => `c${++counter.current}`;
	if (ids.current.length !== columns.length)
		ids.current = columns.map(() => newId());
	const typeOptions = TABLE_COLUMN_TYPES.map(type => ({ value: type, label: t(`approval.formSchema.types.${type}`) }));

	const update = (index: number, patch: Partial<TableColumn>) => onChange(columns.map((c, i) => (i === index ? { ...c, ...patch } : c)));
	const move = (index: number, delta: number) => {
		const next = [...columns];
		const [item] = next.splice(index, 1);
		next.splice(index + delta, 0, item);
		const nextIds = [...ids.current];
		const [id] = nextIds.splice(index, 1);
		nextIds.splice(index + delta, 0, id);
		ids.current = nextIds;
		onChange(next);
		setOpen(index + delta);
	};
	const remove = (index: number) => {
		ids.current = ids.current.filter((_, i) => i !== index);
		onChange(columns.filter((_, i) => i !== index));
		setOpen(null);
	};
	const add = () => {
		const key = nextColumnKey(columns);
		ids.current = [...ids.current, newId()];
		onChange([...columns, { key, label: t("approval.formSchema.table.defaultColumn"), type: FormFieldType.Text }]);
		setOpen(columns.length);
	};

	return (
		<div className="flex flex-col gap-2">
			{!columns.length && <Text type="warning" className="text-xs">{t("approval.formSchema.table.noColumns")}</Text>}
			{columns.map((column, index) => {
				const invalid = columnInvalid(column, columns);
				const issue = keyPatternIssue(column.key);
				const duplicated = columns.filter(c => c.key === column.key).length > 1;
				const keyError = issue ? t(`approval.formSchema.keyIssue.${issue}`) : duplicated ? t("approval.formSchema.table.keyDuplicate") : undefined;
				const otherKeys = columns.filter((_, i) => i !== index).map(c => c.key);
				const expanded = open === index;
				return (
					<div
						key={ids.current[index]}
						className="rounded-md"
						style={{ border: `1px solid ${expanded ? token.colorPrimary : invalid ? token.colorWarning : token.colorBorderSecondary}` }}
					>
						<button
							type="button"
							className="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent px-2 py-1.5 text-left"
							onClick={() => setOpen(expanded ? null : index)}
						>
							<span className="min-w-0 flex-1 truncate">{column.label || column.key}</span>
							<span className="shrink-0 rounded px-1.5 text-xs" style={{ background: token.colorFillTertiary, color: token.colorTextSecondary }}>
								{t(`approval.formSchema.types.${column.type}`)}
							</span>
						</button>
						{expanded && (
							<div className="flex flex-col gap-2 px-2 pb-2">
								<div className="grid grid-cols-2 gap-2">
									<label className="flex flex-col gap-1 text-xs">
										<Text type="secondary" className="text-xs">{t("approval.formSchema.table.columnLabel")}</Text>
										<DebouncedInput value={column.label} status={column.label.trim() ? undefined : "warning"} onCommit={label => update(index, { label })} />
									</label>
									<label className="flex flex-col gap-1 text-xs">
										<Text type="secondary" className="text-xs">{t("approval.formSchema.table.columnKey")}</Text>
										<DebouncedInput
											className="font-mono"
											value={column.key}
											status={keyError ? "error" : undefined}
											onCommit={key => update(index, { key })}
										/>
									</label>
								</div>
								{keyError && <KeyError message={keyError} suggestion={suggestFieldKey(column.key, otherKeys)} onApply={key => update(index, { key })} />}
								<label className="flex flex-col gap-1 text-xs">
									<Text type="secondary" className="text-xs">{t("approval.formSchema.table.columnType")}</Text>
									<Select
										size="small"
										className="w-full"
										value={column.type}
										options={typeOptions}
										onChange={type => update(index, {
											type,
											options: type === FormFieldType.Select ? column.options ?? [] : undefined,
											min: type === FormFieldType.Number || type === FormFieldType.Money ? column.min : undefined,
											max: type === FormFieldType.Number || type === FormFieldType.Money ? column.max : undefined,
											showTotal: type === FormFieldType.Number || type === FormFieldType.Money || type === FormFieldType.Formula ? column.showTotal : undefined,
											// Cột công thức không nhập tay nên không bắt buộc
											required: type === FormFieldType.Formula ? undefined : column.required,
											formula: type === FormFieldType.Formula ? column.formula ?? defaultFormula(columns) : undefined,
											resultType: type === FormFieldType.Formula ? column.resultType : undefined,
										})}
									/>
								</label>
								{column.type === FormFieldType.Select && (
									<Input.TextArea
										rows={3}
										defaultValue={optionsToText(column.options)}
										placeholder={t("approval.formSchema.optionsPlaceholder")}
										onBlur={e => update(index, { options: textToOptions(e.target.value) })}
									/>
								)}
								{(column.type === FormFieldType.Number || column.type === FormFieldType.Money) && (
									<div className="grid grid-cols-2 gap-2">
										<InputNumber size="small" className="w-full" placeholder={t("approval.formSchema.min")} value={column.min} onChange={min => update(index, { min: min ?? undefined })} />
										<InputNumber size="small" className="w-full" placeholder={t("approval.formSchema.max")} value={column.max} onChange={max => update(index, { max: max ?? undefined })} />
									</div>
								)}
								{column.type === FormFieldType.Formula && <FormulaEditor column={column} columns={columns} onChange={patch => update(index, patch)} />}
								{column.type !== FormFieldType.Formula && (
									<Checkbox checked={!!column.unique} onChange={e => update(index, { unique: e.target.checked || undefined })}>
										{t("approval.formSchema.table.unique")}
									</Checkbox>
								)}
								{isSummableColumn(column) && (
									<Checkbox checked={!!column.showTotal} onChange={e => update(index, { showTotal: e.target.checked || undefined })}>
										{t("approval.formSchema.table.showTotal")}
									</Checkbox>
								)}
								<div className="flex items-center justify-between">
									{column.type === FormFieldType.Formula
										? <span />
										: (
											<Checkbox checked={!!column.required} onChange={e => update(index, { required: e.target.checked || undefined })}>
												{t("approval.formSchema.required")}
											</Checkbox>
										)}
									<div className="flex">
										<Tooltip title={t("approval.formSchema.table.moveUp")}>
											<Button type="text" size="small" aria-label={t("approval.formSchema.table.moveUp")} icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => move(index, -1)} />
										</Tooltip>
										<Tooltip title={t("approval.formSchema.table.moveDown")}>
											<Button type="text" size="small" aria-label={t("approval.formSchema.table.moveDown")} icon={<ArrowDownOutlined />} disabled={index === columns.length - 1} onClick={() => move(index, 1)} />
										</Tooltip>
										<Tooltip title={t("approval.formSchema.table.deleteColumn")}>
											<Button type="text" size="small" danger aria-label={t("approval.formSchema.table.deleteColumn")} icon={<DeleteOutlined />} onClick={() => remove(index)} />
										</Tooltip>
									</div>
								</div>
								{invalid && <Text type="warning" className="text-xs">{t("approval.formSchema.table.columnInvalid")}</Text>}
							</div>
						)}
					</div>
				);
			})}
			<Button type="dashed" size="small" icon={<PlusOutlined />} disabled={columns.length >= TABLE_MAX_COLUMNS} onClick={add}>
				{t("approval.formSchema.table.addColumn")}
			</Button>
			<Text type="secondary" className="text-xs">{t("approval.formSchema.table.columnCount", { count: columns.length, max: TABLE_MAX_COLUMNS })}</Text>
		</div>
	);
}
