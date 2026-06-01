import { ProFormDepartmentPicker } from "#src/components/department-picker";
import { ProFormPeoplePicker } from "#src/components/people-picker";
import {
	ProFormRadio,
	ProFormText,
} from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";

interface DeptInfoTabProps {
	isEditing: boolean
	excludeRootId?: string
}

export function DeptInfoTab({ isEditing, excludeRootId }: DeptInfoTabProps) {
	const { t } = useTranslation();

	return (
		<>
			<ProFormText
				allowClear
				rules={[{ required: true }]}
				name="name"
				label={t("system.dept.name")}
				tooltip={t("form.length", { length: 50 })}
			/>

			<ProFormText
				allowClear
				rules={[{ required: true }]}
				disabled={isEditing}
				name="code"
				label={t("system.dept.code")}
			/>

			<ProFormDepartmentPicker
				name="parent"
				label={t("system.dept.parentDept")}
				excludeRootId={excludeRootId}
			/>

			<ProFormPeoplePicker
				name="manager"
				label={t("system.dept.manager")}
				fieldProps={{
					api: "user",
					allowClear: true,
					showSearch: true,
				}}
			/>

			<ProFormPeoplePicker
				name="deputy"
				label={t("system.dept.deputy")}
				fieldProps={{
					api: "user",
					allowClear: true,
					showSearch: true,
				}}
			/>

			<ProFormRadio.Group
				name="status"
				label={t("common.status")}
				radioType="button"
				options={[
					{
						label: t("common.enabled"),
						value: 1,
					},
					{
						label: t("common.deactivated"),
						value: 0,
					},
				]}
			/>
		</>
	);
}
