import type { EntityBase } from "#src/api/entity-base";
import type { SearchParamsBase } from "#src/api/service-base";
import type { FormField } from "#src/api/setting/request-type";
import type { WorkflowDefinition } from "./definition";

export * from "./definition";

export enum ApprovalWorkflowVersionStatus {
	Draft = "draft",
	Published = "published",
	Archived = "archived",
}

export interface ApprovalWorkflowSearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	requestTypeId?: string
	departmentId?: string
	search?: string
}

interface VersionBrief {
	id: string
	version: number
	publishedAt?: string
	updatedAt?: string
}

export interface ApprovalWorkflowEntity extends EntityBase {
	name: string
	description?: string
	priority: number
	isActive: boolean
	requestType: { id: string, code: string, name: string }
	department?: { id: string, name: string } | null
	publishedVersion?: VersionBrief | null
	draftVersion?: VersionBrief | null
}

export interface ApprovalWorkflowVersion {
	id: string
	version: number
	status: ApprovalWorkflowVersionStatus
	publishedAt?: string
	publishedBy?: { id: string, fullName: string } | null
	createdAt: string
	updatedAt: string
	definition?: WorkflowDefinition
}

export interface ApprovalWorkflowDetail {
	id: string
	name: string
	description?: string
	priority: number
	isActive: boolean
	updatedAt: string
	requestType: { id: string, code: string, name: string, formSchema: FormField[] }
	department: { id: string, name: string } | null
	publishedVersion: (VersionBrief & { publishedBy: { id: string, fullName: string } | null, definition: WorkflowDefinition }) | null
	draftVersion: (VersionBrief & { definition: WorkflowDefinition }) | null
	versions: ApprovalWorkflowVersion[]
}

export interface ApprovalWorkflowPayload {
	name: string
	description?: string | null
	requestType: string
	department?: string | null
	priority?: number
	isActive?: boolean
}

/** Mã lỗi validate graph — đồng bộ với backend validate-graph.ts */
export enum GraphErrorCode {
	DuplicateNodeId = "DUPLICATE_NODE_ID",
	UnknownEdgeNode = "UNKNOWN_EDGE_NODE",
	StartCount = "START_COUNT",
	NoEnd = "NO_END",
	StartHasIncoming = "START_HAS_INCOMING",
	EndHasOutgoing = "END_HAS_OUTGOING",
	Unreachable = "UNREACHABLE",
	DeadEnd = "DEAD_END",
	Cycle = "CYCLE",
	SingleOutgoing = "SINGLE_OUTGOING",
	ConditionOutgoing = "CONDITION_OUTGOING",
	ConditionDefault = "CONDITION_DEFAULT",
	EdgeMissingCondition = "EDGE_MISSING_CONDITION",
	EdgeConditionOutsideBranch = "EDGE_CONDITION_OUTSIDE_BRANCH",
	MissingApprover = "MISSING_APPROVER",
	ParallelApprovers = "PARALLEL_APPROVERS",
	UnknownField = "UNKNOWN_FIELD",
	SlaRequired = "SLA_REQUIRED",
	NotifyNoRecipient = "NOTIFY_NO_RECIPIENT",
	StepNotifyNoRecipient = "STEP_NOTIFY_NO_RECIPIENT",
	InactiveUser = "INACTIVE_USER",
}

export interface GraphError {
	code: GraphErrorCode
	message: string
	nodeId?: string
	edgeId?: string
}

export interface SimulateStep {
	nodeId: string
	name?: string
	type: string
	approvers: { id: string, fullName: string }[]
	skipped?: boolean
	error?: string
}

export interface SimulateResult {
	path: string[]
	steps: SimulateStep[]
	outcome: "approved" | "blocked"
}
