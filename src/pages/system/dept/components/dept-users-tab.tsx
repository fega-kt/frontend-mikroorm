import type { UserEntity } from "#src/api/user/types";
import { ProTable } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";

interface DeptUsersTabProps {
	users: UserEntity[]
}

export function DeptUsersTab({ users }: DeptUsersTabProps) {
	const { t } = useTranslation();

	return (
		<ProTable<UserEntity>
			rowKey="id"
			search={false}
			options={false}
			pagination={{ pageSize: 5, size: "small", showTotal: total => t("common.paginationUser", { total }) }}
			scroll={{ x: "max-content" }}
			dataSource={users}
			columns={[
				{
					title: t("system.user.fullName"),
					dataIndex: "fullName",
					key: "fullName",
					width: 180,
					render: (_, record) => (
						<span className="flex items-center gap-2">
							<span
								className="inline-block w-2 h-2 rounded-full shrink-0"
								style={{ background: record.isActive ? "#52c41a" : "#d9d9d9" }}
							/>
							{record.fullName}
						</span>
					),
				},
				{
					title: t("system.user.loginName"),
					dataIndex: "loginName",
					key: "loginName",
					width: 140,
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
