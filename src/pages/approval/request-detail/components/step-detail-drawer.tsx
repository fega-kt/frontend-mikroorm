import type { WorkflowDefinition } from "#src/api/approval-workflow/types";
import type { ApprovalRound } from "../../lib/rounds";
import { ApprovalHistoryAction } from "#src/api/approval-request/types";
import { useWorkflowApproverProfiles, useWorkflowUserNames } from "#src/components/approval-flow-graph/user-names";
import { Drawer, Tag, Timeline, Typography } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { historyActor, historyLabel } from "../../lib/history";
import { DATE_TIME_FORMAT } from "../../lib/payload";
import { groupSteps } from "../../lib/rounds";
import { nodeTitle } from "../../workflow-designer/canvas/labels";
import { useProgressVisual } from "./progress-visual";
import { StepEntries } from "./round-timeline";
import { StepConfig } from "./step-config";

const { Text } = Typography;

/** Diễn biến phụ của bước không nằm trong task (chuyển người, chuyển cấp, nhắc duyệt) */
const SIDE_EVENTS = [ApprovalHistoryAction.Delegate, ApprovalHistoryAction.Escalate, ApprovalHistoryAction.Remind];

interface StepDetailDrawerProps {
	/** Bước đang xem; null = đóng */
	nodeId: string | null
	round: ApprovalRound
	definition: WorkflowDefinition
	userNames: Record<string, string>
	onClose: () => void
}

/** Chi tiết một bước trong vòng: ai duyệt, kết quả, ghi chú / lý do trả lại, từ chối */
export function StepDetailDrawer({ nodeId, round, definition, userNames, onClose }: StepDetailDrawerProps) {
	const { t } = useTranslation();
	const visual = useProgressVisual();
	const names = useWorkflowUserNames(definition, userNames);
	const profiles = useWorkflowApproverProfiles(definition);
	const node = definition.nodes.find(item => item.id === nodeId);
	const group = node && groupSteps(round).find(item => item.nodeId === node.id);
	const status = node ? (round.nodeStatus[node.id] ?? "pending") : "pending";
	const sideEvents = node ? round.histories.filter(item => item.nodeId === node.id && SIDE_EVENTS.includes(item.action)) : [];
	const userName = (value: unknown) => (typeof value === "string" ? names[value] : undefined);

	return (
		<Drawer
			open={!!node}
			onClose={onClose}
			width={460}
			destroyOnHidden
			title={node && (
				<div className="flex items-center gap-2">
					<span className="truncate">{nodeTitle(node, t)}</span>
					<Tag color={visual[status].color} bordered={false} className="m-0">{t(`workflowDesigner.graph.status.${status}`)}</Tag>
				</div>
			)}
		>
			{node && (
				<div className="flex flex-col gap-5">
					<div className="flex flex-col gap-2">
						<Text strong>{t("approval.detail.stepProcessing", { n: round.round })}</Text>
						<StepEntries group={group} node={node} names={names} profiles={profiles} />
					</div>
					{sideEvents.length > 0 && (
						<div className="flex flex-col gap-2">
							<Text strong>{t("approval.detail.stepEvents")}</Text>
							<Timeline
								items={sideEvents.map(item => ({
									key: item.id,
									children: (
										<div className="flex flex-col gap-0.5">
											<Text className="text-[13px]">{historyLabel(item, t)}</Text>
											<Text type="secondary" className="text-xs">
												{[historyActor(item)?.fullName ?? t("approval.detail.system"), dayjs(item.createdAt).format(DATE_TIME_FORMAT)].join(" · ")}
											</Text>
											{(userName(item.data?.from) || userName(item.data?.to)) && (
												<Text className="text-xs">{[userName(item.data?.from), userName(item.data?.to)].filter(Boolean).join(" → ")}</Text>
											)}
											{item.comment && <Text className="whitespace-pre-wrap text-[13px]">{item.comment}</Text>}
										</div>
									),
								}))}
							/>
						</div>
					)}
					<div className="flex flex-col gap-2">
						<Text strong>{t("approval.detail.stepConfig")}</Text>
						<StepConfig node={node} names={names} tasks={group?.tasks} />
					</div>
				</div>
			)}
		</Drawer>
	);
}
