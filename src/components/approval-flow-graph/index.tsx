import type { WorkflowDefinition } from "#src/api/approval-workflow/types";
import type { FormField } from "#src/api/setting/request-type/types";
import type { FlowDisplay, NodeStatus } from "#src/pages/approval/workflow-designer/canvas/display-context";
import type { FlowEdge, FlowNode } from "#src/pages/approval/workflow-designer/lib/to-definition";
import { usePreferences } from "#src/hooks/use-preferences";
import { FlowDisplayContext } from "#src/pages/approval/workflow-designer/canvas/display-context";
import { flowEdgeTypes } from "#src/pages/approval/workflow-designer/canvas/edges";
import { buildConditionInfo } from "#src/pages/approval/workflow-designer/canvas/labels";
import { flowNodeTypes } from "#src/pages/approval/workflow-designer/canvas/nodes";
import { layoutGraph } from "#src/pages/approval/workflow-designer/canvas/useAutoLayout";
import { hasCompleteLayout, toFlow } from "#src/pages/approval/workflow-designer/lib/to-definition";
import { Background, BackgroundVariant, Controls, MarkerType, ReactFlow, ReactFlowProvider, useNodesInitialized, useReactFlow } from "@xyflow/react";
import { theme } from "antd";
import { useEffect, useMemo, useRef } from "react";
import { useWorkflowUserNames } from "./user-names";
import "@xyflow/react/dist/style.css";

export type ApprovalNodeStatus = NodeStatus;

export interface ApprovalFlowGraphProps {
	definition: WorkflowDefinition
	/** Trạng thái từng bước của đơn: done | current | rejected | returned | skipped | pending */
	nodeStatus?: Record<string, ApprovalNodeStatus>
	/** Các node đơn đã đi qua (theo thứ tự) — cạnh nối hai node đã đi qua được tô nổi */
	visitedNodeIds?: string[]
	height?: number | string
	/** id → họ tên cho người duyệt SPECIFIC_USER (id thiếu sẽ tự tải qua API user) */
	userNames?: Record<string, string>
	/** formSchema của loại đơn — để hiển thị nhãn trường trong điều kiện (tùy chọn) */
	fields?: FormField[]
	className?: string
}

/** Lớp các cạnh nối hai node đã đi qua */
function visitedEdgeIds(edges: FlowEdge[], visited: Set<string>): Set<string> {
	return new Set(edges.filter(e => visited.has(e.source) && visited.has(e.target)).map(e => e.id));
}

function Graph({ definition, nodeStatus, visitedNodeIds, height = 420, userNames, fields, className }: ApprovalFlowGraphProps) {
	const { token } = theme.useToken();
	const { isDark } = usePreferences();
	const names = useWorkflowUserNames(definition, userNames);
	const { fitView } = useReactFlow();
	const nodesInitialized = useNodesInitialized();
	const wrapperRef = useRef<HTMLDivElement>(null);

	// `fitView` của ReactFlow chỉ căn một lần lúc khởi tạo, khi khung tab còn đang trượt vào nên kích thước chưa đúng
	// → sơ đồ lệch / quá nhỏ. Căn lại khi các node đã đo xong và mỗi khi khung đổi kích thước.
	useEffect(() => {
		const el = wrapperRef.current;
		if (!el)
			return;
		let frame = 0;
		const refit = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => fitView({ padding: 0.15, maxZoom: 1 }));
		};
		const observer = new ResizeObserver(refit);
		observer.observe(el);
		refit();
		return () => {
			observer.disconnect();
			cancelAnimationFrame(frame);
		};
	}, [fitView, nodesInitialized, definition]);

	const { nodes, edges } = useMemo(() => {
		const flow = toFlow(definition);
		if (!hasCompleteLayout(definition)) {
			const positions = layoutGraph(flow.nodes, flow.edges);
			flow.nodes.forEach((n) => {
				if (positions[n.id])
					n.position = positions[n.id];
			});
		}
		flow.nodes.forEach((n) => {
			n.draggable = false;
			n.connectable = false;
			n.selectable = false;
		});
		return flow as { nodes: FlowNode[], edges: FlowEdge[] };
	}, [definition]);

	const display = useMemo<FlowDisplay>(() => {
		const tracking = !!nodeStatus || !!visitedNodeIds;
		const visited = new Set<string>(visitedNodeIds ?? []);
		const status: Record<string, NodeStatus> = {};
		for (const [id, s] of Object.entries(nodeStatus ?? {})) {
			status[id] = s;
			if (s !== "pending")
				visited.add(id);
		}
		// Node đã đi qua nhưng không có trạng thái → coi như đã xong
		for (const id of visited) {
			if (!status[id])
				status[id] = "done";
		}
		return {
			readOnly: true,
			nodeErrors: {},
			edgeErrors: {},
			nodeStatus: tracking ? status : undefined,
			highlightEdges: tracking ? visitedEdgeIds(edges, visited) : null,
			dimUnvisited: tracking,
			userNames: names,
			fields: fields ?? [],
			conditionInfo: buildConditionInfo(edges),
		};
	}, [nodeStatus, visitedNodeIds, edges, names, fields]);

	return (
		<FlowDisplayContext value={display}>
			<div ref={wrapperRef} className={className} style={{ height, width: "100%" }}>
				<ReactFlow<FlowNode, FlowEdge>
					nodes={nodes}
					edges={edges}
					nodeTypes={flowNodeTypes}
					edgeTypes={flowEdgeTypes}
					nodesDraggable={false}
					nodesConnectable={false}
					elementsSelectable={false}
					deleteKeyCode={null}
					defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 } }}
					colorMode={isDark ? "dark" : "light"}
					fitView
					fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
					minZoom={0.2}
					maxZoom={1.5}
					zoomOnScroll={false}
					preventScrolling={false}
					style={{ background: token.colorBgLayout, borderRadius: token.borderRadiusLG }}
				>
					<Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color={token.colorTextQuaternary} />
					<Controls showInteractive={false} position="bottom-left" />
				</ReactFlow>
			</div>
		</FlowDisplayContext>
	);
}

/**
 * Đồ thị quy trình chỉ đọc (trang chi tiết đơn, xem trước phiên bản).
 * Dùng lại component node của màn thiết kế nhưng không phụ thuộc store của màn đó.
 */
export function ApprovalFlowGraph(props: ApprovalFlowGraphProps) {
	return (
		<ReactFlowProvider>
			<Graph {...props} />
		</ReactFlowProvider>
	);
}
