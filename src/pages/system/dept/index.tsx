import type { DepartmentTreeNode } from "#src/api/system/dept";
import type { ActionType, ProColumns, ProCoreActionType } from "@ant-design/pro-components";

import type { DetailRef } from "./components/detail";
import { departmentService } from "#src/api/system/dept";

import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { DeleteOutlined, EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Tooltip } from "antd";
import { useRef, useState } from "react";

import { useTranslation } from "react-i18next";
import { Detail } from "./components/detail";
import { getConstantColumns } from "./constants";

export default function Dept() {
	const { t } = useTranslation();
	const { canAccess } = useAccess();

	const actionRef = useRef<ActionType>(null);
	const detailRef = useRef<DetailRef>(null);
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

	const columns: ProColumns<DepartmentTreeNode>[] = [

		...getConstantColumns(t),
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 96,
			fixed: "right",
			render: (text, record, _, action) => {
				return [
					<Tooltip key="edit" title={t("common.edit")}>
						<Button
							type="text"
							size="small"
							icon={<EditOutlined />}
							disabled={!canAccess(PermissionType.UpdateDeparment)}
							onClick={() => handleEdit(record.id)}
						/>
					</Tooltip>,
					<Popconfirm
						key="delete"
						title={t("common.confirmDelete")}
						onConfirm={() => handleDeleteRow(record.id, action)}
						okText={t("common.confirm")}
						cancelText={t("common.cancel")}
					>
						<Tooltip title={t("common.delete")}>
							<Button
								type="text"
								size="small"
								danger
								icon={<DeleteOutlined />}
								disabled={!canAccess(PermissionType.DeleteDeparment)}
							/>
						</Tooltip>
					</Popconfirm>,
				];
			},
		},
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<DepartmentTreeNode>
				adaptive
				tableLayout="fixed"
				columns={columns}
				scroll={{ x: "min-content" }}
				actionRef={actionRef}
				pagination={{
					showSizeChanger: false,
					showQuickJumper: false,
					itemRender: () => null,
				}}
				request={async (params) => {
					const tree = await departmentService.fetchDeptTreeList(params);
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
		</BasicContent>
	);
}
