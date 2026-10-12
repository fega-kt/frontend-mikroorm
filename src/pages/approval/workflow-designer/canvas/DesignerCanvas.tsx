import type { GraphError } from "#src/api/approval-workflow/types";
import type { FormField } from "#src/api/setting/request-type/types";
import type { Connection, IsValidConnection } from "@xyflow/react";
import type { CSSProperties, DragEvent } from "react";
import type { AddableNodeType } from "../lib/node-factory";
import type { FlowEdge, FlowNode } from "../lib/to-definition";
import type { FlowDisplay } from "./display-context";
import { NodeType } from "#src/api/approval-workflow/types";
import { usePreferences } from "#src/hooks/use-preferences";
import { cn } from "#src/utils/cn";
import { ApartmentOutlined, CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { Background, BackgroundVariant, Controls, MarkerType, MiniMap, Panel, ReactFlow, useReactFlow, useViewport } from "@xyflow/react";
import { useDebounceEffect } from "ahooks";
import { Badge, Button, Divider, Popover, Space, Tag, theme, Typography } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { groupErrors } from "../lib/errors";
import { NODE_WIDTH, PALETTE_TYPES } from "../lib/node-factory";
import { toDefinition } from "../lib/to-definition";
import { validateGraph } from "../lib/validate-graph";
import { isConnectionAllowed, useDesigner, useDesignerStoreApi } from "../store/designer.store";
import { FlowDisplayContext } from "./display-context";
import { flowEdgeTypes } from "./edges";
import { buildConditionInfo, nodeTitle } from "./labels";
import { flowNodeTypes } from "./nodes";
import { useAutoLayout } from "./useAutoLayout";
import "@xyflow/react/dist/style.css";

/** MIME dùng khi kéo thẻ từ bảng thành phần */
export const PALETTE_DND_MIME = "application/x-approval-node";

interface DesignerCanvasProps {
	readOnly: boolean
	fields: FormField[]
}

function isEditableTarget(el: EventTarget | null) {
	return el instanceof HTMLElement && !!el.closest("input, textarea, select, [contenteditable='true'], .ant-select, .ant-modal, .ant-drawer");
}

export function DesignerCanvas({ readOnly, fields }: DesignerCanvasProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { isDark } = usePreferences();
	const store = useDesignerStoreApi();
	const { screenToFlowPosition, fitView } = useReactFlow();
	const wrapperRef = useRef<HTMLDivElement>(null);
	const [dropActive, setDropActive] = useState(false);

	const nodes = useDesigner(s => s.nodes);
	const edges = useDesigner(s => s.edges);
	const errors = useDesigner(s => s.errors);
	const selectedId = useDesigner(s => s.selectedId);
	const userNames = useDesigner(s => s.userNames);
	const simulationPath = useDesigner(s => s.simulationPath);
	const loadVersion = useDesigner(s => s.loadVersion);
	const onNodesChange = useDesigner(s => s.onNodesChange);
	const onEdgesChange = useDesigner(s => s.onEdgesChange);

	const fieldKeys = useMemo(() => fields.map(f => f.key), [fields]);

	// Kiểm tra hợp lệ trực tiếp (debounce) — backend vẫn là nguồn chuẩn khi xuất bản
	useDebounceEffect(() => {
		store.getState().setErrors(validateGraph(toDefinition(nodes, edges), fieldKeys));
	}, [nodes, edges, fieldKeys], { wait: 300 });

	// Nạp đồ thị mới → căn khung nhìn
	useEffect(() => {
		if (!loadVersion)
			return;
		const raf = requestAnimationFrame(() => fitView({ padding: 0.2, maxZoom: 1 }));
		return () => cancelAnimationFrame(raf);
	}, [loadVersion, fitView]);

	const translateError = useCallback(
		(err: GraphError) => t(`workflowDesigner.errors.${err.code}`, { defaultValue: err.message }),
		[t],
	);
	const { nodeErrors, edgeErrors } = useMemo(() => groupErrors(errors, edges, translateError), [errors, edges, translateError]);

	const highlight = useMemo(() => {
		if (!simulationPath)
			return { nodes: null, edges: null };
		const pathEdges = new Set<string>();
		for (let i = 0; i < simulationPath.length - 1; i++) {
			const e = edges.find(x => x.source === simulationPath[i] && x.target === simulationPath[i + 1]);
			if (e)
				pathEdges.add(e.id);
		}
		return { nodes: new Set(simulationPath), edges: pathEdges };
	}, [simulationPath, edges]);

	const conditionInfo = useMemo(() => buildConditionInfo(edges), [edges]);

	const display = useMemo<FlowDisplay>(() => ({
		readOnly,
		selectedId,
		nodeErrors,
		edgeErrors,
		highlightNodes: highlight.nodes,
		highlightEdges: highlight.edges,
		userNames,
		fields,
		conditionInfo,
		onInsert: readOnly ? undefined : (edgeId: string, type: AddableNodeType) => store.getState().insertOnEdge(edgeId, type, fields),
		onSelect: (id: string) => store.getState().select(id),
	}), [readOnly, selectedId, nodeErrors, edgeErrors, highlight, userNames, fields, conditionInfo, store]);

	const isValidConnection = useCallback<IsValidConnection<FlowEdge>>((conn: FlowEdge | Connection) => {
		const { nodes: ns, edges: es } = store.getState();
		return isConnectionAllowed(ns, es, conn.source, conn.target);
	}, [store]);

	const onConnect = useCallback((conn: Connection) => {
		store.getState().connect(conn.source, conn.target);
	}, [store]);

	// Phím Delete/Backspace: xóa bước hoặc cạnh đang chọn (không xóa được Bắt đầu)
	useEffect(() => {
		if (readOnly)
			return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== "Delete" && e.key !== "Backspace")
				return;
			// Bỏ qua khi đang gõ trong ô nhập, hoặc trang đang bị ẩn (keep-alive)
			if (isEditableTarget(e.target) || !wrapperRef.current || wrapperRef.current.offsetParent === null)
				return;
			if (e.target !== document.body && !wrapperRef.current?.contains(e.target as Node))
				return;
			const s = store.getState();
			if (!s.selectedId)
				return;
			e.preventDefault();
			if (s.nodes.some(n => n.id === s.selectedId))
				s.removeNode(s.selectedId);
			else
				s.removeEdge(s.selectedId);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [readOnly, store]);

	const onDragOver = (e: DragEvent) => {
		if (readOnly || !e.dataTransfer.types.includes(PALETTE_DND_MIME))
			return;
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		setDropActive(true);
	};

	const onDrop = (e: DragEvent) => {
		setDropActive(false);
		const type = e.dataTransfer.getData(PALETTE_DND_MIME) as AddableNodeType;
		if (readOnly || !PALETTE_TYPES.includes(type))
			return;
		e.preventDefault();
		const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
		store.getState().addNode(type, { x: Math.round(p.x - NODE_WIDTH / 2), y: Math.round(p.y - 30) });
	};

	const minimapColor = (n: { type?: string }) => {
		switch (n.type) {
			case NodeType.Start: return token.colorSuccess;
			case NodeType.Approval: return token.colorPrimary;
			case NodeType.Condition: return token.colorWarning;
			case NodeType.Parallel: return token.purple;
			case NodeType.Notify: return token.cyan;
			default: return token.colorTextQuaternary;
		}
	};

	return (
		<FlowDisplayContext value={display}>
			<div
				ref={wrapperRef}
				className={cn("relative h-full w-full", dropActive && "awf-drop-active")}
				style={{ "--awf-drop-color": token.colorPrimary } as CSSProperties}
				onDragOver={onDragOver}
				onDragLeave={() => setDropActive(false)}
				onDrop={onDrop}
			>
				<ReactFlow<FlowNode, FlowEdge>
					nodes={nodes}
					edges={edges}
					nodeTypes={flowNodeTypes}
					edgeTypes={flowEdgeTypes}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					isValidConnection={isValidConnection}
					onNodeClick={(_, node) => store.getState().select(node.id)}
					onEdgeClick={(_, edge) => store.getState().select(edge.id)}
					onPaneClick={() => store.getState().select(null)}
					nodesDraggable={!readOnly}
					nodesConnectable={!readOnly}
					elementsSelectable={false}
					deleteKeyCode={null}
					defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 } }}
					connectionLineStyle={{ stroke: token.colorPrimary, strokeWidth: 1.5 }}
					colorMode={isDark ? "dark" : "light"}
					fitView
					fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
					minZoom={0.2}
					maxZoom={2}
					style={{ background: token.colorBgLayout }}
				>
					<Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color={token.colorTextQuaternary} />
					<Controls showInteractive={false} position="bottom-left" />
					<MiniMap
						pannable
						zoomable
						nodeColor={minimapColor}
						nodeStrokeWidth={0}
						position="bottom-right"
						style={{ background: token.colorBgContainer, width: 160, height: 110 }}
					/>
					<CanvasFooter errors={errors} translate={translateError} readOnly={readOnly} />
				</ReactFlow>
			</div>
		</FlowDisplayContext>
	);
}

/** Thanh dưới canvas: số bước, số nhánh, trạng thái hợp lệ, tự sắp xếp, mức zoom */
function CanvasFooter({ errors, translate, readOnly }: { errors: GraphError[], translate: (e: GraphError) => string, readOnly: boolean }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const store = useDesignerStoreApi();
	const nodes = useDesigner(s => s.nodes);
	const edges = useDesigner(s => s.edges);
	const { zoom } = useViewport();
	const { zoomTo } = useReactFlow();

	const branches = nodes.filter(n => n.type === NodeType.Condition).length;

	const getGraph = useCallback(() => store.getState(), [store]);
	const applyLayout = useCallback((positions: Record<string, { x: number, y: number }>) => store.getState().applyLayout(positions), [store]);
	const autoLayout = useAutoLayout(getGraph, applyLayout);

	const nodeName = (id?: string) => {
		const n = id ? nodes.find(x => x.id === id) : undefined;
		return n ? nodeTitle(n.data.node, t) : undefined;
	};

	const errorList = (
		<div className="max-h-72 w-80 overflow-auto">
			{errors.map((err, i) => {
				const targetId = err.nodeId ?? (err.edgeId ? edges.find(e => e.id === err.edgeId)?.id : undefined);
				const where = nodeName(err.nodeId) ?? (err.edgeId ? t("workflowDesigner.inspector.edgeTitle") : t("workflowDesigner.footer.global"));
				return (
					<div
						// eslint-disable-next-line react/no-array-index-key
						key={i}
						className={cn("flex gap-2 rounded px-2 py-1.5", targetId && "cursor-pointer")}
						style={{ borderBottom: `1px solid ${token.colorSplit}` }}
						onClick={() => targetId && store.getState().select(targetId)}
					>
						<CloseCircleFilled className="mt-0.5" style={{ color: token.colorError }} />
						<div className="min-w-0">
							<Typography.Text strong className="text-xs">{where}</Typography.Text>
							<div className="text-xs" style={{ color: token.colorTextSecondary }}>{translate(err)}</div>
						</div>
					</div>
				);
			})}
		</div>
	);

	return (
		<Panel position="bottom-center">
			<div
				className="flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs"
				style={{ background: token.colorBgContainer, boxShadow: token.boxShadowSecondary, border: `1px solid ${token.colorBorderSecondary}` }}
			>
				<span style={{ color: token.colorTextSecondary }}>
					{t("workflowDesigner.footer.stats", { steps: nodes.length, branches })}
				</span>
				<Divider type="vertical" />
				{errors.length === 0
					? (
						<Tag color="success" icon={<CheckCircleFilled />} className="m-0">
							{t("workflowDesigner.footer.valid")}
						</Tag>
					)
					: (
						<Popover content={errorList} title={t("workflowDesigner.footer.errorsTitle")} trigger="click" placement="top">
							<Tag color="error" className="m-0 cursor-pointer">
								<Badge status="error" />
								{" "}
								{t("workflowDesigner.footer.errors", { count: errors.length })}
							</Tag>
						</Popover>
					)}
				<Divider type="vertical" />
				<Space size={4}>
					<Button size="small" type="text" icon={<ApartmentOutlined />} onClick={autoLayout} disabled={readOnly}>
						{t("workflowDesigner.actions.autoLayout")}
					</Button>
					<Button size="small" type="text" onClick={() => zoomTo(1, { duration: 200 })} title={t("workflowDesigner.actions.zoomReset")}>
						{`${Math.round(zoom * 100)}%`}
					</Button>
				</Space>
			</div>
		</Panel>
	);
}
