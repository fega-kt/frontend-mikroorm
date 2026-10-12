import type { WorkflowNode } from "#src/api/approval-workflow/types";
import {
	ApproverType,
	DEFAULT_STEP_OPTIONS,
	NodeType,
	NotifyChannel,
	OverdueAction,
	ParallelMode,
} from "#src/api/approval-workflow/types";
import i18next from "i18next";
import { newNodeId } from "./to-definition";

/** Các loại bước có thể thêm từ bảng thành phần / nút "+" trên cạnh */
export type AddableNodeType = NodeType.Approval | NodeType.Condition | NodeType.Parallel | NodeType.Notify | NodeType.End;

export const PALETTE_TYPES: AddableNodeType[] = [
	NodeType.Approval,
	NodeType.Condition,
	NodeType.Parallel,
	NodeType.Notify,
	NodeType.End,
];

export const INSERTABLE_TYPES: AddableNodeType[] = [
	NodeType.Approval,
	NodeType.Condition,
	NodeType.Parallel,
	NodeType.Notify,
];

/** Kích thước cố định của node — dùng cho dagre và khi chèn bước */
export const NODE_WIDTH = 200;
export const nodeHeight = (type: string) => (type === NodeType.Start || type === NodeType.End ? 36 : 52);

export function createWorkflowNode(type: NodeType): WorkflowNode {
	const id = newNodeId(type);
	const name = i18next.t(`workflowDesigner.defaultNames.${type}`);
	switch (type) {
		case NodeType.Approval:
			return {
				id,
				type,
				name,
				approver: { type: ApproverType.DeptHead },
				slaHours: 24,
				onOverdue: OverdueAction.Remind,
				options: { ...DEFAULT_STEP_OPTIONS },
			};
		case NodeType.Parallel:
			return {
				id,
				type,
				name,
				mode: ParallelMode.All,
				approvers: [],
				slaHours: 24,
				onOverdue: OverdueAction.Remind,
				options: { ...DEFAULT_STEP_OPTIONS },
			};
		case NodeType.Notify:
			return { id, type, name, channels: [NotifyChannel.InApp], recipients: [] };
		case NodeType.Condition:
			return { id, type, name };
		case NodeType.Start:
			return { id, type, name };
		case NodeType.End:
		default:
			return { id, type: NodeType.End, name };
	}
}

/** Bản sao sâu với id mới */
export function cloneWorkflowNode(node: WorkflowNode): WorkflowNode {
	const copy = structuredClone(node);
	copy.id = newNodeId(node.type);
	return copy;
}
