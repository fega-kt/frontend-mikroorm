import type { DepartmentEntity } from "#src/api/system/dept";
import type { ActionType, ProColumns, ProCoreActionType } from "@ant-design/pro-components";

import type { DetailRef } from "./components/detail";
import { departmentService } from "#src/api/system/dept";

import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { handleTree } from "#src/utils/tree";
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

	/** Trả về IDs của tất cả node có depth <= maxDepth */
	const getExpandedKeys = (list: DepartmentEntity[], maxDepth = 2): string[] => {
		const depthMap = new Map<string, number>();
		const result: string[] = [];
		// Build depth map
		const computeDepth = (id: string): number => {
			if (depthMap.has(id)) {
				return depthMap.get(id)!;
			}
			const node = list.find(d => d.id === id);
			const parentId = node?.parent as unknown as string | null;
			const depth = parentId ? computeDepth(parentId) + 1 : 0;
			depthMap.set(id, depth);
			return depth;
		};
		for (const item of list) {
			if (computeDepth(item.id) <= maxDepth) {
				result.push(item.id);
			}
		}
		return result;
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
		const deletedId = await departmentService.fetchDeleteDeptItem(id);
		await action?.reload?.();
		window.$message?.success(`${t("common.deleteSuccess")} id = ${deletedId}`);
	};

	const columns: ProColumns<DepartmentEntity>[] = [
		...getConstantColumns(t),
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 120,
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
			<BasicTable<DepartmentEntity>
				adaptive
				columns={columns}
				scroll={{ x: "max-content" }}
				actionRef={actionRef}
				request={async (params) => {
					const list = await departmentService.fetchDeptList(params);
					const deptTree = handleTree(list);
					setExpandedRowKeys(getExpandedKeys(list));
					return {
						data: deptTree,
						total: list.length,
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
