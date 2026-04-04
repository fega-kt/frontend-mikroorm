import type { GroupEntity } from "#src/api/system/group";
import type { ProColumns } from "@ant-design/pro-components";

export function getConstantColumns(t: (key: string) => string): ProColumns<GroupEntity>[] {
	return [
		{
			title: t("system.userGroup.name"),
			dataIndex: "name",
			width: 200,
		},
		{
			title: t("system.userGroup.description"),
			dataIndex: "description",
			ellipsis: true,
		},
		{
			title: t("common.createdAt"),
			dataIndex: "created",
			valueType: "dateTime",
			hideInSearch: true,
			width: 160,
		},
	];
}
