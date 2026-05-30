import type { WorkflowSettingEntity } from "#src/api/setting/workflow-setting";
import type { ProColumns } from "@ant-design/pro-components";
import { WorkflowSettingStatus } from "#src/api/setting/workflow-setting";
import { Tag } from "antd";

const statusColorMap: Record<WorkflowSettingStatus, string> = {
	[WorkflowSettingStatus.Draft]: "default",
	[WorkflowSettingStatus.Published]: "success",
	[WorkflowSettingStatus.Cancelled]: "error",
};

export function getConstantColumns(t: (key: string) => string): ProColumns<WorkflowSettingEntity>[] {
	return [
		{
			title: t("setting.workflowSetting.name"),
			dataIndex: "name",
			width: 220,
		},
		{
			title: t("setting.workflowSetting.category"),
			dataIndex: ["category", "name"],
			width: 200,
			hideInSearch: true,
		},
		{
			title: t("setting.workflowSetting.status"),
			dataIndex: "status",
			width: 130,
			hideInSearch: true,
			render: (_, record) => (
				<Tag color={statusColorMap[record.status]}>
					{t(`setting.workflowSetting.statusOptions.${record.status}`)}
				</Tag>
			),
		},
		{
			title: t("common.createdAt"),
			dataIndex: "createdAt",
			valueType: "dateTime",
			fieldProps: { format: "DD/MM/YYYY HH:mm:ss" },
			hideInSearch: true,
			width: 200,
		},
	];
}
