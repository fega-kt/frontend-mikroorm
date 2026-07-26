import type { EntityBase } from "#src/api/entity-base.js";
import type { SearchParamsBase } from "#src/api/service-base.js";
import type { RequestTypeEntity } from "#src/api/setting/request-type";
import type { WorkflowSettingEntity } from "#src/api/setting/workflow-setting";
import type { UserEntity } from "#src/api/user";

export enum WorkflowInstanceStatus {
	Draft = "draft",
	InProgress = "in_progress",
	Approved = "approved",
	Rejected = "rejected",
	Returned = "returned",
	Cancelled = "cancelled",
}

export interface WorkflowInstanceSearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	status?: WorkflowInstanceStatus
	search?: string
}

export interface WorkflowInstanceEntity extends EntityBase {
	title: string
	content?: string
	requester: UserEntity
	requestType?: RequestTypeEntity
	workflowSetting: WorkflowSettingEntity
	status: WorkflowInstanceStatus
	processInstanceId?: string
	processDefinitionKey?: string
	currentStepName?: string
	currentApproverIds?: string[]
	submittedAt?: string
	completedAt?: string
}
