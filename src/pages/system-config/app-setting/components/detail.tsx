import type { AppSettingKeyOption, AppSettingRow, AppSettingValue } from "#src/api/system-config/app-setting";
import type { Dayjs } from "dayjs";
import { appSettingService } from "#src/api/system-config/app-setting";
import { TrimInput, TrimTextArea } from "#src/components/basic-form";
import { ModalForm } from "@ant-design/pro-components";
import { DatePicker, Form, Input, InputNumber, Select, Spin, Switch, Typography } from "antd";
import dayjs from "dayjs";
import { useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import { DATE_FORMAT, getSettingLabel, toStringArray } from "../constants";

const { Text } = Typography;

const EMAIL_REGEX = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;

/** view: chỉ xem, create: chọn key chưa có giá trị rồi thiết lập, edit: sửa key đã có giá trị */
export type DetailMode = "view" | "create" | "edit";

/** Giá trị trong form: như AppSettingValue, riêng `date` là Dayjs và `json` là chuỗi đang soạn. */
type FormValue = AppSettingValue | Dayjs | undefined;

interface FormValues {
	/** Chỉ dùng ở chế độ create */
	key?: string
	value: FormValue
	description?: string
}

export interface DetailRef {
	/** create không truyền record (người dùng chọn key trong modal); view/edit truyền dòng đang thao tác */
	show: (record: AppSettingRow | undefined, mode: DetailMode) => Promise<{ isChange: boolean } | undefined>
}

interface DetailProps {
	ref: React.Ref<DetailRef>
}

let guard: (res?: { isChange: boolean }) => void;

/** Đổi value từ API sang giá trị phù hợp với input của từng type. */
function toFormValue(record: AppSettingRow): FormValue {
	const { type, value } = record;
	switch (type) {
		case "emails":
		case "string_array":
			return toStringArray(value);
		case "boolean":
			return value === true || value === "true";
		case "number": {
			// Dữ liệu cũ có thể lưu số dạng chuỗi ("365"), đổi về number để InputNumber và validate hoạt động đúng
			if (value === null || value === undefined || value === "")
				return undefined;
			const parsed = Number(value);
			return Number.isFinite(parsed) ? parsed : undefined;
		}
		case "date":
			return typeof value === "string" && value ? dayjs(value) : undefined;
		case "json":
			if (value === null || value === undefined)
				return undefined;
			return typeof value === "string" ? value : JSON.stringify(value, null, 2);
		default:
			return value ?? undefined;
	}
}

/** Đổi giá trị trong form về dạng backend lưu. */
function toPayloadValue(record: AppSettingRow, value: FormValue): AppSettingValue {
	switch (record.type) {
		case "date":
			return (value as Dayjs).format(DATE_FORMAT);
		case "json":
			return JSON.parse(value as string);
		default:
			return value as AppSettingValue;
	}
}

export function Detail({ ref }: DetailProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<FormValues>();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [mode, setMode] = useState<DetailMode>("view");
	const [record, setRecord] = useState<AppSettingRow | null>(null);
	const [keyOptions, setKeyOptions] = useState<AppSettingKeyOption[]>([]);

	const type = record?.type ?? "string";
	const rule = record?.rule ?? {};
	const readonly = mode === "view";

	const fillForm = (row: AppSettingRow) => {
		form.setFieldsValue({
			value: toFormValue(row),
			description: row.description,
		});
	};

	useImperativeHandle(ref, () => ({
		show: async (row: AppSettingRow | undefined, nextMode: DetailMode) => {
			form.resetFields();
			setRecord(row ?? null);
			setMode(nextMode);
			setOpen(true);
			if (row)
				fillForm(row);
			if (nextMode === "create") {
				setKeyOptions([]);
				setLoading(true);
				try {
					setKeyOptions(await appSettingService.fetchAvailableKeys());
				}
				catch (error) {
					console.error("[AppSettingDetail] Failed to fetch available keys:", error);
					window.$message?.error(t("common.fetchError"));
				}
				finally {
					setLoading(false);
				}
			}
			if (nextMode === "view" && row) {
				setLoading(true);
				try {
					const data = await appSettingService.fetchAppSettingItem(row.key);
					setRecord(data);
					fillForm(data);
				}
				catch (error) {
					console.error("[AppSettingDetail] Failed to fetch setting:", error);
					window.$message?.error(t("common.fetchError"));
				}
				finally {
					setLoading(false);
				}
			}
			return new Promise<{ isChange: boolean } | undefined>((resolve) => {
				guard = resolve;
			});
		},
	}));

	/** Chọn key ở chế độ create: lấy type/rule của key để dựng lại input giá trị */
	const onSelectKey = (key: string) => {
		const option = keyOptions.find(item => item.key === key);
		if (!option)
			return;
		setRecord({ ...option, value: null });
		form.setFieldsValue({ value: undefined });
	};

	const onFinish = async (values: FormValues) => {
		if (!record || readonly)
			return false;
		const payload = {
			value: toPayloadValue(record, values.value),
			description: values.description || undefined,
		};
		if (mode === "create") {
			await appSettingService.fetchAddAppSetting({ key: record.key, ...payload });
			window.$message?.success(t("common.addSuccess"));
		}
		else {
			await appSettingService.fetchUpdateAppSetting(record.key, payload);
			window.$message?.success(t("common.updateSuccess"));
		}
		guard?.({ isChange: true });
		return true;
	};

	const onClose = () => {
		setOpen(false);
		setRecord(null);
		form.resetFields();
		guard?.();
	};

	const renderValueInput = () => {
		switch (type) {
			case "number":
				return (
					<InputNumber
						className="w-full"
						min={typeof rule.min === "number" ? rule.min : undefined}
						max={typeof rule.max === "number" ? rule.max : undefined}
						precision={rule.integer ? 0 : undefined}
						placeholder={t("common.pleaseInput")}
					/>
				);
			case "boolean":
				return <Switch />;
			case "date":
				return (
					<DatePicker
						className="w-full"
						format="DD/MM/YYYY"
						disabledDate={date =>
							(typeof rule.min === "string" && date.isBefore(rule.min, "day"))
							|| (typeof rule.max === "string" && date.isAfter(rule.max, "day"))}
					/>
				);
			case "emails":
			case "string_array":
				return (
					<Select
						mode="tags"
						open={false}
						suffixIcon={null}
						maxCount={rule.maxItems}
						tokenSeparators={type === "emails" ? [",", ";", " "] : [",", ";"]}
						placeholder={t("system.appSetting.tagsPlaceholder")}
					/>
				);
			case "json":
				return <Input.TextArea rows={8} className="font-mono" placeholder="{ }" />;
			default:
				return <TrimInput maxLength={rule.maxLength} showCount={!!rule.maxLength} placeholder={t("common.pleaseInput")} />;
		}
	};

	/** Kiểm tra giống backend để báo lỗi ngay trên form; backend vẫn kiểm tra lại khi lưu. */
	const validateValue = (_: unknown, value: FormValue) => {
		const fail = (key: string, params?: Record<string, unknown>) => Promise.reject(new Error(t(`system.appSetting.rule.${key}`, params)));
		const isEmpty = value === undefined || value === null || (typeof value === "string" && !value.trim());

		switch (type) {
			case "boolean":
				return Promise.resolve();
			case "emails":
			case "string_array": {
				const items = Array.isArray(value) ? value as string[] : [];
				if (type === "emails") {
					const invalid = items.filter(email => !EMAIL_REGEX.test(email));
					if (invalid.length)
						return Promise.reject(new Error(t("system.appSetting.invalidEmails", { emails: invalid.join(", ") })));
				}
				if (rule.minItems !== undefined && items.length < rule.minItems)
					return fail("minItems", { count: rule.minItems });
				if (rule.maxItems !== undefined && items.length > rule.maxItems)
					return fail("maxItems", { count: rule.maxItems });
				return Promise.resolve();
			}
			case "json": {
				try {
					const parsed: unknown = JSON.parse(String(value ?? ""));
					if (typeof parsed !== "object" || parsed === null)
						throw new Error("not an object");
					return Promise.resolve();
				}
				catch {
					return Promise.reject(new Error(t("system.appSetting.invalidJson")));
				}
			}
			case "number": {
				if (typeof value !== "number")
					return Promise.reject(new Error(t("system.appSetting.valueRequired")));
				if (rule.integer && !Number.isInteger(value))
					return fail("integer");
				if (typeof rule.min === "number" && value < rule.min)
					return fail("min", { min: rule.min });
				if (typeof rule.max === "number" && value > rule.max)
					return fail("max", { max: rule.max });
				return Promise.resolve();
			}
			case "date": {
				if (!dayjs.isDayjs(value))
					return Promise.reject(new Error(t("system.appSetting.valueRequired")));
				if (typeof rule.min === "string" && value.isBefore(rule.min, "day"))
					return fail("dateMin", { date: dayjs(rule.min).format("DD/MM/YYYY") });
				if (typeof rule.max === "string" && value.isAfter(rule.max, "day"))
					return fail("dateMax", { date: dayjs(rule.max).format("DD/MM/YYYY") });
				return Promise.resolve();
			}
			default: {
				if (isEmpty)
					return Promise.reject(new Error(t("system.appSetting.valueRequired")));
				const text = String(value).trim();
				if (rule.minLength !== undefined && text.length < rule.minLength)
					return fail("minLength", { count: rule.minLength });
				if (rule.maxLength !== undefined && text.length > rule.maxLength)
					return fail("maxLength", { count: rule.maxLength });
				if (rule.pattern && !new RegExp(rule.pattern).test(text))
					return fail("pattern");
				return Promise.resolve();
			}
		}
	};

	const titles: Record<DetailMode, string> = {
		view: t("system.appSetting.viewSetting"),
		create: t("system.appSetting.configureSetting"),
		edit: t("system.appSetting.editSetting"),
	};

	return (
		<ModalForm<FormValues>
			title={titles[mode]}
			open={open}
			onOpenChange={(visible) => {
				if (!visible) {
					onClose();
				}
			}}
			layout="vertical"
			form={form}
			disabled={readonly}
			submitter={readonly ? false : undefined}
			modalProps={{ destroyOnHidden: true, width: 600 }}
			onFinish={onFinish}
		>
			<Spin spinning={loading}>
				{mode === "create"
					? (
						<Form.Item
							name="key"
							label={t("system.appSetting.name")}
							rules={[{ required: true, message: t("system.appSetting.keyRequired") }]}
						>
							<Select
								showSearch={{ optionFilterProp: "label" }}
								placeholder={t("common.pleaseSelect")}
								notFoundContent={t("system.appSetting.noAvailableKeys")}
								options={keyOptions.map(option => ({
									value: option.key,
									label: `${getSettingLabel(t, option.key)} (${option.key})`,
								}))}
								onChange={onSelectKey}
							/>
						</Form.Item>
					)
					: record && (
						<div className="mb-4 flex flex-col">
							<Text strong>{getSettingLabel(t, record.key)}</Text>
							<Text type="secondary" className="text-xs">{record.key}</Text>
						</div>
					)}

				{/* Chưa chọn key (create) thì chưa biết type nên chưa hiện ô giá trị */}
				{record && (
					<Form.Item
						name="value"
						label={t("system.appSetting.value")}
						valuePropName={type === "boolean" ? "checked" : "value"}
						extra={t(`system.appSetting.keys.${record.key}.hint`, { defaultValue: "" }) || undefined}
						rules={readonly ? [] : [{ validator: validateValue }]}
					>
						{renderValueInput()}
					</Form.Item>
				)}

				<Form.Item
					name="description"
					label={t("system.appSetting.description")}
					rules={[{ max: 500, message: t("system.appSetting.descriptionMaxLength") }]}
				>
					<TrimTextArea placeholder={readonly ? undefined : t("common.pleaseInput")} />
				</Form.Item>
			</Spin>
		</ModalForm>
	);
}
