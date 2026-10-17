import type { GlobalToken } from "antd";
import type { ReactNode } from "react";
import type { RequestTypeCode } from "./mock";

import { CalendarOutlined, CarOutlined, CreditCardOutlined, FileTextOutlined, ShoppingCartOutlined, WalletOutlined } from "@ant-design/icons";

type PresetColor = "cyan" | "gold" | "purple" | "blue" | "magenta" | "geekblue" | "green" | "volcano" | "lime" | "orange";

/** Dải màu cho nhóm tờ trình (nhóm do admin tạo, không có màu riêng) */
const CATEGORY_COLORS: PresetColor[] = ["cyan", "gold", "purple", "blue", "magenta", "geekblue", "green", "volcano", "lime", "orange"];

/** Màu cố định theo id nhóm: cùng nhóm luôn cùng màu (tag và icon), không phụ thuộc thứ tự hiển thị */
export function categoryColor(id: string): PresetColor {
	let hash = 0;
	for (const char of id)
		hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
}

/** Màu tag theo loại yêu cầu — dùng preset color của antd để tự đổi theo theme */
export const REQUEST_TYPE_COLOR: Record<RequestTypeCode, PresetColor> = {
	leave: "cyan",
	advance: "gold",
	purchase: "purple",
	trip: "blue",
	payment: "magenta",
	other: "geekblue",
};

export const REQUEST_TYPE_ICON: Record<RequestTypeCode, ReactNode> = {
	leave: <CalendarOutlined />,
	advance: <WalletOutlined />,
	purchase: <ShoppingCartOutlined />,
	trip: <CarOutlined />,
	payment: <CreditCardOutlined />,
	other: <FileTextOutlined />,
};

/** Bộ màu (chữ / nền / viền) của loại yêu cầu lấy từ dải màu preset trong token (vd cyan6, cyan1, cyan3) */
export function getRequestTypeColors(token: GlobalToken, type: RequestTypeCode, categoryId?: string) {
	const preset = categoryId ? categoryColor(categoryId) : REQUEST_TYPE_COLOR[type];
	return {
		color: token[`${preset}6`],
		bg: token[`${preset}1`],
		border: token[`${preset}3`],
	};
}

/** Chờ từ bao nhiêu giờ thì cảnh báo / báo động */
export const WAIT_WARNING_HOURS = 48;
export const WAIT_DANGER_HOURS = 72;
