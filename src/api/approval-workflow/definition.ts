/**
 * Định nghĩa quy trình phê duyệt (JSON lưu ở approval_workflow_versions.definition).
 * Đồng bộ với backend: libs/app/services/approval-engine/definition.schema.ts
 */

export enum ApproverType {
	/** Trưởng phòng của người tạo đơn (người tạo là trưởng phòng → trưởng phòng cấp cha) */
	DeptHead = "DEPT_HEAD",
	/** Phó phòng của người tạo đơn (không có → trưởng phòng) */
	DeptDeputy = "DEPT_DEPUTY",
	/** Người cụ thể (cũ — chỉ để đọc định nghĩa đã lưu; màn thiết kế dùng PRINCIPAL) */
	SpecificUser = "SPECIFIC_USER",
	/** Người dùng hoặc nhóm (principal). Nhóm: mọi thành viên nhận task, một người duyệt là đủ */
	Principal = "PRINCIPAL",
}

export enum OverdueAction {
	Remind = "REMIND",
	RemindThenEscalate = "REMIND_THEN_ESCALATE",
	AutoApprove = "AUTO_APPROVE",
}

/** Người duyệt là nhóm — đồng bộ backend GroupMode */
export enum GroupMode {
	/** Cả nhóm cùng xử lý: thành viên hiện tại nào cũng duyệt được, ai trước xong trước */
	Shared = "shared",
	/** Chia cho một người: hệ thống chọn ngẫu nhiên một thành viên */
	Assign = "assign",
}

export enum ParallelMode {
	All = "ALL",
	Any = "ANY",
}

export enum NotifyChannel {
	Email = "EMAIL",
	InApp = "IN_APP",
}

export enum NodeType {
	Start = "start",
	Approval = "approval",
	Condition = "condition",
	Parallel = "parallel",
	Notify = "notify",
	End = "end",
}

interface DeptHeadApprover { type: ApproverType.DeptHead }
interface DeptDeputyApprover { type: ApproverType.DeptDeputy }
interface SpecificUserApprover { type: ApproverType.SpecificUser, userId: string }
interface PrincipalApprover { type: ApproverType.Principal, principalId: string }

export type Approver = DeptHeadApprover | DeptDeputyApprover | SpecificUserApprover | PrincipalApprover;

export interface StepOptions {
	allowDelegation: boolean
	skipIfRequester: boolean
	/** Không tìm được người duyệt thì bỏ qua bước (song song: bỏ suất trống) thay vì báo lỗi */
	skipIfNoApprover: boolean
	requireRejectReason: boolean
	allowReturn: boolean
	/** Người duyệt là nhóm: cả nhóm cùng xử lý / chia cho một người */
	groupMode: GroupMode
	/** Nhóm "cùng xử lý": gửi email cho cả nhóm khi task tới (mặc định chỉ thông báo trong ứng dụng) */
	emailGroup: boolean
}

interface NodeBase {
	id: string
	name?: string
}

/**
 * Thông báo khi bước duyệt xong / bị từ chối / bị trả lại — đồng bộ backend stepNotifyRuleSchema.
 * Từ chối, trả lại chưa cấu hình → gửi người trình; duyệt xong chưa cấu hình → không gửi.
 */
export interface StepNotifyRule {
	enabled: boolean
	channels: NotifyChannel[]
	notifyRequester: boolean
	/** Duyệt xong: người được giao duyệt ở bước kế tiếp */
	notifyNextApprovers: boolean
	/** Từ chối / trả lại: những người đã duyệt trước đó trong lượt trình */
	notifyPreviousApprovers: boolean
	recipients: Approver[]
	/** Mã mẫu email (bỏ trống → mẫu hệ thống của sự kiện) */
	emailTemplate?: string
	message?: string
}

export type StepEvent = "approved" | "rejected" | "returned";
export type StepNotifications = Partial<Record<StepEvent, StepNotifyRule>>;

interface SlaFields {
	slaHours?: number
	onOverdue: OverdueAction
	options: StepOptions
	notifications?: StepNotifications
}

export interface StartNode extends NodeBase { type: NodeType.Start }
export interface ApprovalNode extends NodeBase, SlaFields {
	type: NodeType.Approval
	approver: Approver | null
}
export interface ConditionNode extends NodeBase { type: NodeType.Condition }
export interface ParallelNode extends NodeBase, SlaFields {
	type: NodeType.Parallel
	mode: ParallelMode
	approvers: Approver[]
}
export interface NotifyNode extends NodeBase {
	type: NodeType.Notify
	channels: NotifyChannel[]
	/** Gửi cho người trình. Bỏ trống (định nghĩa cũ) → gửi khi không có người nhận nào khác */
	notifyRequester?: boolean
	/** Gửi cho người được giao duyệt ở bước duyệt kế tiếp */
	notifyNextApprovers?: boolean
	/** Người nhận cố định (người dùng / nhóm) */
	recipients: Approver[]
	/** Mã mẫu email (bỏ trống → mẫu mặc định approval.notify) */
	emailTemplate?: string
	message?: string
}
export interface EndNode extends NodeBase { type: NodeType.End }

export type WorkflowNode = StartNode | ApprovalNode | ConditionNode | ParallelNode | NotifyNode | EndNode;
export type WaitNode = ApprovalNode | ParallelNode;

/** Biểu thức json-logic, ví dụ { ">": [{ "var": "payload.days" }, 3] } */
export type JsonLogic = Record<string, unknown>;

export interface WorkflowEdge {
	id?: string
	from: string
	to: string
	label?: string
	condition?: JsonLogic
	default?: boolean
}

export interface WorkflowDefinition {
	nodes: WorkflowNode[]
	edges: WorkflowEdge[]
	layout: Record<string, { x: number, y: number }>
}

export const DEFAULT_STEP_OPTIONS: StepOptions = {
	allowDelegation: true,
	skipIfRequester: false,
	skipIfNoApprover: false,
	requireRejectReason: true,
	allowReturn: true,
	groupMode: GroupMode.Shared,
	emailGroup: false,
};

/** Bước thông báo có gửi cho người trình không (tương thích định nghĩa cũ chưa có cờ) — đồng bộ backend */
export function notifiesRequester(node: NotifyNode) {
	return node.notifyRequester ?? (node.recipients.length === 0 && !node.notifyNextApprovers);
}

export const DEFAULT_STEP_NOTIFY_RULE: StepNotifyRule = {
	enabled: true,
	channels: [NotifyChannel.InApp, NotifyChannel.Email],
	notifyRequester: true,
	notifyNextApprovers: false,
	notifyPreviousApprovers: false,
	recipients: [],
};

/** Quy tắc thông báo của bước có ít nhất một người nhận — đồng bộ backend */
export function hasStepNotifyRecipient(rule: StepNotifyRule, event: StepEvent) {
	return rule.notifyRequester || rule.recipients.length > 0 || (event === "approved" ? rule.notifyNextApprovers : rule.notifyPreviousApprovers);
}

export function isWaitNode(node: WorkflowNode): node is WaitNode {
	return node.type === NodeType.Approval || node.type === NodeType.Parallel;
}
