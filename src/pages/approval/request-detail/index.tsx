import type { ApprovalRequestDetail, ApprovalTaskItem } from "#src/api/approval-request";
import type { ApprovalActionType } from "#src/api/approval-task";
import type { ActionModalRef } from "../components/action-modal";
import { ApprovalHistoryAction, approvalRequestService, ApprovalRequestStatus } from "#src/api/approval-request";
import { approvalTaskService } from "#src/api/approval-task";
import { ApprovalFlowGraph } from "#src/components/approval-flow-graph";
import { BasicContent } from "#src/components/basic-content";
import { PeoplePicker } from "#src/components/people-picker";
import { SectionCard } from "#src/components/section-card";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum";
import {
	ArrowLeftOutlined,
	CheckOutlined,
	CloseOutlined,
	DeleteOutlined,
	EditOutlined,
	FileTextOutlined,
	HistoryOutlined,
	MailOutlined,
	NodeIndexOutlined,
	PaperClipOutlined,
	ReloadOutlined,
	RollbackOutlined,
	SendOutlined,
	StopOutlined,
	TeamOutlined,
} from "@ant-design/icons";
import { Alert, Button, Descriptions, Empty, Input, Modal, Popconfirm, Result, Skeleton, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { ActionModal } from "../components/action-modal";
import { PayloadDescriptions } from "../components/form-fields";
import { PriorityTag, RequestStatusTag } from "../components/status-tag";
import { DATE_TIME_FORMAT } from "../lib/payload";
import { collectUserNames, computeNodeStatus } from "../lib/progress";
import { HistoryTimeline } from "./components/history-timeline";
import { TaskList } from "./components/task-list";

const { Text, Title } = Typography;

const formatDate = (value?: string) => (value ? dayjs(value).format(DATE_TIME_FORMAT) : "—");

export default function ApprovalRequestDetailPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const canViewMailQueue = useAccess().canAccess(PermissionType.ViewActivityLogQueue);
	const { id } = useParams<{ id: string }>();
	const actionModalRef = useRef<ActionModalRef>(null);
	const [detail, setDetail] = useState<ApprovalRequestDetail>();
	const [error, setError] = useState(false);
	const [busy, setBusy] = useState(false);
	const [reassignTask, setReassignTask] = useState<ApprovalTaskItem | null>(null);
	const [reassignTo, setReassignTo] = useState<string>();
	const [reassignComment, setReassignComment] = useState("");

	const load = useCallback(async () => {
		if (!id)
			return;
		try {
			setDetail(await approvalRequestService.fetchDetail(id));
			setError(false);
		}
		catch {
			setError(true);
		}
	}, [id]);

	useEffect(() => {
		load();
	}, [load]);

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
		navigate("/approval/my/draft", { replace: true });
	};

	const confirmReassign = async () => {
		if (!reassignTask || !reassignTo)
			return;
		await run(() => approvalTaskService.fetchReassign(reassignTask.id, reassignTo, reassignComment || undefined), "approval.messages.reassigned");
		setReassignTask(null);
	};

	if (error)
		return <Result status="404" subTitle={t("approval.messages.notFound")} extra={<Button onClick={() => navigate(-1)}>{t("approval.actions.back")}</Button>} />;
	if (!detail)
		return <BasicContent><Skeleton active paragraph={{ rows: 10 }} /></BasicContent>;

	const { permissions } = detail;
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
							<Button icon={<EditOutlined />} onClick={() => navigate(`/approval/requests/${detail.id}/edit`)}>{t("approval.actions.edit")}</Button>
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

				<div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-4 items-start">
					<div className="flex flex-col gap-4 min-w-0">
						<SectionCard icon={<FileTextOutlined />} title={t("approval.detail.info")}>
							<Descriptions
								size="small"
								column={{ xs: 1, sm: 2 }}
								className="mb-4"
								items={[
									{ key: "code", label: t("approval.fields.code"), children: detail.code ?? "—" },
									{ key: "type", label: t("approval.fields.requestType"), children: detail.requestType.name },
									{ key: "requester", label: t("approval.fields.requester"), children: detail.requester.fullName },
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
							<PayloadDescriptions fields={detail.requestType.formSchema} payload={detail.payload} />
						</SectionCard>

						<SectionCard icon={<NodeIndexOutlined />} title={t("approval.detail.progress")} noPadding>
							{detail.definition
								? (
									<ApprovalFlowGraph
										definition={detail.definition}
										nodeStatus={nodeStatus}
										visitedNodeIds={detail.visitedNodeIds}
										userNames={userNames}
										height={460}
									/>
								)
								: <Empty className="py-8" description={t("approval.detail.notSubmitted")} />}
						</SectionCard>

						{(["documents", "attachments"] as const).map(block => (
							<SectionCard key={block} icon={<PaperClipOutlined />} title={t(`approval.files.${block}`)}>
								{detail[block].length
									? (
										<ul className="m-0 pl-0 list-none flex flex-col gap-1">
											{detail[block].map(file => (
												<li key={file.id}>
													<Typography.Link href={file.url} target="_blank" rel="noreferrer">
														<PaperClipOutlined className="mr-1" />
														{file.filename}
													</Typography.Link>
												</li>
											))}
										</ul>
									)
									: <Text type="secondary">{t("common.noData")}</Text>}
							</SectionCard>
						))}
					</div>

					<div className="flex flex-col gap-4 min-w-0">
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
						<SectionCard icon={<HistoryOutlined />} title={t("approval.detail.timeline")}>
							<HistoryTimeline histories={detail.histories} userNames={{ ...userNames, [detail.requester.id]: detail.requester.fullName }} />
						</SectionCard>
					</div>
				</div>
			</div>

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
