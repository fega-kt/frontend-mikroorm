import type { WorkflowTaskEntity } from "#src/api/workflow-task";
import type { ProColumns } from "@ant-design/pro-components";
import { WorkflowTaskStatus } from "#src/api/workflow-task";
import { Tag } from "antd";

export const workflowTaskStatusColorMap: Record<WorkflowTaskStatus, string> = {
	[WorkflowTaskStatus.Pending]: "processing",
	[WorkflowTaskStatus.Approved]: "success",
	[WorkflowTaskStatus.Rejected]: "error",
	[WorkflowTaskStatus.Returned]: "warning",
	[WorkflowTaskStatus.Cancelled]: "default",
};

export function getConstantColumns(t: (key: string) => string): ProColumns<WorkflowTaskEntity>[] {
	return [
		{
			title: t("setting.workflowTask.workflowInstance"),
			dataIndex: ["workflowInstance", "title"],
			ellipsis: true,
			hideInSearch: true,
		},
		{
			title: t("setting.workflowTask.requester"),
			dataIndex: ["workflowInstance", "requester", "fullName"],
			width: 160,
			hideInSearch: true,
			ellipsis: true,
		},
		{
			title: t("setting.workflowTask.stepName"),
			dataIndex: "stepName",
			width: 160,
			hideInSearch: true,
			ellipsis: true,
		},
		{
			title: t("setting.workflowTask.status"),
			dataIndex: "status",
			width: 130,
			valueType: "select",
			valueEnum: Object.fromEntries(
				Object.values(WorkflowTaskStatus).map(s => [s, { text: t(`setting.workflowTask.statusOptions.${s}`) }]),
			),
			render: (_, entity) => (
				<Tag color={workflowTaskStatusColorMap[entity.status]}>
					{t(`setting.workflowTask.statusOptions.${entity.status}`)}
				</Tag>
			),
		},
		{
			title: t("common.createdAt"),
			dataIndex: "createdAt",
			valueType: "dateTime",
			fieldProps: { format: "DD/MM/YYYY HH:mm:ss" },
			hideInSearch: true,
			width: 180,
		},
	];
}
