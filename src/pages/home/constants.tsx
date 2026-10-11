import type { GlobalToken } from "antd";
import type { ReactNode } from "react";
import type { RequestTypeCode } from "./mock";

import { CalendarOutlined, CarOutlined, CreditCardOutlined, ShoppingCartOutlined, WalletOutlined } from "@ant-design/icons";

type PresetColor = "cyan" | "gold" | "purple" | "blue" | "magenta";

/** Màu tag theo loại yêu cầu — dùng preset color của antd để tự đổi theo theme */
export const REQUEST_TYPE_COLOR: Record<RequestTypeCode, PresetColor> = {
	leave: "cyan",
	advance: "gold",
	purchase: "purple",
	trip: "blue",
	payment: "magenta",
};

export const REQUEST_TYPE_ICON: Record<RequestTypeCode, ReactNode> = {
	leave: <CalendarOutlined />,
	advance: <WalletOutlined />,
	purchase: <ShoppingCartOutlined />,
	trip: <CarOutlined />,
	payment: <CreditCardOutlined />,
};

/** Bộ màu (chữ / nền / viền) của loại yêu cầu lấy từ dải màu preset trong token (vd cyan6, cyan1, cyan3) */
export function getRequestTypeColors(token: GlobalToken, type: RequestTypeCode) {
	const preset = REQUEST_TYPE_COLOR[type];
	return {
		color: token[`${preset}6`],
		bg: token[`${preset}1`],
		border: token[`${preset}3`],
	};
}

/** Chờ từ bao nhiêu giờ thì cảnh báo / báo động */
export const WAIT_WARNING_HOURS = 48;
export const WAIT_DANGER_HOURS = 72;
