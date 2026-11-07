import type { ActivityLogEntity } from "#src/api/activity-log";
import type { ExportQuery } from "#src/components/export-button";
import type { ColumnsVisibility } from "#src/components/export-button/columns";
import type { ProColumns } from "@ant-design/pro-components";
import type { DetailRef } from "./components/detail";
import { activityLogService } from "#src/api/activity-log";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { ExportButton } from "#src/components/export-button";
import { visibleExportColumns } from "#src/components/export-button/columns";
import { PermissionType } from "#src/hooks/use-access/permission-type.enum";
import { Button } from "antd";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Detail } from "./components/detail";
import { getConstantColumns } from "./constants";

/** Cột bảng (theo `key`) → cột xuất của backend */
const EXPORT_MAPPING: Record<string, string[]> = {
	createdAt: [
		"createdAt",
	],
	actor: [
		"actor",
	],
	type: [
		"type",
	],
	action: [
		"action",
	],
	parentType: [
		"parentType",
	],
	parentId: [
		"parentId",
	],
	ip: [
		"ip",
	],
	device: [
		"device",
	],
};

/** Theo dõi activity log. Phạm vi dữ liệu (toàn hệ thống hay trong phòng ban) do backend quyết định theo quyền của user */
export default function ActivityLog() {
	const { t } = useTranslation();
	const detailRef = useRef<DetailRef>(null);
	// Điều kiện lần tải gần nhất và cột đang hiện — để xuất Excel đúng cái đang xem
	const lastQuery = useRef<ExportQuery>(undefined);
	const [visibility, setVisibility] = useState<ColumnsVisibility>({});

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
				columnsState={{ value: visibility, onChange: setVisibility }}
				request={async (params) => {
					const { data, total } = await activityLogService.fetchList(params);
					lastQuery.current = { filter: params, total };
					return { data, total, success: true };
				}}
				headerTitle={t("system.activityLog.title")}
				toolBarRender={() => [
					<ExportButton
						key="export"
						resource="activity-log"
						permissions={[PermissionType.ExportActivityLog]}
						getQuery={() => lastQuery.current}
						getColumns={() => visibleExportColumns(columns, visibility, EXPORT_MAPPING)}
					/>,
				]}
			/>
			<Detail ref={detailRef} />
		</BasicContent>
	);
}
