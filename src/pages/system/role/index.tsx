import type { RoleEntity } from "#src/api/system/role";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { DetailRef } from "./components/detail";

import { roleService } from "#src/api/system/role";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { createActionColumn } from "#src/components/row-actions/create-action-column";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { PlusCircleOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Detail } from "./components/detail";
import { getConstantColumns } from "./constants";

export default function Role() {
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const actionRef = useRef<ActionType>(null);
	const detailRef = useRef<DetailRef>(null);
	const [pageInfo, setPageInfo] = useState({ current: 1, pageSize: 10 });

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
		await roleService.fetchDeleteRole(id);
		actionRef.current?.reload();
		window.$message?.success(t("common.deleteSuccess"));
	};

	const canUpdate = canAccess(PermissionType.UpdateRole);
	const canDelete = canAccess(PermissionType.DeleteRole);

	const columns: ProColumns<RoleEntity>[] = [
		...getConstantColumns(t, pageInfo),
		...createActionColumn<RoleEntity>(t, {
			onEdit: record => handleEdit(record.id),
			editEnabled: canUpdate,
			onDelete: record => handleDelete(record.id),
			deleteEnabled: canDelete,
		}),
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<RoleEntity>
				columns={columns}
				tableLayout="fixed"
				scroll={{ x: 670 }}
				actionRef={actionRef}
				request={async (params) => {
					const { data, total } = await roleService.fetchRoleList(params);
					return {
						data,
						total,
						success: true,
					};
				}}
				pagination={{ onChange: (page, pageSize) => setPageInfo({ current: page, pageSize }) }}
				headerTitle={t("common.menu.role")}
				toolBarRender={() => [
					<Button
						key="add-role"
						icon={<PlusCircleOutlined />}
						type="primary"
						disabled={!canAccess(PermissionType.CreateRole)}
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
