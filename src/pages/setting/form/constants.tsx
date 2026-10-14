import type { FormEntity } from "#src/api/setting/form";
import type { ProColumns } from "@ant-design/pro-components";

export function getConstantColumns(t: (key: string) => string): ProColumns<FormEntity>[] {
	return [
		{
			title: t("setting.form.code"),
			dataIndex: "code",
			width: 180,
			ellipsis: true,
			hideInSearch: true,
		},
		{
			title: t("setting.form.name"),
			dataIndex: "name",
			width: 240,
			ellipsis: true,
			hideInSearch: true,
		},
		{
			title: t("setting.form.description"),
			dataIndex: "description",
			ellipsis: true,
			hideInSearch: true,
		},
		{
			title: t("common.createdAt"),
			dataIndex: "createdAt",
			valueType: "dateTime",
			fieldProps: { format: "DD/MM/YYYY HH:mm:ss" },
			hideInSearch: true,
			width: 200,
		},
		{
			// Ô tìm kiếm chung theo mã / tên (backend lọc theo `search`)
			title: t("common.search"),
			dataIndex: "search",
			hideInTable: true,
		},
	];
}
