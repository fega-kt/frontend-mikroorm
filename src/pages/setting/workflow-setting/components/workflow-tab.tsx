import type { WfApprovalData, WfEdgeCondition, WfNodeData, WorkflowDefinition, WorkflowSettingEntity } from "#src/api/setting/workflow-setting";
import type { Connection, Edge, Node, OnConnect, OnEdgesChange, OnNodesChange } from "@xyflow/react";
import type { FormInstance } from "antd";
import type { WfEdgeData } from "./wf-edge";
import { WfEndResult, WfNodeType } from "#src/api/setting/workflow-setting";
import { CheckCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import {
	addEdge,
	Background,
	BackgroundVariant,
	Controls,
	MiniMap,
	ReactFlow,
	ReactFlowProvider,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from "@xyflow/react";
import { Button, theme, Tooltip, Typography } from "antd";
import * as React from "react";
import { useCallback, useEffect, useRef, useTransition } from "react";
import { WfEdgeComponent } from "./wf-edge";
import { nodeTypes } from "./wf-nodes";
import { WfPanel } from "./wf-panel";
import "@xyflow/react/dist/style.css";

function uid() {
	return crypto.randomUUID().slice(0, 8);
}

const edgeTypes = { wf: WfEdgeComponent };

type Selection = { kind: "node", node: Node } | { kind: "edge", edge: Edge } | null;

// ─── Serialization ────────────────────────────────────────────────────────────

function buildDefaultDefinition(): WorkflowDefinition {
	return {
		nodes: [
			{ id: "start", type: WfNodeType.Start, position: { x: 160, y: 40 }, data: { label: "Bắt đầu" } },
			{ id: "end", type: WfNodeType.End, position: { x: 160, y: 180 }, data: { label: "Kết thúc", result: WfEndResult.Approved } },
		],
		edges: [],
	};
}

function definitionToFlow(def: WorkflowDefinition): { nodes: Node[], edges: Edge[] } {
	return {
		nodes: def.nodes.map(n => ({ ...n })) as unknown as Node[],
		edges: def.edges.map(e => ({
			id: e.id,
			source: e.source,
			target: e.target,
			type: "wf",
			animated: true,
			data: { condition: e.condition } satisfies WfEdgeData,
		})),
	};
}

function flowToDefinition(nodes: Node[], edges: Edge[]): WorkflowDefinition {
	return {
		nodes: nodes.map(n => ({
			id: n.id,
			type: n.type as WorkflowDefinition["nodes"][number]["type"],
			position: n.position,
			data: n.data as unknown as WfNodeData,
		})),
		edges: edges.map(e => ({
			id: e.id,
			source: e.source,
			target: e.target,
			condition: (e.data as WfEdgeData | undefined)?.condition,
		})),
	};
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

function WorkflowCanvas({ form }: { form: FormInstance<WorkflowSettingEntity> }) {
	const { token } = theme.useToken();
	const isDark = token.colorBgBase === "#000" || token.colorBgBase === "#000000";

	const { fitView, getNode } = useReactFlow();
	const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
	const [selection, setSelection] = React.useState<Selection>(null);
	const [, startTransition] = useTransition();

	const initializedRef = useRef(false);

	useEffect(() => {
		if (initializedRef.current)
			return;
		initializedRef.current = true;

		const def: WorkflowDefinition = form.getFieldValue("workflowDefinition") ?? buildDefaultDefinition();
		const { nodes: ns, edges: es } = definitionToFlow(def);
		startTransition(() => {
			setNodes(ns);
			setEdges(es);
		});
		requestAnimationFrame(() => fitView({ padding: 0.3 }));
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const persistRef = useRef(false);
	useEffect(() => {
		if (!persistRef.current) {
			persistRef.current = true;
			return;
		}
		form.setFieldValue("workflowDefinition", flowToDefinition(nodes, edges));
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [nodes, edges]);

	// Stable ref so edge callbacks don't capture stale state
	const openEdgePanelRef = useRef<(edgeId: string) => void>(() => {});
	useEffect(() => {
		openEdgePanelRef.current = (edgeId: string) => {
			const edge = edges.find(e => e.id === edgeId);
			if (edge)
				setSelection({ kind: "edge", edge });
		};
	}, [edges]);

	const onConnect: OnConnect = useCallback(
		(params: Connection) => {
			setEdges(es => addEdge({
				...params,
				id: `edge-${uid()}`,
				type: "wf",
				animated: true,
				data: {} satisfies WfEdgeData,
			}, es));
		},
		[setEdges],
	);

	const handleNodesChange: OnNodesChange = useCallback(
		changes => onNodesChange(changes),
		[onNodesChange],
	);

	const handleEdgesChange: OnEdgesChange = useCallback(
		changes => onEdgesChange(changes),
		[onEdgesChange],
	);

	const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
		setSelection({ kind: "node", node });
	}, []);

	const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
		// Only open panel for edges not going to End node
		const targetNode = getNode(edge.target);
		if (targetNode?.type !== "end")
			setSelection({ kind: "edge", edge });
	}, [getNode]);

	const onPaneClick = useCallback(() => setSelection(null), []);

	const addApprovalNode = () => {
		const node: Node = {
			id: `approval-${uid()}`,
			type: "approval",
			position: { x: 120 + Math.random() * 80, y: 120 + Math.random() * 80 },
			data: {
				title: "Bước phê duyệt",
				approvers: [],
				approvalType: "all",
				selfApproval: "skip",
			} as unknown as Record<string, unknown>,
		};
		setNodes(ns => [...ns, node]);
	};

	const selectedNode = selection?.kind === "node" ? selection.node : null;
	const canDelete = selectedNode && selectedNode.type !== "start" && selectedNode.type !== "end";

	const deleteSelectedNode = () => {
		if (!selectedNode)
			return;
		setNodes(ns => ns.filter(n => n.id !== selectedNode.id));
		setEdges(es => es.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
		setSelection(null);
	};

	const handleNodeDataChange = (nodeId: string, data: WfApprovalData) => {
		setNodes(ns => ns.map(n => n.id === nodeId ? { ...n, data: data as unknown as Record<string, unknown> } : n));
		setSelection(prev => prev?.kind === "node" && prev.node.id === nodeId
			? { kind: "node", node: { ...prev.node, data: data as unknown as Record<string, unknown> } }
			: prev);
	};

	const handleEdgeConditionChange = (edgeId: string, condition: WfEdgeCondition) => {
		setEdges(es => es.map(e => e.id === edgeId
			? { ...e, data: { ...e.data, condition } satisfies WfEdgeData }
			: e));
		setSelection(prev => prev?.kind === "edge" && prev.edge.id === edgeId
			? { kind: "edge", edge: { ...prev.edge, data: { ...prev.edge.data, condition } satisfies WfEdgeData } }
			: prev);
	};

	// Inject onLabelClick into each edge's data
	const edgesWithCallbacks: Edge[] = edges.map(e => ({
		...e,
		data: {
			...(e.data as WfEdgeData),
			onLabelClick: (id: string) => openEdgePanelRef.current(id),
		} satisfies WfEdgeData,
	}));

	return (
		<div className="flex h-full" style={{ backgroundColor: isDark ? token.colorBgLayout : "#f8fafc" }}>
			<div className="flex-1 flex flex-col overflow-hidden min-w-0">
				{/* Toolbar */}
				<div
					className="flex items-center gap-2 px-3 py-2 flex-none"
					style={{ borderBottom: `1px solid ${token.colorBorderSecondary}`, backgroundColor: token.colorBgContainer }}
				>
					<Button size="small" icon={<CheckCircleOutlined />} onClick={addApprovalNode} type="primary" ghost>
						Thêm bước phê duyệt
					</Button>

					<div className="flex-1" />

					{canDelete && (
						<Tooltip title="Xóa node đang chọn">
							<Button size="small" danger icon={<DeleteOutlined />} onClick={deleteSelectedNode}>
								Xóa
							</Button>
						</Tooltip>
					)}

					<Typography.Text className="text-xs" style={{ color: token.colorTextQuaternary }}>
						Kéo để kết nối · Click để cấu hình
					</Typography.Text>
				</div>

				{/* ReactFlow */}
				<div className="flex-1 overflow-hidden">
					<ReactFlow
						nodes={nodes}
						edges={edgesWithCallbacks}
						nodeTypes={nodeTypes}
						edgeTypes={edgeTypes}
						onNodesChange={handleNodesChange}
						onEdgesChange={handleEdgesChange}
						onConnect={onConnect}
						onNodeClick={onNodeClick}
						onEdgeClick={onEdgeClick}
						onPaneClick={onPaneClick}
						fitView
						colorMode={isDark ? "dark" : "light"}
						defaultEdgeOptions={{ animated: true }}
						proOptions={{ hideAttribution: true }}
					>
						<Background variant={BackgroundVariant.Dots} gap={20} size={1} color={token.colorBorderSecondary} />
						<Controls showInteractive={false} />
						<MiniMap
							nodeStrokeWidth={3}
							style={{ backgroundColor: token.colorBgLayout, border: `1px solid ${token.colorBorderSecondary}` }}
						/>
					</ReactFlow>
				</div>
			</div>

			<WfPanel
				selection={selection}
				onClose={() => setSelection(null)}
				onNodeDataChange={handleNodeDataChange}
				onEdgeConditionChange={handleEdgeConditionChange}
			/>
		</div>
	);
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function WorkflowTab({ form }: { form: FormInstance<WorkflowSettingEntity> }) {
	return (
		<ReactFlowProvider>
			<WorkflowCanvas form={form} />
		</ReactFlowProvider>
	);
}
