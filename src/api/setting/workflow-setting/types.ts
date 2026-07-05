import type { EntityBase } from "#src/api/entity-base.js";
import type { SearchParamsBase } from "#src/api/service-base.js";
import type { CategoryEntity } from "#src/api/setting/category";

export enum WorkflowSettingStatus {
	Draft = "draft",
	Published = "published",
	Cancelled = "cancelled",
}

export interface WorkflowSettingSearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	name?: string
	keyword?: string
	status?: WorkflowSettingStatus
}

export interface WorkflowSettingEntity extends EntityBase {
	name: string
	category: CategoryEntity
	status: WorkflowSettingStatus
	description?: string
	bpmnXml?: string
}
