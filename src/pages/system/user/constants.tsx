import type { UserEntity } from "#src/api/user/types";
import type { ProColumns } from "@ant-design/pro-components";
import { PeoplePicker } from "#src/components/people-picker";

export function getConstantColumns(t: any): ProColumns<UserEntity>[] {
	return [
		{
			title: t("system.user.fullName"),
			dataIndex: "fullName",
			width: 180,
			disable: true,
			render: (_, record) => <PeoplePicker user={record} readonly />,
		},
		{
			title: t("system.user.phone"),
			dataIndex: "phoneNumber",
			width: 140,
		},
		{
			title: t("system.dept.name"),
			dataIndex: ["department", "name"],
			width: 150,
			hideInSearch: true,
		},
		{
			title: t("common.status"),
			dataIndex: "isActive",
			width: 150,
			valueType: "select",
			valueEnum: {
				true: { text: t("common.active"), status: "Success" },
				false: { text: t("common.inactive"), status: "Default" },
			},
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
