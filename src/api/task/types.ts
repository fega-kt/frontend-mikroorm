import type { EntityBase } from "../entity-base";
import type { ProjectEntity } from "../project/types";
import type { UserEntity } from "../user/types";

export enum TaskStatus {
	TODO = "TODO",
	IN_PROGRESS = "IN_PROGRESS",
	DONE = "DONE",
	CANCELLED = "CANCELLED",
	REJECTED = "REJECTED",
}

export enum TaskPriority {
	LOW = "LOW",
	MEDIUM = "MEDIUM",
	HIGH = "HIGH",
}

export interface TaskEntity extends EntityBase {
	title: string
	description: string
	project: ProjectEntity
	status: TaskStatus
	priority: TaskPriority
	assignee: UserEntity
	startDate?: string
	dueDate?: string
	completedAt?: string
	order: number
	estimatedHours?: number
	tags?: string[]
	isMilestone: boolean
}
