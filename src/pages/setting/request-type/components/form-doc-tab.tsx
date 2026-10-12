import type { FormField } from "#src/api/setting/request-type";
import { FormFieldType } from "#src/api/setting/request-type";
import { SectionCard } from "#src/components/section-card";
import { PayloadFormItems } from "#src/pages/approval/components/form-fields";
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EyeOutlined, FormOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Form, Input, InputNumber, Select, Switch, Tooltip, Typography } from "antd";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FIELD_KEY_PATTERN, optionsToText, textToOptions } from "../form-schema";

const { Text } = Typography;

const WITH_RANGE = new Set([FormFieldType.Number, FormFieldType.Money, FormFieldType.Text, FormFieldType.Textarea]);

let uidSeq = 0;
const nextUid = () => `f${++uidSeq}`;

interface FormDocTabProps {
	value: FormField[]
	onChange: (value: FormField[]) => void
}

/** Trình soạn form của loại đơn (formSchema) + xem trước */
export function FormDocTab({ value, onChange }: FormDocTabProps) {
	const { t } = useTranslation();
	const [previewForm] = Form.useForm();
	// key React ổn định cho từng dòng (mã trường đổi khi đang gõ nên không dùng làm key được)
	const uids = useRef<string[]>([]);
	if (uids.current.length !== value.length)
		uids.current = value.map(() => nextUid());

	const typeOptions = useMemo(
		() => Object.values(FormFieldType).map(type => ({ value: type, label: t(`approval.formSchema.types.${type}`) })),
		[t],
	);
	const keyCounts = useMemo(() => value.reduce<Record<string, number>>((acc, f) => ({ ...acc, [f.key]: (acc[f.key] ?? 0) + 1 }), {}), [value]);

	const update = (index: number, patch: Partial<FormField>) => onChange(value.map((f, i) => (i === index ? { ...f, ...patch } : f)));
	const remove = (index: number) => {
		uids.current = uids.current.filter((_, i) => i !== index);
		onChange(value.filter((_, i) => i !== index));
	};
	const move = (index: number, delta: number) => {
		const next = [...value];
		const [item] = next.splice(index, 1);
		next.splice(index + delta, 0, item);
		const ids = [...uids.current];
		const [id] = ids.splice(index, 1);
		ids.splice(index + delta, 0, id);
		uids.current = ids;
		onChange(next);
	};
	const add = () => {
		let n = value.length + 1;
		while (value.some(f => f.key === `field${n}`)) n++;
		uids.current = [...uids.current, nextUid()];
		onChange([...value, { key: `field${n}`, label: "", type: FormFieldType.Text, required: false }]);
	};

	const keyError = (field: FormField) => {
		if (!FIELD_KEY_PATTERN.test(field.key))
			return t("approval.formSchema.keyPattern");
		if (keyCounts[field.key] > 1)
			return t("approval.formSchema.keyDuplicate");
		return undefined;
	};

	return (
		<div className="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4">
			<SectionCard
				icon={<FormOutlined />}
				title={t("approval.formSchema.title")}
				extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={add}>{t("approval.formSchema.add")}</Button>}
			>
				<Text type="secondary" className="block mb-4 text-[13px]">{t("approval.formSchema.description")}</Text>
				{!value.length && <Empty description={t("approval.formSchema.empty")} />}
				<div className="flex flex-col gap-3">
					{value.map((field, index) => {
						const error = keyError(field);
						return (
							<Card key={uids.current[index]} size="small">
								<div className="grid grid-cols-12 gap-2 items-start">
									<div className="col-span-12 md:col-span-3">
										<Text type="secondary" className="text-xs">{t("approval.formSchema.key")}</Text>
										<Input
											value={field.key}
											status={error ? "error" : undefined}
											onChange={e => update(index, { key: e.target.value.trim() })}
										/>
										{error && <Text type="danger" className="text-xs">{error}</Text>}
									</div>
									<div className="col-span-12 md:col-span-4">
										<Text type="secondary" className="text-xs">{t("approval.formSchema.label")}</Text>
										<Input value={field.label} status={field.label.trim() ? undefined : "warning"} onChange={e => update(index, { label: e.target.value })} />
									</div>
									<div className="col-span-8 md:col-span-3">
										<Text type="secondary" className="text-xs">{t("approval.formSchema.type")}</Text>
										<Select
											className="w-full"
											value={field.type}
											options={typeOptions}
											onChange={type => update(index, { type, options: type === FormFieldType.Select ? field.options ?? [] : undefined })}
										/>
									</div>
									<div className="col-span-4 md:col-span-2 flex flex-col items-start">
										<Text type="secondary" className="text-xs">{t("approval.formSchema.required")}</Text>
										<Switch size="small" className="mt-1.5" checked={!!field.required} onChange={required => update(index, { required })} />
									</div>

									{field.type === FormFieldType.Select && (
										<div className="col-span-12">
											<Text type="secondary" className="text-xs">{t("approval.formSchema.options")}</Text>
											<Input.TextArea
												rows={3}
												defaultValue={optionsToText(field.options)}
												placeholder={t("approval.formSchema.optionsPlaceholder")}
												onBlur={e => update(index, { options: textToOptions(e.target.value) })}
											/>
										</div>
									)}
									{WITH_RANGE.has(field.type) && (
										<>
											<div className="col-span-6 md:col-span-3">
												<Text type="secondary" className="text-xs">{t("approval.formSchema.min")}</Text>
												<InputNumber className="w-full" value={field.min} onChange={min => update(index, { min: min ?? undefined })} />
											</div>
											<div className="col-span-6 md:col-span-3">
												<Text type="secondary" className="text-xs">{t("approval.formSchema.max")}</Text>
												<InputNumber className="w-full" value={field.max} onChange={max => update(index, { max: max ?? undefined })} />
											</div>
										</>
									)}
									<div className={WITH_RANGE.has(field.type) ? "col-span-12 md:col-span-4" : "col-span-12 md:col-span-10"}>
										<Text type="secondary" className="text-xs">{t("approval.formSchema.placeholder")}</Text>
										<Input value={field.placeholder} onChange={e => update(index, { placeholder: e.target.value || undefined })} />
									</div>
									<div className="col-span-12 md:col-span-2 flex justify-end gap-1 md:pt-5">
										<Tooltip title="↑"><Button size="small" type="text" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => move(index, -1)} /></Tooltip>
										<Tooltip title="↓"><Button size="small" type="text" icon={<ArrowDownOutlined />} disabled={index === value.length - 1} onClick={() => move(index, 1)} /></Tooltip>
										<Tooltip title={t("common.delete")}><Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => remove(index)} /></Tooltip>
									</div>
								</div>
							</Card>
						);
					})}
				</div>
			</SectionCard>

			<SectionCard icon={<EyeOutlined />} title={t("approval.formSchema.preview")}>
				{value.length
					? (
						<Form form={previewForm} layout="vertical">
							<PayloadFormItems fields={value.filter(f => f.key)} />
						</Form>
					)
					: <Empty description={t("approval.formSchema.empty")} />}
			</SectionCard>
		</div>
	);
}
