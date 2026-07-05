import { TrimInput } from "#src/components/basic-form";
import { ProFormDepartmentPicker } from "#src/components/department-picker";
import { ProFormPeoplePicker } from "#src/components/people-picker";
import { ProFormRadio } from "@ant-design/pro-components";
import { Form } from "antd";
import { useTranslation } from "react-i18next";

interface DeptInfoTabProps {
	isEditing: boolean
	excludeRootId?: string
}

export function DeptInfoTab({ isEditing, excludeRootId }: DeptInfoTabProps) {
	const { t } = useTranslation();

	return (
		<>
			<Form.Item
				required
				validateFirst
				name="name"
				label={t("system.dept.name")}
				rules={[
					{ required: true, message: t("system.dept.nameRequired") },
					{ max: 255, message: t("system.dept.nameMaxLength") },
					{ pattern: /^\p{L}[\p{L}0-9]*(?:\s[\p{L}0-9]+)*$/u, message: t("system.dept.nameInvalidFormat") },
				]}
			>
				<TrimInput allowClear placeholder={t("common.pleaseInput")} />
			</Form.Item>

			<Form.Item
				required={!isEditing}
				validateFirst
				name="code"
				label={t("system.dept.code")}
				normalize={(v: string) => (v ?? "").toUpperCase()}
				rules={isEditing
					? []
					: [
						{ required: true, message: t("system.dept.codeRequired") },
						{ max: 50, message: t("system.dept.codeMaxLength") },
						{ pattern: /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/, message: t("system.dept.codeInvalidFormat") },
					]}
			>
				<TrimInput disabled={isEditing} allowClear={!isEditing} placeholder={t("common.pleaseInput")} />
			</Form.Item>

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
