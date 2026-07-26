import type { WorkflowInstanceEntity } from "#src/api/workflow-instance";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import type { DetailRef } from "./components/detail";
import { workflowActionsService } from "#src/api/workflow-actions";
import { workflowInstanceService, WorkflowInstanceStatus } from "#src/api/workflow-instance";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { useAccess } from "#src/hooks/use-access";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum.js";
import { PlayCircleOutlined, PlusCircleOutlined, StopOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Tooltip } from "antd";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Detail } from "./components/detail";
import { getConstantColumns } from "./constants";

export default function WorkflowInstance() {
	const { t } = useTranslation();
	const { canAccess } = useAccess();
	const actionRef = useRef<ActionType>(null);
	const detailRef = useRef<DetailRef>(null);

	const handleAdd = async () => {
		const res = await detailRef.current?.show();
		if (res?.isChange)
			actionRef.current?.reload();
	};

	const handleStart = async (id: string) => {
		await workflowInstanceService.startWorkflowInstance(id);
		actionRef.current?.reload();
		window.$message?.success(t("setting.workflowInstance.startSuccess"));
	};

	const handleCancel = async (id: string) => {
		await workflowActionsService.cancelWorkflow({ workflowInstanceId: id });
		actionRef.current?.reload();
		window.$message?.success(t("setting.workflowInstance.cancelWorkflowSuccess"));
	};

	const columns: ProColumns<WorkflowInstanceEntity>[] = [
		...getConstantColumns(t),
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 96,
			fixed: "right",
			render: (_, record) => [
				record.status === WorkflowInstanceStatus.Draft && (
					<Popconfirm
						key="start"
						title={t("setting.workflowInstance.startConfirm")}
						onConfirm={() => handleStart(record.id)}
						okText={t("common.confirm")}
						cancelText={t("common.cancel")}
					>
						<Tooltip title={t("setting.workflowInstance.start")}>
							<Button
								type="text"
								size="small"
								icon={<PlayCircleOutlined />}
								disabled={!canAccess(PermissionType.UpdateWorkflowInstance)}
							/>
						</Tooltip>
					</Popconfirm>
				),
				record.status === WorkflowInstanceStatus.InProgress && (
					<Popconfirm
						key="cancel"
						title={t("setting.workflowInstance.cancelWorkflowConfirm")}
						onConfirm={() => handleCancel(record.id)}
						okText={t("common.confirm")}
						cancelText={t("common.cancel")}
					>
						<Tooltip title={t("setting.workflowInstance.cancelWorkflow")}>
							<Button
								type="text"
								size="small"
								danger
								icon={<StopOutlined />}
								disabled={!canAccess(PermissionType.CancelWorkflowInstance)}
							/>
						</Tooltip>
					</Popconfirm>
				),
			],
		},
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<WorkflowInstanceEntity>
				columns={columns}
				actionRef={actionRef}
				request={async (params) => {
					const { data, total } = await workflowInstanceService.fetchWorkflowInstanceList(params);
					return { data, total, success: true };
				}}
				headerTitle={t("common.menu.workflowInstance")}
				toolBarRender={() => [
					<Button
						key="add-workflow-instance"
						icon={<PlusCircleOutlined />}
						type="primary"
						disabled={!canAccess(PermissionType.CreateWorkflowInstance)}
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
