import type { EntityBase } from "#src/api/entity-base.js";
import type { SearchParamsBase } from "#src/api/service-base.js";
import type { RequestTypeEntity } from "#src/api/setting/request-type";
import type { WorkflowSettingEntity } from "#src/api/setting/workflow-setting";
import type { PrincipalEntity } from "#src/api/system/principal";

export interface WorkflowDelegationSettingSearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	originalApprover?: string
}

export interface WorkflowDelegationSettingEntity extends EntityBase {
	originalApprover: PrincipalEntity
	delegatedApprovers: PrincipalEntity[]
	fromDate: string
	toDate: string
	requestTypes?: RequestTypeEntity[]
	workflowSettings?: WorkflowSettingEntity[]
	description?: string
}
