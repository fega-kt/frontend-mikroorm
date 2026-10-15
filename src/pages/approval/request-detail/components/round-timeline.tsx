import type { ApprovalTaskItem } from "#src/api/approval-request";
import type { WaitNode, WorkflowDefinition, WorkflowNode } from "#src/api/approval-workflow/types";
import type { ApproverProfile } from "#src/components/approval-flow-graph/user-names";
import type { ReactNode } from "react";
import type { NodeProgress } from "../../lib/progress";
import type { ApprovalRound, StepGroup } from "../../lib/rounds";
import { ApprovalHistoryAction, ApprovalRequestStatus, ApprovalTaskStatus } from "#src/api/approval-request/types";
import { ApproverType, NodeType } from "#src/api/approval-workflow/types";
import { PrincipalType } from "#src/api/system/principal";
import { useWorkflowApproverProfiles, useWorkflowUserNames } from "#src/components/approval-flow-graph/user-names";
import { UserAvatar } from "#src/components/user-avatar";
import { CheckOutlined, ClockCircleOutlined, TeamOutlined, UserOutlined, UserSwitchOutlined } from "@ant-design/icons";
import { Button, Tag, theme, Timeline, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { RequestStatusTag, TaskStatusTag } from "../../components/status-tag";
import { DATE_TIME_FORMAT } from "../../lib/payload";
import { orderNodes } from "../../lib/progress";
import { groupSteps } from "../../lib/rounds";
import { approverLabel, nodeTitle } from "../../workflow-designer/canvas/labels";
import { useProgressVisual } from "./progress-visual";

const { Text } = Typography;

/** Kết quả vòng → màu chấm cuối dòng thời gian */
const OUTCOME_PROGRESS: Partial<Record<ApprovalRequestStatus, NodeProgress>> = {
	[ApprovalRequestStatus.Approved]: "done",
	[ApprovalRequestStatus.Returned]: "returned",
	[ApprovalRequestStatus.Rejected]: "rejected",
	[ApprovalRequestStatus.Cancelled]: "cancelled",
};

const formatTime = (value: string) => dayjs(value).format(DATE_TIME_FORMAT);

/** Ô nội dung một lượt xử lý trong bước */
function EntryCard({ children, compact }: { children: ReactNode, compact?: boolean }) {
	const { token } = theme.useToken();
	return (
		<div className={compact ? "flex flex-col gap-0.5 rounded-md px-2 py-1.5" : "flex flex-col gap-1 rounded-md px-2.5 py-2"} style={{ background: token.colorFillQuaternary }}>
			{children}
		</div>
	);
}

/** Ô trích dẫn ý kiến / lý do (duyệt, trả lại, từ chối, hủy) */
function Comment({ children }: { children: ReactNode }) {
	const { token } = theme.useToken();
	return (
		<div className="mt-1 whitespace-pre-wrap rounded px-2 py-1 text-[13px]" style={{ background: token.colorBgContainer, borderLeft: `3px solid ${token.colorBorder}` }}>
			{children}
		</div>
	);
}

interface PersonRowProps {
	avatar: ReactNode
	name: string
	/** Ghi chú nhỏ cạnh tên (vd: "thay Kim Thái") */
	note?: ReactNode
	/** Phía phải dòng tên: trạng thái, nút thao tác */
	extra?: ReactNode
	children?: ReactNode
	/** Gọn: dòng tên thấp hơn, khoảng cách hẹp (thẻ quy trình thu gọn) */
	compact?: boolean
}

/** Avatar + tên người xử lý, các dòng chi tiết thụt vào thẳng hàng với tên */
function PersonRow({ avatar, name, note, extra, children, compact }: PersonRowProps) {
	return (
		<div className={compact ? "flex items-start gap-2" : "flex items-start gap-2.5"}>
			{avatar}
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<div className={compact ? "flex min-h-[22px] flex-wrap items-center gap-x-2 gap-y-0.5" : "flex min-h-7 flex-wrap items-center gap-x-2 gap-y-1"}>
					<Text strong className="text-[13px]">{name}</Text>
					{note && <Text type="secondary" className="text-xs">{note}</Text>}
					{extra && <span className="ml-auto flex items-center gap-1">{extra}</span>}
				</div>
				{children}
			</div>
		</div>
	);
}

interface StepEntriesProps {
	/** Task + lịch sử của bước trong vòng; chưa có = bước chưa tới */
	group?: StepGroup
	/** Node trong quy trình — để hiện người duyệt dự kiến khi bước chưa tới */
	node?: WorkflowNode
	names: Record<string, string>
	/** Tên / avatar / người hay nhóm của người duyệt cấu hình — cho bước chưa tới */
	profiles?: Record<string, ApproverProfile>
	canReassign?: boolean
	onReassign?: (task: ApprovalTaskItem) => void
	/** Hiển thị gọn (avatar nhỏ, khoảng cách hẹp) cho thẻ quy trình thu gọn */
	compact?: boolean
}

/** Các lượt xử lý của một bước: người duyệt, kết quả, thời gian, ý kiến / lý do */
export function StepEntries({ group, node, names, profiles = {}, canReassign, onReassign, compact }: StepEntriesProps) {
	const { t } = useTranslation();
	const avatarSize = compact ? 22 : 28;

	if (group?.tasks.length) {
		return group.tasks.map((task) => {
			const holder = task.approver.user;
			const groupTask = task.approver.type === PrincipalType.Group;
			const origin = task.originApprover;
			// Hiện người đã bấm (nếu có), không thì người giữ; task cả nhóm chưa ai xử lý thì hiện nhóm
			const person = task.actedBy ?? holder;
			const note = (() => {
				if (task.actedBy && holder && task.actedBy.id !== holder.id)
					return t("approval.detail.delegatedFrom", { name: holder.fullName });
				if (groupTask)
					return task.actedBy ? t("approval.detail.forGroup", { name: task.approver.name }) : t("approval.detail.groupShared");
				if (task.escalatedAt)
					return t("approval.detail.escalatedFrom", { name: origin.name });
				if (task.assignedFromGroup)
					return t("approval.detail.assignedFrom", { name: origin.name });
				if (origin.id !== task.approver.id)
					return t("approval.detail.delegatedFrom", { name: origin.name });
				return null;
			})();
			return (
				<EntryCard key={task.id}>
					<PersonRow
						avatar={person
							? <UserAvatar size={avatarSize} user={person} />
							: <UserAvatar size={avatarSize} user={{ id: task.approver.id }} fallbackIcon={<TeamOutlined />} />}
						name={person?.fullName ?? task.approver.name}
						note={note}
						extra={(
							<>
								<TaskStatusTag status={task.status} />
								{canReassign && onReassign && task.status === ApprovalTaskStatus.Pending && (
									<Tooltip title={t("approval.actions.reassign")}>
										<Button size="small" type="link" className="!px-0" icon={<UserSwitchOutlined />} onClick={() => onReassign(task)} />
									</Tooltip>
								)}
							</>
						)}
					>
						{task.actedAt && <Text type="secondary" className="text-xs">{formatTime(task.actedAt)}</Text>}
						{task.status === ApprovalTaskStatus.Pending && task.dueAt && (
							<Text type={dayjs(task.dueAt).isBefore(dayjs()) ? "danger" : "secondary"} className="text-xs">
								{`${t("approval.fields.dueAt")}: ${formatTime(task.dueAt)}`}
							</Text>
						)}
						{/* Người đang được ủy quyền xử lý thay task này */}
						{!!task.delegates?.length && (
							<span className="flex flex-wrap items-center gap-1.5 text-xs">
								<Text type="secondary" className="text-xs">{t("approval.detail.canActOnBehalf")}</Text>
								{task.delegates.map(user => (
									<span key={user.id} className="inline-flex items-center gap-1">
										<UserAvatar size={16} user={user} className="text-[9px]" />
										<Text className="text-xs">{user.fullName}</Text>
									</span>
								))}
							</span>
						)}
						{task.comment && <Comment>{task.comment}</Comment>}
					</PersonRow>
				</EntryCard>
			);
		});
	}
	if (group?.events.length) {
		return group.events.map(item => (
			<EntryCard key={item.id} compact={compact}>
				<Text className="text-[13px]">
					{t(`approval.history.${item.action}`)}
					{item.action === ApprovalHistoryAction.Skip && typeof item.data?.reason === "string" && ` (${t(`approval.skipReason.${item.data.reason}`)})`}
				</Text>
				<Text type="secondary" className="text-xs">{formatTime(item.createdAt)}</Text>
			</EntryCard>
		));
	}
	// Chưa có task: người duyệt lấy theo cấu hình bước (người / nhóm cụ thể hoặc vai trò như Trưởng phòng)
	const planned = node?.type === NodeType.Approval ? [node.approver] : node?.type === NodeType.Parallel ? node.approvers : [];
	if (!planned.length) {
		return (
			<EntryCard>
				<Text type="secondary" className="text-[13px]">{t("approval.detail.notStarted")}</Text>
			</EntryCard>
		);
	}
	return planned.map((approver, index) => {
		const label = approverLabel(approver, t, names);
		// Người cụ thể (kể cả principal trỏ tới một người): avatar thật; nhóm dùng icon nhóm; vai trò (Trưởng phòng…) chưa rõ người nên dùng icon người
		const refId = approver?.type === ApproverType.SpecificUser ? approver.userId : approver?.type === ApproverType.Principal ? approver.principalId : undefined;
		const profile = refId ? profiles[refId] : undefined;
		const avatar = refId && !profile?.isGroup
			? <UserAvatar size={avatarSize} user={{ id: profile?.userId ?? refId, fullName: label, avatar: profile?.avatar }} />
			: <UserAvatar size={avatarSize} user={{ id: refId ?? approver?.type }} fallbackIcon={profile?.isGroup ? <TeamOutlined /> : <UserOutlined />} />;
		return (
			// eslint-disable-next-line react/no-array-index-key -- người duyệt của bước không có id riêng, thứ tự cố định
			<EntryCard key={index}>
				<PersonRow
					avatar={avatar}
					name={label}
					extra={<Tag bordered={false} icon={<ClockCircleOutlined />} className="m-0">{t("approval.detail.notStarted")}</Tag>}
				>
					{(node as WaitNode).slaHours && <Text type="secondary" className="text-xs">{t("workflowDesigner.summary.sla", { hours: (node as WaitNode).slaHours })}</Text>}
				</PersonRow>
			</EntryCard>
		);
	});
}

interface RoundTimelineProps {
	round: ApprovalRound
	/** Tổng số vòng — để hiện "Vòng n/N" */
	totalRounds: number
	/** Có quy trình thì vòng đang chạy hiện thêm các bước duyệt chưa tới */
	definition?: WorkflowDefinition | null
	/** id → họ tên đã biết (từ task) để hiện người duyệt của bước chưa tới */
	userNames?: Record<string, string>
	canReassign?: boolean
	onReassign?: (task: ApprovalTaskItem) => void
}

/** Quy trình duyệt thu gọn của một vòng theo từng bước: ai xử lý, kết quả, lúc nào, ý kiến */
export function RoundTimeline({ round, totalRounds, definition, userNames, canReassign, onReassign }: RoundTimelineProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const visual = useProgressVisual();
	// Người / nhóm cấu hình ở bước chưa tới chưa có trong task thì tự tải tên
	const names = useWorkflowUserNames(definition, userNames);
	const profiles = useWorkflowApproverProfiles(definition);
	const groups = groupSteps(round);
	const reached = new Set(groups.map(group => group.nodeId));
	// Bước duyệt chưa tới (theo thứ tự quy trình; nhánh điều kiện chưa rẽ thì có thể không đi qua)
	const upcoming = definition && round.outcome === ApprovalRequestStatus.Pending
		? orderNodes(definition).filter((node): node is WaitNode => (node.type === NodeType.Approval || node.type === NodeType.Parallel) && !reached.has(node.id) && (round.nodeStatus[node.id] ?? "pending") === "pending")
		: [];

	const stepLabel = (name: string, status: NodeProgress) => (
		<span
			className="self-start rounded px-1.5 text-xs font-medium leading-5"
			style={status === "pending" ? { background: token.colorFillSecondary, color: token.colorTextSecondary } : { background: visual[status].color, color: token.colorWhite }}
		>
			{name}
		</span>
	);

	// Trả lại / từ chối đã hiện ở ô người xử lý của bước nên chỉ thêm mục kết thúc khi không gắn với bước nào (hoàn tất, hủy)
	const end = round.end && (round.outcome === ApprovalRequestStatus.Approved || round.outcome === ApprovalRequestStatus.Cancelled) ? round.end : undefined;
	const endColor = visual[OUTCOME_PROGRESS[round.outcome] ?? "done"].color;

	const items = [
		{
			key: "submit",
			color: token.colorPrimary,
			children: (
				<div className="pb-0">
					<PersonRow compact avatar={<UserAvatar size={22} user={round.submittedBy} />} name={round.submittedBy?.fullName ?? "—"}>
						<Text type="secondary" className="text-xs">
							<span style={{ color: token.colorPrimary }}>{t(round.round > 1 ? "approval.detail.resubmittedAt" : "approval.detail.submittedAt")}</span>
							{round.submittedAt && ` ${formatTime(round.submittedAt)}`}
						</Text>
					</PersonRow>
				</div>
			),
		},
		...groups.map((group) => {
			const status = round.nodeStatus[group.nodeId] ?? "done";
			return {
				key: group.nodeId,
				color: visual[status].color,
				children: (
					<div className="flex flex-col gap-1 pb-0">
						{stepLabel(group.name, status)}
						<StepEntries compact group={group} names={names} canReassign={canReassign} onReassign={onReassign} />
					</div>
				),
			};
		}),
		...upcoming.map(node => ({
			key: node.id,
			color: token.colorTextQuaternary,
			children: (
				<div className="flex flex-col gap-1 pb-0">
					{stepLabel(nodeTitle(node, t), "pending")}
					<StepEntries compact node={node} names={names} profiles={profiles} />
				</div>
			),
		})),
		...(end
			? [{
				key: "end",
				color: endColor,
				children: (
					<div className="pb-0">
						<PersonRow
							compact
							// Hoàn tất do hệ thống ghi nhận nên không có người thực hiện
							avatar={end.actor ? <UserAvatar size={22} user={end.actor} /> : <UserAvatar size={22} fallbackIcon={<CheckOutlined />} style={{ background: endColor }} />}
							name={end.actor?.fullName ?? t("approval.detail.system")}
						>
							<Text type="secondary" className="text-xs">
								<span style={{ color: endColor }}>{t(`approval.detail.roundEnd.${round.outcome}`)}</span>
								{` ${formatTime(end.createdAt)}`}
							</Text>
							{end.comment && <Comment>{end.comment}</Comment>}
						</PersonRow>
					</div>
				),
			}]
			: []),
	];

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-2">
				{totalRounds > 1
					? <Tag color="blue" bordered={false} className="m-0 font-medium">{t("approval.detail.roundOf", { n: round.round, total: totalRounds })}</Tag>
					: <Text type="secondary" className="text-xs">{t("approval.detail.round", { n: round.round })}</Text>}
				<RequestStatusTag status={round.outcome} />
			</div>
			<Timeline className="[&_.ant-timeline-item]:!pb-3 [&_.ant-timeline-item-last]:!pb-0" items={items} />
		</div>
	);
}
