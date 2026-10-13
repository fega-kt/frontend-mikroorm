import type { ApprovalRequestListItem } from "#src/api/approval-request";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { approvalRequestService, ApprovalRequestStatus } from "#src/api/approval-request";
import { BasicTable } from "#src/components/basic-table";
import { PeoplePicker } from "#src/components/people-picker";
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { DATE_TIME_FORMAT } from "../lib/payload";
import { PriorityTag, RequestStatusTag } from "./status-tag";

/** Nhóm trạng thái của menu "Tờ trình của tôi" */
export type RequestScope = "draft" | "pending" | "completed" | "all";

const SCOPE_STATUSES: Record<RequestScope, ApprovalRequestStatus[] | undefined> = {
	draft: [ApprovalRequestStatus.Draft, ApprovalRequestStatus.Returned],
	pending: [ApprovalRequestStatus.Pending],
	completed: [ApprovalRequestStatus.Approved, ApprovalRequestStatus.Rejected, ApprovalRequestStatus.Cancelled],
	all: undefined,
};

interface RequestTableProps {
	/** mine: tờ trình của tôi; all: tất cả tờ trình (quản trị) */
	mode: "mine" | "all"
	title: string
	/** Chỉ lấy các trạng thái của nhóm (mặc định: toàn bộ) */
	scope?: RequestScope
}

export function RequestTable({ mode, title, scope = "all" }: RequestTableProps) {
	const scopeStatuses = SCOPE_STATUSES[scope];
	const { t } = useTranslation();
	const navigate = useNavigate();
	const actionRef = useRef<ActionType>(null);
	const [typeOptions, setTypeOptions] = useState<Record<string, { text: string }>>({});

	useEffect(() => {
		approvalRequestService.fetchRequestTypes()
			.then(list => setTypeOptions(Object.fromEntries(list.map(item => [item.id, { text: item.name }]))))
			.catch(() => {});
	}, []);

	const view = (id: string) => navigate(`/approval/requests/${id}`);

	const handleDelete = async (id: string) => {
		await approvalRequestService.fetchDelete(id);
		window.$message?.success(t("approval.messages.deleted"));
		actionRef.current?.reload();
	};

	const columns: ProColumns<ApprovalRequestListItem>[] = [
		{ title: t("approval.fields.search"), dataIndex: "search", hideInTable: true },
		{
			title: t("approval.fields.code"),
			dataIndex: "code",
			width: 140,
			hideInSearch: true,
			render: (_, record) => record.code ?? <Typography.Text type="secondary">—</Typography.Text>,
		},
		{
			title: t("approval.fields.title"),
			dataIndex: "title",
			ellipsis: true,
			width: 280,
			hideInSearch: true,
			render: (_, record) => <Typography.Link onClick={() => view(record.id)}>{record.title}</Typography.Link>,
		},
		{
			title: t("approval.fields.requestType"),
			dataIndex: "requestTypeId",
			width: 170,
			valueType: "select",
			valueEnum: typeOptions,
			render: (_, record) => record.requestType.name,
		},
		...(mode === "all"
			? [
				{
					title: t("approval.fields.requester"),
					dataIndex: "requester",
					width: 200,
					hideInSearch: true,
					render: (_: unknown, record: ApprovalRequestListItem) => (
						<PeoplePicker readonly user={record.requester} showEmail={false} />
					),
				} satisfies ProColumns<ApprovalRequestListItem>,
				{
					title: t("approval.fields.department"),
					dataIndex: ["department", "name"],
					width: 160,
					hideInSearch: true,
				} satisfies ProColumns<ApprovalRequestListItem>,
			]
			: []),
		{
			title: t("approval.form.priority"),
			dataIndex: "priority",
			width: 120,
			hideInSearch: true,
			render: (_, record) => <PriorityTag priority={record.priority} />,
		},
		{
			title: t("approval.fields.status"),
			dataIndex: "status",
			width: 130,
			valueType: "select",
			valueEnum: Object.fromEntries((scopeStatuses ?? Object.values(ApprovalRequestStatus)).map(s => [s, { text: t(`approval.status.${s}`) }])),
			// Nhóm chỉ có một trạng thái thì không cần lọc
			hideInSearch: scopeStatuses?.length === 1,
			render: (_, record) => <RequestStatusTag status={record.status} />,
		},
		{
			title: t("approval.fields.submittedAt"),
			dataIndex: "submittedAt",
			width: 150,
			hideInSearch: true,
			render: (_, record) => (record.submittedAt ? dayjs(record.submittedAt).format(DATE_TIME_FORMAT) : "—"),
		},
		{
			title: t("approval.fields.updatedAt"),
			dataIndex: "updatedAt",
			width: 150,
			hideInSearch: true,
			render: (_, record) => dayjs(record.updatedAt).format(DATE_TIME_FORMAT),
		},
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 110,
			fixed: "right",
			render: (_, record) => {
				const editable = mode === "mine" && [ApprovalRequestStatus.Draft, ApprovalRequestStatus.Returned].includes(record.status);
				return [
					<Tooltip key="view" title={t("approval.actions.view")}>
						<Button type="text" size="small" icon={<EyeOutlined />} onClick={() => view(record.id)} />
					</Tooltip>,
					editable && (
						<Tooltip key="edit" title={t("approval.actions.edit")}>
							<Button type="text" size="small" icon={<EditOutlined />} onClick={() => navigate(`/approval/requests/${record.id}/edit`)} />
						</Tooltip>
					),
					mode === "mine" && record.status === ApprovalRequestStatus.Draft && (
						<Popconfirm
							key="delete"
							title={t("approval.messages.confirmDelete")}
							onConfirm={() => handleDelete(record.id)}
							okText={t("common.confirm")}
							cancelText={t("common.cancel")}
						>
							<Tooltip title={t("approval.actions.delete")}>
								<Button type="text" size="small" danger icon={<DeleteOutlined />} />
							</Tooltip>
						</Popconfirm>
					),
				].filter(Boolean);
			},
		},
	];

	return (
		<BasicTable<ApprovalRequestListItem>
			columns={columns}
			actionRef={actionRef}
			rowKey="id"
			request={async (params) => {
				const { data, total } = mode === "mine"
					? await approvalRequestService.fetchMine({ ...params, statuses: params.status ? undefined : scopeStatuses?.join(",") })
					: await approvalRequestService.fetchAll(params);
				return { data, total, success: true };
			}}
			onRow={record => ({ onDoubleClick: () => view(record.id) })}
			headerTitle={title}
			toolBarRender={() => mode === "mine"
				? [
					<Button key="create" type="primary" icon={<PlusCircleOutlined />} onClick={() => navigate("/approval/requests/new")}>
						{t("approval.actions.create")}
					</Button>,
				]
				: []}
		/>
	);
}
