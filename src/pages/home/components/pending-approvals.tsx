import type { PendingApproval } from "../mock";

import { getAvatarColor } from "#src/utils/avatar";

import { ClockCircleOutlined } from "@ant-design/icons";
import { Avatar, Button, Tag, theme } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import { REQUEST_TYPE_COLOR, WAIT_DANGER_HOURS, WAIT_WARNING_HOURS } from "../constants";
import { DashboardCard } from "./dashboard-card";
import { RequestTypeIcon } from "./request-type-icon";

export type ApprovalResult = "approved" | "rejected";

interface PendingApprovalsProps {
	items: PendingApproval[]
	results: Record<string, ApprovalResult>
	onAction: (item: PendingApproval, result: ApprovalResult) => void
}

export function PendingApprovals({ items, results, onAction }: PendingApprovalsProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const openCount = items.filter(item => !results[item.id]).length;

	// Độ gấp theo thời gian chờ: quyết định màu thời gian, thanh màu đầu dòng và nền dòng
	const getUrgency = (createdAt: string) => {
		const hours = dayjs().diff(createdAt, "hour");
		if (hours >= WAIT_DANGER_HOURS)
			return { color: token.colorError, bar: token.colorError, bg: token.colorErrorBg };
		if (hours >= WAIT_WARNING_HOURS)
			return { color: token.colorWarning, bar: token.colorWarning, bg: token.colorWarningBg };
		return { color: token.colorTextSecondary, bar: undefined, bg: undefined };
	};

	return (
		<DashboardCard
			flush
			className="h-full"
			title={(
				<div className="flex items-center gap-2.5">
					{t("home.pending.title")}
					<span className="rounded-full px-2 text-xs font-medium leading-5" style={{ color: token.colorError, background: token.colorErrorBg }}>
						{openCount}
					</span>
				</div>
			)}
			extra={<span className="text-xs font-normal text-colorTextTertiary">{t("home.pending.sortHint")}</span>}
			footerLink={{ to: "/approval/review/pending", label: t("home.pending.viewAll") }}
		>
			{items.map((item) => {
				const result = results[item.id];
				const urgency = getUrgency(item.createdAt);
				const showUrgency = !result;
				return (
					<div
						key={item.id}
						className="relative flex flex-wrap items-center gap-3.5 border-0 border-b border-solid border-colorBorderSecondary px-5 py-3.5 transition-colors"
						style={{ background: showUrgency ? urgency.bg : undefined }}
					>
						{showUrgency && urgency.bar && (
							<span aria-hidden="true" className="absolute inset-y-2 left-0 w-[3px] rounded-r" style={{ background: urgency.bar }} />
						)}
						<RequestTypeIcon type={item.type} />
						<div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
							<div className="flex min-w-0 items-center gap-2">
								<Tag bordered={false} color={REQUEST_TYPE_COLOR[item.type]} className="m-0 shrink-0">
									{t(`home.requestType.${item.type}`)}
								</Tag>
								<span className="truncate text-sm text-colorText">{item.title}</span>
							</div>
							<span className="flex items-center gap-1.5 text-xs text-colorTextTertiary">
								<Avatar size={16} className="shrink-0 text-[9px] font-bold" style={{ backgroundColor: getAvatarColor(item.requesterId) }}>
									{item.requesterName.split(" ").pop()?.[0]}
								</Avatar>
								<span className="truncate">
									{item.requesterName}
									{" · "}
									{t("home.pending.step", { step: item.stepName })}
								</span>
							</span>
						</div>
						<span className="flex w-24 shrink-0 items-center gap-1 text-xs font-medium" style={{ color: urgency.color }}>
							<ClockCircleOutlined />
							{t("home.pending.waiting", { time: dayjs(item.createdAt).fromNow(true) })}
						</span>
						<div className="flex w-[150px] shrink-0 justify-end gap-1.5">
							{result
								? (
									<Tag bordered={false} color={result === "approved" ? "success" : "error"} className="m-0 px-2.5 py-1">
										{t(result === "approved" ? "home.pending.approved" : "home.pending.rejected")}
									</Tag>
								)
								: (
									<>
										<Button danger onClick={() => onAction(item, "rejected")}>{t("home.pending.reject")}</Button>
										<Button type="primary" onClick={() => onAction(item, "approved")}>{t("home.pending.approve")}</Button>
									</>
								)}
						</div>
					</div>
				);
			})}
		</DashboardCard>
	);
}
