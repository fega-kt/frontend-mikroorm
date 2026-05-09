import type { RequestTypeEntity } from "#src/api/setting/request-type";
import type { ProColumns } from "@ant-design/pro-components";
import { RequestTypeStatus } from "#src/api/setting/request-type";
import { Tag } from "antd";

const statusColorMap: Record<RequestTypeStatus, string> = {
	[RequestTypeStatus.Draft]: "default",
	[RequestTypeStatus.Published]: "success",
	[RequestTypeStatus.Cancelled]: "error",
};

export function getConstantColumns(t: (key: string) => string): ProColumns<RequestTypeEntity>[] {
	return [
		{
			title: t("setting.requestType.code"),
			dataIndex: "code",
			width: 150,
		},
		{
			title: t("setting.requestType.name"),
			dataIndex: "name",
			width: 200,
		},
		{
			title: t("setting.requestType.category"),
			dataIndex: ["category", "name"],
			width: 180,
			hideInSearch: true,
		},
		{
			title: t("setting.requestType.prefix"),
			dataIndex: "prefix",
			width: 120,
			hideInSearch: true,
		},
		{
			title: t("setting.requestType.status"),
			dataIndex: "status",
			width: 130,
			hideInSearch: true,
			render: (_, record) => (
				<Tag color={statusColorMap[record.status]}>
					{t(`setting.requestType.statusOptions.${record.status}`)}
				</Tag>
			),
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
