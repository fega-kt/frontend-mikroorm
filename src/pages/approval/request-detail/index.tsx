import type { ApprovalShareItem, ApprovalTaskItem } from "#src/api/approval-request";
import type { ApprovalActionType } from "#src/api/approval-task";
import type { FormField } from "#src/api/setting/request-type/types";
import type { FileViewTarget } from "#src/components/file-viewer";
import type { BadgeProps } from "antd";
import type { ActionModalRef } from "../components/action-modal";
import { ApprovalHistoryAction, approvalRequestService, ApprovalRequestStatus } from "#src/api/approval-request";
import { approvalTaskService } from "#src/api/approval-task";
import { FileContextType, fileViewService } from "#src/api/file-view";
import { ApprovalFlowGraph } from "#src/components/approval-flow-graph";
import { BasicContent } from "#src/components/basic-content";
import { FileViewer } from "#src/components/file-viewer";
import { PeoplePicker } from "#src/components/people-picker";
import { SectionCard } from "#src/components/section-card";
import { UserAvatar } from "#src/components/user-avatar";
import { ApprovalPath } from "#src/router/extra-info";
import {
	ArrowLeftOutlined,
	ArrowRightOutlined,
	BranchesOutlined,
	FileTextOutlined,
	HistoryOutlined,
	NodeIndexOutlined,
	PaperClipOutlined,
	ProfileOutlined,
	ShareAltOutlined,
} from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Alert, Badge, Button, Descriptions, Empty, Input, Modal, Result, Space, Tabs, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ActionModal } from "../components/action-modal";
import { PayloadView } from "../components/form-fields";
import { RequestDetailSkeleton } from "../components/page-skeleton";
import { PriorityTag, RequestStatusTag } from "../components/status-tag";
import { tabLabel } from "../components/tab-label";
import { useLocalizedFields } from "../lib/form-i18n";
import { DATE_TIME_FORMAT } from "../lib/payload";
import { collectUserNames } from "../lib/progress";
import { buildRounds } from "../lib/rounds";
import ApprovalRequestForm from "../request-form";
import { HistoryTimeline } from "./components/history-timeline";
import { RequestActions } from "./components/request-actions";
import { RoundFiles } from "./components/round-files";
import { RoundMeta } from "./components/round-meta";
import { RoundTimeline } from "./components/round-timeline";
import { ShareCount, ShareList, ShareModal } from "./components/share";
import { SignApproveModal } from "./components/sign-approve-modal";
import { StepDetailDrawer } from "./components/step-detail-drawer";

const { Text, Title } = Typography;

/** Các tab của màn chi tiết; giá trị là tham số `?tab=` trên URL (info là mặc định nên không ghi ra URL) */
enum DetailTab {
	Info = "info",
	Progress = "progress",
	Files = "files",
	History = "history",
}

const formatDate = (value?: string) => (value ? dayjs(value).format(DATE_TIME_FORMAT) : "—");

/** Chấm trạng thái trên tab con của từng vòng */
const ROUND_BADGE: Record<ApprovalRequestStatus, BadgeProps["status"]> = {
	[ApprovalRequestStatus.Draft]: "default",
	[ApprovalRequestStatus.Pending]: "processing",
	[ApprovalRequestStatus.Approved]: "success",
	[ApprovalRequestStatus.Rejected]: "error",
	[ApprovalRequestStatus.Returned]: "warning",
	[ApprovalRequestStatus.Cancelled]: "default",
};

const NO_FIELDS: FormField[] = [];

export default function ApprovalRequestDetailPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const [searchParams, setSearchParams] = useSearchParams();
	const actionModalRef = useRef<ActionModalRef>(null);
	// Cache theo id: quay lại tab là có dữ liệu ngay, bản mới tải ngầm rồi cập nhật (chỉ lần đầu mới có skeleton)
	const { data: detail, error: loadError, refreshAsync } = useRequest(
		() => approvalRequestService.fetchDetail(id!),
		{ ready: !!id, refreshDeps: [id], cacheKey: `approval-request-${id}`, staleTime: 5000 },
	);
	// Nhãn / lựa chọn của form theo ngôn ngữ đang dùng (chỉ để hiển thị)
	const contentFields = useLocalizedFields(detail?.requestType.formId, detail?.requestType.formSchema ?? NO_FIELDS);
	// Tờ trình nháp chưa có quy trình thì không có tab sơ đồ
	const hasDefinition = !!detail?.definition;
	const activeTab = Object.values(DetailTab).find(key => key === searchParams.get("tab") && (key !== DetailTab.Progress || hasDefinition)) ?? DetailTab.Info;
	// Chỉ báo không tìm thấy khi chưa có dữ liệu nào; làm mới ngầm lỗi thì giữ bản đang hiện
	const error = !!loadError && !detail;
	const [busy, setBusy] = useState(false);
	const [shareOpen, setShareOpen] = useState(false);
	const [viewing, setViewing] = useState<FileViewTarget | null>(null);
	// Sửa được thì mở thẳng chế độ sửa; bấm Hủy thì về chế độ xem (nút Sửa để vào lại). Gắn với id để sang tờ trình khác thì về mặc định
	const [editPick, setEditPick] = useState<{ id?: string, edit?: boolean }>({});
	const setEditMode = (edit: boolean) => setEditPick({ id, edit });
	const editing = !!detail?.permissions.canEdit && (editPick.id === id && editPick.edit !== undefined ? editPick.edit : true);
	const [signing, setSigning] = useState(false);
	const [downloadingId, setDownloadingId] = useState<string | null>(null);
	const [reassignTask, setReassignTask] = useState<ApprovalTaskItem | null>(null);
	const [reassignTo, setReassignTo] = useState<string>();
	const [reassignComment, setReassignComment] = useState("");
	// Bước đang xem chi tiết trên sơ đồ (của vòng đang chọn)
	const [stepNodeId, setStepNodeId] = useState<string | null>(null);
	// Vòng đang chọn ở tab sơ đồ; undefined = vòng mới nhất. Gắn với id để sang tờ trình khác thì tự về mặc định
	const [roundPick, setRoundPick] = useState<{ id?: string, round?: number }>({});
	const selectedRound = roundPick.id === id ? roundPick.round : undefined;
	const setSelectedRound = (round?: number) => setRoundPick({ id, round });

	const load = useCallback(async () => {
		try {
			await refreshAsync();
		}
		catch {
			// lỗi đã được interceptor hiển thị
		}
	}, [refreshAsync]);

	// Giữ tab đang xem trên URL để tải lại / chia sẻ link vẫn đúng tab
	const changeTab = (key: string) => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			if (key === DetailTab.Info)
				next.delete("tab");
			else
				next.set("tab", key);
			return next;
		}, { replace: true });
		// Rời / quay lại tab sơ đồ thì về vòng mới nhất
		setSelectedRound(undefined);
		setStepNodeId(null);
	};

	const rounds = useMemo(() => (detail ? buildRounds(detail) : []), [detail]);
	const currentRound = rounds.at(-1);
	// Vòng đang xem ở tab sơ đồ — chỉ là state (không lên URL): tải lại / mở link luôn về vòng mới nhất
	const viewingRound = rounds.find(item => item.round === selectedRound) ?? currentRound;

	const changeRound = (key: string) => {
		setSelectedRound(Number(key));
		setStepNodeId(null);
	};

	const userNames = useMemo(() => (detail ? collectUserNames(detail) : {}), [detail]);

	const run = async (fn: () => Promise<unknown>, successKey: string) => {
		setBusy(true);
		try {
			await fn();
			window.$message?.success(t(successKey));
			await load();
		}
		catch {
			// lỗi đã được interceptor hiển thị
		}
		finally {
			setBusy(false);
		}
	};

	const act = async (action: ApprovalActionType) => {
		if (!detail)
			return;
		// Bước bắt buộc ký số: ghi chú + PIN nhập trong hộp "Ký và duyệt"
		if (action === "approve" && detail.permissions.requireSignature) {
			setSigning(true);
			return;
		}
		const requireComment = action === "return" || (action === "reject" && detail.permissions.requireRejectReason);
		const input = await actionModalRef.current?.open(action, { requireComment });
		if (!input)
			return;
		const successKey = { approve: "approval.messages.approved", reject: "approval.messages.rejected", return: "approval.messages.returned" }[action];
		await run(() => approvalTaskService.fetchAct(detail.id, action, input.comment), successKey);
	};

	const cancel = async () => {
		if (!detail)
			return;
		const input = await actionModalRef.current?.open("cancel");
		if (!input)
			return;
		await run(() => approvalRequestService.fetchCancel(detail.id, input.comment), "approval.messages.cancelled");
	};

	const submit = () => detail && run(() => approvalRequestService.fetchSubmit(detail.id), "approval.messages.submitted");

	const remove = async () => {
		if (!detail)
			return;
		await approvalRequestService.fetchDelete(detail.id);
		window.$message?.success(t("approval.messages.deleted"));
		navigate(ApprovalPath.MyDraft, { replace: true });
	};

	const removeShare = (share: ApprovalShareItem) => detail && run(() => approvalRequestService.fetchRemoveShare(detail.id, share.id), "approval.messages.unshared");

	const confirmReassign = async () => {
		if (!reassignTask || !reassignTo)
			return;
		await run(() => approvalTaskService.fetchReassign(reassignTask.id, reassignTo, reassignComment || undefined), "approval.messages.reassigned");
		setReassignTask(null);
	};

	const downloadFile = async (file: { id: string }) => {
		setDownloadingId(file.id);
		await fileViewService.download(FileContextType.ApprovalRequest, file.id);
		setDownloadingId(null);
	};

	// Sửa và xem chung một link: nháp mở thẳng ở chế độ sửa, trạng thái khác xem trước rồi bấm "Sửa"; thoát thì tải lại chi tiết
	if (editing && id && detail) {
		return (
			<ApprovalRequestForm
				id={id}
				initialDetail={detail}
				onExit={() => {
					setEditMode(false);
					load();
				}}
			/>
		);
	}

	if (error)
		return <Result status="404" subTitle={t("approval.messages.notFound")} extra={<Button onClick={() => navigate(-1)}>{t("approval.actions.back")}</Button>} />;
	if (!detail)
		return <RequestDetailSkeleton />;

	const { permissions } = detail;
	const flowLinkLabel = rounds.length > 1 ? t("approval.detail.viewAllRounds", { n: rounds.length }) : t("approval.detail.viewFullGraph");
	const fileCount = detail.documents.length + detail.attachments.length;
	// Nhắc sửa & gửi lại chỉ dành cho người gửi lại được; người khác xem lý do ở thẻ quy trình
	const lastReturn = detail.status === ApprovalRequestStatus.Returned && permissions.canSubmit
		? [...detail.histories].reverse().find(h => h.action === ApprovalHistoryAction.Return)
		: undefined;

	return (
		<BasicContent>
			<div className="flex flex-col gap-4">
				{/* Header */}
				<div className="flex items-start justify-between gap-3 flex-wrap">
					<div className="flex items-start gap-2 min-w-0">
						<Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
						<div className="min-w-0">
							<Space size={8} wrap>
								<Title level={4} className="!m-0">{detail.title}</Title>
								<RequestStatusTag status={detail.status} />
								<PriorityTag priority={detail.priority} />
							</Space>
							<div>
								<Text type="secondary">
									{[detail.code, detail.requestType.name, detail.requester.fullName].filter(Boolean).join(" · ")}
								</Text>
							</div>
						</div>
					</div>
					<RequestActions
						detail={detail}
						busy={busy}
						onReload={load}
						onAct={act}
						onSubmit={submit}
						onEdit={() => setEditMode(true)}
						onCancel={cancel}
						onDelete={remove}
						onShare={() => setShareOpen(true)}
					/>
				</div>

				{permissions.canApprove && permissions.isParallel && <Alert type="info" showIcon message={t("approval.detail.waitingParallel")} />}
				{lastReturn && (
					<Alert
						type="warning"
						showIcon
						message={t("approval.form.returnedNotice")}
						description={(
							<div className="flex items-start gap-2.5">
								<UserAvatar size={28} user={lastReturn.actor} />
								<div className="flex min-w-0 flex-col">
									<Text className="text-[13px]">
										<Text strong>{lastReturn.actor?.fullName ?? t("approval.detail.system")}</Text>
										<Text type="secondary">{` · ${t("approval.detail.roundEnd.returned")} ${formatDate(lastReturn.createdAt)}`}</Text>
									</Text>
									{lastReturn.comment && <Text className="whitespace-pre-wrap">{lastReturn.comment}</Text>}
								</div>
							</div>
						)}
					/>
				)}

				<Tabs
					activeKey={activeTab}
					onChange={changeTab}
					tabBarStyle={{ margin: "0 0 16px" }}
					items={[
						{
							key: DetailTab.Info,
							label: tabLabel(<FileTextOutlined />, t("approval.detail.info")),
							children: (
								<div className="flex flex-col gap-4">
									<div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
										<div className="flex min-w-0 flex-col gap-4">
											<SectionCard icon={<FileTextOutlined />} title={t("approval.detail.info")}>
												<Descriptions
													layout="vertical"
													size="small"
													column={{ xs: 1, sm: 2, xl: 3 }}
													items={[
														{ key: "code", label: t("approval.fields.code"), children: detail.code ?? "—" },
														{ key: "type", label: t("approval.fields.requestType"), children: detail.requestType.name },
														{ key: "requester", label: t("approval.fields.requester"), children: <PeoplePicker readonly user={detail.requester} showEmail={false} size="small" className="!min-h-0" /> },
														{ key: "department", label: t("approval.fields.department"), children: detail.department.name },
														{ key: "submittedAt", label: t("approval.fields.submittedAt"), children: formatDate(detail.submittedAt) },
														{ key: "closedAt", label: t("approval.fields.closedAt"), children: formatDate(detail.closedAt) },
														{
															key: "workflow",
															label: t("approval.fields.workflow"),
															children: detail.workflow
																? (
																	<Space size={4}>
																		{detail.workflow.name}
																		<Tag color="geekblue" icon={<BranchesOutlined />} className="m-0 font-semibold">{`v${detail.workflow.version}`}</Tag>
																	</Space>
																)
																: "—",
														},
													]}
												/>
											</SectionCard>
											<SectionCard icon={<ProfileOutlined />} title={t("approval.detail.content")}>
												<PayloadView fields={contentFields} payload={detail.payload} />
											</SectionCard>
										</div>

										<div className="flex min-w-0 flex-col gap-4">
											{/* Quy trình thu gọn chỉ của vòng hiện tại; các vòng trước xem ở tab sơ đồ */}
											{currentRound && (
												<SectionCard
													className="@container"
													icon={<NodeIndexOutlined />}
													title={t("approval.detail.approvalFlow")}
													extra={hasDefinition && (
														// Thẻ hẹp thì chỉ còn mũi tên, chữ xem ở tooltip
														<Tooltip title={flowLinkLabel}>
															<Typography.Link className="whitespace-nowrap" onClick={() => changeTab(DetailTab.Progress)}>
																<span className="hidden @[400px]:inline">{flowLinkLabel}</span>
																<ArrowRightOutlined className="@[400px]:ml-1.5" />
															</Typography.Link>
														</Tooltip>
													)}
												>
													<RoundTimeline
														round={currentRound}
														totalRounds={rounds.length}
														definition={detail.definition}
														userNames={userNames}
														canReassign={permissions.canReassign}
														onReassign={(task) => {
															setReassignTo(undefined);
															setReassignComment("");
															setReassignTask(task);
														}}
													/>
												</SectionCard>
											)}
											<SectionCard
												icon={<ShareAltOutlined />}
												title={(
													<span className="inline-flex items-center gap-2">
														{t("approval.share.sharedWith")}
														<ShareCount count={detail.shares?.length ?? 0} />
													</span>
												)}
												extra={permissions.canShare && (
													<Button type="link" size="small" icon={<ShareAltOutlined />} onClick={() => setShareOpen(true)}>{t("approval.actions.share")}</Button>
												)}
											>
												<ShareList shares={detail.shares ?? []} canRemove={!!permissions.canShare} onRemove={removeShare} />
											</SectionCard>
										</div>
									</div>
								</div>
							),
						},
						{
							key: DetailTab.Progress,
							label: tabLabel(<NodeIndexOutlined />, t("approval.detail.progress")),
							// Sơ đồ chỉ dựng khi mở tab để tự fit đúng kích thước
							destroyOnHidden: true,
							children: (
								<SectionCard icon={<NodeIndexOutlined />} title={t("approval.detail.progress")} noPadding>
									{/* Nhiều vòng (bị trả lại rồi gửi lại): mỗi vòng một tab con, mặc định vòng mới nhất */}
									{rounds.length > 1 && (
										<Tabs
											size="small"
											className="px-5"
											tabBarStyle={{ margin: 0 }}
											activeKey={String(viewingRound?.round)}
											onChange={changeRound}
											items={rounds.map(item => ({
												key: String(item.round),
												label: (
													<span className="inline-flex items-center gap-1.5">
														<Badge status={ROUND_BADGE[item.outcome]} />
														{t("approval.detail.round", { n: item.round })}
														<Text type="secondary" className="text-xs">{`· ${t(`approval.status.${item.outcome}`)}`}</Text>
													</span>
												),
											}))}
										/>
									)}
									{detail.definition && viewingRound
										? (
											<div className="flex flex-col gap-4 p-4">
												<RoundMeta round={viewingRound} />
												<ApprovalFlowGraph
													// Đổi vòng thì dựng lại để sơ đồ tự căn khung
													key={viewingRound.round}
													definition={detail.definition}
													nodeStatus={viewingRound.nodeStatus}
													visitedNodeIds={viewingRound.visitedNodeIds}
													userNames={userNames}
													fields={contentFields}
													height={560}
													onNodeClick={setStepNodeId}
												/>
												<StepDetailDrawer
													nodeId={stepNodeId}
													round={viewingRound}
													definition={detail.definition}
													userNames={userNames}
													fields={contentFields}
													onClose={() => setStepNodeId(null)}
												/>
											</div>
										)
										: <Empty className="py-8" description={t("approval.detail.notSubmitted")} />}
								</SectionCard>
							),
						},
						{
							key: DetailTab.Files,
							label: tabLabel(<PaperClipOutlined />, t("approval.detail.files"), fileCount),
							children: (
								<RoundFiles
									detail={detail}
									downloadingId={downloadingId}
									onView={file => setViewing({ contextType: FileContextType.ApprovalRequest, fileId: file.id, filename: file.filename })}
									onDownload={downloadFile}
								/>
							),
						},
						{
							key: DetailTab.History,
							label: tabLabel(<HistoryOutlined />, t("approval.detail.timeline"), detail.histories.length),
							children: (
								<SectionCard icon={<HistoryOutlined />} title={t("approval.detail.timeline")}>
									<HistoryTimeline histories={detail.histories} formSchema={detail.requestType.formSchema} userNames={{ ...userNames, [detail.requester.id]: detail.requester.fullName }} />
								</SectionCard>
							),
						},
					].filter(item => item.key !== DetailTab.Progress || hasDefinition)}
				/>
			</div>

			<FileViewer target={viewing} onClose={() => setViewing(null)} />
			<ActionModal ref={actionModalRef} />
			<SignApproveModal requestId={detail.id} open={signing} onClose={() => setSigning(false)} onChanged={load} />
			<ShareModal
				requestId={detail.id}
				open={shareOpen}
				onClose={(changed) => {
					setShareOpen(false);
					if (changed)
						load();
				}}
			/>
			<Modal
				open={!!reassignTask}
				title={t("approval.actions.reassign")}
				okText={t("common.confirm")}
				cancelText={t("common.cancel")}
				okButtonProps={{ disabled: !reassignTo, loading: busy }}
				onOk={confirmReassign}
				onCancel={() => setReassignTask(null)}
				destroyOnHidden
			>
				<div className="flex flex-col gap-3">
					<Text type="secondary">{`${reassignTask?.nodeName ?? ""} · ${reassignTask?.approver.name ?? ""}`}</Text>
					<div>
						<Text>{t("approval.detail.reassignTo")}</Text>
						<PeoplePicker
							className="w-full"
							value={reassignTo}
							onChange={value => setReassignTo(typeof value === "string" ? value : (value as { id?: string } | null)?.id)}
						/>
					</div>
					<Input.TextArea rows={3} maxLength={2000} value={reassignComment} placeholder={t("approval.detail.commentPlaceholder")} onChange={e => setReassignComment(e.target.value)} />
				</div>
			</Modal>
		</BasicContent>
	);
}
