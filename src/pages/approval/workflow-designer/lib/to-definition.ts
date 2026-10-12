import type { JsonLogic, WorkflowDefinition, WorkflowEdge, WorkflowNode } from "#src/api/approval-workflow/types";
import type { Edge, Node } from "@xyflow/react";
import { NodeType } from "#src/api/approval-workflow/types";

/** Dữ liệu node trên canvas — chỉ giữ WorkflowNode, mọi trang trí (lỗi, trạng thái…) lấy qua FlowDisplayContext */
export interface FlowNodeData extends Record<string, unknown> {
	node: WorkflowNode
}

export interface FlowEdgeData extends Record<string, unknown> {
	label?: string
	condition?: JsonLogic
	default?: boolean
	/** false khi cạnh gốc không có id (id trên canvas là `${from}->${to}`) — để round-trip không thêm id thừa */
	hadId?: boolean
}

export type FlowNode = Node<FlowNodeData>;
export type FlowEdge = Edge<FlowEdgeData>;

export const FLOW_EDGE_TYPE = "workflow";

const rand = () => Math.random().toString(36).slice(2, 8);

export const newNodeId = (type: NodeType | string) => `${type}_${rand()}`;
export const newEdgeId = (from: string, to: string) => `e_${from}_${to}_${rand()}`;

/** Định nghĩa đã có vị trí cho mọi node chưa */
export function hasCompleteLayout(definition: WorkflowDefinition) {
	return definition.nodes.every(n => !!definition.layout?.[n.id]);
}

export function toFlowEdge(edge: WorkflowEdge): FlowEdge {
	const data: FlowEdgeData = { hadId: edge.id !== undefined };
	if (edge.label !== undefined)
		data.label = edge.label;
	if (edge.condition !== undefined)
		data.condition = edge.condition;
	if (edge.default)
		data.default = true;
	return {
		id: edge.id ?? `${edge.from}->${edge.to}`,
		source: edge.from,
		target: edge.to,
		type: FLOW_EDGE_TYPE,
		data,
	};
}

export function toFlow(definition: WorkflowDefinition): { nodes: FlowNode[], edges: FlowEdge[] } {
	const layout = definition.layout ?? {};
	const nodes: FlowNode[] = definition.nodes.map(node => ({
		id: node.id,
		type: node.type,
		position: layout[node.id] ? { x: layout[node.id].x, y: layout[node.id].y } : { x: 0, y: 0 },
		data: { node },
		deletable: false,
	}));
	return { nodes, edges: definition.edges.map(toFlowEdge) };
}

export function toWorkflowEdge(edge: FlowEdge): WorkflowEdge {
	const data = edge.data ?? {};
	const keepId = data.hadId !== false || edge.id !== `${edge.source}->${edge.target}`;
	const result: WorkflowEdge = keepId ? { id: edge.id, from: edge.source, to: edge.target } : { from: edge.source, to: edge.target };
	if (data.label !== undefined && data.label !== "")
		result.label = data.label;
	if (data.condition !== undefined)
		result.condition = data.condition;
	if (data.default)
		result.default = true;
	return result;
}

export function toDefinition(nodes: FlowNode[], edges: FlowEdge[]): WorkflowDefinition {
	const layout: WorkflowDefinition["layout"] = {};
	for (const n of nodes)
		layout[n.id] = { x: Math.round(n.position.x), y: Math.round(n.position.y) };
	return {
		nodes: nodes.map(n => (n.data.node.id === n.id ? n.data.node : { ...n.data.node, id: n.id })),
		edges: edges.map(toWorkflowEdge),
		layout,
	};
}

/** Quy trình tối thiểu: Bắt đầu → Kết thúc */
export function emptyDefinition(): WorkflowDefinition {
	return {
		nodes: [
			{ id: "start", type: NodeType.Start },
			{ id: "end", type: NodeType.End },
		],
		edges: [{ id: "e_start_end", from: "start", to: "end" }],
		layout: { start: { x: 0, y: 0 }, end: { x: 0, y: 160 } },
	};
}
