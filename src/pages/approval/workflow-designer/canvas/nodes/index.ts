import type { NodeTypes } from "@xyflow/react";
import { NodeType } from "#src/api/approval-workflow/types";
import { ApprovalNode } from "./ApprovalNode";
import { ConditionNode } from "./ConditionNode";
import { EndNode } from "./EndNode";
import { NotifyNode } from "./NotifyNode";
import { ParallelNode } from "./ParallelNode";
import { StartNode } from "./StartNode";

export { ApprovalNode, ConditionNode, EndNode, NotifyNode, ParallelNode, StartNode };
export { NodeShell } from "./NodeShell";

/** Bảng component node cho ReactFlow — dùng chung cho màn thiết kế và đồ thị chỉ đọc */
export const flowNodeTypes: NodeTypes = {
	[NodeType.Start]: StartNode,
	[NodeType.Approval]: ApprovalNode,
	[NodeType.Condition]: ConditionNode,
	[NodeType.Parallel]: ParallelNode,
	[NodeType.Notify]: NotifyNode,
	[NodeType.End]: EndNode,
};
