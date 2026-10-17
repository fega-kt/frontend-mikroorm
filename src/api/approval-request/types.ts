import type { WorkflowDefinition } from "#src/api/approval-workflow";
import type { AttachmentEntity } from "#src/api/attachment";
import type { SearchParamsBase } from "#src/api/service-base";
import type { AttachmentConfig, FormField } from "#src/api/setting/request-type";
import type { PrincipalType } from "#src/api/system/principal";

export enum ApprovalRequestStatus {
	Draft = "draft",
	Pending = "pending",
	Approved = "approved",
	Rejected = "rejected",
	Returned = "returned",
	Cancelled = "cancelled",
}

/** Độ ưu tiên — số lớn hơn = gấp hơn (đồng bộ backend) */
export enum ApprovalPriority {
	Low = 0,
	Normal = 1,
	High = 2,
	Urgent = 3,
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
	Create = "create",
	Update = "update",
	FileAdd = "file_add",
	FileRemove = "file_remove",
	Share = "share",
	Unshare = "unshare",
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
	priority: ApprovalPriority
	submittedAt?: string
	closedAt?: string
	createdAt: string
	updatedAt: string
	currentNodeIds: string[]
	requestType: { id: string, code: string, name: string }
	requester: UserBrief
	department: { id: string, name: string }
	/** Nhóm tờ trình (icon = URL ảnh, có thể trống) */
	category: { id: string, name: string, icon?: string | null }
}

export interface CreatableRequestType {
	id: string
	code: string
	name: string
	prefix: string
	description?: string
	category: { id: string, name: string } | null
	formId: string
	formSchema: FormField[]
	attachmentConfig: AttachmentConfig
	hasWorkflow: boolean
	/** Phiên bản hiện hành của loại (phiếu mới sẽ gắn với bản này) */
	version: number
}

/** Đơn vị trình chọn được (phòng của người dùng + cấp trên) */
export interface SubmitUnit {
	id: string
	name: string
	code?: string
	level: number
	isOwn: boolean
}

export interface PreviewFlowResult {
	workflow: { id: string, name: string, version: number } | null
	path: string[]
	steps: { nodeId: string, name?: string, type: string, approvers: { id: string, fullName: string }[], skipped?: boolean, error?: string }[]
	outcome: "approved" | "blocked"
}

/** Người hoặc nhóm (principal) giữ / được giao task */
export interface PrincipalBrief {
	id: string
	type: PrincipalType
	name: string
	/** Có khi là người */
	user: UserBrief | null
}

export interface ApprovalTaskItem {
	id: string
	round: number
	nodeId: string
	nodeName?: string
	status: ApprovalTaskStatus
	/** Người / nhóm đang giữ task */
	approver: PrincipalBrief
	/** Người / nhóm duyệt theo quy trình — khác `approver` khi được chia từ nhóm, gán lại, chuyển cấp */
	originApprover: PrincipalBrief
	/** Hệ thống chia ngẫu nhiên từ nhóm cho `approver` */
	assignedFromGroup: boolean
	/** Người đang được ủy quyền xử lý thay (chỉ task đang chờ; rỗng nếu không có) */
	delegates: UserBrief[]
	actedBy: UserBrief | null
	comment?: string
	dueAt?: string
	remindedAt?: string
	escalatedAt?: string
	actedAt?: string
	createdAt: string
}

/** Lượt chia sẻ tờ trình cho một người / nhóm (chỉ xem) */
export interface ApprovalShareItem {
	id: string
	principal: PrincipalBrief
	sharedBy: UserBrief
	message?: string
	createdAt: string
}

export interface ApprovalSharePayload {
	/** Id các principal (người / nhóm) nhận */
	principals: string[]
	message?: string
	/** Backend gửi mail / thông báo trong hệ thống cho người nhận (nhóm: tới các thành viên) */
	sendEmail: boolean
	sendNotification: boolean
}

/** data.changes của dòng "update": field là khóa kỹ thuật (title, priority, department, payload.<key>) — nhãn tra theo formSchema / ngôn ngữ người xem */
export interface HistoryFieldChange {
	field: string
	from: unknown
	to: unknown
}

/** data.files của dòng "file_add" / "file_remove" */
export interface HistoryFileItem {
	id: string
	filename: string
	block: "documents" | "attachments"
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
	priority: ApprovalPriority
	payload: Record<string, unknown>
	round: number
	currentNodeIds: string[]
	visitedNodeIds: string[]
	submittedAt?: string
	closedAt?: string
	createdAt: string
	updatedAt: string
	requestType: { id: string, code: string, name: string, formId: string, formSchema: FormField[], attachmentConfig: AttachmentConfig }
	/** Nhóm tờ trình đã chọn lúc tạo */
	category: { id: string, name: string }
	requester: UserBrief
	department: { id: string, name: string }
	documents: Pick<AttachmentEntity, "id" | "filename" | "url" | "visibility" | "size" | "mimetype">[]
	attachments: Pick<AttachmentEntity, "id" | "filename" | "url" | "visibility" | "size" | "mimetype">[]
	workflow: { id: string, name: string, versionId: string, version: number } | null
	definition: WorkflowDefinition | null
	tasks: ApprovalTaskItem[]
	histories: ApprovalHistoryItem[]
	/** Những người / nhóm được chia sẻ; thiếu khi backend chưa hỗ trợ */
	shares?: ApprovalShareItem[]
	permissions: {
		/** Người duyệt, người trình, người tạo được chia sẻ; thiếu = không chia sẻ được */
		canShare?: boolean
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

/** Loại tệp của tờ trình — trùng tên trường và tên thư mục trên storage */
export type RequestFileCategory = "documents" | "attachments";

export interface ApprovalRequestPayload {
	/** Id sinh sẵn ở client: tệp upload trước khi tạo phiếu nằm đúng thư mục Attachments/{id}/... */
	id?: string
	requestType: string
	/** Nhóm tờ trình đã chọn (bắt buộc) — loại tờ trình phải thuộc nhóm này */
	category: string
	title: string
	payload: Record<string, unknown>
	priority: ApprovalPriority
	/** Đơn vị trình — bỏ trống = phòng của người tạo */
	department?: string
	documents: string[]
	attachments: string[]
	submit?: boolean
}
