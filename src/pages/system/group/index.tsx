import type { GroupEntity } from "#src/api/system/group";
import type { HistoryDrawerRef } from "#src/components/activity-history/history-drawer";
import type { ExportQuery } from "#src/components/export-button";
import type { ColumnsVisibility } from "#src/components/export-button/columns";

import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { DetailRef } from "./components/detail";
import { groupService } from "#src/api/system/group";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { ExportButton } from "#src/components/export-button";
import { visibleExportColumns } from "#src/components/export-button/columns";
import { createActionColumn } from "#src/components/row-actions/create-action-column";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { PlusCircleOutlined } from "@ant-design/icons";
import { App, Button } from "antd";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Detail } from "./components/detail";
import { History } from "./components/history";
import { getConstantColumns } from "./constants";

/** Cột bảng (theo `key`) → cột xuất của backend */
const EXPORT_MAPPING: Record<string, string[]> = {
	name: [
		"name",
	],
	description: [
		"description",
	],
	createdBy: [
		"createdBy",
	],
	createdAt: [
		"createdAt",
	],
	updatedAt: [
		"updatedAt",
	],
};

export default function Group() {
	const { message } = App.useApp();
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const actionRef = useRef<ActionType>(null);
	// Điều kiện lần tải gần nhất và cột đang hiện — để xuất Excel đúng cái đang xem
	const lastQuery = useRef<ExportQuery>(undefined);
	const [visibility, setVisibility] = useState<ColumnsVisibility>({});
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
		await groupService.fetchDeleteGroup(id);
		actionRef.current?.reload();
		message.success(t("common.deleteSuccess"));
	};

	// Generic or User permission used until Group specific perms exist
	const canUpdate = canAccess(PermissionType.UpdateUser);
	// Có quyền xem chi tiết hoặc cập nhật đều xem được lịch sử
	const canViewHistory = canAccess([PermissionType.ViewGroupDetail, PermissionType.UpdateGroup]);
	const canDelete = canAccess(PermissionType.DeleteUser);

	const columns: ProColumns<GroupEntity>[] = [
		...getConstantColumns(t),
		...createActionColumn<GroupEntity>(t, {
			onEdit: record => handleEdit(record.id),
			editEnabled: canUpdate,
			onDelete: record => handleDelete(record.id),
			deleteEnabled: canDelete,
			onHistory: record => historyRef.current?.show({ id: record.id, title: record.name }),
			historyEnabled: canViewHistory,
		}),
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<GroupEntity>
				adaptive
				columns={columns}
				columnsState={{ value: visibility, onChange: setVisibility }}
				actionRef={actionRef}
				request={async (params) => {
					const { data, total } = await groupService.fetchGroupList(params);
					lastQuery.current = { filter: params, total };
					return {
						data,
						total,
						success: true,
					};
				}}
				headerTitle={t("system.userGroup.title")}
				toolBarRender={() => [
					<ExportButton
						key="export"
						resource="group"
						permissions={[PermissionType.MenuGroup, PermissionType.ExportGroup]}
						getQuery={() => lastQuery.current}
						getColumns={() => visibleExportColumns(columns, visibility, EXPORT_MAPPING)}
					/>,
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
			<History ref={historyRef} />
		</BasicContent>
	);
}
