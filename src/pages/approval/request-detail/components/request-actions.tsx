import type { ApprovalRequestDetail } from "#src/api/approval-request";
import type { ApprovalActionType } from "#src/api/approval-task";
import type { MenuProps } from "antd";
import { ApprovalRequestStatus } from "#src/api/approval-request";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum";
import { approvalRequestPath } from "#src/router/extra-info";
import {
	CheckOutlined,
	CloseOutlined,
	DeleteOutlined,
	EditOutlined,
	EllipsisOutlined,
	MailOutlined,
	ReloadOutlined,
	RollbackOutlined,
	SendOutlined,
	ShareAltOutlined,
	StopOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Space } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

interface RequestActionsProps {
	detail: ApprovalRequestDetail
	/** Đang có thao tác chạy → khóa các nút */
	busy: boolean
	onReload: () => void
	onAct: (action: ApprovalActionType) => void
	onSubmit: () => void
	onCancel: () => void
	onDelete: () => void
	onShare: () => void
}

/**
 * Nút thao tác trên đầu trang chi tiết: chỉ để lộ làm mới, từ chối, duyệt;
 * các thao tác còn lại gom vào menu "…" ở cuối (chỉ hiện mục người xem được phép làm).
 */
export function RequestActions({ detail, busy, onReload, onAct, onSubmit, onCancel, onDelete, onShare }: RequestActionsProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const canViewMailQueue = useAccess().canAccess(PermissionType.ViewActivityLogQueue);
	const { permissions } = detail;

	const moreItems = [
		permissions.canSubmit && {
			key: "submit",
			icon: <SendOutlined />,
			label: t(detail.status === ApprovalRequestStatus.Returned ? "approval.actions.resubmit" : "approval.actions.submit"),
			onClick: onSubmit,
		},
		permissions.canEdit && {
			key: "edit",
			icon: <EditOutlined />,
			label: t("approval.actions.edit"),
			onClick: () => navigate(approvalRequestPath.edit(detail.id)),
		},
		permissions.canReturn && { key: "return", icon: <RollbackOutlined />, label: t("approval.actions.return"), onClick: () => onAct("return") },
		permissions.canShare && { key: "share", icon: <ShareAltOutlined />, label: t("approval.actions.share"), onClick: onShare },
		canViewMailQueue && {
			key: "emails",
			icon: <MailOutlined />,
			label: t("approval.actions.viewEmails"),
			onClick: () => navigate(`/activity-log/mail-queue?refId=${detail.id}`),
		},
		permissions.canCancel && detail.status !== ApprovalRequestStatus.Draft && {
			key: "cancel",
			icon: <StopOutlined />,
			label: t("approval.actions.cancel"),
			onClick: onCancel,
		},
		permissions.canDelete && {
			key: "delete",
			icon: <DeleteOutlined />,
			label: t("approval.actions.delete"),
			danger: true,
			// Menu không chứa được Popconfirm → hỏi lại bằng hộp xác nhận
			onClick: () => window.$modal?.confirm({
				title: t("approval.messages.confirmDelete"),
				okText: t("common.confirm"),
				cancelText: t("common.cancel"),
				okButtonProps: { danger: true },
				onOk: onDelete,
			}),
		},
	].filter(Boolean) as NonNullable<MenuProps["items"]>;

	return (
		<Space wrap>
			<Button icon={<ReloadOutlined />} onClick={onReload} disabled={busy} />
			{permissions.canReject && (
				<Button danger icon={<CloseOutlined />} disabled={busy} onClick={() => onAct("reject")}>{t("approval.actions.reject")}</Button>
			)}
			{permissions.canApprove && (
				<Button type="primary" icon={<CheckOutlined />} loading={busy} onClick={() => onAct("approve")}>{t("approval.actions.approve")}</Button>
			)}
			{moreItems.length > 0 && (
				<Dropdown menu={{ items: moreItems }} trigger={["click"]} placement="bottomRight" disabled={busy}>
					<Button icon={<EllipsisOutlined />} />
				</Dropdown>
			)}
		</Space>
	);
}
