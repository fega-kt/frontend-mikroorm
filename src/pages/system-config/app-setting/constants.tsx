import type { AppSettingRow, AppSettingValue } from "#src/api/system-config/app-setting";
import type { ProColumns } from "@ant-design/pro-components";
import type { TFunction } from "i18next";
import { PeoplePicker } from "#src/components/people-picker";
import { Space, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

/** Số item tối đa hiển thị trong bảng với value dạng mảng, phần còn lại gộp vào tag "+N". */
const MAX_VISIBLE_ITEMS = 5;

/** Định dạng backend lưu cho type `date`. */
export const DATE_FORMAT = "YYYY-MM-DD";

/** Tên hiển thị của key, chưa có bản dịch thì hiện chính key. */
export function getSettingLabel(t: TFunction<"translation", undefined>, key: string) {
	return t(`system.appSetting.keys.${key}.label`, { defaultValue: key });
}

/** Chuẩn hóa value lưu trong DB (có thể là JSON string) về mảng string. */
export function toStringArray(value: AppSettingValue | null | undefined): string[] {
	if (Array.isArray(value))
		return value.filter((v): v is string => typeof v === "string");
	if (typeof value === "string" && value.trim()) {
		try {
			const parsed: unknown = JSON.parse(value);
			if (Array.isArray(parsed))
				return parsed.filter((v): v is string => typeof v === "string");
		}
		catch {
			return value.split(",").map(v => v.trim()).filter(Boolean);
		}
	}
	return [];
}

function renderValue(t: TFunction<"translation", undefined>, record: AppSettingRow) {
	const notConfigured = <Tag>{t("system.appSetting.notConfigured")}</Tag>;
	if (record.value === undefined || record.value === null || record.value === "")
		return notConfigured;

	switch (record.type) {
		case "emails":
		case "string_array": {
			const items = toStringArray(record.value);
			if (!items.length)
				return notConfigured;
			const visible = items.slice(0, MAX_VISIBLE_ITEMS);
			const hidden = items.slice(MAX_VISIBLE_ITEMS);
			return (
				<Space size={[8, 8]} wrap>
					{visible.map(item => <Tag key={item} className="m-0">{item}</Tag>)}
					{hidden.length > 0 && (
						<Tooltip
							title={(
								<div className="flex flex-col">
									{hidden.map(item => <span key={item}>{item}</span>)}
								</div>
							)}
						>
							<Tag className="m-0 cursor-pointer">{`+${hidden.length}`}</Tag>
						</Tooltip>
					)}
				</Space>
			);
		}
		case "boolean":
			return record.value === true || record.value === "true"
				? <Tag color="success">{t("system.appSetting.on")}</Tag>
				: <Tag>{t("system.appSetting.off")}</Tag>;
		case "number":
			return <Text>{String(record.value)}</Text>;
		case "date":
			return <Text>{dayjs(String(record.value)).format("DD/MM/YYYY")}</Text>;
		case "json":
			return <Text code ellipsis>{typeof record.value === "string" ? record.value : JSON.stringify(record.value)}</Text>;
		default:
			return <Text code copyable ellipsis>{String(record.value)}</Text>;
	}
}

/** Key đã có giá trị trong DB (khác với key chưa cấu hình backend trả về kèm value = null). */
export function isConfigured(record: AppSettingRow) {
	return !!record.id;
}

/** onView: có quyền xem chi tiết thì tên cấu hình bấm được để mở modal xem. */
export function getConstantColumns(t: TFunction<"translation", undefined>, onView?: (record: AppSettingRow) => void): ProColumns<AppSettingRow>[] {
	return [
		{
			title: t("system.appSetting.keyword"),
			dataIndex: "keyword",
			hideInTable: true,
			fieldProps: { placeholder: t("system.appSetting.keywordPlaceholder") },
		},
		{
			title: t("system.appSetting.name"),
			dataIndex: "key",
			hideInSearch: true,
			width: 260,
			disable: true,
			render: (_, record) => (
				<div className="flex flex-col">
					{onView
						? <Typography.Link strong onClick={() => onView(record)}>{getSettingLabel(t, record.key)}</Typography.Link>
						: <Text strong>{getSettingLabel(t, record.key)}</Text>}
					<Text type="secondary" className="text-xs">{record.key}</Text>
				</div>
			),
		},
		{
			title: t("system.appSetting.value"),
			dataIndex: "value",
			hideInSearch: true,
			width: 320,
			render: (_, record) => renderValue(t, record),
		},
		{
			title: t("system.appSetting.description"),
			dataIndex: "description",
			hideInSearch: true,
			width: 260,
			ellipsis: true,
		},
		{
			title: t("common.updatedBy"),
			dataIndex: "updatedBy",
			hideInSearch: true,
			width: 180,
			render: (_, record) => record.updatedBy ? <PeoplePicker user={record.updatedBy as any} readonly showEmail={false} /> : "-",
		},
		{
			title: t("common.updatedAt"),
			dataIndex: "updatedAt",
			hideInSearch: true,
			valueType: "dateTime",
			fieldProps: { format: "DD/MM/YYYY HH:mm:ss" },
			width: 160,
		},
	];
}
