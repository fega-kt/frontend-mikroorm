import type { WfApprovalData, WfEdgeCondition, WfEndData } from "#src/api/setting/workflow-setting";
import type { Edge, Node } from "@xyflow/react";
import { CloseOutlined } from "@ant-design/icons";
import { Button, theme, Typography } from "antd";
import { ApprovalPanel } from "./approval-panel";
import { EdgeConditionPanel } from "./condition-panel";

type Selection = { kind: "node", node: Node } | { kind: "edge", edge: Edge } | null;

interface WfPanelProps {
	selection: Selection
	onClose: () => void
	onNodeDataChange: (nodeId: string, data: WfApprovalData) => void
	onEdgeConditionChange: (edgeId: string, condition: WfEdgeCondition) => void
}

export function WfPanel({ selection, onClose, onNodeDataChange, onEdgeConditionChange }: WfPanelProps) {
	const { token } = theme.useToken();

	if (!selection)
		return null;

	let title: string;
	if (selection.kind === "edge") {
		title = "Điều kiện";
	}
	else {
		const node = selection.node;
		title = node.type === "approval" ? "Bước phê duyệt" : node.type === "end" ? "Kết thúc" : "Node";
	}

	return (
		<div
			className="flex flex-col h-full overflow-hidden"
			style={{
				width: 300,
				borderLeft: `1px solid ${token.colorBorderSecondary}`,
				backgroundColor: token.colorBgContainer,
				flexShrink: 0,
			}}
		>
			<div
				className="flex items-center justify-between px-4 py-3 flex-none"
				style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
			>
				<Typography.Text strong className="text-sm">{title}</Typography.Text>
				<Button size="small" type="text" icon={<CloseOutlined />} onClick={onClose} />
			</div>

			<div className="flex-1 overflow-y-auto">
				{selection.kind === "edge" && (
					<EdgeConditionPanel
						condition={selection.edge.data?.condition as WfEdgeCondition | undefined}
						onChange={cond => onEdgeConditionChange(selection.edge.id, cond)}
					/>
				)}
				{selection.kind === "node" && selection.node.type === "approval" && (
					<ApprovalPanel
						data={selection.node.data as unknown as WfApprovalData}
						onChange={data => onNodeDataChange(selection.node.id, data)}
					/>
				)}
				{selection.kind === "node" && selection.node.type === "end" && (
					<div className="p-4">
						<Typography.Text className="text-xs" style={{ color: token.colorTextQuaternary }}>
							{`Kết quả: ${(selection.node.data as unknown as WfEndData).result === "approved" ? "Phê duyệt" : "Từ chối"}`}
						</Typography.Text>
					</div>
				)}
				{selection.kind === "node" && selection.node.type === "start" && (
					<div className="p-4">
						<Typography.Text className="text-xs" style={{ color: token.colorTextQuaternary }}>
							Node bắt đầu không có cấu hình thêm.
						</Typography.Text>
					</div>
				)}
			</div>
		</div>
	);
}
