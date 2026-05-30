import type { RoleEntity } from "#src/api/system/role";
import type { ProColumns } from "@ant-design/pro-components";

export function getConstantColumns(t: (key: string) => string): ProColumns<RoleEntity>[] {
	return [
		{
			title: t("system.role.name"),
			dataIndex: "name",
			width: 150,
		},
		{
			title: t("system.role.description"),
			dataIndex: "description",
			ellipsis: true,
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
