import type { ReactNode } from "react";

import { NotificationType } from "#src/api/notifications";

import { AuditOutlined, BellOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, RiseOutlined, RollbackOutlined, SafetyOutlined, StopOutlined } from "@ant-design/icons";

interface NotificationIconConfig {
	icon: ReactNode
	color: string
}

const DEFAULT_ICON: NotificationIconConfig = { icon: <BellOutlined />, color: "#1677ff" };

/** Icon + màu nền cho noti hệ thống (không có actor) — thêm loại mới vào đây */
const ICON_BY_TYPE: Partial<Record<NotificationType, NotificationIconConfig>> = {
	[NotificationType.LOGIN_INACTIVE_REMINDER]: { icon: <ClockCircleOutlined />, color: "#fa8c16" },
	[NotificationType.LOGIN_NEW_DEVICE]: { icon: <SafetyOutlined />, color: "#f5222d" },
	[NotificationType.APPROVAL_PENDING]: { icon: <AuditOutlined />, color: "#1677ff" },
	[NotificationType.APPROVAL_APPROVED]: { icon: <CheckCircleOutlined />, color: "#52c41a" },
	[NotificationType.APPROVAL_REJECTED]: { icon: <CloseCircleOutlined />, color: "#f5222d" },
	[NotificationType.APPROVAL_RETURNED]: { icon: <RollbackOutlined />, color: "#fa8c16" },
	[NotificationType.APPROVAL_CANCELLED]: { icon: <StopOutlined />, color: "#8c8c8c" },
	[NotificationType.APPROVAL_REMINDER]: { icon: <ClockCircleOutlined />, color: "#fa8c16" },
	[NotificationType.APPROVAL_ESCALATED]: { icon: <RiseOutlined />, color: "#722ed1" },
	[NotificationType.APPROVAL_NOTIFY]: { icon: <BellOutlined />, color: "#13c2c2" },
};

export function getNotificationIcon(type: NotificationType): NotificationIconConfig {
	return ICON_BY_TYPE[type] ?? DEFAULT_ICON;
}
