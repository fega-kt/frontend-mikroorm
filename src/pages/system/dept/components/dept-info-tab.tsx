import type { DepartmentEntity } from "#src/api/system/dept";
import { fetchUserList } from "#src/api/user";
import { handleTree } from "#src/utils/tree";
import {
	ProFormCascader,
	ProFormRadio,
	ProFormSelect,
	ProFormText,
} from "@ant-design/pro-components";
import { Spin } from "antd";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface DeptInfoTabProps {
	isEditing: boolean
	validParentList: DepartmentEntity[]
}

export function DeptInfoTab({ isEditing, validParentList }: DeptInfoTabProps) {
	const { t } = useTranslation();
	const [userOptions, setUserOptions] = useState<{ label: string, value: string }[]>([]);
	const [usersLoading, setUsersLoading] = useState(false);
	const usersFetched = useRef(false);

	const loadUsers = async () => {
		if (usersFetched.current)
			return;
		usersFetched.current = true;
		setUsersLoading(true);
		try {
			const list = await fetchUserList();
			setUserOptions(list.map(u => ({ label: u.fullName, value: u.id })));
		}
		finally {
			setUsersLoading(false);
		}
	};

	const userSelectProps = {
		labelInValue: true,
		optionFilterProp: "label",
		options: userOptions,
		notFoundContent: usersLoading
			? (
				<div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 8, height: 100 }}>
					<Spin size="small" />
					<span style={{ fontSize: 12, color: "var(--ant-color-text-description)" }}>{t("common.loading")}</span>
				</div>
			)
			: undefined,
		onDropdownVisibleChange: (open: boolean) => {
			if (open)
				loadUsers();
		},
	};

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

			<ProFormCascader
				name="parent"
				label={t("system.dept.parentDept")}
				transform={(value: string[]) => ({
					parent: value?.[value.length - 1] ?? null,
				})}
				fieldProps={{
					showSearch: true,
					autoClearSearchValue: true,
					changeOnSelect: true,
					options: handleTree(validParentList),
					fieldNames: {
						label: "name",
						value: "id",
						children: "children",
					},
				}}
			/>

			<ProFormSelect
				name="manager"
				label={t("system.dept.manager")}
				allowClear
				showSearch
				fieldProps={userSelectProps}
			/>

			<ProFormSelect
				name="deputy"
				label={t("system.dept.deputy")}
				allowClear
				showSearch
				fieldProps={userSelectProps}
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
