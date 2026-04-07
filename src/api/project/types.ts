import type { EntityBase } from "../entity-base";
import type { UserEntity } from "../user/types";

export enum ProjectStatus {
	PLANNING = "PLANNING",
	ACTIVE = "ACTIVE",
	COMPLETED = "COMPLETED",
	ON_HOLD = "ON_HOLD",
	ARCHIVED = "ARCHIVED",
}

export enum ProjectPriority {
	LOW = "LOW",
	MEDIUM = "MEDIUM",
	HIGH = "HIGH",
	URGENT = "URGENT",
}

export enum ProjectVisibility {
	PUBLIC = "PUBLIC",
	PRIVATE = "PRIVATE",
}

export interface ProjectEntity extends EntityBase {
	name: string
	description?: string
	status: ProjectStatus
	priority: ProjectPriority
	owner: UserEntity
	startDate: string
	dueDate: string
	budget?: number
	tags?: string[]
	visibility: ProjectVisibility
}
