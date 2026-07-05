import type { FlowableTask } from "#src/api/approval/task";
import type { ProColumns } from "@ant-design/pro-components";
import type { TFunction } from "i18next";

export function getConstantColumns(t: TFunction): ProColumns<FlowableTask>[] {
	return [
		{
			title: t("approval.task.taskName"),
			dataIndex: "name",
			ellipsis: true,
			search: false,
		},
		{
			title: t("approval.task.businessKey"),
			dataIndex: "businessKey",
			width: 130,
			search: false,
		},
		{
			title: t("approval.task.processInstanceId"),
			dataIndex: "processInstanceId",
			width: 200,
			ellipsis: true,
			search: false,
			copyable: true,
		},
		{
			title: t("approval.task.createdAt"),
			dataIndex: "created",
			valueType: "dateTime",
			fieldProps: { format: "DD/MM/YYYY HH:mm" },
			width: 155,
			search: false,
		},
	];
}
