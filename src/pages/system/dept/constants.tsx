import type { DepartmentEntity } from "#src/api/system/dept";
import type { ProColumns } from "@ant-design/pro-components";
import type { TFunction } from "i18next";

import { Tag } from "antd";

export function getConstantColumns(t: TFunction<"translation", undefined>): ProColumns<DepartmentEntity>[] {
	return [

		{
			title: t("system.dept.name"),
			dataIndex: "name",
			ellipsis: true,
			width: 200,
			fieldProps: {
				placeholder: t("common.name"),
			},
			formItemProps: {
				label: t("common.name"),
				rules: [
					{
						required: true,
						message: t("form.required"),
					},
				],
			},
		},
		{
			title: t("system.dept.code"),
			dataIndex: "code",
			width: 150,
			ellipsis: true,
			fieldProps: {
				placeholder: t("common.id"),
			},
			formItemProps: {
				label: t("common.id"),
			},
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
			width: 80,
			render: (text, record) => {
				return <Tag color={record.status === 1 ? "success" : "default"}>{text}</Tag>;
			},
			valueEnum: {
				1: {
					text: t("common.enabled"),
				},
				0: {
					text: t("common.deactivated"),
				},
			},
		},
		{
			title: t("system.dept.userCount"),
			dataIndex: "users",
			width: 120,
			search: false,
			render: (_, record) => {
				return record.users?.length ?? 0;
			},
		},
		{
			title: t("common.createTime"),
			dataIndex: "createdAt",
			valueType: "date",
			width: 150,
			search: false,
		},
		{
			title: t("common.updateTime"),
			dataIndex: "updatedAt",
			valueType: "date",
			width: 170,
			search: false,
		},
	];
}
