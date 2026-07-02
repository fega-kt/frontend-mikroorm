import type { GroupEntity } from "#src/api/system/group";
import type { ProColumns } from "@ant-design/pro-components";
import { PeoplePicker } from "#src/components/people-picker";

export function getConstantColumns(t: (key: string) => string): ProColumns<GroupEntity>[] {
	return [
		{
			title: t("system.userGroup.name"),
			dataIndex: "name",
			width: 200,
			disable: true,
			ellipsis: true,
		},
		{
			title: t("system.userGroup.description"),
			dataIndex: "description",
			width: 300,
			ellipsis: true,
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
			width: 160,
		},
	];
}
