import type { ApprovalHistoryItem, ApprovalRequestDetail, HistoryFieldChange, HistoryFileItem, HistoryFileVersion } from "#src/api/approval-request";
import type { FormField } from "#src/api/setting/request-type/types";
import type { HistorySection } from "./history-changes";
import type { TimelineNodeStyle } from "./timeline-row";
import { ApprovalHistoryAction } from "#src/api/approval-request/types";
import { PeoplePicker } from "#src/components/people-picker";
import { UserAvatar } from "#src/components/user-avatar";
import { approvalRequestPath } from "#src/router/extra-info";
import {
	ArrowRightOutlined,
	BellOutlined,
	CheckCircleOutlined,
	ClockCircleOutlined,
	CloseCircleOutlined,
	EditOutlined,
	FileAddOutlined,
	FileExcelOutlined,
	FilterOutlined,
	FlagOutlined,
	FormOutlined,
	PlusOutlined,
	RetweetOutlined,
	RiseOutlined,
	RollbackOutlined,
	SendOutlined,
	SettingOutlined,
	ShareAltOutlined,
	StepForwardOutlined,
	StopOutlined,
	SwapOutlined,
} from "@ant-design/icons";
import { Button, Empty, Segmented, theme, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { displayComment, historyActor, historyLabel } from "../../lib/history";
import { HistoryChanges } from "./history-changes";
import { HistoryStatusCard } from "./history-status-card";
import { TimelineRow } from "./timeline-row";

const { Text } = Typography;

type Tone = "primary" | "success" | "error" | "warning" | "default" | "info" | "edit";

const ACTION_STYLE: Record<ApprovalHistoryAction, { icon: React.ReactNode, tone: Tone }> = {
	[ApprovalHistoryAction.Submit]: { icon: <SendOutlined />, tone: "primary" },
	[ApprovalHistoryAction.Resubmit]: { icon: <SendOutlined />, tone: "primary" },
	[ApprovalHistoryAction.Approve]: { icon: <CheckCircleOutlined />, tone: "success" },
	[ApprovalHistoryAction.AutoApprove]: { icon: <CheckCircleOutlined />, tone: "success" },
	[ApprovalHistoryAction.AutoReject]: { icon: <CloseCircleOutlined />, tone: "error" },
	[ApprovalHistoryAction.Reject]: { icon: <CloseCircleOutlined />, tone: "error" },
	[ApprovalHistoryAction.Return]: { icon: <RollbackOutlined />, tone: "warning" },
	[ApprovalHistoryAction.Cancel]: { icon: <StopOutlined />, tone: "default" },
	[ApprovalHistoryAction.Skip]: { icon: <StepForwardOutlined />, tone: "default" },
	[ApprovalHistoryAction.Delegate]: { icon: <SwapOutlined />, tone: "info" },
	[ApprovalHistoryAction.Escalate]: { icon: <RiseOutlined />, tone: "warning" },
	[ApprovalHistoryAction.Remind]: { icon: <BellOutlined />, tone: "default" },
	[ApprovalHistoryAction.Notify]: { icon: <BellOutlined />, tone: "default" },
	[ApprovalHistoryAction.Complete]: { icon: <FlagOutlined />, tone: "success" },
	[ApprovalHistoryAction.Create]: { icon: <PlusOutlined />, tone: "success" },
	[ApprovalHistoryAction.Update]: { icon: <EditOutlined />, tone: "edit" },
	[ApprovalHistoryAction.FileAdd]: { icon: <FileAddOutlined />, tone: "info" },
	[ApprovalHistoryAction.FileRemove]: { icon: <FileExcelOutlined />, tone: "warning" },
	[ApprovalHistoryAction.Share]: { icon: <ShareAltOutlined />, tone: "info" },
	[ApprovalHistoryAction.Unshare]: { icon: <ShareAltOutlined />, tone: "default" },
	[ApprovalHistoryAction.FileConvert]: { icon: <RetweetOutlined />, tone: "info" },
	[ApprovalHistoryAction.Sign]: { icon: <FormOutlined />, tone: "success" },
};

/** Dòng do hệ thống ghi chỉ để biết: chữ nhạt, không có chi tiết */
const QUIET_ACTIONS = [ApprovalHistoryAction.Remind, ApprovalHistoryAction.Notify];

enum HistoryFilter {
	All = "all",
	Approval = "approval",
	Edit = "edit",
	Files = "files",
}

const EDIT_ACTIONS = [ApprovalHistoryAction.Create, ApprovalHistoryAction.Update];
const FILE_ACTIONS = [ApprovalHistoryAction.FileAdd, ApprovalHistoryAction.FileRemove, ApprovalHistoryAction.FileConvert];
/** Dòng có data.files dạng bản trước → bản mới */
const VERSION_ACTIONS = [ApprovalHistoryAction.FileConvert, ApprovalHistoryAction.Sign];
/** Thứ tự nhóm tệp trong một dòng lịch sử */
const FILE_BLOCKS: HistoryFileItem["block"][] = ["documents", "attachments"];
/** Dòng mở một vòng duyệt mới */
const ROUND_ACTIONS = [ApprovalHistoryAction.Submit, ApprovalHistoryAction.Resubmit];

function matchesFilter(action: ApprovalHistoryAction, filter: HistoryFilter) {
	switch (filter) {
		case HistoryFilter.Edit: return EDIT_ACTIONS.includes(action);
		case HistoryFilter.Files: return FILE_ACTIONS.includes(action);
		case HistoryFilter.Approval: return !EDIT_ACTIONS.includes(action) && !FILE_ACTIONS.includes(action);
		default: return true;
	}
}

/** Huy hiệu loại tệp: chữ + màu theo nhóm (PDF đỏ, Word xanh dương, Excel xanh lá, PowerPoint cam) */
function FileBadge({ filename }: { filename: string }) {
	const { token } = theme.useToken();
	const ext = filename.includes(".") ? (filename.split(".").pop() ?? "").toLowerCase() : "";
	const tone = ext === "pdf"
		? { bg: token.colorErrorBg, fg: token.colorError }
		: ["doc", "docx", "txt"].includes(ext)
			? { bg: token.colorInfoBg, fg: token.colorInfo }
			: ["xls", "xlsx", "csv"].includes(ext)
				? { bg: token.colorSuccessBg, fg: token.colorSuccess }
				: ["ppt", "pptx"].includes(ext)
					? { bg: token.colorWarningBg, fg: token.colorWarning }
					: { bg: token.colorFillSecondary, fg: token.colorTextSecondary };
	return (
		<span className="flex size-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold uppercase" style={{ background: tone.bg, color: tone.fg }}>
			{ext.slice(0, 4) || "?"}
		</span>
	);
}

interface FileCardProps {
	filename: string
	subtitle?: React.ReactNode
	removed?: boolean
	actions?: { label: string, onClick: () => void }[]
}

/** Thẻ tệp trong một dòng lịch sử */
function FileCard({ filename, subtitle, removed, actions = [] }: FileCardProps) {
	const { token } = theme.useToken();
	return (
		<div
			className="flex items-center gap-3 rounded-lg px-3 py-2.5"
			style={{ border: `1px ${removed ? "dashed" : "solid"} ${token.colorBorderSecondary}`, background: removed ? token.colorFillAlter : undefined }}
		>
			<FileBadge filename={filename} />
			<div className="flex min-w-0 flex-1 flex-col">
				<Text className="text-[13px] font-medium" delete={removed} type={removed ? "secondary" : undefined} ellipsis={{ tooltip: filename }}>{filename}</Text>
				{subtitle && <Text type="secondary" className="text-xs">{subtitle}</Text>}
			</div>
			{actions.map(action => <Button key={action.label} type="link" size="small" onClick={action.onClick}>{action.label}</Button>)}
		</div>
	);
}

interface HistoryTimelineProps {
	histories: ApprovalHistoryItem[]
	userNames: Record<string, string>
	formSchema: FormField[]
	/** Có thì ghim thẻ trạng thái (đang chờ ai / kết quả) ở đầu dòng thời gian */
	request?: ApprovalRequestDetail
	/** Có thì thẻ tệp hiện nút xem */
	onViewFile?: (file: { id: string, filename: string }) => void
}

/** Lịch sử xử lý tờ trình: thẻ trạng thái + các sự kiện nhóm theo ngày (mặc định mới nhất trước) */
export function HistoryTimeline({ histories, userNames, formSchema, request, onViewFile }: HistoryTimelineProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [filter, setFilter] = useState(HistoryFilter.All);
	const [newestFirst, setNewestFirst] = useState(true);
	const toneStyle = (tone: Tone): Omit<TimelineNodeStyle, "icon"> => {
		const map: Record<Tone, Omit<TimelineNodeStyle, "icon">> = {
			primary: { color: token.colorPrimary, background: token.colorPrimaryBg },
			success: { color: token.colorSuccess, background: token.colorSuccessBg },
			error: { color: token.colorError, background: token.colorErrorBg },
			warning: { color: token.colorWarning, background: token.colorWarningBg },
			info: { color: token.colorInfo, background: token.colorInfoBg },
			edit: { color: token.colorPrimary, background: token.colorFillTertiary },
			default: { color: token.colorTextSecondary, background: token.colorFillSecondary },
		};
		return map[tone];
	};

	// Kết quả cuối đã hiện ở thẻ trạng thái nên bỏ dòng "Hoàn tất" cho khỏi trùng
	const events = request ? histories.filter(item => item.action !== ApprovalHistoryAction.Complete) : histories;
	// Vòng duyệt của từng lần gửi / gửi lại: lần gửi thứ n mở vòng n
	const roundOf = new Map<string, number>();
	events.filter(item => ROUND_ACTIONS.includes(item.action)).forEach((item, index) => roundOf.set(item.id, index + 1));

	const countOf = (value: HistoryFilter) => events.filter(item => matchesFilter(item.action, value)).length;
	const visible = events.filter(item => matchesFilter(item.action, filter));
	const ordered = newestFirst ? [...visible].reverse() : visible;
	const showStatus = !!request && (filter === HistoryFilter.All || filter === HistoryFilter.Approval);
	// Chỉ hiện bộ lọc khi phiếu có dòng chỉnh sửa / tệp, tránh thêm nhiễu cho phiếu chỉ có luồng duyệt
	const hasEdits = events.some(item => !matchesFilter(item.action, HistoryFilter.Approval));
	const lastUpdate = histories.length ? histories[histories.length - 1].createdAt : undefined;

	const dayLabel = (date: string) => {
		const day = dayjs(date);
		const full = day.format("dddd, DD/MM/YYYY");
		if (day.isSame(dayjs(), "day"))
			return `${t("approval.history.today")} · ${full}`;
		if (day.isSame(dayjs().subtract(1, "day"), "day"))
			return `${t("approval.history.yesterday")} · ${full}`;
		return full;
	};

	const renderEvent = (item: ApprovalHistoryItem, last: boolean) => {
		const style = ACTION_STYLE[item.action] ?? { icon: <ClockCircleOutlined />, tone: "default" as Tone };
		const data = item.data ?? {};
		const from = typeof data.from === "string" ? userNames[data.from] : undefined;
		const to = typeof data.to === "string" ? userNames[data.to] : undefined;
		const changes = Array.isArray(data.changes) ? (data.changes as HistoryFieldChange[]) : [];
		const isVersion = VERSION_ACTIONS.includes(item.action);
		const files = Array.isArray(data.files) && !isVersion ? (data.files as HistoryFileItem[]) : [];
		const versions = Array.isArray(data.files) && isVersion ? (data.files as HistoryFileVersion[]) : [];
		const sharedWith = Array.isArray(data.principals) ? (data.principals as { id: string, name: string }[]) : [];
		// Phiếu tạo bằng nhân bản: data.clonedFrom = { id, code } của phiếu gốc (code null khi phiếu gốc chưa gửi)
		const clonedFrom = data.clonedFrom as { id: string, code: string | null } | undefined;
		const actor = historyActor(item);
		const quiet = QUIET_ACTIONS.includes(item.action);
		// Duyệt / từ chối / trả lại thay người khác theo ủy quyền
		const onBehalfOf = typeof data.onBehalfOf === "string" ? userNames[data.onBehalfOf] : undefined;
		const round = roundOf.get(item.id) ?? (isVersion && typeof data.round === "number" ? data.round : undefined);
		const titleColor = item.action === ApprovalHistoryAction.Return
			? token.colorWarningText
			: item.action === ApprovalHistoryAction.Reject || item.action === ApprovalHistoryAction.AutoReject ? token.colorErrorText : undefined;
		const commentBg = item.action === ApprovalHistoryAction.Return
			? token.colorWarningBg
			: item.action === ApprovalHistoryAction.Reject ? token.colorErrorBg : token.colorFillTertiary;
		const chip = (text: React.ReactNode, color = token.colorTextSecondary, background = token.colorFillTertiary) => (
			<span className="whitespace-nowrap rounded px-2 text-xs leading-5" style={{ color, background }}>{text}</span>
		);
		const view = (file: { id: string, filename: string }) => () => onViewFile?.(file);
		// Tệp nhóm theo loại thành khối riêng (văn bản tờ trình / tài liệu đính kèm) như các khối của form
		const removed = item.action === ApprovalHistoryAction.FileRemove;
		const fileSections: HistorySection[] = FILE_BLOCKS
			.map(block => ({ block, items: files.filter(file => file.block === block) }))
			.filter(group => group.items.length > 0)
			.map(group => ({
				key: `files.${group.block}`,
				title: t(`approval.files.${group.block}`),
				meta: t("approval.files.count", { count: group.items.length }),
				content: (
					<div className="flex flex-col gap-2">
						{group.items.map(file => (
							<FileCard
								key={file.id}
								filename={file.filename}
								removed={removed}
								subtitle={removed ? t("approval.history.fileRemoved") : undefined}
								actions={onViewFile && !removed ? [{ label: t("approval.files.view"), onClick: view(file) }] : []}
							/>
						))}
					</div>
				),
			}));

		return (
			<TimelineRow key={item.id} time={dayjs(item.createdAt).format("HH:mm")} node={{ icon: style.icon, ...toneStyle(style.tone) }} last={last}>
				<div className="flex flex-wrap items-center gap-2">
					<span className={`text-sm ${quiet ? "font-medium" : "font-semibold"}`} style={{ color: quiet ? token.colorTextSecondary : titleColor }}>
						{historyLabel(item, t)}
						{item.action === ApprovalHistoryAction.Skip && typeof data.reason === "string" && ` (${t(`approval.skipReason.${data.reason}`)})`}
					</span>
					{changes.length > 0 && item.action === ApprovalHistoryAction.Update && <Text type="secondary" className="text-[13px]">{`· ${t("approval.history.changes.fields", { count: changes.length })}`}</Text>}
					{/* Bấm để mở phiếu gốc (không có quyền xem / đã xóa thì trang chi tiết tự báo) */}
					{clonedFrom && chip(
						<Link to={approvalRequestPath.detail(clonedFrom.id)}>
							{clonedFrom.code ? t("approval.history.clonedFrom", { code: clonedFrom.code }) : t("approval.history.clonedFromDraft")}
						</Link>,
					)}
					{item.nodeName && chip(item.nodeName)}
					{round !== undefined && chip(t("approval.files.round", { round }))}
					{onBehalfOf && chip(t("approval.detail.delegatedFrom", { name: onBehalfOf }), token.purple7, token.purple1)}
					{quiet && <Text type="secondary" className="text-xs">{`· ${actor?.fullName ?? t("approval.detail.system")}`}</Text>}
				</div>
				{!quiet && (
					<div className="flex min-w-0 items-center gap-1.5">
						{/* Dòng do hệ thống ghi (tự động duyệt, chuyển PDF…) không có người thực hiện */}
						{actor
							? <PeoplePicker readonly user={actor} size="small" avatarSize={20} showEmail={false} subtle className="!min-h-0" />
							: (
								<>
									<UserAvatar size={20} fallbackIcon={<SettingOutlined />} className="text-[11px]" style={{ background: token.colorTextQuaternary }} />
									<Text type="secondary" className="text-xs">{t("approval.detail.system")}</Text>
								</>
							)}
					</div>
				)}
				{(from || to) && (
					<div className="flex flex-wrap items-center gap-2 text-[13px]">
						{from && <span>{from}</span>}
						{from && to && <ArrowRightOutlined className="text-xs opacity-60" aria-hidden />}
						{to && <span className="font-medium">{to}</span>}
					</div>
				)}
				{/* Dòng chia sẻ / thu hồi: data.principals = các principal nhận */}
				{sharedWith.length > 0 && <div className="flex flex-wrap gap-1.5">{sharedWith.map(principal => chip(principal.name))}</div>}
				{(changes.length > 0 || fileSections.length > 0) && (
					<HistoryChanges changes={changes} formSchema={formSchema} created={item.action === ApprovalHistoryAction.Create} sections={fileSections} />
				)}
				{versions.map(version => (item.action === ApprovalHistoryAction.FileConvert
					// Chuyển PDF: tên gốc → tên PDF
					? (
						<div key={version.to.id} className="flex flex-wrap items-center gap-2.5">
							<FileCard filename={version.from.filename} actions={onViewFile ? [{ label: t("approval.files.view"), onClick: view(version.from) }] : []} />
							<ArrowRightOutlined className="text-xs opacity-60" aria-hidden />
							<FileCard filename={version.to.filename} actions={onViewFile ? [{ label: t("approval.files.view"), onClick: view(version.to) }] : []} />
						</div>
					)
					// Ký: tên tệp giữ nguyên, xem được cả bản trước khi ký
					: (
						<FileCard
							key={version.to.id}
							filename={version.to.filename}
							subtitle={t("approval.history.signedVersion")}
							actions={onViewFile
								? [{ label: t("approval.history.viewPrevious"), onClick: view(version.from) }, { label: t("approval.files.view"), onClick: view(version.to) }]
								: []}
						/>
					)))}
				{item.comment && (
					<blockquote className="m-0 whitespace-pre-wrap rounded-lg px-3.5 py-2 text-[13px] leading-5" style={{ background: commentBg }}>
						{displayComment(item.comment, t, !item.actor)}
					</blockquote>
				)}
			</TimelineRow>
		);
	};

	// Nhóm theo ngày, giữ thứ tự đã sắp
	const days: { key: string, items: ApprovalHistoryItem[] }[] = [];
	for (const item of ordered) {
		const key = dayjs(item.createdAt).format("YYYY-MM-DD");
		if (days.at(-1)?.key !== key)
			days.push({ key, items: [] });
		days.at(-1)!.items.push(item);
	}
	const dayHeader = (key: string, label: string) => (
		<div key={`day-${key}`} className="mb-3 mt-4 flex items-center gap-3 first:mt-0">
			<span className="text-xs font-semibold uppercase tracking-wide" style={{ color: token.colorTextSecondary }}>{label}</span>
			<span className="h-px flex-1" style={{ background: token.colorBorderSecondary }} />
		</div>
	);
	const statusCard = showStatus ? <HistoryStatusCard detail={request!} last={!newestFirst || !ordered.length} /> : null;

	if (!histories.length && !request)
		return <Text type="secondary">{t("approval.detail.notSubmitted")}</Text>;
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Text type="secondary" className="text-xs">
					{[t("approval.history.eventCount", { count: events.length }), lastUpdate && t("approval.history.lastUpdate", { time: dayjs(lastUpdate).format("HH:mm, DD/MM/YYYY") })].filter(Boolean).join(" · ")}
				</Text>
				<div className="flex flex-wrap items-center gap-2">
					{hasEdits && (
						<Segmented
							value={filter}
							onChange={setFilter}
							options={Object.values(HistoryFilter).map(value => ({
								value,
								label: (
									<span className="inline-flex items-center gap-1.5">
										{t(`approval.history.filter.${value}`)}
										<span className="rounded-full px-1.5 text-[11px] leading-4" style={{ background: value === filter ? token.colorPrimaryBg : token.colorFillSecondary, color: value === filter ? token.colorPrimaryText : token.colorTextSecondary }}>
											{countOf(value)}
										</span>
									</span>
								),
							}))}
						/>
					)}
					<Button icon={<SwapOutlined rotate={90} />} onClick={() => setNewestFirst(!newestFirst)}>
						{newestFirst ? t("approval.history.newestFirst") : t("approval.history.oldestFirst")}
					</Button>
				</div>
			</div>

			{!ordered.length && !statusCard
				? (
					<Empty image={<FilterOutlined className="text-3xl opacity-40" />} description={t("approval.history.filterEmpty", { name: t(`approval.history.filter.${filter}`) })}>
						<Button onClick={() => setFilter(HistoryFilter.All)}>{t("approval.history.showAllEvents")}</Button>
					</Empty>
				)
				: (
					<div>
						{newestFirst && statusCard}
						{days.map((day, dayIndex) => [
							dayHeader(day.key, dayLabel(day.items[0].createdAt)),
							...day.items.map((item, index) => renderEvent(item, !(newestFirst ? false : !!statusCard) && dayIndex === days.length - 1 && index === day.items.length - 1)),
						])}
						{!newestFirst && statusCard}
					</div>
				)}
		</div>
	);
}
