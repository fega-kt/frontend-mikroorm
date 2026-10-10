import type { ActivityLogEntity } from "#src/api/activity-log";
import type { ProColumns } from "@ant-design/pro-components";
import type { TFunction } from "i18next";
import { ActivityLogAction, ActivityLogParentType, ActivityLogType } from "#src/api/activity-log";
import { PeoplePicker } from "#src/components/people-picker";
import { Tag, Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

type T = TFunction<"translation", undefined>;

/** Nhãn của loại đối tượng; loại chưa có bản dịch thì hiện chính tên bảng */
export function getParentTypeLabel(t: T, parentType: string) {
	return t(`system.activityLog.parentTypes.${parentType}`, { defaultValue: parentType });
}

export function getActionLabel(t: T, action: string) {
	return t(`common.history.action.${action}`, { defaultValue: action });
}

function enumOptions(values: string[], getLabel: (value: string) => string) {
	return Object.fromEntries(values.map(value => [value, { text: getLabel(value) }]));
}

export function getConstantColumns(t: T): ProColumns<ActivityLogEntity>[] {
	return [
		{
			title: t("common.createdAt"),
			dataIndex: "createdAt",
			valueType: "dateTime",
			fieldProps: { format: "DD/MM/YYYY HH:mm:ss" },
			hideInSearch: true,
			width: 160,
		},
		{
			// Ô tìm kiếm khoảng thời gian, gửi lên backend thành from/to
			title: t("system.activityLog.timeRange"),
			dataIndex: "createdAtRange",
			valueType: "dateTimeRange",
			hideInTable: true,
			search: {
				transform: (value: [string, string]) => ({
					from: dayjs(value[0]).toISOString(),
					to: dayjs(value[1]).toISOString(),
				}),
			},
		},
		{
			title: t("system.activityLog.actor"),
			dataIndex: "createdBy",
			hideInSearch: true,
			width: 200,
			render: (_, record) => record.createdBy
				? <PeoplePicker user={record.createdBy as any} readonly showEmail={false} />
				: "-",
		},
		{
			title: t("system.activityLog.action"),
			dataIndex: "action",
			width: 200,
			valueType: "select",
			valueEnum: enumOptions(Object.values(ActivityLogAction), value => getActionLabel(t, value)),
			render: (_, record) => <Tag>{getActionLabel(t, record.action)}</Tag>,
		},
		{
			title: t("system.activityLog.type"),
			dataIndex: "type",
			width: 120,
			valueType: "select",
			valueEnum: enumOptions(Object.values(ActivityLogType), value => t(`system.activityLog.types.${value}`)),
			render: (_, record) => t(`system.activityLog.types.${record.type}`),
		},
		{
			title: t("system.activityLog.parentType"),
			dataIndex: "parentType",
			width: 160,
			valueType: "select",
			valueEnum: enumOptions(Object.values(ActivityLogParentType), value => getParentTypeLabel(t, value)),
			render: (_, record) => getParentTypeLabel(t, record.parentType),
		},
		{
			title: t("system.activityLog.parentId"),
			dataIndex: "parentId",
			width: 300,
			ellipsis: true,
			render: (_, record) => <Text copyable={{ text: record.parentId }}>{record.parentId}</Text>,
		},
		{
			title: t("system.activityLog.ip"),
			dataIndex: "ip",
			hideInSearch: true,
			width: 140,
		},
		{
			title: t("system.activityLog.device"),
			dataIndex: "device",
			hideInSearch: true,
			width: 240,
			ellipsis: true,
		},
	];
}
