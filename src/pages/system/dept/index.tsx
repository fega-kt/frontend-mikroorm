import type { DepartmentEntity } from "#src/api/system/dept";
import type { ActionType, ProColumns, ProCoreActionType } from "@ant-design/pro-components";

import { fetchDeleteDeptItem, fetchDeptList } from "#src/api/system/dept";
import { BasicButton } from "#src/components/basic-button";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";

import { handleTree } from "#src/utils/tree";
import { PlusCircleOutlined } from "@ant-design/icons";
import { Button, Popconfirm } from "antd";
import { useRef, useState } from "react";

import { useTranslation } from "react-i18next";
import { Detail } from "./components/detail";
import { getConstantColumns } from "./constants";

export default function Dept() {
	const { t } = useTranslation();
	const { canAccess } = useAccess();

	const [isOpen, setIsOpen] = useState(false);
	const [title, setTitle] = useState("");
	const [detailData, setDetailData] = useState<Partial<DepartmentEntity>>({});
	const [flatDeptList, setFlatDeptList] = useState<DepartmentEntity[]>([]);

	const actionRef = useRef<ActionType>(null);

	const handleDeleteRow = async (id: string, action?: ProCoreActionType<object>) => {
		const responseData = await fetchDeleteDeptItem(id);
		await action?.reload?.();
		window.$message?.success(`${t("common.deleteSuccess")} id = ${responseData.result}`);
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
					<BasicButton
						key="editable"
						type="link"
						size="small"
						disabled={!canAccess(PermissionType.UpdateDeparment)}
						onClick={async () => {
							setIsOpen(true);
							setTitle(t("system.dept.editDept"));
							setDetailData({ ...record });
						}}
					>
						{t("common.edit")}
					</BasicButton>,
					<Popconfirm
						key="delete"
						title={t("common.confirmDelete")}
						onConfirm={() => handleDeleteRow(record.id, action)}
						okText={t("common.confirm")}
						cancelText={t("common.cancel")}
					>
						<BasicButton
							type="link"
							size="small"
							disabled={!canAccess(PermissionType.DeleteDeparment)}
						>
							{t("common.delete")}
						</BasicButton>
					</Popconfirm>,
				];
			},
		},
	];

	const onCloseChange = () => {
		setIsOpen(false);
		setDetailData({});
	};

	const refreshTable = () => {
		actionRef.current?.reload();
	};

	return (
		<BasicContent className="h-full">
			<BasicTable<DepartmentEntity>
				adaptive
				columns={columns}
				actionRef={actionRef}
				request={async (params) => {
					const responseData = await fetchDeptList(params);
					const deptTree = handleTree(responseData.result);
					setFlatDeptList(responseData.result);
					return {
						...responseData,
						data: deptTree,
						total: responseData.result.length,
					};
				}}
				headerTitle={t("common.menu.dept")}
				toolBarRender={() => [
					<Button
						key="add-dept"
						icon={<PlusCircleOutlined />}
						type="primary"
						disabled={!canAccess(PermissionType.CreateDeparment)}
						onClick={() => {
							setIsOpen(true);
							setTitle(t("system.dept.addDept"));
						}}
					>
						{t("common.add")}
					</Button>,
				]}
			/>
			<Detail
				title={title}
				open={isOpen}
				flatDeptList={flatDeptList}
				onCloseChange={onCloseChange}
				detailData={detailData}
				refreshTable={refreshTable}
			/>
		</BasicContent>
	);
}
