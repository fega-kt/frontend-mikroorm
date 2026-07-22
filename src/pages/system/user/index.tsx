import type { UserEntity } from "#src/api/user/types";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { DetailRef } from "./components/detail";
import { userService } from "#src/api/user";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { DeleteOutlined, EditOutlined, LockOutlined, PlusCircleOutlined, UnlockOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Tooltip } from "antd";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Detail } from "./components/detail";
import { getConstantColumns } from "./constants";

export default function User() {
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const actionRef = useRef<ActionType>(null);
	const detailRef = useRef<DetailRef>(null);

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

	const columns: ProColumns<UserEntity>[] = [
		...getConstantColumns(t),
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 130,
			fixed: "right",
			render: (_, record) => [
				<Tooltip key="edit" title={t("common.edit")}>
					<Button
						type="text"
						size="small"
						icon={<EditOutlined />}
						disabled={!canAccess(PermissionType.UpdateUser)}
						onClick={() => handleEdit(record.id)}
					/>
				</Tooltip>,
				<Popconfirm
					key="toggle-active"
					title={record.isActive ? t("system.user.confirmDeactivate") : t("system.user.confirmActivate")}
					onConfirm={() => handleToggleActive(record.id, !!record.isActive)}
					okText={t("common.confirm")}
					cancelText={t("common.cancel")}
				>
					<Tooltip title={record.isActive ? t("system.user.deactivate") : t("system.user.activate")}>
						<Button
							type="text"
							size="small"
							icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}
							disabled={!canAccess(PermissionType.UpdateUser)}
						/>
					</Tooltip>
				</Popconfirm>,
				<Popconfirm
					key="delete"
					title={t("common.confirmDelete")}
					onConfirm={() => handleDelete(record.id)}
					okText={t("common.confirm")}
					cancelText={t("common.cancel")}
				>
					<Tooltip title={t("common.delete")}>
						<Button
							type="text"
							size="small"
							danger
							icon={<DeleteOutlined />}
							disabled={!canAccess(PermissionType.DeleteUser)}
						/>
					</Tooltip>
				</Popconfirm>,
			],
		},
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
		</BasicContent>
	);
}
