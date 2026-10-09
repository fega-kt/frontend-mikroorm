import type { AppSettingRow } from "#src/api/system-config/app-setting";
import { ActivityLogAction } from "#src/api/activity-log/types";
import { appSettingService } from "#src/api/system-config/app-setting";
import { ActivityHistory } from "#src/components/activity-history";
import { Drawer, Typography } from "antd";
import dayjs from "dayjs";
import { useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import { getSettingLabel } from "../constants";

const { Text } = Typography;

const FIELD_LABELS: Record<string, string> = {
	value: "system.appSetting.value",
	description: "system.appSetting.description",
};

/** Với app setting, "tạo" là thiết lập giá trị lần đầu và "xóa" là xóa giá trị */
const ACTION_LABELS: Partial<Record<ActivityLogAction, string>> = {
	[ActivityLogAction.CREATE]: "system.appSetting.historyAction.CREATE",
	[ActivityLogAction.DELETE]: "system.appSetting.historyAction.DELETE",
};

export interface HistoryRef {
	show: (record: AppSettingRow) => void
}

interface HistoryProps {
	ref: React.Ref<HistoryRef>
}

export function History({ ref }: HistoryProps) {
	const { t } = useTranslation();
	const [record, setRecord] = useState<AppSettingRow | null>(null);

	useImperativeHandle(ref, () => ({
		show: setRecord,
	}));

	/** Định dạng value theo type của setting để timeline hiển thị giống bảng */
	const formatValue = (field: string, value: any): string | undefined => {
		if (field !== "value" || !record)
			return undefined;
		if (record.type === "boolean")
			return value === true || value === "true" ? t("system.appSetting.on") : t("system.appSetting.off");
		if (record.type === "date")
			return dayjs(String(value)).format("DD/MM/YYYY");
		return undefined;
	};

	/** Giá trị boolean "Tắt" hiện màu đỏ thay vì xanh */
	const valueTone = (field: string, value: any) => {
		if (field === "value" && record?.type === "boolean" && !(value === true || value === "true"))
			return "error" as const;
		return undefined;
	};

	return (
		<Drawer
			open={!!record}
			width={560}
			destroyOnHidden
			// Body không tự cuộn, để ActivityHistory (fillHeight) chỉ cuộn phần timeline
			styles={{ body: { display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 } }}
			onClose={() => setRecord(null)}
			title={record && (
				<div className="flex flex-col">
					<span>{getSettingLabel(t, record.key)}</span>
					<Text type="secondary" className="text-xs font-normal">{record.key}</Text>
				</div>
			)}
		>
			{record && (
				<ActivityHistory
					queryKey={["app-setting", "history", record.key]}
					fetcher={() => appSettingService.fetchAppSettingHistory(record.key)}
					fieldLabels={FIELD_LABELS}
					formatValue={formatValue}
					valueTone={valueTone}
					actionLabels={ACTION_LABELS}
					fillHeight
				/>
			)}
		</Drawer>
	);
}
