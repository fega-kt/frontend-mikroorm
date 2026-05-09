import type { RequestTypeEntity } from "#src/api/setting/request-type";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { DetailRef } from "./components/detail";
import { requestTypeService } from "#src/api/setting/request-type";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { DeleteOutlined, EditOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Tooltip } from "antd";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Detail } from "./components/detail";
import { getConstantColumns } from "./constants";

export default function RequestType() {
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const actionRef = useRef<ActionType>(null);
	const detailRef = useRef<DetailRef>(null);

	const handleAdd = async () => {
		const res = await detailRef.current?.show();
		if (res?.isChange)
			actionRef.current?.reload();
	};

	const handleEdit = async (id: string) => {
		const res = await detailRef.current?.show(id);
		if (res?.isChange)
			actionRef.current?.reload();
	};

	const handleDelete = async (id: string) => {
		await requestTypeService.fetchDeleteRequestType(id);
		actionRef.current?.reload();
		window.$message?.success(t("common.deleteSuccess"));
	};

	const columns: ProColumns<RequestTypeEntity>[] = [
		...getConstantColumns(t),
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 120,
			fixed: "right",
			render: (_, record) => [
				<Tooltip key="edit" title={t("common.edit")}>
					<Button
						type="text"
						size="small"
						icon={<EditOutlined />}
						disabled={!canAccess(PermissionType.UpdateRequestType)}
						onClick={() => handleEdit(record.id)}
					/>
				</Tooltip>,
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
							disabled={!canAccess(PermissionType.DeleteRequestType)}
						/>
					</Tooltip>
				</Popconfirm>,
			],
		},
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<RequestTypeEntity>
				columns={columns}
				actionRef={actionRef}
				request={async (params) => {
					const { data, total } = await requestTypeService.fetchRequestTypeList(params);
					return { data, total, success: true };
				}}
				headerTitle={t("common.menu.requestType")}
				toolBarRender={() => [
					<Button
						key="add-request-type"
						icon={<PlusCircleOutlined />}
						type="primary"
						disabled={!canAccess(PermissionType.CreateRequestType)}
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
