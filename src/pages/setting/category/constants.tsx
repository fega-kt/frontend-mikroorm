import type { CategoryEntity } from "#src/api/setting/category";
import type { ProColumns } from "@ant-design/pro-components";

export function getConstantColumns(t: (key: string) => string): ProColumns<CategoryEntity>[] {
	return [
		{
			title: t("setting.category.icon"),
			dataIndex: "icon",
			width: 120,
			hideInSearch: true,
			render: (_, entity) => entity.icon ? <img src={entity.icon} alt="icon" className="w-5 h-5 object-contain" /> : null,
		},
		{
			title: t("setting.category.code"),
			dataIndex: "code",
			width: 150,
		},
		{
			title: t("setting.category.name"),
			dataIndex: "name",
			width: 200,
		},
		{
			title: t("setting.category.department"),
			dataIndex: ["department", "name"],
			width: 180,
			hideInSearch: true,
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
