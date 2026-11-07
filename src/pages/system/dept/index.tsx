import type { DepartmentTreeNode } from "#src/api/system/dept";
import type { HistoryDrawerRef } from "#src/components/activity-history/history-drawer";

import type { ExportQuery } from "#src/components/export-button";
import type { ColumnsVisibility } from "#src/components/export-button/columns";
import type { ActionType, ProColumns, ProCoreActionType } from "@ant-design/pro-components";

import type { DetailRef } from "./components/detail";
import { departmentService } from "#src/api/system/dept";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { ExportButton } from "#src/components/export-button";
import { visibleExportColumns } from "#src/components/export-button/columns";
import { createActionColumn } from "#src/components/row-actions/create-action-column";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { PlusCircleOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useRef, useState } from "react";

import { useTranslation } from "react-i18next";
import { Detail } from "./components/detail";
import { History } from "./components/history";
import { getConstantColumns } from "./constants";

/** Cột bảng (theo `key`) → cột xuất của backend; bảng hiển thị dạng cây còn file xuất là danh sách phẳng cùng bộ lọc */
const EXPORT_MAPPING: Record<string, string[]> = {
	name: [
		"name",
	],
	code: [
		"code",
	],
	parentCode: [
		"parentCode",
	],
	status: [
		"status",
	],
	createdAt: [
		"createdAt",
	],
	updatedAt: [
		"updatedAt",
	],
};

export default function Dept() {
	const { t } = useTranslation();
	const { canAccess } = useAccess();

	const actionRef = useRef<ActionType>(null);
	// Điều kiện lần tải gần nhất và cột đang hiện — để xuất Excel đúng cái đang xem
	const lastQuery = useRef<ExportQuery>(undefined);
	const [visibility, setVisibility] = useState<ColumnsVisibility>({});
	const detailRef = useRef<DetailRef>(null);
	const historyRef = useRef<HistoryDrawerRef>(null);
	const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

	const getExpandedKeys = (nodes: DepartmentTreeNode[], depth = 0, maxDepth = 2): string[] => {
		if (depth >= maxDepth) {
			return [];
		}
		return nodes.flatMap(node => [
			node.id,
			...getExpandedKeys(node.children ?? [], depth + 1, maxDepth),
		]);
	};

	const countTreeNodes = (nodes: DepartmentTreeNode[]): number => {
		return nodes.reduce((sum, node) => sum + 1 + countTreeNodes(node.children ?? []), 0);
	};

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

	const handleDeleteRow = async (id: string, action?: ProCoreActionType<object>) => {
		await departmentService.fetchDeleteDeptItem(id);
		await action?.reload?.();
		window.$message?.success(t("common.deleteSuccess"));
	};

	const handleToggleActive = async (id: string, status: 0 | 1, action?: ProCoreActionType<object>) => {
		await departmentService.fetchUpdateDeptActive(id, status === 1 ? 0 : 1);
		await action?.reload?.();
		window.$message?.success(status === 1 ? t("system.dept.deactivateSuccess") : t("system.dept.activateSuccess"));
	};

	const canUpdate = canAccess(PermissionType.UpdateDeparment);
	// Có quyền xem chi tiết hoặc cập nhật đều xem được lịch sử
	const canViewHistory = canAccess([PermissionType.ViewDeparmentDetail, PermissionType.UpdateDeparment]);
	const canDelete = canAccess(PermissionType.DeleteDeparment);

	const columns: ProColumns<DepartmentTreeNode>[] = [

		...getConstantColumns(t),
		...createActionColumn<DepartmentTreeNode>(t, {
			width: 130,
			onEdit: record => handleEdit(record.id),
			editEnabled: canUpdate,
			toggleActive: {
				active: record => record.status === 1,
				onToggle: (record, action) => handleToggleActive(record.id, record.status, action),
				enabled: canUpdate,
				confirmTitle: record => record.status === 1 ? t("system.dept.confirmDeactivate") : t("system.dept.confirmActivate"),
				tooltipTitle: record => record.status === 1 ? t("system.dept.deactivate") : t("system.dept.activate"),
			},
			onDelete: (record, action) => handleDeleteRow(record.id, action),
			deleteEnabled: canDelete,
			onHistory: record => historyRef.current?.show({ id: record.id, title: record.name, subtitle: record.code }),
			historyEnabled: canViewHistory,
		}),
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<DepartmentTreeNode>
				adaptive
				tableLayout="fixed"
				columns={columns}
				columnsState={{ value: visibility, onChange: setVisibility }}
				scroll={{ x: "min-content" }}
				actionRef={actionRef}
				pagination={{
					showSizeChanger: false,
					showQuickJumper: false,
					itemRender: () => null,
				}}
				request={async (params) => {
					const tree = await departmentService.fetchDeptTreeList(params);
					lastQuery.current = { filter: params, total: countTreeNodes(tree) };
					setExpandedRowKeys(getExpandedKeys(tree));
					return {
						data: tree,
						total: countTreeNodes(tree),
						success: true,
					};
				}}
				expandable={{
					expandedRowKeys,
					onExpandedRowsChange: keys => setExpandedRowKeys(keys as string[]),
				}}
				headerTitle={t("common.menu.dept")}
				toolBarRender={() => [
					<ExportButton
						key="export"
						resource="department"
						permissions={[PermissionType.MenuDeparment, PermissionType.ExportDepartment]}
						getQuery={() => lastQuery.current}
						getColumns={() => visibleExportColumns(columns, visibility, EXPORT_MAPPING)}
					/>,
					<Button
						key="add-dept"
						icon={<PlusCircleOutlined />}
						type="primary"
						disabled={!canAccess(PermissionType.CreateDeparment)}
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
