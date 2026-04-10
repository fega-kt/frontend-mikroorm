import type { AttachmentEntity } from "../attachment/types";
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
	startDate: Date
	dueDate: Date
	budget?: number
	tags?: string[]
	visibility: ProjectVisibility
	attachments?: AttachmentEntity[]
	/** UUID do client sinh sẵn, dùng làm tên thư mục trên R2 */
	folderId: string
}

/** Payload gửi lên khi tạo / cập nhật project */
export interface ProjectPayload extends Omit<Partial<ProjectEntity>, "attachments"> {
	attachments?: string[]
}

export interface ProjectStats {
	total: number
	completed: number
	overdue: number
	completionRate: number
	byAssignee: Array<{ assigneeId: string, assigneeName: string, count: number }>
}
