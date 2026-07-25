import { DeleteOutlined, EditOutlined, LockOutlined, UnlockOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Tooltip } from "antd";
import { useTranslation } from "react-i18next";

interface ToggleActiveConfig {
	active: boolean
	onToggle: () => void
	enabled?: boolean
	confirmTitle: string
	tooltipTitle: string
}

interface RowActionsProps {
	onEdit?: () => void
	editEnabled?: boolean
	toggleActive?: ToggleActiveConfig
	onDelete?: () => void
	deleteEnabled?: boolean
	deleteConfirmTitle?: string
}

export function RowActions(props: RowActionsProps) {
	const { onEdit, editEnabled, toggleActive, onDelete, deleteEnabled, deleteConfirmTitle } = props;
	const { active, onToggle, enabled: toggleEnabled, confirmTitle, tooltipTitle } = toggleActive ?? {};
	const { t } = useTranslation();

	return (
		<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
			{onEdit && editEnabled && (
				<Tooltip title={t("common.edit")}>
					<Button
						type="text"
						size="small"
						icon={<EditOutlined />}
						style={{ color: "#1677ff" }}
						onClick={onEdit}
					/>
				</Tooltip>
			)}
			{toggleActive && toggleEnabled && (
				<Popconfirm
					title={confirmTitle}
					onConfirm={onToggle}
					okText={t("common.confirm")}
					cancelText={t("common.cancel")}
				>
					<Tooltip title={tooltipTitle}>
						<Button
							type="text"
							size="small"
							icon={active ? <LockOutlined /> : <UnlockOutlined />}
							style={{ color: active ? "#fa8c16" : "#52c41a" }}
						/>
					</Tooltip>
				</Popconfirm>
			)}
			{onDelete && deleteEnabled && (
				<Popconfirm
					title={deleteConfirmTitle ?? t("common.confirmDelete")}
					onConfirm={onDelete}
					okText={t("common.confirm")}
					cancelText={t("common.cancel")}
				>
					<Tooltip title={t("common.delete")}>
						<Button
							type="text"
							size="small"
							danger
							icon={<DeleteOutlined />}
						/>
					</Tooltip>
				</Popconfirm>
			)}
		</div>
	);
}
