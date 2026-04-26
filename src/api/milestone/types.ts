import type { EntityBase } from "../entity-base";
import type { ProjectEntity } from "../project/types";

export enum MilestoneStatus {
	PENDING = "PENDING",
	IN_PROGRESS = "IN_PROGRESS",
	COMPLETED = "COMPLETED",
	MISSED = "MISSED",
}

export interface MilestoneEntity extends EntityBase {
	project: ProjectEntity
	name: string
	description?: string
	dueDate: string
	status: MilestoneStatus
	completedAt?: string
}

export interface MilestonePayload {
	project?: string
	name?: string
	description?: string
	dueDate?: string
	status?: MilestoneStatus
	completedAt?: string
}
