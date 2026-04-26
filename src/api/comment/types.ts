import type { EntityBase } from "../entity-base";
import type { TaskEntity } from "../task/types";

export interface CommentEntity extends EntityBase {
	task: TaskEntity
	content: string
	parentComment?: CommentEntity
	edited: boolean
}

export interface CommentPayload {
	task?: string
	content?: string
	parentComment?: string
}
