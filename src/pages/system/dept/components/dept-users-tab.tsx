import type { UserInfoType } from "#src/api/user/types";
import { ProTable } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";

interface DeptUsersTabProps {
	users: UserInfoType[]
}

export function DeptUsersTab({ users }: DeptUsersTabProps) {
	const { t } = useTranslation();

	return (
		<ProTable<UserInfoType>
			rowKey="id"
			search={false}
			options={false}
			pagination={{ pageSize: 5, size: "small" }}
			scroll={{ x: "max-content" }}
			dataSource={users}
			columns={[
				{
					title: t("system.user.loginName"),
					dataIndex: "loginName",
					key: "loginName",
					width: 140,
				},
				{
					title: t("system.user.workEmail"),
					dataIndex: "workEmail",
					key: "workEmail",
					width: 200,
				},
				{
					title: t("system.user.phoneNumber"),
					dataIndex: "phoneNumber",
					key: "phoneNumber",
					width: 130,
				},
			]}
		/>
	);
}
