import type { DepartmentTreeNode } from "#src/api/system/dept";
import type { ProColumns } from "@ant-design/pro-components";
import type { TFunction } from "i18next";
import { PeoplePicker } from "#src/components/people-picker";
import { Tag, Tooltip } from "antd";

export function getConstantColumns(t: TFunction<"translation", undefined>): ProColumns<DepartmentTreeNode>[] {
	return [
		{
			title: t("system.dept.name"),
			dataIndex: "name",
			width: 200,
			disable: true,
			ellipsis: true,
			render: (_, record) => (
				<Tooltip title={record.name} placement="topLeft">
					<span>{record.name}</span>
				</Tooltip>
			),
		},
		{
			title: t("system.dept.code"),
			dataIndex: "code",
			width: 150,
			ellipsis: true,
		},
		{
			title: t("system.dept.parentCode"),
			dataIndex: "parentCode",
			width: 200,
			ellipsis: true,
			search: false,
		},
		{
			disable: true,
			title: t("common.status"),
			dataIndex: "status",
			valueType: "select",
			ellipsis: true,
			width: 150,
			render: (text, record) => {
				return <Tag color={record.status === 1 ? "success" : "default"}>{text}</Tag>;
			},
			valueEnum: {
				1: { text: t("common.enabled") },
				0: { text: t("common.deactivated") },
			},
		},
		{
			title: t("common.createdBy"),
			dataIndex: "createdBy",
			search: false,
			width: 180,
			render: (_, record) => record.createdBy ? <PeoplePicker user={record.createdBy as any} readonly showEmail={false} /> : "-",
		},
		{
			title: t("common.createdAt"),
			dataIndex: "createdAt",
			valueType: "dateTime",
			fieldProps: { format: "DD/MM/YYYY HH:mm:ss" },
			width: 160,
			search: false,
		},
		{
			title: t("common.updatedBy"),
			dataIndex: "updatedBy",
			search: false,
			width: 180,
			render: (_, record) => record.updatedBy ? <PeoplePicker user={record.updatedBy as any} readonly showEmail={false} /> : "-",
		},
		{
			title: t("common.updatedAt"),
			dataIndex: "updatedAt",
			valueType: "dateTime",
			fieldProps: { format: "DD/MM/YYYY HH:mm:ss" },
			width: 160,
			search: false,
		},
	];
}
