import type { ApprovalRequestListItem } from "#src/api/approval-request";
import type { ExportQuery } from "#src/components/export-button";
import type { ColumnsVisibility } from "#src/components/export-button/columns";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { approvalRequestService, ApprovalRequestStatus } from "#src/api/approval-request";
import { BasicTable } from "#src/components/basic-table";
import { ExportButton } from "#src/components/export-button";
import { visibleExportColumns } from "#src/components/export-button/columns";
import { PeoplePicker } from "#src/components/people-picker";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum";
import { approvalRequestPath } from "#src/router/extra-info";
import { DeleteOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { DATE_TIME_FORMAT } from "../lib/payload";
import { RequestScope, RequestTableMode, SCOPE_STATUSES } from "../lib/scope";
import { PriorityTag, RequestStatusTag } from "./status-tag";

/** Cột bảng (theo `key`) → cột xuất của backend */
const EXPORT_MAPPING: Record<string, string[]> = {
	code: ["code"],
	title: ["title"],
	requestType: ["requestType"],
	requester: ["requester"],
	department: ["department"],
	priority: ["priority"],
	status: ["status"],
	submittedAt: ["submittedAt"],
	updatedAt: ["updatedAt"],
};

interface RequestTableProps {
	/** mine: tờ trình của tôi; all: tất cả tờ trình (quản trị) */
	mode: RequestTableMode
	title: string
	/** Chỉ lấy các trạng thái của nhóm (mặc định: toàn bộ) */
	scope?: RequestScope
}

export function RequestTable({ mode, title, scope = RequestScope.All }: RequestTableProps) {
	const scopeStatuses = SCOPE_STATUSES[scope];
	const { t } = useTranslation();
	const navigate = useNavigate();
	const actionRef = useRef<ActionType>(null);
	// Điều kiện lần tải gần nhất (đúng thứ đã gửi lên API) và cột người dùng đang hiện — để xuất Excel đúng cái đang xem
	const lastQuery = useRef<ExportQuery>(undefined);
	const [visibility, setVisibility] = useState<ColumnsVisibility>({});
	const [typeOptions, setTypeOptions] = useState<Record<string, { text: string }>>({});

	useEffect(() => {
		approvalRequestService.fetchRequestTypes()
			.then(list => setTypeOptions(Object.fromEntries(list.map(item => [item.id, { text: item.name }]))))
			.catch(() => {});
	}, []);

	const view = (id: string) => navigate(approvalRequestPath.detail(id));
	// Xóa nháp chỉ có ở nhóm "Đang soạn"; "Toàn bộ" và các nhóm khác không có cột thao tác
	const hasRowActions = mode === RequestTableMode.Mine && !!scopeStatuses?.includes(ApprovalRequestStatus.Draft);

	const handleDelete = async (id: string) => {
		await approvalRequestService.fetchDelete(id);
		window.$message?.success(t("approval.messages.deleted"));
		actionRef.current?.reload();
	};

	const columns: ProColumns<ApprovalRequestListItem>[] = [
		{ title: t("approval.fields.search"), dataIndex: "search", hideInTable: true },
		{
			title: t("approval.fields.code"),
			key: "code",
			dataIndex: "code",
			width: 140,
			hideInSearch: true,
			render: (_, record) => record.code ?? <Typography.Text type="secondary">—</Typography.Text>,
		},
		{
			title: t("approval.fields.title"),
			key: "title",
			dataIndex: "title",
			ellipsis: true,
			width: 280,
			hideInSearch: true,
			render: (_, record) => (
				<Typography.Link onClick={(e) => {
					e.stopPropagation();
					view(record.id);
				}}
				>
					{record.title}
				</Typography.Link>
			),
		},
		{
			title: t("approval.fields.requestType"),
			key: "requestType",
			dataIndex: "requestTypeId",
			width: 170,
			ellipsis: true,
			valueType: "select",
			valueEnum: typeOptions,
			render: (_, record) => record.requestType.name,
		},
		...(mode === RequestTableMode.All
			? [
				{
					title: t("approval.fields.requester"),
					key: "requester",
					dataIndex: "requester",
					width: 200,
					hideInSearch: true,
					render: (_: unknown, record: ApprovalRequestListItem) => (
						<PeoplePicker readonly user={record.requester} showEmail={false} />
					),
				} satisfies ProColumns<ApprovalRequestListItem>,
				{
					title: t("approval.fields.department"),
					key: "department",
					dataIndex: ["department", "name"],
					width: 160,
					hideInSearch: true,
				} satisfies ProColumns<ApprovalRequestListItem>,
			]
			: []),
		{
			title: t("approval.form.priority"),
			key: "priority",
			dataIndex: "priority",
			width: 120,
			hideInSearch: true,
			render: (_, record) => <PriorityTag priority={record.priority} />,
		},
		{
			title: t("approval.fields.status"),
			key: "status",
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
			key: "submittedAt",
			dataIndex: "submittedAt",
			width: 150,
			hideInSearch: true,
			render: (_, record) => (record.submittedAt ? dayjs(record.submittedAt).format(DATE_TIME_FORMAT) : "—"),
		},
		{
			title: t("approval.fields.updatedAt"),
			key: "updatedAt",
			dataIndex: "updatedAt",
			width: 150,
			hideInSearch: true,
			render: (_, record) => dayjs(record.updatedAt).format(DATE_TIME_FORMAT),
		},
		// Chỉ hiện cột thao tác ở nhóm có nháp để xóa (mở chi tiết bằng cách bấm vào dòng)
		...(hasRowActions
			? [
				{
					title: t("common.action"),
					valueType: "option",
					key: "option",
					width: 80,
					fixed: "right",
					render: (_: unknown, record: ApprovalRequestListItem) => {
						// Xem / sửa là một: bấm dòng để mở chi tiết (sửa được thì vào thẳng chế độ sửa) nên cột này chỉ còn xóa nháp
						if (record.status !== ApprovalRequestStatus.Draft)
							return null;
						// Chặn nổi bọt (kể cả từ popup của Popconfirm) để không kích hoạt mở chi tiết của dòng
						return (
							<span className="inline-flex" onClick={e => e.stopPropagation()}>
								<Popconfirm
									title={t("approval.messages.confirmDelete")}
									onConfirm={() => handleDelete(record.id)}
									okText={t("common.confirm")}
									cancelText={t("common.cancel")}
								>
									<Tooltip title={t("approval.actions.delete")}>
										<Button type="text" size="small" danger icon={<DeleteOutlined />} />
									</Tooltip>
								</Popconfirm>
							</span>
						);
					},
				} satisfies ProColumns<ApprovalRequestListItem>,
			]
			: []),
	];

	return (
		<BasicTable<ApprovalRequestListItem>
			columns={columns}
			actionRef={actionRef}
			rowKey="id"
			columnsState={{ value: visibility, onChange: setVisibility }}
			request={async (params) => {
				// Cùng một bộ lọc cho danh sách và cho xuất Excel (đã gồm nhóm trạng thái ngầm của màn)
				const query = mode === RequestTableMode.Mine ? { ...params, statuses: params.status ? undefined : scopeStatuses?.join(",") } : params;
				const { data, total } = mode === RequestTableMode.Mine
					? await approvalRequestService.fetchMine(query)
					: await approvalRequestService.fetchAll(query);
				lastQuery.current = { filter: query, total };
				return { data, total, success: true };
			}}
			onRow={record => ({ onClick: () => view(record.id), style: { cursor: "pointer" } })}
			headerTitle={title}
			// Tạo mới chỉ ở màn "Đang soạn" (và trang chủ), các nhóm trạng thái khác chỉ để theo dõi
			toolBarRender={() => [
				<ExportButton
					key="export"
					resource={mode === RequestTableMode.Mine ? "approval-request-mine" : "approval-request-all"}
					permissions={mode === RequestTableMode.Mine
						? [PermissionType.ExportApproval]
						: [PermissionType.MenuAllApprovalRequest, PermissionType.ExportApproval]}
					getQuery={() => lastQuery.current}
					getColumns={() => visibleExportColumns(columns, visibility, EXPORT_MAPPING)}
				/>,
				...(mode === RequestTableMode.Mine && scope === RequestScope.Draft
					? [
						<Button key="create" type="primary" icon={<PlusCircleOutlined />} onClick={() => navigate(approvalRequestPath.create)}>
							{t("approval.actions.create")}
						</Button>,
					]
					: []),
			]}
		/>
	);
}
