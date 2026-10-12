import type { WorkflowNode } from "#src/api/approval-workflow/types";
import type { CSSProperties, ReactNode } from "react";
import type { NodeStatus } from "../display-context";
import { cn } from "#src/utils/cn";
import {
	CheckCircleFilled,
	ClockCircleFilled,
	CloseCircleFilled,
	ExclamationCircleFilled,
	MinusCircleOutlined,
	RollbackOutlined,
} from "@ant-design/icons";
import { Handle, Position } from "@xyflow/react";
import { theme, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { NODE_WIDTH, nodeHeight } from "../../lib/node-factory";
import { useFlowDisplay } from "../display-context";
import { nodeSummary, nodeTitle } from "../labels";
import "../flow.css";

interface NodeShellProps {
	id: string
	node: WorkflowNode
	icon: ReactNode
	/** Màu nhấn của loại bước (token antd) */
	color: string
	/** Dạng viên thuốc nhỏ gọn cho Bắt đầu / Kết thúc */
	compact?: boolean
	hasTarget?: boolean
	hasSource?: boolean
}

const tint = (color: string, percent: number) => `color-mix(in srgb, ${color} ${percent}%, transparent)`;

/** Khung chung của mọi node: icon + tên + tóm tắt, viền theo lỗi / trạng thái / đang chọn */
export function NodeShell({ id, node, icon, color, compact, hasTarget = true, hasSource = true }: NodeShellProps) {
	const display = useFlowDisplay();
	const { token } = theme.useToken();
	const { t } = useTranslation();

	const errors = display.nodeErrors[id] ?? [];
	const status: NodeStatus | undefined = display.nodeStatus?.[id];
	const selected = display.selectedId === id;
	const inPath = display.highlightNodes ? display.highlightNodes.has(id) : false;
	const dimmed = (display.highlightNodes && !inPath) || (display.dimUnvisited && (!status || status === "pending"));

	let borderColor = token.colorBorderSecondary;
	let borderStyle: CSSProperties["borderStyle"] = "solid";
	let background = token.colorBgContainer;
	let statusIcon: ReactNode = null;
	switch (status) {
		case "done":
			borderColor = token.colorSuccess;
			background = token.colorSuccessBg;
			statusIcon = <CheckCircleFilled style={{ color: token.colorSuccess }} />;
			break;
		case "current":
			borderColor = token.colorPrimary;
			background = token.colorPrimaryBg;
			statusIcon = <ClockCircleFilled style={{ color: token.colorPrimary }} />;
			break;
		case "rejected":
			borderColor = token.colorError;
			background = token.colorErrorBg;
			statusIcon = <CloseCircleFilled style={{ color: token.colorError }} />;
			break;
		case "returned":
			borderColor = token.colorWarning;
			background = token.colorWarningBg;
			statusIcon = <RollbackOutlined style={{ color: token.colorWarning }} />;
			break;
		case "skipped":
			borderStyle = "dashed";
			borderColor = token.colorTextQuaternary;
			background = token.colorFillQuaternary;
			statusIcon = <MinusCircleOutlined style={{ color: token.colorTextTertiary }} />;
			break;
		default:
			break;
	}
	if (inPath)
		borderColor = token.colorPrimary;
	if (errors.length)
		borderColor = token.colorError;
	if (selected && !errors.length)
		borderColor = token.colorPrimary;

	const handleStyle: CSSProperties = {
		width: 8,
		height: 8,
		background: token.colorBgContainer,
		border: `1.5px solid ${display.readOnly ? "transparent" : token.colorTextQuaternary}`,
		...(display.readOnly ? { opacity: 0, pointerEvents: "none" } : {}),
	};

	const summary = nodeSummary(node, t, {
		userNames: display.userNames,
		fields: display.fields,
		conditionInfo: display.conditionInfo[id],
	});

	const body = (
		<div
			className={cn("relative transition-[opacity,box-shadow]", compact ? "rounded-full" : "rounded-md", status === "current" && "awf-pulse")}
			style={{
				"width": NODE_WIDTH,
				"minHeight": nodeHeight(node.type),
				"borderWidth": selected || errors.length ? 2 : 1.5,
				borderStyle,
				borderColor,
				background,
				"opacity": dimmed ? 0.4 : 1,
				"boxShadow": selected ? `0 0 0 4px ${tint(errors.length ? token.colorError : token.colorPrimary, 18)}` : token.boxShadowTertiary,
				"--awf-pulse-color": tint(token.colorPrimary, 45),
			} as CSSProperties}
			title={status ? t(`workflowDesigner.graph.status.${status}`) : undefined}
		>
			{hasTarget && <Handle type="target" position={Position.Top} isConnectable={!display.readOnly} style={handleStyle} />}
			<div className={cn("flex items-center gap-2", compact ? "px-3 py-1.5" : "px-2.5 py-2")}>
				<span
					className="flex shrink-0 items-center justify-center rounded-md"
					style={{ width: compact ? 20 : 26, height: compact ? 20 : 26, fontSize: compact ? 12 : 14, color, background: tint(color, 14) }}
				>
					{icon}
				</span>
				<div className="min-w-0 flex-1 leading-tight">
					<div className="truncate text-xs font-semibold" style={{ color: token.colorText }}>
						{nodeTitle(node, t)}
					</div>
					{summary && (
						<div className="truncate text-[11px]" style={{ color: token.colorTextSecondary }} title={summary}>
							{summary}
						</div>
					)}
				</div>
				{statusIcon}
				{errors.length > 0 && <ExclamationCircleFilled style={{ color: token.colorError }} />}
			</div>
			{hasSource && <Handle type="source" position={Position.Bottom} isConnectable={!display.readOnly} style={handleStyle} />}
		</div>
	);

	if (!errors.length)
		return body;
	return (
		<Tooltip
			placement="right"
			title={(
				<ul className="m-0 list-disc pl-4">
					{errors.map(msg => <li key={msg}>{msg}</li>)}
				</ul>
			)}
		>
			{body}
		</Tooltip>
	);
}
