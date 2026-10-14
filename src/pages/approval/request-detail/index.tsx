import type { ApprovalTaskItem } from "#src/api/approval-request";
import type { ApprovalActionType } from "#src/api/approval-task";
import type { FileViewTarget } from "#src/components/file-viewer";
import type { ReactNode } from "react";
import type { ActionModalRef } from "../components/action-modal";
import { ApprovalHistoryAction, approvalRequestService, ApprovalRequestStatus, ApprovalTaskStatus } from "#src/api/approval-request";
import { approvalTaskService } from "#src/api/approval-task";
import { FileContextType, fileViewService } from "#src/api/file-view";
import { ApprovalFlowGraph } from "#src/components/approval-flow-graph";
import { BasicContent } from "#src/components/basic-content";
import { FileViewer } from "#src/components/file-viewer";
import { PeoplePicker } from "#src/components/people-picker";
import { SectionCard } from "#src/components/section-card";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum";
import { ApprovalPath, approvalRequestPath } from "#src/router/extra-info";
import {
	ArrowLeftOutlined,
	ArrowRightOutlined,
	CheckOutlined,
	CloseOutlined,
	DeleteOutlined,
	EditOutlined,
	FileTextOutlined,
	HistoryOutlined,
	MailOutlined,
	NodeIndexOutlined,
	PaperClipOutlined,
	ProfileOutlined,
	ReloadOutlined,
	RollbackOutlined,
	SendOutlined,
	StopOutlined,
	TeamOutlined,
} from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Alert, Button, Descriptions, Empty, Input, Modal, Popconfirm, Result, Space, Tabs, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ActionModal } from "../components/action-modal";
import { PayloadDescriptions } from "../components/form-fields";
import { RequestDetailSkeleton } from "../components/page-skeleton";
import { PriorityTag, RequestStatusTag } from "../components/status-tag";
import { fileListSummary } from "../lib/files";
import { DATE_TIME_FORMAT } from "../lib/payload";
import { collectUserNames, computeNodeStatus } from "../lib/progress";
import ApprovalRequestForm from "../request-form";
import { HistoryTimeline } from "./components/history-timeline";
import { RequestFileList } from "./components/request-file-list";
import { ReviewProgress } from "./components/review-progress";
import { TaskList } from "./components/task-list";

const { Text, Title } = Typography;

/** Các tab của màn chi tiết; giá trị là tham số `?tab=` trên URL (info là mặc định nên không ghi ra URL) */
enum DetailTab {
	Info = "info",
	Progress = "progress",
	Files = "files",
	History = "history",
}

function tabLabel(icon: ReactNode, text: string, count?: number) {
	return (
		<span className="inline-flex items-center gap-1.5">
			{icon}
			{text}
			{!!count && <Tag bordered={false} className="m-0 rounded-full px-1.5 leading-4">{count}</Tag>}
		</span>
	);
}

const formatDate = (value?: string) => (value ? dayjs(value).format(DATE_TIME_FORMAT) : "—");

export default function ApprovalRequestDetailPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const canViewMailQueue = useAccess().canAccess(PermissionType.ViewActivityLogQueue);
	const { id } = useParams<{ id: string }>();
	const [searchParams, setSearchParams] = useSearchParams();
	const actionModalRef = useRef<ActionModalRef>(null);
	// Cache theo id: quay lại tab là có dữ liệu ngay, bản mới tải ngầm rồi cập nhật (chỉ lần đầu mới có skeleton)
	const { data: detail, error: loadError, refreshAsync } = useRequest(
		() => approvalRequestService.fetchDetail(id!),
		{ ready: !!id, refreshDeps: [id], cacheKey: `approval-request-${id}`, staleTime: 5000 },
	);
	// Tờ trình nháp chưa có quy trình thì không có tab sơ đồ
	const hasDefinition = !!detail?.definition;
	const activeTab = Object.values(DetailTab).find(key => key === searchParams.get("tab") && (key !== DetailTab.Progress || hasDefinition)) ?? DetailTab.Info;
	// Chỉ báo không tìm thấy khi chưa có dữ liệu nào; làm mới ngầm lỗi thì giữ bản đang hiện
	const error = !!loadError && !detail;
	const [busy, setBusy] = useState(false);
	const [viewing, setViewing] = useState<FileViewTarget | null>(null);
	const [downloadingId, setDownloadingId] = useState<string | null>(null);
	const [reassignTask, setReassignTask] = useState<ApprovalTaskItem | null>(null);
	const [reassignTo, setReassignTo] = useState<string>();
	const [reassignComment, setReassignComment] = useState("");

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
	};

	const nodeStatus = useMemo(() => (detail ? computeNodeStatus(detail) : {}), [detail]);
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

	// Chế độ sửa nằm ngay trong trang chi tiết nên cùng 1 tab; thoát thì tải lại chi tiết
	if (searchParams.get("mode") === "edit" && id) {
		return (
			<ApprovalRequestForm
				id={id}
				initialDetail={detail}
				onExit={() => {
					setSearchParams((prev) => {
						const next = new URLSearchParams(prev);
						next.delete("mode");
						return next;
					}, { replace: true });
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
	const fileCount = detail.documents.length + detail.attachments.length;
	const pendingTasks = detail.tasks.filter(task => task.round === detail.round && task.status === ApprovalTaskStatus.Pending);
	const lastReturn = detail.status === ApprovalRequestStatus.Returned
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
					<Space wrap>
						<Button icon={<ReloadOutlined />} onClick={load} disabled={busy} />
						{canViewMailQueue && (
							<Button icon={<MailOutlined />} onClick={() => navigate(`/activity-log/mail-queue?refId=${detail.id}`)}>{t("approval.actions.viewEmails")}</Button>
						)}
						{permissions.canEdit && (
							<Button icon={<EditOutlined />} onClick={() => navigate(approvalRequestPath.edit(detail.id))}>{t("approval.actions.edit")}</Button>
						)}
						{permissions.canDelete && (
							<Popconfirm title={t("approval.messages.confirmDelete")} onConfirm={remove} okText={t("common.confirm")} cancelText={t("common.cancel")}>
								<Button danger icon={<DeleteOutlined />}>{t("approval.actions.delete")}</Button>
							</Popconfirm>
						)}
						{permissions.canCancel && detail.status !== ApprovalRequestStatus.Draft && (
							<Button icon={<StopOutlined />} disabled={busy} onClick={cancel}>{t("approval.actions.cancel")}</Button>
						)}
						{permissions.canSubmit && (
							<Button type="primary" icon={<SendOutlined />} loading={busy} onClick={submit}>
								{t(detail.status === ApprovalRequestStatus.Returned ? "approval.actions.resubmit" : "approval.actions.submit")}
							</Button>
						)}
						{permissions.canReturn && (
							<Button icon={<RollbackOutlined />} disabled={busy} onClick={() => act("return")}>{t("approval.actions.return")}</Button>
						)}
						{permissions.canReject && (
							<Button danger icon={<CloseOutlined />} disabled={busy} onClick={() => act("reject")}>{t("approval.actions.reject")}</Button>
						)}
						{permissions.canApprove && (
							<Button type="primary" icon={<CheckOutlined />} loading={busy} onClick={() => act("approve")}>{t("approval.actions.approve")}</Button>
						)}
					</Space>
				</div>

				{permissions.canApprove && permissions.isParallel && <Alert type="info" showIcon message={t("approval.detail.waitingParallel")} />}
				{lastReturn && (
					<Alert
						type="warning"
						showIcon
						message={t("approval.form.returnedNotice")}
						description={lastReturn.comment && `${lastReturn.actor?.fullName ?? ""}: ${lastReturn.comment}`}
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
									{detail.definition && (
										<SectionCard
											icon={<NodeIndexOutlined />}
											title={t("approval.detail.reviewProgress")}
											extra={(
												<Typography.Link onClick={() => changeTab(DetailTab.Progress)}>
													{t("approval.detail.viewFullGraph")}
													<ArrowRightOutlined className="ml-1.5" />
												</Typography.Link>
											)}
										>
											<ReviewProgress
												definition={detail.definition}
												nodeStatus={nodeStatus}
												userNames={userNames}
												fields={detail.requestType.formSchema}
												pendingTasks={pendingTasks}
											/>
										</SectionCard>
									)}

									<div className={detail.tasks.length ? "grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]" : "grid grid-cols-1 gap-4"}>
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
																		<Tag className="m-0">{`v${detail.workflow.version}`}</Tag>
																	</Space>
																)
																: "—",
														},
													]}
												/>
											</SectionCard>
											<SectionCard icon={<ProfileOutlined />} title={t("approval.detail.content")}>
												<PayloadDescriptions fields={detail.requestType.formSchema} payload={detail.payload} />
											</SectionCard>
										</div>

										{detail.tasks.length > 0 && (
											<SectionCard icon={<TeamOutlined />} title={t("approval.detail.tasks")}>
												<TaskList
													tasks={detail.tasks}
													canReassign={permissions.canReassign}
													onReassign={(task) => {
														setReassignTo(undefined);
														setReassignComment("");
														setReassignTask(task);
													}}
												/>
											</SectionCard>
										)}
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
									{detail.definition
										? (
											<ApprovalFlowGraph
												definition={detail.definition}
												nodeStatus={nodeStatus}
												visitedNodeIds={detail.visitedNodeIds}
												userNames={userNames}
												height={560}
											/>
										)
										: <Empty className="py-8" description={t("approval.detail.notSubmitted")} />}
								</SectionCard>
							),
						},
						{
							key: DetailTab.Files,
							label: tabLabel(<PaperClipOutlined />, t("approval.detail.files"), fileCount),
							children: (
								<div className="flex flex-col gap-4">
									{(["documents", "attachments"] as const).map(block => (
										<SectionCard
											key={block}
											icon={<PaperClipOutlined />}
											title={t(`approval.files.${block}`)}
											extra={detail[block].length > 0 && <Text type="secondary" className="text-[13px]">{fileListSummary(detail[block], t)}</Text>}
											bodyClassName={detail[block].length ? "px-2 py-2" : undefined}
										>
											{detail[block].length
												? (
													<RequestFileList
														files={detail[block]}
														downloadingId={downloadingId}
														onView={file => setViewing({ contextType: FileContextType.ApprovalRequest, fileId: file.id, filename: file.filename })}
														onDownload={downloadFile}
													/>
												)
												: <Text type="secondary">{t("common.noData")}</Text>}
										</SectionCard>
									))}
								</div>
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
					<Text type="secondary">{`${reassignTask?.nodeName ?? ""} · ${reassignTask?.approver?.fullName ?? ""}`}</Text>
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
