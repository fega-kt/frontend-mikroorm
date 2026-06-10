import type { RoleEntity } from "#src/api/system/role";
import type { ProColumns } from "@ant-design/pro-components";

export function getConstantColumns(
	t: (key: string) => string,
	pageInfo: { current: number, pageSize: number },
): ProColumns<RoleEntity>[] {
	return [
		{
			title: t("common.stt"),
			valueType: "index",
			width: 50,
			hideInSearch: true,
			render: (_, __, index) => (pageInfo.current - 1) * pageInfo.pageSize + index + 1,
		},
		{
			title: t("system.role.name"),
			dataIndex: "name",
			minWidth: 150,
			ellipsis: true,
		},
		{
			title: t("system.role.description"),
			dataIndex: "description",
			ellipsis: true,
			minWidth: 200,
		},
		{
			title: t("common.createdAt"),
			dataIndex: "createdAt",
			valueType: "dateTime",
			fieldProps: { format: "DD/MM/YYYY HH:mm:ss" },
			hideInSearch: true,
			ellipsis: true,
			width: 150,
		},
	];
}
