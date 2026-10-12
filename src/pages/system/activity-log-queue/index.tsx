import type { ActivityLogQueueItem } from "#src/api/activity-log-queue";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { activityLogQueueService, ActivityLogQueueStatus } from "#src/api/activity-log-queue";
import { NotificationType } from "#src/api/notifications";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum";
import { RedoOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Tag, Tooltip, Typography } from "antd";
import { useRef } from "react";
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
	approval_requests: id => `/approval/requests/${id}`,
};

/** Hàng đợi gửi mail: mỗi dòng là một email cho một người nhận — trạng thái, số lần thử, lỗi; gửi lại được */
export default function MailQueue() {
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const actionRef = useRef<ActionType>(null);
	const canRetry = canAccess(PermissionType.RetryActivityLogQueue);
	// Mở từ trang tờ trình: ?refId=<id tờ trình>
	const refId = searchParams.get("refId") ?? undefined;

	const retry = async (item: ActivityLogQueueItem) => {
		const res = await activityLogQueueService.fetchRetry(item.id);
		if (res.success)
			window.$message?.success(t("system.mailQueue.retryQueued"));
		else
			window.$message?.error(res.error || t("system.mailQueue.retryFailed"));
		actionRef.current?.reload();
	};

	const columns: ProColumns<ActivityLogQueueItem>[] = [
		{
			title: t("common.createdAt"),
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
			dataIndex: "type",
			valueType: "select",
			width: 220,
			valueEnum: Object.fromEntries(MAIL_TYPES.map(type => [type, { text: t(`notification.${type}.title`, { defaultValue: type }) }])),
			render: (_, item) => t(`notification.${item.type}.title`, { defaultValue: item.type }),
		},
		{
			title: t("system.mailQueue.recipient"),
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
			dataIndex: "status",
			valueType: "select",
			width: 130,
			valueEnum: Object.fromEntries(Object.values(ActivityLogQueueStatus).map(status => [status, { text: t(`system.mailQueue.statuses.${status}`) }])),
			render: (_, item) => <Tag color={STATUS_COLOR[item.status]} className="m-0">{t(`system.mailQueue.statuses.${item.status}`)}</Tag>,
		},
		{
			title: t("system.mailQueue.attempts"),
			dataIndex: "attempts",
			hideInSearch: true,
			width: 90,
			align: "center",
		},
		{
			title: t("system.mailQueue.lastAttemptAt"),
			dataIndex: "lastAttemptAt",
			valueType: "dateTime",
			fieldProps: { format: "DD/MM/YYYY HH:mm:ss" },
			hideInSearch: true,
			width: 160,
		},
		{
			title: t("system.mailQueue.error"),
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
				actionRef={actionRef}
				params={{ refId }}
				request={async (params) => {
					const { items, total } = await activityLogQueueService.fetchList(params);
					return { data: items, total, success: true };
				}}
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
