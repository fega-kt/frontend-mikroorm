import type { GroupEntity } from "#src/api/system/group";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { DetailRef } from "./components/detail";

import { groupService } from "#src/api/system/group";
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
import { getConstantColumns } from "./constants";

export default function Group() {
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
		await groupService.fetchDeleteGroup(id);
		actionRef.current?.reload();
		window.$message?.success(t("common.deleteSuccess"));
	};

	// Generic or User permission used until Group specific perms exist
	const canUpdate = canAccess(PermissionType.UpdateUser);
	const canDelete = canAccess(PermissionType.DeleteUser);

	const columns: ProColumns<GroupEntity>[] = [
		...getConstantColumns(t),
		...createActionColumn<GroupEntity>(t, {
			onEdit: record => handleEdit(record.id),
			editEnabled: canUpdate,
			onDelete: record => handleDelete(record.id),
			deleteEnabled: canDelete,
		}),
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<GroupEntity>
				adaptive
				columns={columns}
				actionRef={actionRef}
				request={async (params) => {
					const { data, total } = await groupService.fetchGroupList(params);
					return {
						data,
						total,
						success: true,
					};
				}}
				headerTitle={t("system.userGroup.title")}
				toolBarRender={() => [
					<Button
						key="add-group"
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
