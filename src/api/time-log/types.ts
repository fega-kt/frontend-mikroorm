import type { EntityBase } from "../entity-base";
import type { TaskEntity } from "../task/types";
import type { UserEntity } from "../user/types";

export enum TimeLogStatus {
	PENDING = "PENDING",
	APPROVED = "APPROVED",
	REJECTED = "REJECTED",
}

export interface TimeLogEntity extends EntityBase {
	task: TaskEntity
	user: UserEntity
	date: string
	hours: number
	note?: string
	status: TimeLogStatus
	reviewedBy?: UserEntity
	reviewedAt?: string
	rejectReason?: string
}

export interface TimeLogPayload {
	task?: string
	user?: string
	date?: string
	hours?: number
	note?: string
}

export interface TimeLogReviewPayload {
	approved: boolean
	rejectReason?: string
}

export interface TimeLogSummary {
	taskId: string
	totalLogged: number
	estimated: number
	logs: TimeLogEntity[]
}
