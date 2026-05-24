import type { WfEdgeCondition } from "#src/api/setting/workflow-setting";
import type { EdgeProps } from "@xyflow/react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow } from "@xyflow/react";
import { theme } from "antd";

export interface WfEdgeData extends Record<string, unknown> {
	condition?: WfEdgeCondition
	onLabelClick?: (edgeId: string) => void
}

export function WfEdgeComponent({
	id,
	source: _source,
	target,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	selected,
	animated,
	data,
}: EdgeProps) {
	const { token } = theme.useToken();
	const { getNode } = useReactFlow();
	const d = data as unknown as WfEdgeData | undefined;
	const condition = d?.condition;

	// No condition button when connecting to the End node
	const targetNode = getNode(target);
	const isToEnd = targetNode?.type === "end";

	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	const strokeColor = selected
		? token.colorPrimary
		: condition
			? "#f59e0b"
			: "#94a3b8";

	return (
		<>
			<BaseEdge
				id={id}
				path={edgePath}
				className={animated ? "animated" : undefined}
				style={{ stroke: strokeColor, strokeWidth: selected ? 2 : 1.5 }}
			/>

			{!isToEnd && (
				<EdgeLabelRenderer>
					<button
						type="button"
						className="nodrag nopan absolute"
						style={{
							transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
							pointerEvents: "all",
							cursor: "pointer",
							background: "none",
							border: "none",
							padding: 0,
						}}
						onClick={() => d?.onLabelClick?.(id)}
					>
						{condition?.label
							? (
								<span
									className="px-1.5 py-0.5 rounded-full text-[10px] font-medium leading-none whitespace-nowrap block"
									style={{
										backgroundColor: selected ? "#f59e0b" : "#fffbeb",
										color: selected ? "#fff" : "#92400e",
										border: "1px solid #fcd34d",
										boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
										maxWidth: 140,
										overflow: "hidden",
										textOverflow: "ellipsis",
									}}
								>
									{condition.label}
								</span>
							)
							: (
								<span
									className="flex items-center justify-center rounded-full text-[11px] font-semibold leading-none"
									style={{
										width: 18,
										height: 18,
										backgroundColor: token.colorBgContainer,
										color: "#94a3b8",
										border: "1px solid #cbd5e1",
										boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
										opacity: selected ? 1 : 0.85,
									}}
								>
									+
								</span>
							)}
					</button>
				</EdgeLabelRenderer>
			)}
		</>
	);
}
