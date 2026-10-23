import type { ApprovalHistoryItem, ApprovalRequestDetail, ApprovalTaskItem } from "#src/api/approval-request";
import type { TimelineNodeStyle } from "./timeline-row";
import { ApprovalHistoryAction, ApprovalRequestStatus, ApprovalTaskStatus } from "#src/api/approval-request/types";
import { PeoplePicker } from "#src/components/people-picker";
import {
	ClockCircleOutlined,
	CloseOutlined,
	EditOutlined,
	FlagOutlined,
	RollbackOutlined,
	StopOutlined,
	WarningOutlined,
} from "@ant-design/icons";
import { Progress, theme, Typography } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { TimelineRow } from "./timeline-row";

const { Text } = Typography;

const SHORT_TIME = "HH:mm, DD/MM/YYYY";

/** Khoảng thời gian gọn: "2 ngày", "5 giờ", "30 phút" */
function formatSpan(ms: number, t: (key: string, options?: Record<string, unknown>) => string) {
	const minutes = Math.max(1, Math.round(Math.abs(ms) / 60_000));
	if (minutes >= 24 * 60)
		return t("approval.history.status.days", { count: Math.floor(minutes / (24 * 60)) });
	if (minutes >= 60)
		return t("approval.history.status.hours", { count: Math.floor(minutes / 60) });
	return t("approval.history.status.minutes", { count: minutes });
}

/** Dòng lịch sử gần nhất thuộc một trong các hành động */
const lastOf = (histories: ApprovalHistoryItem[], actions: ApprovalHistoryAction[]) => [...histories].reverse().find(item => actions.includes(item.action));

function Pill({ color, background, children }: { color: string, background: string, children: React.ReactNode }) {
	return <span className="whitespace-nowrap rounded-full px-2 text-xs leading-5" style={{ color, background }}>{children}</span>;
}

function Chip({ color, background, children }: { color: string, background: string, children: React.ReactNode }) {
	return <span className="whitespace-nowrap rounded px-2 text-xs leading-5" style={{ color, background }}>{children}</span>;
}

/** Người thực hiện: avatar + tên (không có = hệ thống) */
function Person({ user, name }: { user?: ApprovalTaskItem["actedBy"], name?: string }) {
	if (user)
		return <PeoplePicker readonly user={user} size="small" avatarSize={22} showEmail={false} subtle className="!min-h-0" />;
	return <Text className="text-[13px]">{name}</Text>;
}

function Comment({ text, background }: { text?: string, background: string }) {
	if (!text)
		return null;
	return <blockquote className="m-0 whitespace-pre-wrap rounded-lg rounded-tl-none px-3.5 py-2 text-[13px] leading-5" style={{ background }}>{text}</blockquote>;
}

/** Trạng thái một người duyệt của bước đang chờ */
function TaskPill({ task, myTaskId, signed }: { task: ApprovalTaskItem, myTaskId: string | null, signed: boolean }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	switch (task.status) {
		case ApprovalTaskStatus.Approved:
			return <Pill color={token.colorSuccessText} background={token.colorSuccessBg}>{signed ? t("approval.history.status.signedApproved") : t("approval.taskStatus.approved")}</Pill>;
		case ApprovalTaskStatus.Rejected:
			return <Pill color={token.colorErrorText} background={token.colorErrorBg}>{t("approval.taskStatus.rejected")}</Pill>;
		case ApprovalTaskStatus.Returned:
			return <Pill color={token.colorWarningText} background={token.colorWarningBg}>{t("approval.taskStatus.returned")}</Pill>;
		case ApprovalTaskStatus.Skipped:
			return <Pill color={token.colorTextSecondary} background={token.colorFillSecondary}><span className="line-through">{t("approval.taskStatus.skipped")}</span></Pill>;
		default:
			return task.id === myTaskId
				? <Pill color={token.colorPrimaryText} background={token.colorPrimaryBg}>{t("approval.history.status.yourTurn")}</Pill>
				: <Pill color={token.colorTextSecondary} background={token.colorFillSecondary}>{t("approval.taskStatus.pending")}</Pill>;
	}
}

/**
 * Thẻ ghim đầu dòng thời gian: tờ trình đang ở đâu (đang chờ ai, hạn, quá hạn, trả lại) hoặc đã kết thúc ra sao.
 * `last`: thẻ nằm cuối (sắp xếp cũ nhất trước) nên không vẽ đường nối xuống.
 */
export function HistoryStatusCard({ detail, last }: { detail: ApprovalRequestDetail, last?: boolean }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { status, permissions, histories } = detail;
	const now = Date.now();
	const nowLabel = t("approval.history.status.now");
	const closedTime = detail.closedAt ? dayjs(detail.closedAt).format("HH:mm") : "";
	const span = detail.submittedAt && detail.closedAt
		? t("approval.history.status.span", { from: dayjs(detail.submittedAt).format(SHORT_TIME), to: dayjs(detail.closedAt).format(SHORT_TIME) })
		: undefined;

	const card = (tone: { border: string, background: string, dashed?: boolean }, children: React.ReactNode) => (
		<div className="flex flex-col gap-2.5 rounded-[10px] px-4 py-3.5" style={{ border: `1px ${tone.dashed ? "dashed" : "solid"} ${tone.border}`, background: tone.background }}>
			{children}
		</div>
	);
	const header = (title: React.ReactNode, titleColor: string | undefined, chips?: React.ReactNode, aside?: React.ReactNode) => (
		<div className="flex flex-wrap items-center gap-2">
			<span className="text-sm font-semibold" style={{ color: titleColor }}>{title}</span>
			{chips}
			{aside && <span className="ml-auto text-xs" style={{ color: token.colorTextSecondary }}>{aside}</span>}
		</div>
	);
	const row = (time: React.ReactNode, timeColor: string | undefined, node: TimelineNodeStyle, children: React.ReactNode) => (
		<TimelineRow time={time} timeColor={timeColor} node={node} last={last} dashedLine={node.dashed}>{children}</TimelineRow>
	);

	if (status === ApprovalRequestStatus.Draft) {
		return row(nowLabel, token.colorTextSecondary, { icon: <EditOutlined />, color: token.colorTextTertiary, background: token.colorFillSecondary, dashed: true }, card(
			{ border: token.colorBorder, background: token.colorFillAlter, dashed: true },
			<>
				{header(t("approval.history.status.draft"), undefined)}
				<Text type="secondary" className="text-[13px]">{t("approval.history.status.draftHint")}</Text>
			</>,
		));
	}

	if (status === ApprovalRequestStatus.Pending) {
		const tasks = detail.tasks.filter(task => task.round === detail.round && detail.currentNodeIds.includes(task.nodeId));
		const waiting = tasks.filter(task => task.status === ApprovalTaskStatus.Pending);
		const steps = [...new Set(tasks.map(task => task.nodeName).filter(Boolean))];
		const due = waiting.map(task => task.dueAt).filter(Boolean).sort()[0];
		const overdue = due ? dayjs(due).valueOf() < now : false;
		const approved = tasks.filter(task => task.status === ApprovalTaskStatus.Approved).length;
		const counted = tasks.filter(task => task.status !== ApprovalTaskStatus.Skipped).length;
		const signing = !!permissions.requireSignature;
		const accent = overdue ? token.colorError : token.colorPrimary;
		return row(
			nowLabel,
			overdue ? token.colorErrorText : token.colorPrimaryText,
			{ icon: overdue ? <WarningOutlined /> : <ClockCircleOutlined />, color: accent, background: token.colorPrimaryBg, dashed: true },
			card(
				{ border: overdue ? token.colorErrorBorder : token.colorPrimaryBorder, background: overdue ? token.colorErrorBg : token.colorPrimaryBg },
				<>
					{header(
						signing ? t("approval.history.status.pendingSign") : t("approval.history.status.pending"),
						undefined,
						<>
							{steps.map(step => <Chip key={step} color={token.colorPrimaryText} background={token.colorBgContainer}>{step}</Chip>)}
							{permissions.isParallel && <Chip color={token.colorPrimaryText} background={token.colorBgContainer}>{t("approval.history.status.parallel")}</Chip>}
							{signing && <Chip color={token.colorWarningText} background={token.colorWarningBg}>{t("approval.history.status.requireSign")}</Chip>}
							{overdue && <Chip color={token.colorErrorText} background={token.colorBgContainer}>{t("approval.history.status.overdue", { span: formatSpan(now - dayjs(due).valueOf(), t) })}</Chip>}
						</>,
						due && (overdue
							? t("approval.history.status.dueAt", { time: dayjs(due).format(SHORT_TIME) })
							: t("approval.history.status.dueIn", { time: dayjs(due).format(SHORT_TIME), span: formatSpan(dayjs(due).valueOf() - now, t) })),
					)}
					{permissions.isParallel && counted > 1 && (
						<div className="flex items-center gap-2.5">
							<Progress className="!m-0 flex-1" percent={Math.round((approved / counted) * 100)} showInfo={false} size="small" strokeColor={token.colorSuccess} />
							<span className="text-xs font-semibold">{t("approval.history.status.progress", { done: approved, total: counted })}</span>
						</div>
					)}
					{tasks.length > 0 && (
						<div className="flex flex-col">
							{tasks.map((task, index) => (
								<div key={task.id} className="flex flex-wrap items-center gap-2 py-1.5 text-[13px]" style={{ borderTop: index ? `1px solid ${token.colorPrimaryBorder}` : undefined }}>
									<Person user={task.approver.user ?? undefined} name={task.approver.name} />
									{task.delegates.length > 0 && <Text type="secondary" className="text-xs">{t("approval.history.status.delegates", { names: task.delegates.map(user => user.fullName).join(", ") })}</Text>}
									<span className="ml-auto flex items-center gap-2">
										{task.actedAt && <Text type="secondary" className="text-xs">{dayjs(task.actedAt).format("HH:mm, DD/MM")}</Text>}
										{task.status === ApprovalTaskStatus.Pending && task.remindedAt && <Text type="secondary" className="text-xs">{t("approval.history.status.reminded")}</Text>}
										<TaskPill task={task} myTaskId={permissions.myTaskId} signed={signing} />
									</span>
								</div>
							))}
						</div>
					)}
				</>,
			),
		);
	}

	if (status === ApprovalRequestStatus.Returned) {
		const returned = lastOf(histories, [ApprovalHistoryAction.Return]);
		return row(nowLabel, token.colorWarningText, { icon: <RollbackOutlined />, color: token.colorWarning, background: token.colorWarningBg, dashed: true }, card(
			{ border: token.colorWarningBorder, background: token.colorWarningBg },
			<>
				{header(
					t("approval.history.status.returned"),
					token.colorWarningText,
					<Chip color={token.colorTextSecondary} background={token.colorBgContainer}>{t("approval.history.status.nextRound", { round: detail.round + 1 })}</Chip>,
				)}
				<div className="flex flex-wrap items-center gap-2 text-[13px]">
					<Person user={detail.requester} />
					<Pill color={token.colorWarningText} background={token.colorBgContainer}>{t("approval.history.status.needsUpdate")}</Pill>
				</div>
				{returned && (
					<Text type="secondary" className="text-[13px]">
						{t("approval.history.status.returnedBy", { name: returned.actor?.fullName ?? t("approval.detail.system"), time: dayjs(returned.createdAt).format(SHORT_TIME) })}
					</Text>
				)}
				<Comment text={returned?.comment} background={token.colorBgContainer} />
			</>,
		));
	}

	if (status === ApprovalRequestStatus.Approved) {
		return row(closedTime, undefined, { icon: <FlagOutlined />, color: token.colorWhite, background: token.colorSuccess }, card(
			{ border: token.colorSuccessBorder, background: token.colorSuccessBg },
			header(
				t("approval.history.complete"),
				token.colorSuccessText,
				undefined,
				span && [span, detail.round > 1 ? t("approval.history.status.rounds", { count: detail.round }) : undefined].filter(Boolean).join(" · "),
			),
		));
	}

	if (status === ApprovalRequestStatus.Rejected) {
		const rejected = lastOf(histories, [ApprovalHistoryAction.Reject, ApprovalHistoryAction.AutoReject]);
		const auto = rejected?.action === ApprovalHistoryAction.AutoReject;
		return row(closedTime, undefined, { icon: auto ? <ClockCircleOutlined /> : <CloseOutlined />, color: token.colorWhite, background: token.colorError }, card(
			{ border: token.colorErrorBorder, background: token.colorErrorBg },
			<>
				{header(
					auto ? t("approval.history.status.autoRejected") : t("approval.history.status.rejected"),
					token.colorErrorText,
					rejected?.nodeName && <Chip color={token.colorTextSecondary} background={token.colorBgContainer}>{rejected.nodeName}</Chip>,
					span,
				)}
				{auto
					? <Text type="secondary" className="text-[13px]">{t("approval.history.status.autoRejectedHint")}</Text>
					: rejected?.actor && <div className="text-[13px]"><Person user={rejected.actor} /></div>}
				<Comment text={rejected?.comment} background={token.colorBgContainer} />
			</>,
		));
	}

	// Đã hủy
	const cancelled = lastOf(histories, [ApprovalHistoryAction.Cancel]);
	return row(closedTime, undefined, { icon: <StopOutlined />, color: token.colorWhite, background: token.colorTextTertiary }, card(
		{ border: token.colorBorder, background: token.colorFillAlter },
		<>
			{header(
				t("approval.history.status.cancelled"),
				undefined,
				cancelled?.nodeName && <Chip color={token.colorTextSecondary} background={token.colorBgContainer}>{cancelled.nodeName}</Chip>,
				span,
			)}
			{cancelled?.actor && <div className="text-[13px]"><Person user={cancelled.actor} /></div>}
			<Comment text={cancelled?.comment} background={token.colorBgContainer} />
		</>,
	));
}
