import type { ActivityLogEntity } from "#src/api/activity-log";
import { ActivityLogAction } from "#src/api/activity-log";
import { Alert, Descriptions, Drawer, Typography } from "antd";
import dayjs from "dayjs";
import { useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import { getActionLabel, getParentTypeLabel } from "../constants";

const { Text } = Typography;

export interface DetailRef {
	show: (log: ActivityLogEntity) => void
}

interface DetailProps {
	ref: React.Ref<DetailRef>
}

function JsonBlock({ title, data }: { title: string, data?: Record<string, any> }) {
	const { t } = useTranslation();
	return (
		<div className="mt-4">
			<Text strong>{title}</Text>
			<pre className="mt-2 max-h-80 overflow-auto rounded-md border border-solid border-colorBorderSecondary bg-colorFillTertiary p-3 text-xs">
				{data && Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : t("system.activityLog.noData")}
			</pre>
		</div>
	);
}

/** Chi tiết một dòng log, gồm dữ liệu trước và sau khi thay đổi */
export function Detail({ ref }: DetailProps) {
	const { t } = useTranslation();
	const [log, setLog] = useState<ActivityLogEntity | null>(null);

	useImperativeHandle(ref, () => ({
		show: next => setLog(next),
	}));

	const actor = log ? (log as any).createdBy : undefined;

	return (
		<Drawer
			open={!!log}
			width={600}
			destroyOnHidden
			title={t("system.activityLog.detail")}
			onClose={() => setLog(null)}
		>
			{log && (
				<>
					{log.action === ActivityLogAction.LOGIN && (
						<Alert type="info" showIcon className="mb-4" message={t("system.activityLog.loginIpNote")} />
					)}
					<Descriptions column={1} size="small" bordered>
						<Descriptions.Item label={t("common.createdAt")}>{dayjs(log.createdAt).format("DD/MM/YYYY HH:mm:ss")}</Descriptions.Item>
						<Descriptions.Item label={t("system.activityLog.actor")}>{actor?.fullName ?? actor?.loginName ?? "-"}</Descriptions.Item>
						<Descriptions.Item label={t("system.activityLog.action")}>{getActionLabel(t, log.action)}</Descriptions.Item>
						<Descriptions.Item label={t("system.activityLog.type")}>{t(`system.activityLog.types.${log.type}`)}</Descriptions.Item>
						<Descriptions.Item label={t("system.activityLog.parentType")}>{getParentTypeLabel(t, log.parentType)}</Descriptions.Item>
						<Descriptions.Item label={t("system.activityLog.parentId")}><Text copyable>{log.parentId}</Text></Descriptions.Item>
						<Descriptions.Item label={t("system.activityLog.ip")}>{log.ip}</Descriptions.Item>
						<Descriptions.Item label={t("system.activityLog.device")}>{log.device}</Descriptions.Item>
						<Descriptions.Item label={t("system.activityLog.requestId")}><Text copyable>{log.requestId}</Text></Descriptions.Item>
					</Descriptions>
					<JsonBlock title={t("system.activityLog.oldData")} data={log.oldData} />
					<JsonBlock title={t("system.activityLog.newData")} data={log.newData} />
				</>
			)}
		</Drawer>
	);
}
