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
}

export interface NotificationEntity extends EntityBase {
	type: NotificationType
	title: string
	message: string
	refId?: string
	refType?: string
	isRead: boolean
	readAt?: string
}
