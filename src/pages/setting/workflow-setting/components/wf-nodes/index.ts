import type { NodeTypes } from "@xyflow/react";
import { ApprovalNode } from "./approval-node";
import { EndNode } from "./end-node";
import { StartNode } from "./start-node";

export const nodeTypes: NodeTypes = {
	start: StartNode as NodeTypes[string],
	approval: ApprovalNode as NodeTypes[string],
	end: EndNode as NodeTypes[string],
};

export type { ApprovalNodeType } from "./approval-node";
export type { EndNodeType } from "./end-node";
export type { StartNodeType } from "./start-node";
