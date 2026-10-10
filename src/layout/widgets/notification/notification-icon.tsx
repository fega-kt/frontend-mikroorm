import type { ReactNode } from "react";

import { NotificationType } from "#src/api/notifications";

import { BellOutlined, ClockCircleOutlined, SafetyOutlined } from "@ant-design/icons";

interface NotificationIconConfig {
	icon: ReactNode
	color: string
}

const DEFAULT_ICON: NotificationIconConfig = { icon: <BellOutlined />, color: "#1677ff" };

/** Icon + màu nền cho noti hệ thống (không có actor) — thêm loại mới vào đây */
const ICON_BY_TYPE: Partial<Record<NotificationType, NotificationIconConfig>> = {
	[NotificationType.LOGIN_INACTIVE_REMINDER]: { icon: <ClockCircleOutlined />, color: "#fa8c16" },
	[NotificationType.LOGIN_NEW_DEVICE]: { icon: <SafetyOutlined />, color: "#f5222d" },
};

export function getNotificationIcon(type: NotificationType): NotificationIconConfig {
	return ICON_BY_TYPE[type] ?? DEFAULT_ICON;
}
