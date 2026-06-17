import type { RoleEntity } from "#src/api/system/role";
import type { ProColumns } from "@ant-design/pro-components";
import { PeoplePicker } from "#src/components/people-picker";

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
			width: 200,
			disable: true,
			ellipsis: true,
		},
		{
			title: t("system.role.description"),
			dataIndex: "description",
			ellipsis: true,
			width: 300,
		},
		{
			title: t("common.createdBy"),
			dataIndex: "createdBy",
			hideInSearch: true,
			width: 180,
			render: (_, record) => record.createdBy ? <PeoplePicker user={record.createdBy as any} readonly showEmail={false} /> : "-",
		},
		{
			title: t("common.createdAt"),
			dataIndex: "createdAt",
			valueType: "dateTime",
			fieldProps: { format: "DD/MM/YYYY HH:mm:ss" },
			hideInSearch: true,
			ellipsis: true,
			width: 160,
		},
		{
			title: t("common.updatedBy"),
			dataIndex: "updatedBy",
			hideInSearch: true,
			width: 180,
			render: (_, record) => record.updatedBy ? <PeoplePicker user={record.updatedBy as any} readonly showEmail={false} /> : "-",
		},
		{
			title: t("common.updatedAt"),
			dataIndex: "updatedAt",
			valueType: "dateTime",
			fieldProps: { format: "DD/MM/YYYY HH:mm:ss" },
			hideInSearch: true,
			ellipsis: true,
			width: 160,
		},
	];
}
