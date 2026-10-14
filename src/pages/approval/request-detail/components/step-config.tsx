import type { ApprovalTaskItem } from "#src/api/approval-request";
import type { StepEvent, WorkflowNode } from "#src/api/approval-workflow/types";
import type { ReactNode } from "react";
import { ApprovalTaskStatus } from "#src/api/approval-request/types";
import { DEFAULT_STEP_NOTIFY_RULE, DEFAULT_STEP_OPTIONS, NodeType, notifiesRequester } from "#src/api/approval-workflow/types";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { Descriptions, theme, Typography } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { DATE_TIME_FORMAT } from "../../lib/payload";
import { approverLabel } from "../../workflow-designer/canvas/labels";

const { Text } = Typography;

const EVENTS: StepEvent[] = ["approved", "rejected", "returned"];
const OPTION_KEYS = ["allowReturn", "requireRejectReason", "allowDelegation", "skipIfRequester", "skipIfNoApprover", "emailGroup"] as const;

/** Cấu hình của bước theo phiên bản quy trình tờ trình đang chạy (chỉ đọc) — nhãn dùng chung với màn thiết kế quy trình */
export function StepConfig({ node, names, tasks = [] }: { node: WorkflowNode, names: Record<string, string>, /** Task của bước trong vòng đang xem — để hiện hạn xử lý cụ thể */ tasks?: ApprovalTaskItem[] }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const who = (list: Parameters<typeof approverLabel>[0][]) => list.map(item => approverLabel(item, t, names)).join(", ");
	const channels = (list: string[]) => list.map(c => t(`workflowDesigner.channels.${c}`)).join(", ");
	const items: { key: string, label: string, children: ReactNode }[] = [];

	if (node.type === NodeType.Approval || node.type === NodeType.Parallel) {
		const options = { ...DEFAULT_STEP_OPTIONS, ...node.options };
		if (node.type === NodeType.Approval) {
			items.push({ key: "approver", label: t("workflowDesigner.inspector.approver"), children: who([node.approver]) });
		}
		else {
			items.push(
				{ key: "approvers", label: t("workflowDesigner.inspector.approvers"), children: who(node.approvers) || t("workflowDesigner.summary.noApprover") },
				{ key: "mode", label: t("workflowDesigner.inspector.mode"), children: `${t(`workflowDesigner.parallelMode.${node.mode}`)} — ${t(`workflowDesigner.parallelModeDesc.${node.mode}`)}` },
			);
		}
		// Bước đã tới (có task) thì kèm hạn cụ thể; song song lấy hạn muộn nhất. Còn chờ mà quá hạn thì tô đỏ
		const dueAt = tasks.map(task => task.dueAt).filter((value): value is string => !!value).sort().at(-1);
		const overdue = !!dueAt && tasks.some(task => task.status === ApprovalTaskStatus.Pending) && dayjs(dueAt).isBefore(dayjs());
		items.push({
			key: "sla",
			label: t("workflowDesigner.inspector.sla"),
			children: node.slaHours
				? (
					<span>
						{`${node.slaHours} ${t("workflowDesigner.inspector.hours")}`}
						{dueAt && (
							<Text type={overdue ? "danger" : "secondary"}>
								{` · ${t("approval.detail.dueUntil", { time: dayjs(dueAt).format(DATE_TIME_FORMAT) })}`}
								{overdue && ` (${t("approval.detail.overdue")})`}
							</Text>
						)}
					</span>
				)
				: t("approval.detail.noSla"),
		});
		if (node.slaHours)
			items.push({ key: "overdue", label: t("workflowDesigner.inspector.onOverdue"), children: t(`workflowDesigner.overdue.${node.onOverdue}`) });
		items.push({ key: "groupMode", label: t("workflowDesigner.inspector.groupMode"), children: t(`workflowDesigner.groupMode.${options.groupMode}`) });
		items.push({
			key: "options",
			label: t("workflowDesigner.inspector.options"),
			children: (
				<ul className="m-0 flex list-none flex-col gap-1 p-0">
					{OPTION_KEYS.map(key => (
						<li key={key} className="flex items-start gap-2">
							{options[key]
								? <CheckOutlined className="mt-1 text-xs" style={{ color: token.colorSuccess }} />
								: <CloseOutlined className="mt-1 text-xs" style={{ color: token.colorTextQuaternary }} />}
							<Text type={options[key] ? undefined : "secondary"}>{t(`workflowDesigner.inspector.opt.${key}`)}</Text>
						</li>
					))}
				</ul>
			),
		});
		items.push({
			key: "notify",
			label: t("approval.detail.stepNotify"),
			children: (
				<ul className="m-0 flex list-none flex-col gap-1 p-0">
					{EVENTS.map((event) => {
						const rule = node.notifications?.[event];
						// Đồng bộ màn thiết kế: từ chối / trả lại chưa cấu hình vẫn gửi người trình; duyệt xong chưa cấu hình thì không gửi
						const enabled = rule ? rule.enabled : event !== "approved";
						const current = rule ?? DEFAULT_STEP_NOTIFY_RULE;
						const notifyOther = event === "approved" ? current.notifyNextApprovers : current.notifyPreviousApprovers;
						const targets = [
							current.notifyRequester && t("workflowDesigner.inspector.notifyRequester"),
							notifyOther && t(event === "approved" ? "workflowDesigner.inspector.notifyNextApprovers" : "workflowDesigner.stepNotify.previousApprovers"),
							current.recipients.length > 0 && who(current.recipients),
						].filter(Boolean);
						// Chưa cấu hình thì hiện luôn người nhận / kênh thực tế của cấu hình mặc định, không ghi chữ "mặc định"
						const summary = !enabled
							? t("workflowDesigner.stepNotify.off")
							: `${targets.length ? targets.join(", ") : t("workflowDesigner.stepNotify.noRecipient")} · ${channels(current.channels)}`;
						return (
							<li key={event}>
								<Text>{t(`workflowDesigner.stepNotify.events.${event}`)}</Text>
								<Text type="secondary">{`: ${summary}`}</Text>
							</li>
						);
					})}
				</ul>
			),
		});
	}
	else if (node.type === NodeType.Notify) {
		const recipients = [
			notifiesRequester(node) && t("workflowDesigner.summary.requester"),
			node.notifyNextApprovers && t("workflowDesigner.summary.nextApprovers"),
			node.recipients.length > 0 && who(node.recipients),
		].filter(Boolean);
		items.push(
			{ key: "channels", label: t("workflowDesigner.inspector.channels"), children: channels(node.channels) || t("workflowDesigner.summary.noChannel") },
			{ key: "recipients", label: t("workflowDesigner.inspector.recipients"), children: recipients.join(", ") || t("workflowDesigner.summary.noRecipient") },
		);
		if (node.message)
			items.push({ key: "message", label: t("workflowDesigner.inspector.message"), children: <span className="whitespace-pre-wrap">{node.message}</span> });
	}

	if (!items.length)
		return null;
	return <Descriptions size="small" column={1} bordered items={items} labelStyle={{ width: 120, verticalAlign: "top" }} />;
}
