import type { ApprovalTaskItem } from "#src/api/approval-request";
import type { WorkflowDefinition, WorkflowNode } from "#src/api/approval-workflow/types";
import type { FormField } from "#src/api/setting/request-type/types";
import type { ReactNode } from "react";
import type { NodeProgress } from "../../lib/progress";
import { NodeType } from "#src/api/approval-workflow/types";
import { UserAvatar } from "#src/components/user-avatar";
import {
	CheckOutlined,
	ClockCircleFilled,
	CloseOutlined,
	MinusOutlined,
	RollbackOutlined,
	StopOutlined,
} from "@ant-design/icons";
import { Tag, theme, Typography } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { DATE_TIME_FORMAT } from "../../lib/payload";
import { nodeSummary, nodeTitle } from "../../workflow-designer/canvas/labels";

const { Text } = Typography;

interface ReviewProgressProps {
	definition: WorkflowDefinition
	nodeStatus: Record<string, NodeProgress>
	userNames: Record<string, string>
	fields: FormField[]
	/** Task đang chờ xử lý của lượt hiện tại — để hiện "đang chờ ai" */
	pendingTasks: ApprovalTaskItem[]
}

/** Các bước theo thứ tự đi từ node Bắt đầu; bỏ node điều kiện / song song vì chỉ là điểm rẽ nhánh */
function orderNodes(definition: WorkflowDefinition): WorkflowNode[] {
	const byId = new Map(definition.nodes.map(node => [node.id, node]));
	const start = definition.nodes.find(node => node.type === NodeType.Start);
	if (!start)
		return definition.nodes;

	const seen = new Set<string>([start.id]);
	const queue = [start.id];
	const ordered: WorkflowNode[] = [];
	while (queue.length) {
		const node = byId.get(queue.shift()!);
		if (!node)
			continue;
		ordered.push(node);
		for (const edge of definition.edges) {
			if (edge.from === node.id && !seen.has(edge.to)) {
				seen.add(edge.to);
				queue.push(edge.to);
			}
		}
	}
	return ordered.filter(node => node.type !== NodeType.Condition && node.type !== NodeType.Parallel);
}

/** Tiến trình duyệt thu gọn: các bước nằm ngang + dòng "đang chờ ai", đọc lướt không cần mở sơ đồ */
export function ReviewProgress({ definition, nodeStatus, userNames, fields, pendingTasks }: ReviewProgressProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	const visual: Record<NodeProgress, { color: string, icon: ReactNode }> = {
		done: { color: token.colorSuccess, icon: <CheckOutlined /> },
		current: { color: token.colorPrimary, icon: <ClockCircleFilled /> },
		rejected: { color: token.colorError, icon: <CloseOutlined /> },
		returned: { color: token.colorWarning, icon: <RollbackOutlined /> },
		skipped: { color: token.colorTextTertiary, icon: <MinusOutlined /> },
		cancelled: { color: token.magenta6, icon: <StopOutlined /> },
		pending: { color: token.colorTextQuaternary, icon: null },
	};

	const nodes = orderNodes(definition);
	const first = pendingTasks[0];
	const extra = pendingTasks.length - 1;

	return (
		<div className="flex flex-col gap-5">
			<ol className="m-0 flex list-none gap-0 overflow-x-auto p-0 pb-1">
				{nodes.map((node, index) => {
					const status = nodeStatus[node.id] ?? "pending";
					const { color, icon } = visual[status];
					const summary = nodeSummary(node, t, { userNames, fields });
					const last = index === nodes.length - 1;
					return (
						<li key={node.id} className={last ? "flex min-w-[120px] shrink-0 flex-col gap-2.5" : "flex min-w-[150px] flex-1 flex-col gap-2.5"}>
							<div className="flex items-center">
								<span
									className="flex size-[30px] shrink-0 items-center justify-center rounded-full text-sm"
									style={status === "pending"
										? { border: `2px solid ${token.colorBorder}`, background: token.colorBgContainer }
										: {
											background: color,
											color: token.colorWhite,
											boxShadow: status === "current" ? `0 0 0 5px color-mix(in srgb, ${color} 18%, transparent)` : undefined,
										}}
								>
									{icon}
								</span>
								{!last && (
									<span className="mx-2 h-0.5 flex-1 rounded" style={{ background: status === "done" ? token.colorSuccess : token.colorBorderSecondary }} />
								)}
							</div>
							<div className="min-w-0 pr-2">
								<div className="truncate font-semibold" style={{ color: status === "current" ? token.colorPrimary : status === "pending" ? token.colorTextSecondary : undefined }} title={nodeTitle(node, t)}>
									{nodeTitle(node, t)}
								</div>
								<div className="mt-0.5 truncate text-xs text-colorTextSecondary" title={summary || undefined}>
									{summary || (status === "pending" ? t("workflowDesigner.graph.status.pending") : t(`workflowDesigner.graph.status.${status}`))}
								</div>
							</div>
						</li>
					);
				})}
			</ol>

			{first && (
				<div
					className="flex flex-wrap items-center gap-3 rounded-lg px-3.5 py-2.5"
					style={{ background: token.colorPrimaryBg, border: `1px solid ${token.colorPrimaryBorder}` }}
				>
					<UserAvatar size={28} user={first.approver} />
					<div className="min-w-[240px] flex-1">
						<Text>
							{t("approval.detail.waitingFor", { name: first.approver?.fullName ?? "—" })}
							{extra > 0 && <Text type="secondary">{` +${extra}`}</Text>}
						</Text>
						<Text type="secondary" className="ml-1.5">
							{[
								first.nodeName ?? first.nodeId,
								first.originalApprover && t(first.escalatedAt ? "approval.detail.escalatedFrom" : "approval.detail.delegatedFrom", { name: first.originalApprover.fullName }),
							].filter(Boolean).join(" · ")}
						</Text>
					</div>
					{first.dueAt && (
						<Tag color="blue" bordered className="m-0">{`${t("approval.fields.dueAt")} ${dayjs(first.dueAt).format(DATE_TIME_FORMAT)}`}</Tag>
					)}
				</div>
			)}
		</div>
	);
}
