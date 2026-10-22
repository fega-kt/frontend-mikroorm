import type { ApprovalHistoryItem, HistoryFieldChange, HistoryFileItem, HistoryFileVersion } from "#src/api/approval-request";
import type { FormField } from "#src/api/setting/request-type/types";
import { ApprovalHistoryAction } from "#src/api/approval-request/types";
import { PeoplePicker } from "#src/components/people-picker";
import { UserAvatar } from "#src/components/user-avatar";
import {
	BellOutlined,
	CheckCircleOutlined,
	ClockCircleOutlined,
	CloseCircleOutlined,
	EditOutlined,
	FileAddOutlined,
	FileExcelOutlined,
	FilePdfOutlined,
	FlagOutlined,
	FormOutlined,
	PlusCircleOutlined,
	RiseOutlined,
	RollbackOutlined,
	SendOutlined,
	SettingOutlined,
	ShareAltOutlined,
	StepForwardOutlined,
	StopOutlined,
	SwapOutlined,
} from "@ant-design/icons";
import { Segmented, theme, Timeline, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { historyActor, historyLabel } from "../../lib/history";
import { DATE_TIME_FORMAT, formatPayloadValue } from "../../lib/payload";

const { Text } = Typography;

type Tone = "primary" | "success" | "error" | "warning" | "default" | "info";

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
	[ApprovalHistoryAction.Remind]: { icon: <ClockCircleOutlined />, tone: "warning" },
	[ApprovalHistoryAction.Notify]: { icon: <BellOutlined />, tone: "info" },
	[ApprovalHistoryAction.Complete]: { icon: <FlagOutlined />, tone: "success" },
	[ApprovalHistoryAction.Create]: { icon: <PlusCircleOutlined />, tone: "primary" },
	[ApprovalHistoryAction.Update]: { icon: <EditOutlined />, tone: "info" },
	[ApprovalHistoryAction.FileAdd]: { icon: <FileAddOutlined />, tone: "info" },
	[ApprovalHistoryAction.FileRemove]: { icon: <FileExcelOutlined />, tone: "warning" },
	[ApprovalHistoryAction.Share]: { icon: <ShareAltOutlined />, tone: "info" },
	[ApprovalHistoryAction.Unshare]: { icon: <ShareAltOutlined />, tone: "default" },
	[ApprovalHistoryAction.FileConvert]: { icon: <FilePdfOutlined />, tone: "info" },
	[ApprovalHistoryAction.Sign]: { icon: <FormOutlined />, tone: "success" },
};

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

function matchesFilter(action: ApprovalHistoryAction, filter: HistoryFilter) {
	switch (filter) {
		case HistoryFilter.Edit: return EDIT_ACTIONS.includes(action);
		case HistoryFilter.Files: return FILE_ACTIONS.includes(action);
		case HistoryFilter.Approval: return !EDIT_ACTIONS.includes(action) && !FILE_ACTIONS.includes(action);
		default: return true;
	}
}

/** Nhãn + giá trị hiển thị của một trường đổi; trường eform tra theo formSchema nên nhãn / lựa chọn theo ngôn ngữ hiện tại */
function describeChange(change: HistoryFieldChange, formSchema: FormField[], t: (key: string) => string) {
	const { field, from, to } = change;
	const text = (value: unknown) => (value == null || value === "" ? "—" : String(value));
	/** Trường lưu dạng { id, name } (nhóm, đơn vị trình): hiện tên */
	const briefName = (value: unknown) => (value && typeof value === "object" ? text((value as { name?: string }).name) : text(value));
	if (field.startsWith("payload.")) {
		const key = field.slice("payload.".length);
		const def = formSchema.find(item => item.key === key);
		// Trường đã bị gỡ khỏi eform: không còn nhãn để tra nên hiện khóa kỹ thuật
		if (!def)
			return { label: key, from: text(from), to: text(to) };
		return { label: def.label, from: formatPayloadValue(def, from, t), to: formatPayloadValue(def, to, t) };
	}
	switch (field) {
		case "title":
			return { label: t("approval.fields.title"), from: text(from), to: text(to) };
		case "priority":
			return { label: t("approval.form.priority"), from: t(`approval.priority.${from}`), to: t(`approval.priority.${to}`) };
		case "category":
			return { label: t("approval.form.category"), from: briefName(from), to: briefName(to) };
		case "department":
			return { label: t("approval.form.submitUnit"), from: briefName(from), to: briefName(to) };
		default:
			return { label: field, from: text(from), to: text(to) };
	}
}

/** Lịch sử xử lý đơn (mới nhất ở trên) */
export function HistoryTimeline({ histories, userNames, formSchema }: { histories: ApprovalHistoryItem[], userNames: Record<string, string>, formSchema: FormField[] }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [filter, setFilter] = useState(HistoryFilter.All);
	const toneColor: Record<Tone, string> = {
		primary: token.colorPrimary,
		success: token.colorSuccess,
		error: token.colorError,
		warning: token.colorWarning,
		info: token.colorInfo,
		default: token.colorTextTertiary,
	};

	const items = [...histories].reverse().filter(item => matchesFilter(item.action, filter)).map((item) => {
		const style = ACTION_STYLE[item.action] ?? { icon: <ClockCircleOutlined />, tone: "default" as Tone };
		const data = item.data ?? {};
		const from = typeof data.from === "string" ? userNames[data.from] : undefined;
		const to = typeof data.to === "string" ? userNames[data.to] : undefined;
		const changes = Array.isArray(data.changes) ? (data.changes as HistoryFieldChange[]) : [];
		const isVersion = VERSION_ACTIONS.includes(item.action);
		const files = Array.isArray(data.files) && !isVersion ? (data.files as HistoryFileItem[]) : [];
		const versions = Array.isArray(data.files) && isVersion ? (data.files as HistoryFileVersion[]) : [];
		const sharedWith = Array.isArray(data.principals) ? (data.principals as { id: string, name: string }[]) : [];
		const actor = historyActor(item);
		// Duyệt / từ chối / trả lại thay người khác theo ủy quyền
		const onBehalfOf = typeof data.onBehalfOf === "string" ? userNames[data.onBehalfOf] : undefined;
		return {
			key: item.id,
			color: toneColor[style.tone],
			dot: <span style={{ color: toneColor[style.tone] }}>{style.icon}</span>,
			children: (
				<div className="flex flex-col gap-0.5 pb-1">
					<Text strong>
						{historyLabel(item, t)}
						{item.action === ApprovalHistoryAction.Skip && typeof data.reason === "string" && ` (${t(`approval.skipReason.${data.reason}`)})`}
					</Text>
					<div className="flex min-w-0 items-center gap-1.5">
						{/* Dòng do hệ thống ghi (nhắc duyệt, tự động duyệt…) không có người thực hiện */}
						{actor
							? <PeoplePicker readonly user={actor} size="small" avatarSize={20} showEmail={false} subtle className="!min-h-0" />
							: (
								<>
									<UserAvatar size={20} fallbackIcon={<SettingOutlined />} className="text-[11px]" style={{ background: token.colorTextQuaternary }} />
									<Text type="secondary" className="text-xs">{t("approval.detail.system")}</Text>
								</>
							)}
						<Text type="secondary" className="text-xs" ellipsis>
							{`· ${[onBehalfOf && t("approval.detail.delegatedFrom", { name: onBehalfOf }), item.nodeName, dayjs(item.createdAt).format(DATE_TIME_FORMAT)].filter(Boolean).join(" · ")}`}
						</Text>
					</div>
					{(from || to) && <Text className="text-xs">{[from, to].filter(Boolean).join(" → ")}</Text>}
					{/* Dòng chia sẻ / thu hồi: data.principals = các principal nhận */}
					{sharedWith.length > 0 && <Text className="text-xs">{sharedWith.map(item => item.name).join(", ")}</Text>}
					{changes.length > 0 && (
						<ul className="m-0 flex list-none flex-col gap-0.5 p-0 text-[13px]">
							{changes.map((change) => {
								const row = describeChange(change, formSchema, t);
								return (
									<li key={change.field} className="whitespace-pre-wrap">
										<Text type="secondary">{`${row.label}: `}</Text>
										{/* Dòng "tạo": chưa có giá trị cũ nên chỉ hiện giá trị ban đầu */}
										{item.action !== ApprovalHistoryAction.Create && (
											<>
												<Text delete type="secondary">{row.from}</Text>
												<Text type="secondary">{" → "}</Text>
											</>
										)}
										<Text strong>{row.to}</Text>
									</li>
								);
							})}
						</ul>
					)}
					{files.length > 0 && (
						<ul className="m-0 flex list-none flex-col gap-0.5 p-0 text-[13px]">
							{files.map(file => (
								<li key={file.id}>
									<Text delete={item.action === ApprovalHistoryAction.FileRemove}>{file.filename}</Text>
									<Text type="secondary">{` · ${t(`approval.files.${file.block}`)}`}</Text>
								</li>
							))}
						</ul>
					)}
					{versions.length > 0 && typeof data.round === "number" && (
						<Text type="secondary" className="text-xs">{t("approval.files.round", { round: data.round })}</Text>
					)}
					{versions.length > 0 && (
						<ul className="m-0 flex list-none flex-col gap-0.5 p-0 text-[13px]">
							{versions.map(version => (
								<li key={version.to.id}>
									{/* Ký: tên tệp giữ nguyên nên chỉ hiện một tên; chuyển đổi: tên gốc → tên PDF */}
									{version.from.filename !== version.to.filename && (
										<>
											<Text type="secondary">{version.from.filename}</Text>
											<Text type="secondary">{" → "}</Text>
										</>
									)}
									<Text>{version.to.filename}</Text>
								</li>
							))}
						</ul>
					)}
					{item.comment && (
						<div className="mt-1 px-2 py-1 rounded text-[13px] whitespace-pre-wrap" style={{ background: token.colorFillTertiary }}>
							{item.comment}
						</div>
					)}
				</div>
			),
		};
	});

	// Chỉ hiện bộ lọc khi phiếu có dòng chỉnh sửa / tệp, tránh thêm nhiễu cho phiếu chỉ có luồng duyệt
	const hasEdits = histories.some(item => !matchesFilter(item.action, HistoryFilter.Approval));
	if (!histories.length)
		return <Text type="secondary">{t("approval.detail.notSubmitted")}</Text>;
	return (
		<div className="flex flex-col gap-4">
			{hasEdits && (
				<Segmented
					className="self-start"
					value={filter}
					onChange={setFilter}
					options={Object.values(HistoryFilter).map(value => ({ value, label: t(`approval.history.filter.${value}`) }))}
				/>
			)}
			{items.length ? <Timeline items={items} /> : <Text type="secondary">{t("common.noData")}</Text>}
		</div>
	);
}
