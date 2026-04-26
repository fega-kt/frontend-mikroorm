import type { AttachmentEntity } from "../attachment/types";
import type { EntityBase } from "../entity-base";
import type { ProjectEntity } from "../project/types";
import type { SectionEntity } from "../section/types";
import type { SprintEntity } from "../sprint/types";
import type { UserEntity } from "../user/types";

export enum TaskStatus {
	DRAFT = "DRAFT",
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
	section?: SectionEntity
	sprint?: SprintEntity
	parentTask?: TaskEntity
	status: TaskStatus
	priority: TaskPriority
	assignee: UserEntity
	startDate?: string
	dueDate?: string
	completedAt?: string
	order: number
	estimatedHours?: number
	actualHours?: number
	labels?: string[]
	attachments?: AttachmentEntity[]
}

export interface TaskPayload extends Omit<Partial<TaskEntity>, "attachments" | "section" | "project" | "assignee" | "parentTask" | "sprint"> {
	project?: string
	section?: string
	sprint?: string
	assignee?: string
	parentTask?: string
	attachments?: string[]
}
