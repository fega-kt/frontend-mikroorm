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
}

interface NodeBase {
	id: string
	name?: string
}

interface SlaFields {
	slaHours?: number
	onOverdue: OverdueAction
	options: StepOptions
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
	/** Rỗng → chỉ báo cho người tạo đơn */
	recipients: Approver[]
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
};

export function isWaitNode(node: WorkflowNode): node is WaitNode {
	return node.type === NodeType.Approval || node.type === NodeType.Parallel;
}
