import type { ApprovalWorkflowEntity } from "#src/api/approval-workflow";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { DetailRef } from "./components/detail";
import { approvalWorkflowService } from "#src/api/approval-workflow";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { DeleteOutlined, EditOutlined, NodeIndexOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Tooltip } from "antd";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Detail } from "./components/detail";
import { getConstantColumns } from "./constants";

export default function ApprovalWorkflows() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { canAccess } = useAccess();
	const actionRef = useRef<ActionType>(null);
	const detailRef = useRef<DetailRef>(null);

	const openDesigner = (id: string) => navigate(`/setting/approval-workflow/${id}`);

	const handleAdd = async () => {
		const res = await detailRef.current?.show();
		if (res?.isChange && res.id)
			openDesigner(res.id);
	};

	const handleEdit = async (id: string) => {
		const res = await detailRef.current?.show(id);
		if (res?.isChange)
			actionRef.current?.reload();
	};

	const handleDelete = async (id: string) => {
		await approvalWorkflowService.fetchDelete(id);
		actionRef.current?.reload();
		window.$message?.success(t("common.deleteSuccess"));
	};

	const columns: ProColumns<ApprovalWorkflowEntity>[] = [
		...getConstantColumns(t),
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 120,
			fixed: "right",
			render: (_, record) => [
				<Tooltip key="design" title={t("approval.workflow.design")}>
					<Button type="text" size="small" icon={<NodeIndexOutlined />} onClick={() => openDesigner(record.id)} />
				</Tooltip>,
				<Tooltip key="edit" title={t("approval.workflow.edit")}>
					<Button
						type="text"
						size="small"
						icon={<EditOutlined />}
						disabled={!canAccess(PermissionType.UpdateApprovalWorkflow)}
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
						<Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={!canAccess(PermissionType.DeleteApprovalWorkflow)} />
					</Tooltip>
				</Popconfirm>,
			],
		},
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<ApprovalWorkflowEntity>
				columns={columns}
				actionRef={actionRef}
				rowKey="id"
				request={async (params) => {
					const { data, total } = await approvalWorkflowService.fetchList(params);
					return { data, total, success: true };
				}}
				onRow={record => ({ onDoubleClick: () => openDesigner(record.id) })}
				headerTitle={t("approval.workflow.title")}
				toolBarRender={() => [
					<Button
						key="add"
						icon={<PlusCircleOutlined />}
						type="primary"
						disabled={!canAccess(PermissionType.CreateApprovalWorkflow)}
						onClick={handleAdd}
					>
						{t("approval.workflow.add")}
					</Button>,
				]}
			/>
			<Detail ref={detailRef} />
		</BasicContent>
	);
}
