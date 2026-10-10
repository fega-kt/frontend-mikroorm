import type { ActivityLogEntity } from "#src/api/activity-log";
import type { ProColumns } from "@ant-design/pro-components";
import type { DetailRef } from "./components/detail";
import { activityLogService } from "#src/api/activity-log";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { Button } from "antd";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Detail } from "./components/detail";
import { getConstantColumns } from "./constants";

/** Theo dõi activity log. Phạm vi dữ liệu (toàn hệ thống hay trong phòng ban) do backend quyết định theo quyền của user */
export default function ActivityLog() {
	const { t } = useTranslation();
	const detailRef = useRef<DetailRef>(null);

	const columns: ProColumns<ActivityLogEntity>[] = [
		...getConstantColumns(t),
		{
			title: t("common.action"),
			valueType: "option",
			fixed: "right",
			width: 100,
			render: (_, record) => [
				<Button key="detail" type="link" size="small" onClick={() => detailRef.current?.show(record)}>
					{t("system.activityLog.detail")}
				</Button>,
			],
		},
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<ActivityLogEntity>
				adaptive
				columns={columns}
				request={async (params) => {
					const { data, total } = await activityLogService.fetchList(params);
					return { data, total, success: true };
				}}
				headerTitle={t("system.activityLog.title")}
			/>
			<Detail ref={detailRef} />
		</BasicContent>
	);
}
