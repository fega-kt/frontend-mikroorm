import type { FormField, FormReference } from "#src/api/setting/request-type/types";
import type { FormProps } from "antd";
import type { Dayjs } from "dayjs";
import { FormFieldType } from "#src/api/setting/request-type/types";
import dayjs from "dayjs";

/** Bố cục form tờ trình — dùng chung cho form soạn và màn xem nội dung để hai bên luôn giống nhau */
export const PAYLOAD_FORM_LAYOUT: FormProps["layout"] = "vertical";
/** Lưới 12 cột (container query: khung hẹp thì mỗi trường chiếm cả hàng) */
export const PAYLOAD_GRID_CLASS = "@container grid grid-cols-12 gap-x-5";

const SPAN_CLASS: Record<number, string> = {
	1: "col-span-12 @xl:col-span-1",
	2: "col-span-12 @xl:col-span-2",
	3: "col-span-12 @xl:col-span-3",
	4: "col-span-12 @xl:col-span-4",
	5: "col-span-12 @xl:col-span-5",
	6: "col-span-12 @xl:col-span-6",
	7: "col-span-12 @xl:col-span-7",
	8: "col-span-12 @xl:col-span-8",
	9: "col-span-12 @xl:col-span-9",
	10: "col-span-12 @xl:col-span-10",
	11: "col-span-12 @xl:col-span-11",
	12: "col-span-12 @xl:col-span-12",
};

/** Độ rộng (1–12) của trường: mặc định nửa hàng, đoạn văn cả hàng */
export function fieldSpan(field: FormField) {
	return field.span ?? (field.type === FormFieldType.Textarea ? 12 : 6);
}

/** Class col-span theo lưới 12 cột (khung đủ rộng thì chia cột; hẹp thì cả hàng) */
export const fieldSpanClass = (field: FormField) => SPAN_CLASS[fieldSpan(field)] ?? "col-span-12 @xl:col-span-6";

export const DATE_FORMAT = "DD/MM/YYYY";
export const DATE_TIME_FORMAT = "DD/MM/YYYY HH:mm";
const API_DATE = "YYYY-MM-DD";

/** Mốc ngày giới hạn của trường: "today" = hôm nay, còn lại là YYYY-MM-DD */
export function resolveDateBound(bound?: string): Dayjs | undefined {
	if (!bound)
		return undefined;
	return bound === "today" ? dayjs().startOf("day") : dayjs(bound);
}

/** Không cho chọn ngày ngoài [minDate, maxDate] của trường */
export function disabledDateFor(field: FormField) {
	const min = resolveDateBound(field.minDate);
	const max = resolveDateBound(field.maxDate);
	return (current: Dayjs) => (!!min && current.isBefore(min, "day")) || (!!max && current.isAfter(max, "day"));
}

export const formatMoney = (value?: string | number) => (value === undefined || value === "" ? "" : `${value}`.replace(/\B(?=(?:\d{3})+(?!\d))/g, ","));
export const parseMoney = (value?: string) => (value ? Number(value.replace(/,/g, "")) : (undefined as unknown as number));

/** payload (API) → giá trị form (dayjs cho trường ngày) */
export function payloadToFormValues(fields: FormField[], payload: Record<string, unknown> = {}) {
	const values: Record<string, unknown> = { ...payload };
	for (const field of fields) {
		const value = payload[field.key];
		if (value == null)
			continue;
		if (field.type === FormFieldType.Date)
			values[field.key] = dayjs(value as string);
		if (field.type === FormFieldType.DateRange && Array.isArray(value))
			values[field.key] = value.map(v => dayjs(v as string));
	}
	return values;
}

/** giá trị form → payload gửi API (ngày dạng YYYY-MM-DD, bỏ trường không có trong schema) */
export function formValuesToPayload(fields: FormField[], values: Record<string, unknown> = {}) {
	const payload: Record<string, unknown> = {};
	for (const field of fields) {
		const value = values[field.key];
		if (value === undefined || value === null || value === "") {
			if (field.type === FormFieldType.Switch)
				payload[field.key] = false;
			continue;
		}
		if (field.type === FormFieldType.Date)
			payload[field.key] = (value as Dayjs).format(API_DATE);
		else if (field.type === FormFieldType.DateRange)
			payload[field.key] = (value as Dayjs[]).map(d => d.format(API_DATE));
		else
			payload[field.key] = value;
	}
	return payload;
}

/** Hiển thị giá trị của một trường (read-only) */
export function formatPayloadValue(field: FormField, value: unknown, t: (key: string) => string): string {
	if (value === undefined || value === null || value === "")
		return "—";
	switch (field.type) {
		case FormFieldType.Date:
			return dayjs(value as string).format(DATE_FORMAT);
		case FormFieldType.DateRange:
			return Array.isArray(value) ? value.map(v => dayjs(v as string).format(DATE_FORMAT)).join(" → ") : String(value);
		case FormFieldType.Money:
			return formatMoney(value as number);
		case FormFieldType.Select:
			return field.options?.find(o => o.value === value)?.label ?? String(value);
		case FormFieldType.Switch:
			return value ? t("approval.yes") : t("approval.no");
		case FormFieldType.User:
		case FormFieldType.Department:
		case FormFieldType.Principal:
			return (Array.isArray(value) ? value : [value]).map(v => (v as FormReference)?.name ?? "").filter(Boolean).join(", ") || "—";
		default:
			return String(value);
	}
}
