import type { EntityBase } from "#src/api/entity-base.js";
import type { SearchParamsBase } from "#src/api/service-base.js";
import type { PrincipalEntity } from "#src/api/system/principal";
import type { WorkflowInstanceEntity } from "#src/api/workflow-instance";

export enum WorkflowTaskStatus {
	Pending = "pending",
	Approved = "approved",
	Rejected = "rejected",
	Returned = "returned",
	Cancelled = "cancelled",
}

export interface WorkflowTaskSearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	status?: WorkflowTaskStatus
}

export interface WorkflowTaskEntity extends EntityBase {
	workflowInstance: WorkflowInstanceEntity
	nodeId: string
	stepName: string
	approver: PrincipalEntity
	status: WorkflowTaskStatus
	comment?: string
	completedAt?: string
}
