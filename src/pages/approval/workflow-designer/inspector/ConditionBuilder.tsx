import type { JsonLogic } from "#src/api/approval-workflow/types";
import type { FormField } from "#src/api/setting/request-type/types";
import type { ConditionGroup, ConditionOperator, ConditionRow } from "../lib/condition";
import { FormFieldType } from "#src/api/setting/request-type/types";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, DatePicker, Input, InputNumber, Segmented, Select, theme, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	defaultValueFor,
	logicToRows,
	OPERATOR_I18N_KEY,
	OPERATOR_SYMBOL,
	operatorsFor,
	rowsToLogic,
} from "../lib/condition";

interface ConditionBuilderProps {
	value?: JsonLogic
	onChange: (value: JsonLogic | undefined) => void
	fields: FormField[]
	disabled?: boolean
}

type Mode = "builder" | "json";

/** Trình tạo điều kiện: các hàng [trường] [toán tử] [giá trị] nối bằng AND/OR → json-logic; có chế độ JSON thô */
export function ConditionBuilder({ value, onChange, fields: allFields, disabled }: ConditionBuilderProps) {
	const { t } = useTranslation();
	// Trường bảng chưa dùng được trong điều kiện (tổng cột / số dòng sẽ hỗ trợ sau)
	const fields = allFields.filter(f => f.type !== FormFieldType.Table);
	const { token } = theme.useToken();
	const [initial] = useState(() => logicToRows(value));
	const [mode, setMode] = useState<Mode>(initial && fields.length ? "builder" : "json");
	const [group, setGroup] = useState<ConditionGroup>(initial ?? { combinator: "and", rows: [] });
	const [raw, setRaw] = useState(() => (value ? JSON.stringify(value, null, 2) : ""));
	const [rawError, setRawError] = useState(false);
	const [notRepresentable, setNotRepresentable] = useState(false);

	const commit = (next: ConditionGroup) => {
		setGroup(next);
		onChange(rowsToLogic(next));
	};

	const updateRow = (index: number, patch: Partial<ConditionRow>) => {
		commit({ ...group, rows: group.rows.map((r, i) => (i === index ? { ...r, ...patch } : r)) });
	};

	const changeField = (index: number, key: string) => {
		const field = fields.find(f => f.key === key);
		const row = group.rows[index];
		const allowed = operatorsFor(field?.type);
		const operator = allowed.includes(row.operator) ? row.operator : allowed[0];
		updateRow(index, { field: key, operator, value: defaultValueFor(field, operator) });
	};

	const changeOperator = (index: number, operator: ConditionOperator) => {
		const row = group.rows[index];
		const field = fields.find(f => f.key === row.field);
		const wasList = row.operator === "in";
		const isList = operator === "in";
		updateRow(index, { operator, value: wasList === isList ? row.value : defaultValueFor(field, operator) });
	};

	const addRow = () => {
		const field = fields[0];
		const operator = operatorsFor(field?.type)[0];
		commit({ ...group, rows: [...group.rows, { field: field?.key ?? "", operator, value: defaultValueFor(field, operator) }] });
	};

	const switchMode = (next: Mode) => {
		if (next === "json") {
			setRaw(value ? JSON.stringify(value, null, 2) : "");
			setRawError(false);
			setMode("json");
			return;
		}
		const parsed = logicToRows(value);
		if (!parsed) {
			setNotRepresentable(true);
			return;
		}
		setNotRepresentable(false);
		setGroup(parsed);
		setMode("builder");
	};

	const commitRaw = () => {
		if (!raw.trim()) {
			setRawError(false);
			onChange(undefined);
			return;
		}
		try {
			const parsed = JSON.parse(raw);
			if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
				throw new Error("not an object");
			setRawError(false);
			onChange(parsed as JsonLogic);
		}
		catch {
			setRawError(true);
		}
	};

	return (
		<div className="flex flex-col gap-2">
			{!fields.length && <Alert type="info" showIcon className="text-xs" message={t("workflowDesigner.condition.noFields")} />}
			{fields.length > 0 && (
				<div className="flex items-center justify-between gap-2">
					<Segmented<Mode>
						size="small"
						value={mode}
						onChange={switchMode}
						disabled={disabled}
						options={[
							{ value: "builder", label: t("workflowDesigner.condition.builder") },
							{ value: "json", label: t("workflowDesigner.condition.rawJson") },
						]}
					/>
					{mode === "builder" && group.rows.length > 1 && (
						<Segmented
							size="small"
							value={group.combinator}
							disabled={disabled}
							onChange={v => commit({ ...group, combinator: v as ConditionGroup["combinator"] })}
							options={[
								{ value: "and", label: t("workflowDesigner.condition.matchAll") },
								{ value: "or", label: t("workflowDesigner.condition.matchAny") },
							]}
						/>
					)}
				</div>
			)}
			{notRepresentable && <Typography.Text type="warning" className="text-xs">{t("workflowDesigner.condition.notRepresentable")}</Typography.Text>}

			{mode === "builder"
				? (
					<>
						{group.rows.map((row, index) => {
							const field = fields.find(f => f.key === row.field);
							return (
								<div
									// eslint-disable-next-line react/no-array-index-key
									key={index}
									className="flex flex-col gap-1.5 rounded-md p-2"
									style={{ background: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }}
								>
									<div className="flex items-center gap-1.5">
										{index > 0 && (
											<Typography.Text type="secondary" className="w-8 shrink-0 text-[11px] uppercase">
												{t(`workflowDesigner.summary.${group.combinator}`)}
											</Typography.Text>
										)}
										<Select
											className="min-w-0 flex-1"
											size="small"
											value={row.field || undefined}
											placeholder={t("workflowDesigner.condition.field")}
											disabled={disabled}
											status={row.field && !field ? "error" : undefined}
											options={fields.map(f => ({ value: f.key, label: f.label }))}
											onChange={key => changeField(index, key)}
										/>
										<Button size="small" type="text" danger icon={<DeleteOutlined />} disabled={disabled} onClick={() => commit({ ...group, rows: group.rows.filter((_, i) => i !== index) })} />
									</div>
									<div className="flex items-center gap-1.5">
										<Select<ConditionOperator>
											size="small"
											className="w-[118px] shrink-0"
											value={row.operator}
											disabled={disabled}
											popupMatchSelectWidth={false}
											options={operatorsFor(field?.type).map(op => ({
												value: op,
												label: `${OPERATOR_SYMBOL[op]}  ${t(`workflowDesigner.operators.${OPERATOR_I18N_KEY[op]}`)}`,
											}))}
											onChange={op => changeOperator(index, op)}
										/>
										<div className="min-w-0 flex-1">
											<ValueInput field={field} operator={row.operator} value={row.value} disabled={disabled} onChange={v => updateRow(index, { value: v })} />
										</div>
									</div>
								</div>
							);
						})}
						{!group.rows.length && <Typography.Text type="secondary" className="text-xs">{t("workflowDesigner.condition.empty")}</Typography.Text>}
						<Button size="small" type="dashed" icon={<PlusOutlined />} disabled={disabled || !fields.length} onClick={addRow}>
							{t("workflowDesigner.condition.addRow")}
						</Button>
					</>
				)
				: (
					<>
						<Input.TextArea
							value={raw}
							disabled={disabled}
							status={rawError ? "error" : undefined}
							autoSize={{ minRows: 3, maxRows: 10 }}
							className="font-mono text-xs"
							placeholder={"{ \">\": [{ \"var\": \"payload.days\" }, 3] }"}
							onChange={e => setRaw(e.target.value)}
							onBlur={commitRaw}
						/>
						{rawError && <Typography.Text type="danger" className="text-xs">{t("workflowDesigner.condition.invalidJson")}</Typography.Text>}
					</>
				)}
		</div>
	);
}

interface ValueInputProps {
	field?: FormField
	operator: ConditionOperator
	value: unknown
	disabled?: boolean
	onChange: (value: unknown) => void
}

/** Ô nhập giá trị theo kiểu trường */
function ValueInput({ field, operator, value, disabled, onChange }: ValueInputProps) {
	const { t } = useTranslation();
	const common = { size: "small" as const, disabled, className: "w-full", placeholder: t("workflowDesigner.condition.value") };

	if (operator === "in") {
		const list = Array.isArray(value) ? (value as (string | number)[]) : [];
		return field?.options?.length
			? <Select {...common} mode="multiple" value={list} options={field.options} onChange={onChange} maxTagCount="responsive" />
			: <Select {...common} mode="tags" value={list.map(String)} onChange={onChange} open={false} suffixIcon={null} />;
	}

	switch (field?.type) {
		case FormFieldType.Number:
		case FormFieldType.Money:
			return (
				<InputNumber
					{...common}
					value={typeof value === "number" ? value : null}
					onChange={v => onChange(v ?? null)}
					formatter={field.type === FormFieldType.Money ? v => `${v}`.replace(/\B(?=(?:\d{3})+(?!\d))/g, ",") : undefined}
					parser={field.type === FormFieldType.Money ? v => Number((v ?? "").replace(/,/g, "")) : undefined}
				/>
			);
		case FormFieldType.Date:
			return (
				<DatePicker
					{...common}
					value={typeof value === "string" && value ? dayjs(value) : null}
					format="DD/MM/YYYY"
					onChange={d => onChange(d ? d.format("YYYY-MM-DD") : null)}
				/>
			);
		case FormFieldType.Switch:
			return (
				<Select
					{...common}
					value={value === true ? "true" : value === false ? "false" : undefined}
					options={[
						{ value: "true", label: t("workflowDesigner.condition.true") },
						{ value: "false", label: t("workflowDesigner.condition.false") },
					]}
					onChange={v => onChange(v === "true")}
				/>
			);
		case FormFieldType.Select:
			return <Select {...common} value={value as string} options={field.options ?? []} onChange={onChange} />;
		default:
			return <Input {...common} value={value === null || value === undefined ? "" : String(value)} onChange={e => onChange(e.target.value)} />;
	}
}
