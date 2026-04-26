import type { EntityBase } from "../entity-base";
import type { ProjectEntity } from "../project/types";

export enum SprintStatus {
	PLANNING = "PLANNING",
	ACTIVE = "ACTIVE",
	COMPLETED = "COMPLETED",
	CANCELLED = "CANCELLED",
}

export interface SprintEntity extends EntityBase {
	name: string
	goal?: string
	project: ProjectEntity
	status: SprintStatus
	startDate: string
	endDate: string
}

export interface SprintPayload {
	name?: string
	goal?: string
	project?: string
	status?: SprintStatus
	startDate?: string
	endDate?: string
}
