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

export interface WorkflowSettingEntity extends EntityBase {
	name: string
	category: CategoryEntity
	status: WorkflowSettingStatus
	description?: string
	workflowDefinition?: WorkflowDefinition
}

// ─── Workflow node / edge types ───────────────────────────────────────────────

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

export enum WfEndResult {
	Approved = "approved",
	Rejected = "rejected",
}

export enum WfNodeType {
	Start = "start",
	Approval = "approval",
	End = "end",
}

export enum ConditionOperator {
	Eq = "eq",
	Ne = "ne",
	Gt = "gt",
	Lt = "lt",
	Gte = "gte",
	Lte = "lte",
	Contains = "contains",
	NotContains = "notContains",
}

export interface ConditionRule {
	field: string
	operator: ConditionOperator
	value: string
}

export interface WfEdgeCondition {
	label: string
	rules: ConditionRule[]
	logic: "and" | "or"
	isDefault?: boolean
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

export interface WfStartData { label: string }

export interface WfApprovalData {
	title: string
	approvers: ApproverConfig[]
	approvalType: ApprovalType
	selfApproval: SelfApproval
}

export interface WfEndData {
	label: string
	result: WfEndResult
}

export type WfNodeData = WfStartData | WfApprovalData | WfEndData;

export interface WfNode {
	id: string
	type: WfNodeType
	position: { x: number, y: number }
	data: WfNodeData
}

export interface WfEdge {
	id: string
	source: string
	target: string
	condition?: WfEdgeCondition
}

export interface WorkflowDefinition {
	nodes: WfNode[]
	edges: WfEdge[]
}

// ─── API payload types (approvers serialized to string IDs) ──────────────────

export interface ApproverConfigPayload extends Omit<ApproverConfig, "approvers"> {
	approvers?: string[]
}

export interface WfApprovalDataPayload extends Omit<WfApprovalData, "approvers"> {
	approvers?: ApproverConfigPayload[]
}

export interface WfNodePayload extends Omit<WfNode, "data"> {
	data: WfStartData | WfApprovalDataPayload | WfEndData
}

export interface WorkflowSettingPayload extends Omit<WorkflowSettingEntity, "workflowDefinition"> {
	workflowDefinition?: {
		nodes: WfNodePayload[]
		edges: WfEdge[]
	}
}
