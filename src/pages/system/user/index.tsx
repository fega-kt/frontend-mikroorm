import type { UserEntity } from "#src/api/user/types";
import type { HistoryDrawerRef } from "#src/components/activity-history/history-drawer";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { DetailRef } from "./components/detail";
import { userService } from "#src/api/user";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { createActionColumn } from "#src/components/row-actions/create-action-column";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { PlusCircleOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Detail } from "./components/detail";
import { History } from "./components/history";
import { getConstantColumns } from "./constants";

export default function User() {
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const actionRef = useRef<ActionType>(null);
	const detailRef = useRef<DetailRef>(null);
	const historyRef = useRef<HistoryDrawerRef>(null);

	const handleAdd = async () => {
		const res = await detailRef.current?.show();
		if (res?.isChange) {
			actionRef.current?.reload();
		}
	};

	const handleEdit = async (id: string) => {
		const res = await detailRef.current?.show(id);
		if (res?.isChange) {
			actionRef.current?.reload();
		}
	};

	const handleDelete = async (id: string) => {
		await userService.fetchDeleteUser(id);
		actionRef.current?.reload();
		window.$message?.success(t("common.deleteSuccess"));
	};

	const handleToggleActive = async (id: string, isActive: boolean) => {
		await userService.fetchUpdateUserActive(id, !isActive);
		actionRef.current?.reload();
		window.$message?.success(isActive ? t("system.user.deactivateSuccess") : t("system.user.activateSuccess"));
	};

	const canUpdate = canAccess(PermissionType.UpdateUser);
	// Có quyền xem chi tiết hoặc cập nhật đều xem được lịch sử
	const canViewHistory = canAccess([PermissionType.ViewUserDetail, PermissionType.UpdateUser]);
	const canDelete = canAccess(PermissionType.DeleteUser);

	const columns: ProColumns<UserEntity>[] = [
		...getConstantColumns(t),
		...createActionColumn<UserEntity>(t, {
			width: 130,
			onEdit: record => handleEdit(record.id),
			editEnabled: canUpdate,
			toggleActive: {
				active: record => !!record.isActive,
				onToggle: record => handleToggleActive(record.id, !!record.isActive),
				enabled: canUpdate,
				confirmTitle: record => record.isActive ? t("system.user.confirmDeactivate") : t("system.user.confirmActivate"),
				tooltipTitle: record => record.isActive ? t("system.user.deactivate") : t("system.user.activate"),
			},
			onDelete: record => handleDelete(record.id),
			deleteEnabled: canDelete,
			onHistory: record => historyRef.current?.show({ id: record.id, title: record.fullName, subtitle: record.loginName }),
			historyEnabled: canViewHistory,
		}),
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<UserEntity>
				adaptive
				columns={columns}
				actionRef={actionRef}
				request={async (params) => {
					const { data, total } = await userService.fetchUserList(params);
					return {
						data,
						total,
						success: true,
					};
				}}
				headerTitle={t("common.menu.user")}
				toolBarRender={() => [
					<Button
						key="add-user"
						icon={<PlusCircleOutlined />}
						type="primary"
						disabled={!canAccess(PermissionType.CreateUser)}
						onClick={handleAdd}
					>
						{t("common.add")}
					</Button>,
				]}
			/>
			<Detail ref={detailRef} />
			<History ref={historyRef} />
		</BasicContent>
	);
}
