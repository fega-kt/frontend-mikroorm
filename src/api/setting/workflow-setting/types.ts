import type { EntityBase } from "#src/api/entity-base.js";
import type { SearchParamsBase } from "#src/api/service-base.js";
import type { CategoryEntity } from "#src/api/setting/category";
import type { PrincipalEntity } from "#src/api/system/principal";

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

export enum ApproverType {
	User = "user",
	Dept = "dept",
	Role = "role",
	Dynamic = "dynamic",
}

export enum ApprovalType {
	All = "all",
	Any = "any",
}

export enum SelfApproval {
	Allow = "allow",
	Skip = "skip",
}

export interface ApproverConfig {
	type: ApproverType
	/** Single ID — used for dept, role */
	id?: string
	name?: string
	/** Principal entities — used when type = "user" */
	approvers?: PrincipalEntity[]
	/** Field path — used when type = "dynamic" */
	fieldPath?: string
}

export interface WfApprovalData {
	title: string
	approvers: ApproverConfig[]
	approvalType: ApprovalType
	selfApproval: SelfApproval
}

export interface WorkflowSettingEntity extends EntityBase {
	name: string
	category: CategoryEntity
	status: WorkflowSettingStatus
	description?: string
	/** Approval step config, keyed by the BPMN element id (bpmn:UserTask) it belongs to */
	approvalConfig?: Record<string, WfApprovalData>
	/**
	 * Set after a successful POST .../deploy — no deploymentId is stored (matches v5); the BPMN
	 *  XML is always fetched by resolving this key to its latest Flowable process definition.
	 */
	processDefinitionKey?: string
}

// ─── API payload types (approvers serialized to string IDs) ──────────────────

export interface ApproverConfigPayload extends Omit<ApproverConfig, "approvers"> {
	approvers?: string[]
}

export interface WfApprovalDataPayload extends Omit<WfApprovalData, "approvers"> {
	approvers?: ApproverConfigPayload[]
}

export interface WorkflowSettingPayload extends Omit<WorkflowSettingEntity, "approvalConfig"> {
	approvalConfig?: Record<string, WfApprovalDataPayload>
}
