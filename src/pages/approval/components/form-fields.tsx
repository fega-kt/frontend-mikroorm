import type { FormField } from "#src/api/setting/request-type/types";
import type { FormProps } from "antd";
import { FormFieldType } from "#src/api/setting/request-type/types";
import { DatePicker, Descriptions, Form, Input, InputNumber, Select, Switch, theme, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { DATE_FORMAT, formatMoney, formatPayloadValue, parseMoney, PAYLOAD_FORM_LAYOUT, PAYLOAD_GRID_CLASS } from "../lib/payload";

interface FormFieldInputProps {
	field: FormField
	disabled?: boolean
	/** value / onChange / checked / id… do Form.Item truyền xuống — phải chuyển tiếp cho ô nhập, nếu không Form không nhận được giá trị */
	[control: string]: any
}

/** Ô nhập cho một trường của form loại tờ trình */
export function FormFieldInput({ field, disabled, ...control }: FormFieldInputProps) {
	const { t } = useTranslation();
	switch (field.type) {
		case FormFieldType.Textarea:
			return <Input.TextArea rows={4} maxLength={field.max ?? 5000} showCount placeholder={field.placeholder} disabled={disabled} {...control} />;
		case FormFieldType.Number:
			return <InputNumber className="w-full" min={field.min} max={field.max} placeholder={field.placeholder} disabled={disabled} {...control} />;
		case FormFieldType.Money:
			return (
				<InputNumber<number>
					className="w-full"
					min={field.min}
					max={field.max}
					formatter={formatMoney}
					parser={parseMoney}
					placeholder={field.placeholder}
					disabled={disabled}
					{...control}
				/>
			);
		case FormFieldType.Date:
			return <DatePicker className="w-full" format={DATE_FORMAT} disabled={disabled} {...control} />;
		case FormFieldType.DateRange:
			return <DatePicker.RangePicker className="w-full" format={DATE_FORMAT} disabled={disabled} {...control} />;
		case FormFieldType.Select:
			return <Select options={field.options} placeholder={field.placeholder} disabled={disabled} allowClear={!field.required} {...control} />;
		case FormFieldType.Switch:
			return <Switch checkedChildren={t("approval.yes")} unCheckedChildren={t("approval.no")} disabled={disabled} {...control} />;
		case FormFieldType.Text:
		default:
			return <Input maxLength={field.max ?? 500} placeholder={field.placeholder} disabled={disabled} {...control} />;
	}
}

/** Các Form.Item sinh từ formSchema, giá trị nằm dưới `payload.<key>` */
export function PayloadFormItems({ fields, disabled }: { fields: FormField[], disabled?: boolean }) {
	const { t } = useTranslation();
	return (
		<>
			{fields.map(field => (
				<Form.Item
					key={field.key}
					name={["payload", field.key]}
					label={field.label}
					valuePropName={field.type === FormFieldType.Switch ? "checked" : "value"}
					rules={field.required && field.type !== FormFieldType.Switch ? [{ required: true, message: t("form.required") }] : undefined}
				>
					<FormFieldInput field={field} disabled={disabled} />
				</Form.Item>
			))}
		</>
	);
}

/**
 * Nội dung tờ trình chỉ đọc, cùng bố cục với form soạn (lưới 2 cột, nhãn trên, ô nhiều dòng chiếm cả hàng):
 * mỗi giá trị nằm trong một ô viền giống ô nhập nhưng không sửa được.
 */
export function PayloadView({ fields, payload, layout = PAYLOAD_FORM_LAYOUT }: {
	fields: FormField[]
	payload: Record<string, unknown>
	/** Mặc định theo form soạn; truyền "horizontal" khi cần nhãn nằm ngang (vd: khung hẹp) */
	layout?: FormProps["layout"]
}) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	if (!fields.length)
		return <Typography.Text type="secondary">{t("common.noData")}</Typography.Text>;
	return (
		<Form layout={layout} component="div" className={PAYLOAD_GRID_CLASS}>
			{fields.map((field) => {
				const multiline = field.type === FormFieldType.Textarea;
				const value = payload[field.key];
				// Trường không nhập: để ô trống như trên form (không hiện "—")
				const empty = value == null || value === "" || (Array.isArray(value) && !value.length);
				return (
					<Form.Item key={field.key} label={field.label} className={multiline ? "md:col-span-2" : undefined}>
						<div
							className="whitespace-pre-wrap break-words rounded-md px-[11px] py-[4px] leading-[22px]"
							style={{
								minHeight: multiline ? 98 : 32,
								border: `1px solid ${token.colorBorder}`,
								background: token.colorFillQuaternary,
							}}
						>
							{!empty && formatPayloadValue(field, value, t)}
						</div>
					</Form.Item>
				);
			})}
		</Form>
	);
}

/** Dữ liệu đơn dạng bảng mô tả theo formSchema */
export function PayloadDescriptions({ fields, payload, column = 2 }: { fields: FormField[], payload: Record<string, unknown>, column?: number }) {
	const { t } = useTranslation();
	if (!fields.length)
		return <Typography.Text type="secondary">{t("common.noData")}</Typography.Text>;
	return (
		<Descriptions
			size="small"
			bordered
			column={{ xs: 1, sm: 1, md: column }}
			items={fields.map(field => ({
				key: field.key,
				label: field.label,
				span: field.type === FormFieldType.Textarea ? column : 1,
				children: <span className="whitespace-pre-wrap">{formatPayloadValue(field, payload[field.key], t)}</span>,
			}))}
		/>
	);
}
