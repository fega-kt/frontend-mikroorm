import type { ActivityLogQueueItem } from "#src/api/activity-log-queue";
import type { ExportQuery } from "#src/components/export-button";
import type { ColumnsVisibility } from "#src/components/export-button/columns";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { activityLogQueueService, ActivityLogQueueStatus } from "#src/api/activity-log-queue";
import { NotificationType } from "#src/api/notifications";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { ExportButton } from "#src/components/export-button";
import { visibleExportColumns } from "#src/components/export-button/columns";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum";
import { approvalRequestPath } from "#src/router/extra-info";
import { RedoOutlined } from "@ant-design/icons";
import { App, Button, Popconfirm, Tag, Tooltip, Typography } from "antd";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";

const { Text } = Typography;

const STATUS_COLOR: Record<ActivityLogQueueStatus, string> = {
	[ActivityLogQueueStatus.Draft]: "default",
	[ActivityLogQueueStatus.InProgress]: "processing",
	[ActivityLogQueueStatus.Completed]: "success",
	[ActivityLogQueueStatus.Failed]: "error",
	[ActivityLogQueueStatus.Skipped]: "warning",
};

/** Loại email có thể gửi lại (có queue xử lý ở backend) */
const MAIL_TYPES = Object.values(NotificationType).filter(type => type.startsWith("APPROVAL_") || type === NotificationType.LOGIN_INACTIVE_REMINDER);

const REF_ROUTE: Record<string, (id: string) => string> = {
	approval_requests: id => approvalRequestPath.detail(id),
};

/** Hàng đợi gửi mail: mỗi dòng là một email cho một người nhận — trạng thái, số lần thử, lỗi; gửi lại được */
/** Cột bảng (theo `key`) → cột xuất của backend */
const EXPORT_MAPPING: Record<string, string[]> = {
	createdAt: [
		"createdAt",
	],
	type: [
		"type",
	],
	recipient: [
		"recipient",
	],
	subject: [
		"subject",
	],
	status: [
		"status",
	],
	attempts: [
		"attempts",
	],
	lastAttemptAt: [
		"lastAttemptAt",
	],
	error: [
		"error",
	],
};

export default function MailQueue() {
	const { message } = App.useApp();
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const actionRef = useRef<ActionType>(null);
	// Điều kiện lần tải gần nhất và cột đang hiện — để xuất Excel đúng cái đang xem
	const lastQuery = useRef<ExportQuery>(undefined);
	const [visibility, setVisibility] = useState<ColumnsVisibility>({});
	const canRetry = canAccess(PermissionType.RetryActivityLogQueue);
	// Mở từ trang tờ trình: ?refId=<id tờ trình>
	const refId = searchParams.get("refId") ?? undefined;

	const retry = async (item: ActivityLogQueueItem) => {
		const res = await activityLogQueueService.fetchRetry(item.id);
		if (res.success)
			message.success(t("system.mailQueue.retryQueued"));
		else
			message.error(res.error || t("system.mailQueue.retryFailed"));
		actionRef.current?.reload();
	};

	const columns: ProColumns<ActivityLogQueueItem>[] = [
		{
			title: t("common.createdAt"),
			key: "createdAt",
			dataIndex: "createdAt",
			valueType: "dateTime",
			fieldProps: { format: "DD/MM/YYYY HH:mm:ss" },
			hideInSearch: true,
			width: 160,
		},
		{
			title: t("system.mailQueue.keyword"),
			dataIndex: "keyword",
			hideInTable: true,
			fieldProps: { placeholder: t("system.mailQueue.keywordPlaceholder") },
		},
		{
			title: t("system.mailQueue.type"),
			key: "type",
			dataIndex: "type",
			valueType: "select",
			width: 220,
			valueEnum: Object.fromEntries(MAIL_TYPES.map(type => [type, { text: t(`notification.${type}.title`, { defaultValue: type }) }])),
			render: (_, item) => t(`notification.${item.type}.title`, { defaultValue: item.type }),
		},
		{
			title: t("system.mailQueue.recipient"),
			key: "recipient",
			dataIndex: "recipient",
			hideInSearch: true,
			width: 230,
			render: (_, item) => (
				<div className="flex min-w-0 flex-col">
					<span>{item.user?.fullName ?? item.userId}</span>
					<Text type="secondary" className="text-xs" ellipsis>{item.recipient ?? item.user?.loginName ?? "—"}</Text>
				</div>
			),
		},
		{
			title: t("system.mailQueue.subject"),
			key: "subject",
			dataIndex: "subject",
			hideInSearch: true,
			ellipsis: true,
			render: (_, item) => {
				const route = item.refType && item.refId ? REF_ROUTE[item.refType]?.(item.refId) : undefined;
				return (
					<div className="flex min-w-0 flex-col">
						<Text ellipsis={{ tooltip: item.subject }}>{item.subject ?? "—"}</Text>
						{route && (
							<Typography.Link className="text-xs" onClick={() => navigate(route)}>{t("system.mailQueue.openRef")}</Typography.Link>
						)}
					</div>
				);
			},
		},
		{
			title: t("system.mailQueue.status"),
			key: "status",
			dataIndex: "status",
			valueType: "select",
			width: 130,
			valueEnum: Object.fromEntries(Object.values(ActivityLogQueueStatus).map(status => [status, { text: t(`system.mailQueue.statuses.${status}`) }])),
			render: (_, item) => <Tag color={STATUS_COLOR[item.status]} className="m-0">{t(`system.mailQueue.statuses.${item.status}`)}</Tag>,
		},
		{
			title: t("system.mailQueue.attempts"),
			key: "attempts",
			dataIndex: "attempts",
			hideInSearch: true,
			width: 90,
			align: "center",
		},
		{
			title: t("system.mailQueue.lastAttemptAt"),
			key: "lastAttemptAt",
			dataIndex: "lastAttemptAt",
			valueType: "dateTime",
			fieldProps: { format: "DD/MM/YYYY HH:mm:ss" },
			hideInSearch: true,
			width: 160,
		},
		{
			title: t("system.mailQueue.error"),
			key: "error",
			dataIndex: "error",
			hideInSearch: true,
			width: 240,
			render: (_, item) => (item.error
				? <Text type={item.status === ActivityLogQueueStatus.Failed ? "danger" : "warning"} ellipsis={{ tooltip: item.error }}>{item.error}</Text>
				: "—"),
		},
		{
			title: t("common.action"),
			valueType: "option",
			fixed: "right",
			width: 90,
			render: (_, item) => [
				<Popconfirm
					key="retry"
					title={t(item.status === ActivityLogQueueStatus.Completed ? "system.mailQueue.confirmResend" : "system.mailQueue.confirmRetry")}
					onConfirm={() => retry(item)}
					okText={t("common.confirm")}
					cancelText={t("common.cancel")}
					disabled={!canRetry || item.status === ActivityLogQueueStatus.InProgress}
				>
					<Tooltip title={t("system.mailQueue.retry")}>
						<Button type="text" size="small" icon={<RedoOutlined />} disabled={!canRetry || item.status === ActivityLogQueueStatus.InProgress} />
					</Tooltip>
				</Popconfirm>,
			],
		},
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<ActivityLogQueueItem>
				adaptive
				columns={columns}
				columnsState={{ value: visibility, onChange: setVisibility }}
				actionRef={actionRef}
				params={{ refId }}
				request={async (params) => {
					const { items, total } = await activityLogQueueService.fetchList(params);
					lastQuery.current = { filter: params, total };
					return { data: items, total, success: true };
				}}
				toolBarRender={() => [
					<ExportButton
						key="export"
						resource="activity-log-queue"
						permissions={[PermissionType.ViewActivityLogQueue, PermissionType.ExportActivityLogQueue]}
						getQuery={() => lastQuery.current}
						getColumns={() => visibleExportColumns(columns, visibility, EXPORT_MAPPING)}
					/>,
				]}
				headerTitle={(
					<div className="flex flex-wrap items-center gap-2">
						<span>{t("common.menu.mailQueue")}</span>
						{refId && (
							<Tag closable className="m-0" onClose={() => navigate("/activity-log/mail-queue")}>
								{t("system.mailQueue.filteredByRef")}
							</Tag>
						)}
					</div>
				)}
			/>
		</BasicContent>
	);
}
