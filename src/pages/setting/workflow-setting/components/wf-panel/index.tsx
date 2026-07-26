import type { WfApprovalData } from "#src/api/setting/workflow-setting";
import type { BpmnElement } from "bpmn-js/lib/Modeler";
import type { SequenceFlowMode } from "./sequence-flow-panel";
import { CloseOutlined } from "@ant-design/icons";
import { Button, theme, Typography } from "antd";
import { ApprovalPanel } from "./approval-panel";
import { SequenceFlowPanel } from "./sequence-flow-panel";

interface WfPanelProps {
	element: BpmnElement | null
	onClose: () => void
	approvalData: WfApprovalData
	onApprovalChange: (data: WfApprovalData) => void
	sequenceFlowMode: SequenceFlowMode
	onSequenceFlowChange: (mode: SequenceFlowMode) => void
}

export function WfPanel({
	element,
	onClose,
	approvalData,
	onApprovalChange,
	sequenceFlowMode,
	onSequenceFlowChange,
}: WfPanelProps) {
	const { token } = theme.useToken();

	if (!element)
		return null;

	const isUserTask = element.type === "bpmn:UserTask";
	const isSequenceFlow = element.type === "bpmn:SequenceFlow";

	if (!isUserTask && !isSequenceFlow)
		return null;

	const title = isUserTask ? "Bước phê duyệt" : "Điều kiện";

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
				{isUserTask && <ApprovalPanel data={approvalData} onChange={onApprovalChange} />}
				{isSequenceFlow && <SequenceFlowPanel mode={sequenceFlowMode} onChange={onSequenceFlowChange} />}
			</div>
		</div>
	);
}
