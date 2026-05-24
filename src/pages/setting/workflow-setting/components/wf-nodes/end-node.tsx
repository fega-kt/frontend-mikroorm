import type { WfEndData } from "#src/api/setting/workflow-setting";
import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";

export type EndNodeType = Node<Record<string, unknown>, "end">;

export function EndNode({ data: rawData, selected }: NodeProps<EndNodeType>) {
	const data = rawData as unknown as WfEndData;
	const bg = data.result === "rejected" ? "#dc2626" : "#059669";

	return (
		<div
			className="flex items-center justify-center rounded-full select-none"
			style={{
				width: 32,
				height: 32,
				backgroundColor: bg,
				color: "#fff",
				fontSize: 9,
				fontWeight: 600,
				letterSpacing: "0.02em",
				outline: selected ? `2px solid ${bg}` : "2px solid transparent",
				outlineOffset: 3,
			}}
		>
			End
			<Handle
				type="target"
				position={Position.Top}
				style={{ width: 6, height: 6, background: bg, border: "1.5px solid #fff" }}
			/>
		</div>
	);
}
