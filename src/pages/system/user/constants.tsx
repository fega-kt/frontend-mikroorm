import type { UserEntity } from "#src/api/user/types";
import type { ProColumns } from "@ant-design/pro-components";
import { PeoplePicker } from "#src/components/people-picker";

export function getConstantColumns(t: any): ProColumns<UserEntity>[] {
	return [
		{
			title: t("system.user.fullName"),
			dataIndex: "fullName",
			width: 180,
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
			dataIndex: "status",
			width: 100,
			valueType: "select",
			valueEnum: {
				1: { text: t("common.active"), status: "Success" },
				0: { text: t("common.inactive"), status: "Default" },
			},
		},
		{
			title: t("common.createdAt"),
			dataIndex: "createdAt",
			valueType: "dateTime",
			hideInSearch: true,
			width: 160,
		},
	];
}
