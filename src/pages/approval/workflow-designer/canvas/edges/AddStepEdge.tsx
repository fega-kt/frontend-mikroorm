import type { EdgeProps } from "@xyflow/react";
import type { MenuProps } from "antd";
import type { ReactNode } from "react";
import type { FlowEdge } from "../../lib/to-definition";
import { NodeType } from "#src/api/approval-workflow/types";
import { AuditOutlined, BellOutlined, BranchesOutlined, PlusOutlined, TeamOutlined } from "@ant-design/icons";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from "@xyflow/react";
import { Dropdown, theme, Tooltip } from "antd";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { INSERTABLE_TYPES } from "../../lib/node-factory";
import { useFlowDisplay } from "../display-context";
import { edgeLabelText } from "../labels";

const INSERT_ICONS: Record<string, ReactNode> = {
	[NodeType.Approval]: <AuditOutlined />,
	[NodeType.Condition]: <BranchesOutlined />,
	[NodeType.Parallel]: <TeamOutlined />,
	[NodeType.Notify]: <BellOutlined />,
};

/** Cạnh bậc thang có nhãn nhánh và nút "+" ở giữa để chèn bước */
function AddStepEdgeImpl(props: EdgeProps<FlowEdge>) {
	const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd } = props;
	const display = useFlowDisplay();
	const { token } = theme.useToken();
	const { t } = useTranslation();

	const [path, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 10 });

	const errors = display.edgeErrors[id] ?? [];
	const selected = display.selectedId === id;
	const inPath = display.highlightEdges ? display.highlightEdges.has(id) : false;
	const dimmed = !!display.highlightEdges && !inPath && !display.dimUnvisited;
	const unvisited = !!display.dimUnvisited && !inPath;

	let stroke = token.colorTextQuaternary;
	if (inPath)
		stroke = display.dimUnvisited ? token.colorSuccess : token.colorPrimary;
	if (errors.length)
		stroke = token.colorError;
	if (selected)
		stroke = errors.length ? token.colorError : token.colorPrimary;

	const label = edgeLabelText(data, t, display.fields);
	const canInsert = !display.readOnly && !!display.onInsert;

	const items: MenuProps["items"] = INSERTABLE_TYPES.map(type => ({
		key: type,
		icon: INSERT_ICONS[type],
		label: t(`workflowDesigner.nodeTypes.${type}`),
	}));

	return (
		<>
			<BaseEdge
				id={id}
				path={path}
				markerEnd={markerEnd}
				interactionWidth={18}
				style={{
					stroke,
					strokeWidth: selected || inPath ? 2.2 : 1.5,
					strokeDasharray: unvisited ? "5 4" : undefined,
					opacity: dimmed || unvisited ? 0.35 : 1,
				}}
			/>
			{(label || canInsert) && (
				<EdgeLabelRenderer>
					<div
						className="nodrag nopan absolute flex flex-col items-center gap-1"
						style={{
							transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
							pointerEvents: "all",
							opacity: dimmed || unvisited ? 0.45 : 1,
						}}
					>
						{label && (
							<Tooltip title={errors.length ? errors.join("\n") : undefined}>
								<span
									className="max-w-[180px] cursor-pointer truncate rounded px-1.5 py-0.5 text-[11px] font-medium"
									style={{
										background: token.colorBgContainer,
										color: errors.length ? token.colorError : (data?.default ? token.colorTextSecondary : token.colorText),
										border: `1px solid ${errors.length ? token.colorError : selected ? token.colorPrimary : token.colorBorderSecondary}`,
									}}
									onClick={(e) => {
										e.stopPropagation();
										display.onSelect?.(id);
									}}
								>
									{label}
								</span>
							</Tooltip>
						)}
						{canInsert && (
							<Dropdown
								trigger={["click"]}
								menu={{ items, onClick: ({ key }) => display.onInsert?.(id, key as (typeof INSERTABLE_TYPES)[number]) }}
							>
								<Tooltip title={t("workflowDesigner.actions.insertStep")}>
									<button
										type="button"
										className="flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full p-0 text-[11px] transition-transform hover:scale-110"
										style={{
											background: token.colorBgContainer,
											color: token.colorPrimary,
											border: `1px solid ${token.colorPrimaryBorder}`,
											boxShadow: token.boxShadowTertiary,
										}}
										onClick={e => e.stopPropagation()}
									>
										<PlusOutlined />
									</button>
								</Tooltip>
							</Dropdown>
						)}
					</div>
				</EdgeLabelRenderer>
			)}
		</>
	);
}

export const AddStepEdge = memo(AddStepEdgeImpl);
