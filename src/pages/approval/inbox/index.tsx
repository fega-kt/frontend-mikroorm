import type { ApprovalActionType, InboxItem } from "#src/api/approval-task";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { ActionModalRef } from "../components/action-modal";
import { approvalRequestService } from "#src/api/approval-request";
import { ApprovalTaskStatus } from "#src/api/approval-request/types";
import { approvalTaskService } from "#src/api/approval-task";
import { PrincipalType } from "#src/api/system/principal";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { UserAvatar } from "#src/components/user-avatar";
import { approvalRequestPath } from "#src/router/extra-info";
import { CheckOutlined, CloseOutlined, EyeOutlined, RollbackOutlined } from "@ant-design/icons";
import { Button, Drawer, Space, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { ActionModal } from "../components/action-modal";
import { PayloadDescriptions } from "../components/form-fields";
import { PriorityTag, RequestStatusTag, TaskStatusTag } from "../components/status-tag";
import { DATE_TIME_FORMAT } from "../lib/payload";

dayjs.extend(relativeTime);

type Tab = "pending" | "done" | "all";

const TAB_TITLE: Record<Tab, string> = {
	pending: "common.menu.approvalReviewPending",
	done: "common.menu.approvalReviewDone",
	all: "common.menu.approvalReview",
};

export default function ApprovalInbox() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const actionRef = useRef<ActionType>(null);
	const actionModalRef = useRef<ActionModalRef>(null);
	// /approval/review/{pending|done|all}
	const segment = useLocation().pathname.split("/").filter(Boolean).pop() as Tab;
	const tab: Tab = segment in TAB_TITLE ? segment : "pending";
	const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
	const [rows, setRows] = useState<InboxItem[]>([]);
	const [preview, setPreview] = useState<InboxItem | null>(null);
	const [acting, setActing] = useState(false);
	const [typeOptions, setTypeOptions] = useState<Record<string, { text: string }>>({});

	useEffect(() => {
		approvalRequestService.fetchRequestTypes()
			.then(list => setTypeOptions(Object.fromEntries(list.map(item => [item.id, { text: item.name }]))))
			.catch(() => {});
	}, []);

	const reload = () => {
		setSelectedKeys([]);
		actionRef.current?.reload();
	};

	const act = async (item: InboxItem, action: ApprovalActionType) => {
		const input = await actionModalRef.current?.open(action, { requireComment: action !== "approve" });
		if (!input)
			return;
		setActing(true);
		try {
			await approvalTaskService.fetchAct(item.request.id, action, input.comment);
			window.$message?.success(t(`approval.messages.${action === "approve" ? "approved" : action === "reject" ? "rejected" : "returned"}`));
			setPreview(null);
			reload();
		}
		finally {
			setActing(false);
		}
	};

	const bulkApprove = () => {
		const requestIds = [...new Set(rows.filter(r => selectedKeys.includes(r.id)).map(r => r.request.id))];
		window.$modal?.confirm({
			title: t("approval.messages.confirmBulkApprove", { count: requestIds.length }),
			okText: t("approval.actions.approve"),
			cancelText: t("common.cancel"),
			onOk: async () => {
				const res = await approvalTaskService.fetchBulkApprove(requestIds);
				const failed = res.results.filter(r => !r.success);
				window.$message?.[failed.length ? "warning" : "success"](t("approval.messages.bulkResult", { ok: res.succeeded, total: requestIds.length }));
				reload();
			},
		});
	};

	/**
	 * Ghi chú dưới tên bước: xử lý thay theo ủy quyền ("Thay A"), task của cả nhóm ("Nhóm X"),
	 * được chia từ nhóm ("Từ nhóm X"), hoặc được gán lại / chuyển cấp từ người khác ("Thay A").
	 */
	const inboxNote = (item: InboxItem) => {
		if (item.onBehalfOf)
			return t("approval.inbox.delegatedFrom", { name: item.onBehalfOf.fullName });
		if (item.approver.type === PrincipalType.Group)
			return t("approval.inbox.groupTask", { name: item.approver.name });
		if (item.originApprover.id !== item.approver.id) {
			return item.originApprover.type === PrincipalType.Group
				? t("approval.inbox.fromGroup", { name: item.originApprover.name })
				: t("approval.inbox.delegatedFrom", { name: item.originApprover.name });
		}
		return null;
	};

	const dueCell = (item: InboxItem) => {
		if (!item.dueAt)
			return "—";
		const due = dayjs(item.dueAt);
		const overdue = due.isBefore(dayjs());
		return (
			<Tooltip title={due.format(DATE_TIME_FORMAT)}>
				{overdue
					? <Tag color="error" className="m-0">{t("approval.messages.overdue")}</Tag>
					: <Typography.Text>{t("approval.messages.dueIn", { time: due.fromNow(true) })}</Typography.Text>}
			</Tooltip>
		);
	};

	const columns: ProColumns<InboxItem>[] = [
		{ title: t("approval.fields.search"), dataIndex: "search", hideInTable: true },
		{
			title: t("approval.fields.title"),
			dataIndex: ["request", "title"],
			width: 280,
			ellipsis: true,
			hideInSearch: true,
			render: (_, item) => (
				<div className="flex flex-col min-w-0">
					{/* Bấm tiêu đề (cũng như cả dòng) mở chi tiết; xem nhanh ở nút con mắt */}
					<Typography.Link ellipsis>{item.request.title}</Typography.Link>
					<Typography.Text type="secondary" className="text-xs">{item.request.code}</Typography.Text>
				</div>
			),
		},
		{
			title: t("approval.form.priority"),
			dataIndex: ["request", "priority"],
			width: 110,
			hideInSearch: true,
			render: (_, item) => <PriorityTag priority={item.request.priority} />,
		},
		{
			title: t("approval.fields.requestType"),
			dataIndex: "requestTypeId",
			width: 160,
			valueType: "select",
			valueEnum: typeOptions,
			render: (_, item) => item.request.requestType.name,
		},
		{
			title: t("approval.fields.requester"),
			dataIndex: ["request", "requester"],
			width: 200,
			hideInSearch: true,
			render: (_, item) => (
				<Space size={6}>
					<UserAvatar size={22} user={item.request.requester} />
					<div className="flex flex-col leading-tight">
						<span>{item.request.requester.fullName}</span>
						<Typography.Text type="secondary" className="text-xs">{item.request.department.name}</Typography.Text>
					</div>
				</Space>
			),
		},
		{
			title: t("approval.fields.step"),
			dataIndex: "nodeName",
			width: 180,
			hideInSearch: true,
			render: (_, item) => (
				<div className="flex flex-col">
					<span>{item.nodeName ?? item.nodeId}</span>
					{/* Xử lý thay / task của nhóm / được chia từ nhóm / gán lại — xem inboxNote */}
					{inboxNote(item) && <Typography.Text type="secondary" className="text-xs">{inboxNote(item)}</Typography.Text>}
				</div>
			),
		},
		tab === "pending"
			? { title: t("approval.fields.dueAt"), dataIndex: "dueAt", width: 130, hideInSearch: true, render: (_, item) => dueCell(item) }
			: {
				title: t("approval.fields.actedAt"),
				dataIndex: "actedAt",
				width: 190,
				hideInSearch: true,
				render: (_, item) => (
					<Space size={6}>
						<TaskStatusTag status={item.status} />
						{item.status === ApprovalTaskStatus.Pending
							? dueCell(item)
							: <span>{item.actedAt ? dayjs(item.actedAt).format(DATE_TIME_FORMAT) : ""}</span>}
					</Space>
				),
			},
		{
			title: t("approval.fields.submittedAt"),
			dataIndex: ["request", "submittedAt"],
			width: 150,
			hideInSearch: true,
			render: (_, item) => (item.request.submittedAt ? dayjs(item.request.submittedAt).format(DATE_TIME_FORMAT) : "—"),
		},
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: tab === "done" ? 70 : 120,
			fixed: "right",
			// Chặn nổi bọt để bấm nút không kích hoạt mở chi tiết của dòng
			render: (_, item) => (
				<span className="inline-flex" onClick={e => e.stopPropagation()}>
					<Tooltip title={t("approval.inbox.quickView")}>
						<Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setPreview(item)} />
					</Tooltip>
					{item.status === ApprovalTaskStatus.Pending && (
						<>
							<Tooltip title={t("approval.actions.approve")}>
								<Button type="text" size="small" className="text-green-600" icon={<CheckOutlined />} onClick={() => act(item, "approve")} />
							</Tooltip>
							<Tooltip title={t("approval.actions.reject")}>
								<Button type="text" size="small" danger icon={<CloseOutlined />} onClick={() => act(item, "reject")} />
							</Tooltip>
						</>
					)}
				</span>
			),
		},
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<InboxItem>
				key={tab}
				columns={columns}
				actionRef={actionRef}
				rowKey="id"
				params={{ tab }}
				request={async (params) => {
					const { data, total } = await approvalTaskService.fetchInbox(params);
					setRows(data);
					return { data, total, success: true };
				}}
				rowSelection={tab === "pending" ? { selectedRowKeys: selectedKeys, onChange: setSelectedKeys } : false}
				// Bấm vào dòng mở chi tiết tờ trình (trừ ô chọn dòng dùng cho duyệt hàng loạt)
				onRow={item => ({
					onClick: (e) => {
						if (!(e.target as HTMLElement).closest(".ant-table-selection-column"))
							navigate(approvalRequestPath.detail(item.request.id));
					},
					style: { cursor: "pointer" },
				})}
				tableAlertRender={false}
				headerTitle={t(TAB_TITLE[tab])}
				toolBarRender={() => tab === "pending" && selectedKeys.length
					? [
						<Button key="bulk" type="primary" icon={<CheckOutlined />} onClick={bulkApprove}>
							{t("approval.actions.bulkApprove", { count: selectedKeys.length })}
						</Button>,
					]
					: []}
			/>

			<Drawer
				open={!!preview}
				width={640}
				title={preview && (
					<Space wrap>
						<span>{preview.request.title}</span>
						<RequestStatusTag status={preview.request.status} />
					</Space>
				)}
				onClose={() => setPreview(null)}
				extra={preview && <Button onClick={() => navigate(approvalRequestPath.detail(preview.request.id))}>{t("approval.actions.view")}</Button>}
				footer={preview && preview.status === ApprovalTaskStatus.Pending && (
					<div className="flex justify-end gap-2">
						<Button icon={<RollbackOutlined />} disabled={acting} onClick={() => act(preview, "return")}>{t("approval.actions.return")}</Button>
						<Button danger icon={<CloseOutlined />} disabled={acting} onClick={() => act(preview, "reject")}>{t("approval.actions.reject")}</Button>
						<Button type="primary" icon={<CheckOutlined />} loading={acting} onClick={() => act(preview, "approve")}>{t("approval.actions.approve")}</Button>
					</div>
				)}
			>
				{preview && (
					<div className="flex flex-col gap-4">
						<Space size={8} wrap>
							<Tag>{preview.request.code}</Tag>
							<span>{preview.request.requestType.name}</span>
							<Typography.Text type="secondary">·</Typography.Text>
							<span>{preview.request.requester.fullName}</span>
							<Typography.Text type="secondary">{preview.request.department.name}</Typography.Text>
						</Space>
						<div>
							<Typography.Text type="secondary">
								{t("approval.fields.step")}
								:
								{" "}
							</Typography.Text>
							<Typography.Text strong>{preview.nodeName ?? preview.nodeId}</Typography.Text>
						</div>
						<PayloadDescriptions fields={preview.request.requestType.formSchema} payload={preview.request.payload} column={1} />
					</div>
				)}
			</Drawer>
			<ActionModal ref={actionModalRef} />
		</BasicContent>
	);
}
