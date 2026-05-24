import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";

export type StartNodeType = Node<Record<string, unknown>, "start">;

export function StartNode({ selected }: NodeProps<StartNodeType>) {
	return (
		<div
			className="flex items-center justify-center rounded-full select-none"
			style={{
				width: 32,
				height: 32,
				backgroundColor: "#334155",
				color: "#fff",
				fontSize: 9,
				fontWeight: 600,
				letterSpacing: "0.02em",
				outline: selected ? "2px solid #334155" : "2px solid transparent",
				outlineOffset: 3,
			}}
		>
			Start
			<Handle
				type="source"
				position={Position.Bottom}
				style={{ width: 6, height: 6, background: "#334155", border: "1.5px solid #fff" }}
			/>
		</div>
	);
}
