import type { WfApprovalData } from "#src/api/setting/workflow-setting";
import type { Node, NodeProps } from "@xyflow/react";
import { CheckOutlined } from "@ant-design/icons";
import { Handle, Position } from "@xyflow/react";
import { theme } from "antd";

export type ApprovalNodeType = Node<Record<string, unknown>, "approval">;

export function ApprovalNode({ data: rawData, selected }: NodeProps<ApprovalNodeType>) {
	const data = rawData as unknown as WfApprovalData;
	const { token } = theme.useToken();

	const totalApprovers = (data.approvers || []).reduce((acc, a) => {
		return acc + (a.approvers?.length || (a.id ? 1 : 0));
	}, 0);

	return (
		<div
			className="flex items-center gap-1 select-none rounded px-2"
			style={{
				height: 22,
				minWidth: 72,
				maxWidth: 130,
				backgroundColor: selected ? token.colorPrimaryBg : token.colorBgContainer,
				border: `1px solid ${selected ? token.colorPrimary : token.colorBorderSecondary}`,
				boxShadow: selected
					? `0 0 0 2px ${token.colorPrimaryBgHover}`
					: "0 1px 2px 0 rgba(0,0,0,0.06)",
				transition: "border-color 0.15s, box-shadow 0.15s",
			}}
		>
			<Handle
				type="target"
				position={Position.Top}
				style={{ width: 5, height: 5, background: token.colorPrimary, border: "1.5px solid #fff" }}
			/>

			<CheckOutlined
				style={{
					fontSize: 9,
					color: selected ? token.colorPrimary : token.colorTextTertiary,
					flexShrink: 0,
				}}
			/>

			<span
				className="text-[10px] font-medium flex-1 truncate"
				style={{ color: selected ? token.colorPrimary : token.colorText }}
			>
				{data.title || "Phê duyệt"}
			</span>

			{totalApprovers > 0 && (
				<span
					className="text-[9px] font-semibold rounded px-0.5 shrink-0"
					style={{
						backgroundColor: selected ? token.colorPrimary : token.colorFillSecondary,
						color: selected ? "#fff" : token.colorTextSecondary,
					}}
				>
					{totalApprovers}
				</span>
			)}

			<Handle
				type="source"
				position={Position.Bottom}
				style={{ width: 5, height: 5, background: token.colorPrimary, border: "1.5px solid #fff" }}
			/>
		</div>
	);
}
