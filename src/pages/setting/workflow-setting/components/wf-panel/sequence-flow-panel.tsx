import { Radio, theme, Typography } from "antd";

export type SequenceFlowMode = "always" | "approve" | "not-approve";

interface SequenceFlowPanelProps {
	mode: SequenceFlowMode
	onChange: (mode: SequenceFlowMode) => void
}

export function SequenceFlowPanel({ mode, onChange }: SequenceFlowPanelProps) {
	const { token } = theme.useToken();

	return (
		<div className="space-y-4 p-4">
			<div>
				<Typography.Text className="text-xs font-medium block mb-2" style={{ color: token.colorTextSecondary }}>
					Điều kiện đi tiếp
				</Typography.Text>
				<Radio.Group
					value={mode}
					onChange={e => onChange(e.target.value as SequenceFlowMode)}
					size="small"
					className="flex flex-col gap-2"
				>
					<Radio value="always">Luôn luôn</Radio>
					<Radio value="approve">Nếu được duyệt</Radio>
					<Radio value="not-approve">Nếu không được duyệt (từ chối/trả lại)</Radio>
				</Radio.Group>
			</div>
		</div>
	);
}
