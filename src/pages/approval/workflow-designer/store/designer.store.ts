import type { GraphError, WorkflowDefinition, WorkflowNode } from "#src/api/approval-workflow/types";
import type { FormField } from "#src/api/setting/request-type/types";
import type { EdgeChange, NodeChange, XYPosition } from "@xyflow/react";
import type { AddableNodeType } from "../lib/node-factory";
import type { FlowEdge, FlowEdgeData, FlowNode } from "../lib/to-definition";
import { NodeType } from "#src/api/approval-workflow/types";
import { applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import i18next from "i18next";
import { createContext, use } from "react";
import { createStore, useStore } from "zustand";
import { layoutGraph } from "../canvas/useAutoLayout";
import { initialRowFor, rowsToLogic } from "../lib/condition";
import { cloneWorkflowNode, createWorkflowNode, NODE_WIDTH, nodeHeight } from "../lib/node-factory";
import { FLOW_EDGE_TYPE, hasCompleteLayout, newEdgeId, toFlow } from "../lib/to-definition";

type Positions = Record<string, XYPosition>;

export interface DesignerState {
	nodes: FlowNode[]
	edges: FlowEdge[]
	/** id của node hoặc cạnh đang chọn */
	selectedId: string | null
	dirty: boolean
	errors: GraphError[]
	/** Tên người dùng đã biết (SPECIFIC_USER) — id → họ tên */
	userNames: Record<string, string>
	/** Đường đi của lần chạy thử, null khi không chạy thử */
	simulationPath: string[] | null
	/** Tăng mỗi lần nạp đồ thị mới — canvas dùng để fitView */
	loadVersion: number

	load: (definition: WorkflowDefinition) => void
	onNodesChange: (changes: NodeChange<FlowNode>[]) => void
	onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void
	connect: (source: string, target: string) => string | null
	addNode: (type: AddableNodeType, position?: XYPosition) => string
	insertOnEdge: (edgeId: string, type: AddableNodeType, fields?: FormField[]) => void
	addBranch: (conditionId: string) => void
	updateNode: (id: string, updater: (node: WorkflowNode) => WorkflowNode) => void
	updateEdgeData: (id: string, patch: Partial<FlowEdgeData>) => void
	setDefaultEdge: (id: string, isDefault: boolean) => void
	removeNode: (id: string) => void
	removeEdge: (id: string) => void
	duplicateNode: (id: string) => void
	select: (id: string | null) => void
	applyLayout: (positions: Positions) => void
	setErrors: (errors: GraphError[]) => void
	markSaved: () => void
	setUserNames: (names: Record<string, string>) => void
	setSimulationPath: (path: string[] | null) => void
}

const t = (key: string, options?: Record<string, unknown>) => i18next.t(`workflowDesigner.${key}`, options);

/** Tập node đi tới được từ `from` (kể cả chính nó) */
function descendants(edges: FlowEdge[], from: string): Set<string> {
	const seen = new Set([from]);
	const stack = [from];
	while (stack.length) {
		const id = stack.pop()!;
		for (const e of edges) {
			if (e.source === id && !seen.has(e.target)) {
				seen.add(e.target);
				stack.push(e.target);
			}
		}
	}
	return seen;
}

/** Quy tắc nối cạnh trên canvas: không tự nối, không vào Bắt đầu, không ra từ Kết thúc, không trùng, không tạo vòng */
export function isConnectionAllowed(nodes: FlowNode[], edges: FlowEdge[], source?: string | null, target?: string | null): boolean {
	if (!source || !target || source === target)
		return false;
	const src = nodes.find(n => n.id === source);
	const tgt = nodes.find(n => n.id === target);
	if (!src || !tgt || tgt.type === NodeType.Start || src.type === NodeType.End)
		return false;
	if (edges.some(e => e.source === source && e.target === target))
		return false;
	// Bỏ cạnh ra hiện tại của bước thường (sẽ bị thay thế) khi xét vòng lặp
	const considered = src.type === NodeType.Condition ? edges : edges.filter(e => e.source !== source);
	return !descendants(considered, target).has(source);
}

function makeEdge(source: string, target: string, data: Omit<FlowEdgeData, "hadId"> = {}): FlowEdge {
	return {
		id: newEdgeId(source, target),
		source,
		target,
		type: FLOW_EDGE_TYPE,
		data: { hadId: true, ...data },
	};
}

function makeNode(node: WorkflowNode, position: XYPosition): FlowNode {
	return {
		id: node.id,
		type: node.type,
		position,
		data: { node },
		deletable: false,
	};
}

/** Đổi đích của cạnh — cạnh không có id gốc thì đổi id theo from->to mới */
function retarget(edge: FlowEdge, target: string): FlowEdge {
	return {
		...edge,
		id: edge.data?.hadId === false ? `${edge.source}->${target}` : edge.id,
		target,
	};
}

export function createDesignerStore() {
	return createStore<DesignerState>()((set, get) => ({
		nodes: [],
		edges: [],
		selectedId: null,
		dirty: false,
		errors: [],
		userNames: {},
		simulationPath: null,
		loadVersion: 0,

		load: (definition) => {
			const { nodes, edges } = toFlow(definition);
			if (!hasCompleteLayout(definition)) {
				const positions = layoutGraph(nodes, edges);
				nodes.forEach((n) => {
					if (positions[n.id])
						n.position = positions[n.id];
				});
			}
			set(s => ({ nodes, edges, selectedId: null, dirty: false, errors: [], simulationPath: null, loadVersion: s.loadVersion + 1 }));
		},

		onNodesChange: (changes) => {
			const filtered = changes.filter(c => c.type !== "remove" && c.type !== "add");
			if (!filtered.length)
				return;
			const moved = filtered.some(c => c.type === "position" && !!c.position);
			set(s => ({ nodes: applyNodeChanges(filtered, s.nodes), dirty: s.dirty || moved }));
		},

		onEdgesChange: (changes) => {
			const filtered = changes.filter(c => c.type !== "remove" && c.type !== "add" && c.type !== "select");
			if (filtered.length)
				set(s => ({ edges: applyEdgeChanges(filtered, s.edges) }));
		},

		connect: (source, target) => {
			const { nodes, edges } = get();
			if (!isConnectionAllowed(nodes, edges, source, target))
				return null;
			const src = nodes.find(n => n.id === source)!;
			let next = edges;
			let edge: FlowEdge;
			if (src.type === NodeType.Condition) {
				const outs = edges.filter(e => e.source === source);
				edge = outs.some(e => e.data?.default)
					? makeEdge(source, target, { label: t("edge.branch", { index: outs.length + 1 }) })
					: makeEdge(source, target, { default: true, label: t("edge.default") });
			}
			else {
				// Bước thường chỉ có một cạnh ra → nối mới thay cạnh cũ
				next = edges.filter(e => e.source !== source);
				edge = makeEdge(source, target);
			}
			set(s => ({
				edges: [...next, edge],
				dirty: true,
				selectedId: src.type === NodeType.Condition ? edge.id : s.selectedId,
			}));
			return edge.id;
		},

		addNode: (type, position) => {
			const { nodes } = get();
			const node = createWorkflowNode(type);
			let pos = position;
			if (!pos) {
				const lowest = nodes.reduce<FlowNode | null>((acc, n) => (!acc || n.position.y > acc.position.y ? n : acc), null);
				pos = lowest ? { x: lowest.position.x + NODE_WIDTH + 60, y: lowest.position.y } : { x: 0, y: 0 };
			}
			set(s => ({ nodes: [...s.nodes, makeNode(node, pos)], selectedId: node.id, dirty: true }));
			return node.id;
		},

		insertOnEdge: (edgeId, type, fields) => {
			const { nodes, edges } = get();
			const edge = edges.find(e => e.id === edgeId);
			const target = edge && nodes.find(n => n.id === edge.target);
			if (!edge || !target)
				return;

			const wf = createWorkflowNode(type);
			const pos = { ...target.position };
			const shift = nodeHeight(type) + 70;
			const moving = descendants(edges, target.id);
			const nextNodes = nodes.map(n => (moving.has(n.id) ? { ...n, position: { x: n.position.x, y: n.position.y + shift } } : n));
			nextNodes.push(makeNode(wf, pos));

			// Cạnh cũ giữ id + dữ liệu (nhãn/điều kiện nhánh) và trỏ vào bước mới
			const nextEdges = edges.map(e => (e.id === edgeId ? retarget(e, wf.id) : e));
			if (type === NodeType.Condition) {
				const end = createWorkflowNode(NodeType.End);
				nextNodes.push(makeNode(end, { x: pos.x + NODE_WIDTH + 80, y: pos.y + shift }));
				const condition = fields?.length ? rowsToLogic({ combinator: "and", rows: [initialRowFor(fields[0])] }) : undefined;
				nextEdges.push(
					makeEdge(wf.id, end.id, { label: t("edge.yes"), ...(condition ? { condition } : {}) }),
					makeEdge(wf.id, target.id, { label: t("edge.no"), default: true }),
				);
			}
			else {
				nextEdges.push(makeEdge(wf.id, target.id));
			}
			set({ nodes: nextNodes, edges: nextEdges, selectedId: wf.id, dirty: true });
		},

		addBranch: (conditionId) => {
			const { nodes, edges } = get();
			const cond = nodes.find(n => n.id === conditionId);
			if (!cond)
				return;
			const outs = edges.filter(e => e.source === conditionId);
			const end = createWorkflowNode(NodeType.End);
			const pos = { x: cond.position.x + (outs.length + 1) * (NODE_WIDTH / 2 + 40), y: cond.position.y + 220 };
			const edge = outs.some(e => e.data?.default)
				? makeEdge(conditionId, end.id, { label: t("edge.branch", { index: outs.length + 1 }) })
				: makeEdge(conditionId, end.id, { default: true, label: t("edge.default") });
			set({ nodes: [...nodes, makeNode(end, pos)], edges: [...edges, edge], dirty: true });
		},

		updateNode: (id, updater) => {
			set(s => ({
				nodes: s.nodes.map(n => (n.id === id ? { ...n, data: { ...n.data, node: updater(n.data.node) } } : n)),
				dirty: true,
			}));
		},

		updateEdgeData: (id, patch) => {
			set(s => ({
				edges: s.edges.map((e) => {
					if (e.id !== id)
						return e;
					const data: FlowEdgeData = { ...e.data, ...patch };
					for (const key of Object.keys(data) as (keyof FlowEdgeData)[]) {
						if (data[key] === undefined)
							delete data[key];
					}
					return { ...e, data };
				}),
				dirty: true,
			}));
		},

		setDefaultEdge: (id, isDefault) => {
			const edge = get().edges.find(e => e.id === id);
			if (!edge)
				return;
			set(s => ({
				edges: s.edges.map((e) => {
					if (e.source !== edge.source)
						return e;
					const data = { ...e.data };
					if (e.id === id) {
						if (isDefault) {
							data.default = true;
							delete data.condition;
						}
						else {
							delete data.default;
						}
					}
					else if (isDefault && data.default) {
						delete data.default;
					}
					return { ...e, data };
				}),
				dirty: true,
			}));
		},

		removeNode: (id) => {
			const { nodes, edges } = get();
			const node = nodes.find(n => n.id === id);
			if (!node || node.type === NodeType.Start)
				return;
			const outs = edges.filter(e => e.source === id);
			const ins = edges.filter(e => e.target === id);
			const successor = node.type === NodeType.Condition
				? outs.find(e => e.data?.default)?.target
				: outs.length === 1 ? outs[0].target : undefined;

			const nextEdges = edges.filter(e => e.source !== id && e.target !== id);
			// Nối lại bước trước với bước sau để không đứt luồng
			if (successor && successor !== id) {
				for (const e of ins) {
					if (!nextEdges.some(x => x.source === e.source && x.target === successor))
						nextEdges.push(retarget(e, successor));
				}
			}
			set(s => ({
				nodes: nodes.filter(n => n.id !== id),
				edges: nextEdges,
				selectedId: s.selectedId === id ? null : s.selectedId,
				dirty: true,
			}));
		},

		removeEdge: (id) => {
			set(s => ({
				edges: s.edges.filter(e => e.id !== id),
				selectedId: s.selectedId === id ? null : s.selectedId,
				dirty: true,
			}));
		},

		duplicateNode: (id) => {
			const node = get().nodes.find(n => n.id === id);
			if (!node || node.type === NodeType.Start)
				return;
			const copy = cloneWorkflowNode(node.data.node);
			set(s => ({
				nodes: [...s.nodes, makeNode(copy, { x: node.position.x + 40, y: node.position.y + 40 })],
				selectedId: copy.id,
				dirty: true,
			}));
		},

		select: id => set({ selectedId: id }),

		applyLayout: (positions) => {
			set(s => ({
				nodes: s.nodes.map(n => (positions[n.id] ? { ...n, position: positions[n.id] } : n)),
				dirty: true,
			}));
		},

		setErrors: errors => set({ errors }),

		markSaved: () => set({ dirty: false }),

		setUserNames: (names) => {
			const current = get().userNames;
			if (Object.entries(names).every(([k, v]) => current[k] === v))
				return;
			set({ userNames: { ...current, ...names } });
		},

		setSimulationPath: path => set({ simulationPath: path }),
	}));
}

export type DesignerStore = ReturnType<typeof createDesignerStore>;

export const DesignerStoreContext = createContext<DesignerStore | null>(null);

export function useDesignerStoreApi(): DesignerStore {
	const store = use(DesignerStoreContext);
	if (!store)
		throw new Error("useDesigner must be used inside DesignerStoreContext");
	return store;
}

export function useDesigner<T>(selector: (state: DesignerState) => T): T {
	return useStore(useDesignerStoreApi(), selector);
}
