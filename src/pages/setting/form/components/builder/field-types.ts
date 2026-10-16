import type { ComponentType } from "react";
import { FormFieldType } from "#src/api/setting/request-type/types";
import {
	AlignLeftOutlined,
	ApartmentOutlined,
	CalendarOutlined,
	CheckSquareOutlined,
	DollarOutlined,
	DownCircleOutlined,
	FieldNumberOutlined,
	FontSizeOutlined,
	ScheduleOutlined,
	TeamOutlined,
	UserOutlined,
} from "@ant-design/icons";

export type PaletteGroup = "input" | "choice" | "date" | "people";

export interface FieldTypeMeta {
	type: FormFieldType
	group: PaletteGroup
	icon: ComponentType
}

/** Thư viện loại trường (thứ tự hiển thị trong palette) */
export const FIELD_TYPES: FieldTypeMeta[] = [
	{ type: FormFieldType.Text, group: "input", icon: FontSizeOutlined },
	{ type: FormFieldType.Textarea, group: "input", icon: AlignLeftOutlined },
	{ type: FormFieldType.Number, group: "input", icon: FieldNumberOutlined },
	{ type: FormFieldType.Money, group: "input", icon: DollarOutlined },
	{ type: FormFieldType.Select, group: "choice", icon: DownCircleOutlined },
	{ type: FormFieldType.Switch, group: "choice", icon: CheckSquareOutlined },
	{ type: FormFieldType.Date, group: "date", icon: CalendarOutlined },
	{ type: FormFieldType.DateRange, group: "date", icon: ScheduleOutlined },
	{ type: FormFieldType.User, group: "people", icon: UserOutlined },
	{ type: FormFieldType.Department, group: "people", icon: ApartmentOutlined },
	{ type: FormFieldType.Principal, group: "people", icon: TeamOutlined },
];

export const PALETTE_GROUPS: PaletteGroup[] = ["input", "choice", "date", "people"];

export const fieldTypeIcon = (type: FormFieldType) => FIELD_TYPES.find(item => item.type === type)?.icon;

/** Các lựa chọn độ rộng nhanh trên lưới 12 cột */
export const SPAN_PRESETS = [
	{ value: 3, label: "1/4" },
	{ value: 4, label: "1/3" },
	{ value: 6, label: "1/2" },
	{ value: 8, label: "2/3" },
	{ value: 12, label: "full" },
] as const;

/** Nhãn gọn của độ rộng: 1/4, 1/3, … hoặc `n/12` nếu không trùng mức nào */
export function spanLabel(span: number, fullLabel: string) {
	if (span === 12)
		return fullLabel;
	return SPAN_PRESETS.find(item => item.value === span)?.label ?? `${span}/12`;
}

/** Kiểu cho phép nhập khoảng min/max */
export const WITH_RANGE = new Set<FormFieldType>([FormFieldType.Number, FormFieldType.Money, FormFieldType.Text, FormFieldType.Textarea]);

/** Kiểu cho phép giới hạn ngày sớm nhất / muộn nhất */
export const WITH_DATE_BOUNDS = new Set<FormFieldType>([FormFieldType.Date, FormFieldType.DateRange]);

/** Kiểu chọn thực thể: có tuỳ chọn "chọn nhiều" */
export const WITH_MULTIPLE = new Set<FormFieldType>([FormFieldType.User, FormFieldType.Department, FormFieldType.Principal]);
