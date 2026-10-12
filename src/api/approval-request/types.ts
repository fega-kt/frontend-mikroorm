import type { WorkflowDefinition } from "#src/api/approval-workflow";
import type { AttachmentEntity } from "#src/api/attachment";
import type { SearchParamsBase } from "#src/api/service-base";
import type { FormField } from "#src/api/setting/request-type";

export enum ApprovalRequestStatus {
	Draft = "draft",
	Pending = "pending",
	Approved = "approved",
	Rejected = "rejected",
	Returned = "returned",
	Cancelled = "cancelled",
}

export enum ApprovalTaskStatus {
	Pending = "pending",
	Approved = "approved",
	Rejected = "rejected",
	Returned = "returned",
	Skipped = "skipped",
}

export enum ApprovalHistoryAction {
	Submit = "submit",
	Resubmit = "resubmit",
	Approve = "approve",
	Reject = "reject",
	Return = "return",
	Cancel = "cancel",
	Skip = "skip",
	AutoApprove = "auto_approve",
	Delegate = "delegate",
	Escalate = "escalate",
	Remind = "remind",
	Notify = "notify",
	Complete = "complete",
}

export interface UserBrief {
	id: string
	fullName: string
	avatar?: string
}

export interface ApprovalRequestSearchParams extends SearchParamsBase {
	page?: number
	limit?: number
	status?: ApprovalRequestStatus
	/** Nhiều trạng thái, phân tách bằng dấu phẩy */
	statuses?: string
	requestTypeId?: string
	requesterId?: string
	search?: string
}

export interface ApprovalRequestListItem {
	id: string
	code?: string
	title: string
	status: ApprovalRequestStatus
	submittedAt?: string
	closedAt?: string
	createdAt: string
	updatedAt: string
	currentNodeIds: string[]
	requestType: { id: string, code: string, name: string }
	requester: UserBrief
	department: { id: string, name: string }
}

export interface CreatableRequestType {
	id: string
	code: string
	name: string
	prefix: string
	description?: string
	category: { id: string, name: string } | null
	formSchema: FormField[]
	hasWorkflow: boolean
}

export interface ApprovalTaskItem {
	id: string
	round: number
	nodeId: string
	nodeName?: string
	status: ApprovalTaskStatus
	approver: UserBrief | null
	originalApprover: UserBrief | null
	actedBy: UserBrief | null
	comment?: string
	dueAt?: string
	remindedAt?: string
	escalatedAt?: string
	actedAt?: string
	createdAt: string
}

export interface ApprovalHistoryItem {
	id: string
	action: ApprovalHistoryAction
	actor: UserBrief | null
	nodeId?: string
	nodeName?: string
	comment?: string
	data?: Record<string, unknown>
	createdAt: string
}

export interface ApprovalRequestDetail {
	id: string
	code?: string
	title: string
	status: ApprovalRequestStatus
	payload: Record<string, unknown>
	round: number
	currentNodeIds: string[]
	visitedNodeIds: string[]
	submittedAt?: string
	closedAt?: string
	createdAt: string
	updatedAt: string
	requestType: { id: string, code: string, name: string, formSchema: FormField[] }
	requester: UserBrief
	department: { id: string, name: string }
	attachments: Pick<AttachmentEntity, "id" | "filename" | "url" | "size" | "mimetype">[]
	workflow: { id: string, name: string, versionId: string, version: number } | null
	definition: WorkflowDefinition | null
	tasks: ApprovalTaskItem[]
	histories: ApprovalHistoryItem[]
	permissions: {
		canEdit: boolean
		canSubmit: boolean
		canDelete: boolean
		canCancel: boolean
		canApprove: boolean
		canReject: boolean
		canReturn: boolean
		requireRejectReason: boolean
		canReassign: boolean
		myTaskId: string | null
		isParallel: boolean
	}
}

export interface ApprovalRequestPayload {
	requestType: string
	title: string
	payload: Record<string, unknown>
	attachments: string[]
	submit?: boolean
}
