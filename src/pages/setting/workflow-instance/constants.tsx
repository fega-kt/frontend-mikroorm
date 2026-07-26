import type { WorkflowInstanceEntity } from "#src/api/workflow-instance";
import type { ProColumns } from "@ant-design/pro-components";
import { WorkflowInstanceStatus } from "#src/api/workflow-instance";
import { Tag } from "antd";

export const workflowInstanceStatusColorMap: Record<WorkflowInstanceStatus, string> = {
	[WorkflowInstanceStatus.Draft]: "default",
	[WorkflowInstanceStatus.InProgress]: "processing",
	[WorkflowInstanceStatus.Approved]: "success",
	[WorkflowInstanceStatus.Rejected]: "error",
	[WorkflowInstanceStatus.Returned]: "warning",
	[WorkflowInstanceStatus.Cancelled]: "default",
};

export function getConstantColumns(t: (key: string) => string): ProColumns<WorkflowInstanceEntity>[] {
	return [
		{
			title: t("setting.workflowInstance.title"),
			dataIndex: "title",
			ellipsis: true,
		},
		{
			title: t("setting.workflowInstance.requestType"),
			dataIndex: ["requestType", "name"],
			width: 160,
			hideInSearch: true,
			ellipsis: true,
		},
		{
			title: t("setting.workflowInstance.workflowSetting"),
			dataIndex: ["workflowSetting", "name"],
			width: 200,
			hideInSearch: true,
			ellipsis: true,
		},
		{
			title: t("setting.workflowInstance.currentStepName"),
			dataIndex: "currentStepName",
			width: 160,
			hideInSearch: true,
			ellipsis: true,
		},
		{
			title: t("setting.workflowInstance.status"),
			dataIndex: "status",
			width: 130,
			valueType: "select",
			valueEnum: Object.fromEntries(
				Object.values(WorkflowInstanceStatus).map(s => [s, { text: t(`setting.workflowInstance.statusOptions.${s}`) }]),
			),
			render: (_, entity) => (
				<Tag color={workflowInstanceStatusColorMap[entity.status]}>
					{t(`setting.workflowInstance.statusOptions.${entity.status}`)}
				</Tag>
			),
		},
		{
			title: t("setting.workflowInstance.createdAt"),
			dataIndex: "createdAt",
			valueType: "dateTime",
			fieldProps: { format: "DD/MM/YYYY HH:mm:ss" },
			hideInSearch: true,
			width: 180,
		},
	];
}
