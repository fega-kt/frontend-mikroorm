import type { UserEntity } from "#src/api/user/types";
import { departmentService } from "#src/api/system/dept";
import { BasicTable } from "#src/components/basic-table";
import { useTranslation } from "react-i18next";

interface DeptUsersTabProps {
	departmentId: string
}

export function DeptUsersTab({ departmentId }: DeptUsersTabProps) {
	const { t } = useTranslation();

	return (
		<BasicTable<UserEntity>
			rowKey="id"
			cardBordered={false}
			cardProps={{ ghost: true }}
			search={false}
			options={{ reload: false, density: false, setting: false, fullScreen: false }}
			scroll={{ x: undefined, y: "clamp(200px, calc(100vh - 400px), 480px)" }}
			request={async (params) => {
				const { data, total } = await departmentService.fetchDeptUsers(departmentId, {
					page: params.page,
					limit: params.limit,
				});
				return { data, total, success: true };
			}}
			columns={[
				{
					title: t("system.user.fullName"),
					dataIndex: "fullName",
					key: "fullName",
					width: 220,
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
					width: 220,
				},
				{
					title: t("system.user.phoneNumber"),
					dataIndex: "phoneNumber",
					key: "phoneNumber",
				},
			]}
		/>
	);
}
