import type { EntityBase } from "../entity-base";

export enum NotificationType {
	TASK_ASSIGNED = "TASK_ASSIGNED",
	TASK_STATUS_CHANGED = "TASK_STATUS_CHANGED",
	TASK_COMMENT = "TASK_COMMENT",
	DEADLINE_REMINDER = "DEADLINE_REMINDER",
	TIMELOG_APPROVED = "TIMELOG_APPROVED",
	TIMELOG_REJECTED = "TIMELOG_REJECTED",
	PROJECT_MEMBER_ADDED = "PROJECT_MEMBER_ADDED",
	MILESTONE_DUE = "MILESTONE_DUE",
	SPRINT_STARTED = "SPRINT_STARTED",
	SPRINT_COMPLETED = "SPRINT_COMPLETED",
	LOGIN_INACTIVE_REMINDER = "LOGIN_INACTIVE_REMINDER",
	LOGIN_NEW_DEVICE = "LOGIN_NEW_DEVICE",
}

export interface NotificationEntity extends EntityBase {
	type: NotificationType
	/** Người gây ra noti — null nếu do hệ thống */
	actor?: { id: string, fullName: string, avatar?: string } | null
	/** Tham số merge vào câu dịch `notification.<type>.*` */
	data?: Record<string, string | number>
	refId?: string
	/** Tên bảng của entity liên quan (vd: "users") */
	refType?: string | null
	isRead: boolean
	readAt?: string
}
