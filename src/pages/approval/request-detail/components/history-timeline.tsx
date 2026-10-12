import type { ApprovalHistoryItem } from "#src/api/approval-request";
import { ApprovalHistoryAction } from "#src/api/approval-request/types";
import {
	BellOutlined,
	CheckCircleOutlined,
	ClockCircleOutlined,
	CloseCircleOutlined,
	FlagOutlined,
	RiseOutlined,
	RollbackOutlined,
	SendOutlined,
	StepForwardOutlined,
	StopOutlined,
	SwapOutlined,
} from "@ant-design/icons";
import { theme, Timeline, Typography } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { DATE_TIME_FORMAT } from "../../lib/payload";

const { Text } = Typography;

type Tone = "primary" | "success" | "error" | "warning" | "default" | "info";

const ACTION_STYLE: Record<ApprovalHistoryAction, { icon: React.ReactNode, tone: Tone }> = {
	[ApprovalHistoryAction.Submit]: { icon: <SendOutlined />, tone: "primary" },
	[ApprovalHistoryAction.Resubmit]: { icon: <SendOutlined />, tone: "primary" },
	[ApprovalHistoryAction.Approve]: { icon: <CheckCircleOutlined />, tone: "success" },
	[ApprovalHistoryAction.AutoApprove]: { icon: <CheckCircleOutlined />, tone: "success" },
	[ApprovalHistoryAction.Reject]: { icon: <CloseCircleOutlined />, tone: "error" },
	[ApprovalHistoryAction.Return]: { icon: <RollbackOutlined />, tone: "warning" },
	[ApprovalHistoryAction.Cancel]: { icon: <StopOutlined />, tone: "default" },
	[ApprovalHistoryAction.Skip]: { icon: <StepForwardOutlined />, tone: "default" },
	[ApprovalHistoryAction.Delegate]: { icon: <SwapOutlined />, tone: "info" },
	[ApprovalHistoryAction.Escalate]: { icon: <RiseOutlined />, tone: "warning" },
	[ApprovalHistoryAction.Remind]: { icon: <ClockCircleOutlined />, tone: "warning" },
	[ApprovalHistoryAction.Notify]: { icon: <BellOutlined />, tone: "info" },
	[ApprovalHistoryAction.Complete]: { icon: <FlagOutlined />, tone: "success" },
};

/** Lịch sử xử lý đơn (mới nhất ở trên) */
export function HistoryTimeline({ histories, userNames }: { histories: ApprovalHistoryItem[], userNames: Record<string, string> }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const toneColor: Record<Tone, string> = {
		primary: token.colorPrimary,
		success: token.colorSuccess,
		error: token.colorError,
		warning: token.colorWarning,
		info: token.colorInfo,
		default: token.colorTextTertiary,
	};

	const items = [...histories].reverse().map((item) => {
		const style = ACTION_STYLE[item.action] ?? { icon: <ClockCircleOutlined />, tone: "default" as Tone };
		const data = item.data ?? {};
		const from = typeof data.from === "string" ? userNames[data.from] : undefined;
		const to = typeof data.to === "string" ? userNames[data.to] : undefined;
		return {
			key: item.id,
			color: toneColor[style.tone],
			dot: <span style={{ color: toneColor[style.tone] }}>{style.icon}</span>,
			children: (
				<div className="flex flex-col gap-0.5 pb-1">
					<Text strong>
						{t(`approval.history.${item.action}`)}
						{item.action === ApprovalHistoryAction.Skip && typeof data.reason === "string" && ` (${t(`approval.skipReason.${data.reason}`)})`}
					</Text>
					<Text type="secondary" className="text-xs">
						{[item.actor?.fullName ?? t("approval.detail.system"), item.nodeName, dayjs(item.createdAt).format(DATE_TIME_FORMAT)].filter(Boolean).join(" · ")}
					</Text>
					{(from || to) && <Text className="text-xs">{[from, to].filter(Boolean).join(" → ")}</Text>}
					{item.comment && (
						<div className="mt-1 px-2 py-1 rounded text-[13px] whitespace-pre-wrap" style={{ background: token.colorFillTertiary }}>
							{item.comment}
						</div>
					)}
				</div>
			),
		};
	});

	if (!items.length)
		return <Text type="secondary">{t("approval.detail.notSubmitted")}</Text>;
	return <Timeline items={items} />;
}
