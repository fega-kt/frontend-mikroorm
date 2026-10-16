import type { FormField } from "#src/api/setting/request-type/types";
import { FormFieldType } from "#src/api/setting/request-type/types";
import { fieldSpan } from "#src/pages/approval/lib/payload";
import { Input, InputNumber, Segmented, Select, Switch, Typography } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { optionsToText, textToOptions } from "../../form-schema";
import { FIELD_TYPES, SPAN_PRESETS, WITH_MULTIPLE, WITH_RANGE } from "./field-types";

const { Text } = Typography;

interface PropertiesPanelProps {
	field: FormField
	keyError?: string
	onChange: (patch: Partial<FormField>) => void
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-3 border-b border-[var(--ant-color-border-secondary)] pb-4 last:border-b-0">
			<div className="text-[11px] font-semibold uppercase tracking-wider opacity-50">{title}</div>
			{children}
		</div>
	);
}

function Row({ label, children }: { label: string, children: React.ReactNode }) {
	return (
		<div>
			<Text type="secondary" className="mb-1 block text-xs">{label}</Text>
			{children}
		</div>
	);
}

/** Thuộc tính của trường đang chọn (render lại từ đầu khi đổi trường nhờ `key` ở chỗ dùng) */
export function PropertiesPanel({ field, keyError, onChange }: PropertiesPanelProps) {
	const { t } = useTranslation();
	const typeOptions = useMemo(() => FIELD_TYPES.map(item => ({ value: item.type, label: t(`approval.formSchema.types.${item.type}`) })), [t]);
	const span = fieldSpan(field);
	const spanValue = SPAN_PRESETS.some(p => p.value === span) ? span : undefined;

	return (
		<div className="flex flex-col gap-4">
			<Section title={t("approval.formSchema.builder.basic")}>
				<Row label={t("approval.formSchema.label")}>
					<Input value={field.label} status={field.label.trim() ? undefined : "warning"} onChange={e => onChange({ label: e.target.value })} />
				</Row>
				<Row label={t("approval.formSchema.key")}>
					<Input
						value={field.key}
						status={keyError ? "error" : undefined}
						className="font-mono"
						onChange={e => onChange({ key: e.target.value.trim() })}
					/>
					{keyError
						? <Text type="danger" className="text-xs">{keyError}</Text>
						: (
							<Text type="secondary" className="text-xs">
								{t("approval.formSchema.builder.keyHint")}
								{" "}
								<code>{`payload.${field.key}`}</code>
							</Text>
						)}
				</Row>
				<Row label={t("approval.formSchema.type")}>
					<Select
						className="w-full"
						value={field.type}
						options={typeOptions}
						onChange={type => onChange({
							type,
							options: type === FormFieldType.Select ? field.options ?? [] : undefined,
							multiple: WITH_MULTIPLE.has(type) ? field.multiple : undefined,
						})}
					/>
				</Row>
				{field.type !== FormFieldType.Switch && (
					<Row label={t("approval.formSchema.placeholder")}>
						<Input value={field.placeholder} onChange={e => onChange({ placeholder: e.target.value || undefined })} />
					</Row>
				)}
				{field.type === FormFieldType.Select && (
					<Row label={t("approval.formSchema.options")}>
						<Input.TextArea
							rows={4}
							defaultValue={optionsToText(field.options)}
							placeholder={t("approval.formSchema.optionsPlaceholder")}
							onBlur={e => onChange({ options: textToOptions(e.target.value) })}
						/>
					</Row>
				)}
			</Section>

			<Section title={t("approval.formSchema.builder.layout")}>
				<Row label={t("approval.formSchema.builder.width")}>
					<Segmented
						block
						size="small"
						value={spanValue}
						options={SPAN_PRESETS.map(p => ({ value: p.value, label: p.label === "full" ? t("approval.formSchema.builder.full") : p.label }))}
						onChange={value => onChange({ span: value })}
					/>
					<Text type="secondary" className="mt-1 block text-xs">{t("approval.formSchema.builder.widthHint", { span })}</Text>
				</Row>
			</Section>

			<Section title={t("approval.formSchema.builder.validation")}>
				{field.type !== FormFieldType.Switch && (
					<div className="flex items-center justify-between">
						<span>{t("approval.formSchema.required")}</span>
						<Switch checked={!!field.required} onChange={required => onChange({ required })} />
					</div>
				)}
				{WITH_MULTIPLE.has(field.type) && (
					<div className="flex items-center justify-between">
						<span>{t("approval.formSchema.builder.multiple")}</span>
						<Switch checked={!!field.multiple} onChange={multiple => onChange({ multiple: multiple || undefined })} />
					</div>
				)}
				{WITH_RANGE.has(field.type) && (
					<div className="grid grid-cols-2 gap-2.5">
						<Row label={t("approval.formSchema.min")}>
							<InputNumber className="w-full" value={field.min} onChange={min => onChange({ min: min ?? undefined })} />
						</Row>
						<Row label={t("approval.formSchema.max")}>
							<InputNumber className="w-full" value={field.max} onChange={max => onChange({ max: max ?? undefined })} />
						</Row>
					</div>
				)}
			</Section>
		</div>
	);
}
