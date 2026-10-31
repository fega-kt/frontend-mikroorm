import type { WorkSchedule, WorkShift } from "#src/api/work-calendar";
import type { Dayjs } from "dayjs";
import { workScheduleService } from "#src/api/work-calendar";
import { Collapse, DatePicker, Form, Input, InputNumber, Modal, Radio, Select, Space, Switch, theme, Tooltip } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cycleDayLabel, DATE_FORMAT, DEFAULT_SHIFT_COLOR, isWeekly, WEEKDAY_KEYS, weekdayIndex } from "../utils";

/** Giá trị "Nghỉ" trong ô chọn ca (Select không hiện được null) */
const OFF = "__off__";

/** Thứ Hai của tuần chứa ngày */
function mondayOf(date?: Dayjs) {
	return date?.subtract(weekdayIndex(date), "day");
}

/**
 * days của lịch đã lưu sắp theo thứ Hai → Chủ nhật. Lịch ca xoay theo tuần lưu trước đây có thể neo vào ngày khác thứ Hai:
 * ngày (thứ Hai + j) = mốc + (j - lệch) → days[(j - lệch) mod n]
 */
function mondayAlignedDays(schedule: WorkSchedule) {
	const n = schedule.days.length;
	const shift = weekdayIndex(schedule.anchorDate);
	if (n % 7 !== 0 || shift === 0)
		return schedule.days;
	return schedule.days.map((_, j) => schedule.days[(((j - shift) % n) + n) % n]);
}

interface FormValues {
	code: string
	name: string
	kind: "weekly" | "cycle"
	cycleDays: number
	anchorDate?: Dayjs
	days: string[]
	ignoreHolidays: boolean
	description?: string
}

interface ScheduleModalProps {
	/** undefined = đóng, null = thêm mới */
	schedule: WorkSchedule | null | undefined
	shifts: WorkShift[]
	onClose: (changed: boolean) => void
}

/** Thêm / sửa lịch làm việc: lịch tuần (T2 … CN) hoặc ca xoay theo chu kỳ N ngày tính từ ngày mốc */
export function ScheduleModal({ schedule, shifts, onClose }: ScheduleModalProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [form] = Form.useForm<FormValues>();
	const [saving, setSaving] = useState(false);
	const kind = Form.useWatch("kind", form);
	const cycleDays = Form.useWatch("cycleDays", form) ?? 7;
	const dayCount = kind === "cycle" ? Math.max(1, Math.min(60, cycleDays)) : 7;
	const anchorDate = Form.useWatch("anchorDate", form);
	/**
	 * Ca xoay theo tuần (số ngày chia hết cho 7): ô thứ i luôn là thứ WEEKDAY_KEYS[i % 7] của tuần i / 7 + 1, bắt đầu từ thứ Hai;
	 * ngày bắt đầu chỉ cho biết tuần nào là tuần 1 (ngày đó rơi vào thứ mấy cũng được)
	 */
	const weekBased = kind === "cycle" && dayCount % 7 === 0;
	const weekGroups = weekBased && dayCount > 7
		? Array.from({ length: dayCount / 7 }, (_, w) => Array.from({ length: 7 }, (_, d) => w * 7 + d))
		: null;
	const weekdayLabel = (i: number) => t(`workCalendar.weekday.${WEEKDAY_KEYS[i % 7]}`);

	const shiftOptions = [
		{ value: OFF, label: t("workCalendar.dayOff") },
		...shifts.map(s => ({
			value: s.id,
			label: (
				<span>
					<span className="mr-2 inline-block size-2 rounded-full" style={{ background: s.color || DEFAULT_SHIFT_COLOR }} />
					{s.code}
					{" – "}
					{s.name}
				</span>
			),
		})),
	];

	/** Ô ứng với chính ngày đã chọn (thứ của ngày đó trong Tuần 1) — tô đậm cho dễ thấy */
	const anchorIndex = weekBased && anchorDate ? weekdayIndex(anchorDate) : -1;

	const watchedDays = Form.useWatch("days", form) as string[] | undefined;
	const shiftCodeById = new Map(shifts.map(s => [s.id, s.code]));
	/** "T2 HC · T3 HC · … · CN N" */
	const weekSummary = (indexes: number[]) => indexes
		.map((i) => {
			const id = watchedDays?.[i];
			const code = id && id !== OFF ? shiftCodeById.get(id) ?? "?" : t("workCalendar.dayOffShort");
			return `${t(`workCalendar.weekdayShort.${WEEKDAY_KEYS[i % 7]}`)} ${code}`;
		})
		.join(" · ");

	const renderDay = (i: number, label: string) => (
		<div key={i} className="flex min-w-0 items-center gap-2">
			{i === anchorIndex
				? (
					<Tooltip title={t("workCalendar.schedule.anchorDay", { date: anchorDate?.format("DD/MM/YYYY") })}>
						<span className="w-24 shrink-0 text-right font-semibold" style={{ color: token.colorPrimary }}>{label}</span>
					</Tooltip>
				)
				: <span className="w-24 shrink-0 text-right">{label}</span>}
			<Form.Item name={["days", i]} noStyle initialValue={OFF}>
				<Select options={shiftOptions} className="min-w-0 flex-1" popupMatchSelectWidth={false} />
			</Form.Item>
		</div>
	);

	const submit = async () => {
		const values = await form.validateFields();
		const weekly = values.kind === "weekly";
		const payload = {
			code: values.code,
			name: values.name,
			cycleDays: weekly ? 7 : values.cycleDays,
			// Ca xoay theo tuần: gửi thứ Hai của tuần chứa ngày bắt đầu, khớp với days[0] = thứ Hai
			anchorDate: weekly
				? null
				: (values.cycleDays % 7 === 0 ? mondayOf(values.anchorDate) : values.anchorDate)?.format(DATE_FORMAT),
			days: Array.from({ length: weekly ? 7 : values.cycleDays }, (_, i) => {
				const value = values.days?.[i];
				return value && value !== OFF ? value : null;
			}),
			ignoreHolidays: values.ignoreHolidays,
			description: values.description,
		};
		setSaving(true);
		try {
			if (schedule)
				await workScheduleService.fetchUpdate(schedule.id, payload);
			else
				await workScheduleService.fetchCreate(payload);
			window.$message?.success(t(schedule ? "common.updateSuccess" : "common.addSuccess"));
			onClose(true);
		}
		catch {
			// lỗi đã được interceptor hiển thị
		}
		finally {
			setSaving(false);
		}
	};

	const initialValues = (): Partial<FormValues> => {
		if (!schedule)
			return { kind: "weekly", cycleDays: 7, days: Array.from({ length: 7 }, () => OFF), ignoreHolidays: false };
		return {
			code: schedule.code,
			name: schedule.name,
			kind: isWeekly(schedule) ? "weekly" : "cycle",
			cycleDays: schedule.cycleDays,
			anchorDate: isWeekly(schedule) ? undefined : dayjs(schedule.anchorDate),
			days: mondayAlignedDays(schedule).map(id => id ?? OFF),
			ignoreHolidays: schedule.ignoreHolidays,
			description: schedule.description ?? undefined,
		};
	};

	return (
		<Modal
			open={schedule !== undefined}
			width={640}
			title={t(schedule ? "workCalendar.schedule.edit" : "workCalendar.schedule.add")}
			okText={t("common.save")}
			cancelText={t("common.cancel")}
			confirmLoading={saving}
			onOk={submit}
			onCancel={() => onClose(false)}
			afterOpenChange={(open) => {
				if (open) {
					form.resetFields();
					form.setFieldsValue(initialValues());
				}
			}}
			destroyOnHidden
		>
			<Form
				form={form}
				layout="vertical"
				onValuesChange={(changed: Partial<FormValues>) => {
					// Ca xoay 7 ngày chẳng khác lịch tuần — gợi ý sẵn chu kỳ 2 tuần (VD làm T7 cách tuần)
					if (changed.kind === "cycle" && form.getFieldValue("cycleDays") === 7)
						form.setFieldValue("cycleDays", 14);
				}}
			>
				<Space.Compact block>
					<Form.Item name="code" label={t("workCalendar.code")} rules={[{ required: true, max: 50 }]} className="w-1/3">
						<Input placeholder="HC_T2_T6" />
					</Form.Item>
					<Form.Item name="name" label={t("workCalendar.name")} rules={[{ required: true, max: 255 }]} className="flex-1">
						<Input placeholder={t("workCalendar.schedule.namePlaceholder")} />
					</Form.Item>
				</Space.Compact>
				{/* Mã / tên và nút Lưu giữ cố định, chỉ phần cấu hình lịch bên dưới cuộn */}
				<div className="-mr-2 overflow-y-auto overflow-x-hidden pr-2" style={{ maxHeight: "calc(100vh - 340px)" }}>
					<Form.Item name="kind" label={t("workCalendar.schedule.kind")}>
						<Radio.Group
							optionType="button"
							options={[
								{ value: "weekly", label: t("workCalendar.schedule.weekly") },
								{ value: "cycle", label: t("workCalendar.schedule.cycle") },
							]}
						/>
					</Form.Item>
					{kind === "cycle" && (
						<Space size="large" wrap>
							<Form.Item name="cycleDays" label={t("workCalendar.schedule.cycleDays")} rules={[{ required: true }]}>
								<InputNumber min={1} max={60} />
							</Form.Item>
							<Form.Item
								name="anchorDate"
								label={t(weekBased ? "workCalendar.schedule.firstWeek" : "workCalendar.schedule.anchorDate")}
								tooltip={t(weekBased ? "workCalendar.schedule.firstWeekHint" : "workCalendar.schedule.anchorDateHint")}
								rules={[{ required: true }]}
							>
								<DatePicker format="DD/MM/YYYY" />
							</Form.Item>
						</Space>
					)}
					<Form.Item label={t("workCalendar.schedule.days")} required>
						{weekGroups
							? (
							// Mỗi tuần một khối thu gọn được; tiêu đề tóm tắt ca từng ngày để khỏi phải mở ra xem.
							// forceRender: khối đang đóng vẫn giữ ô chọn trong form (lưu đủ mọi ngày)
								<Collapse
									defaultActiveKey={["0"]}
									items={weekGroups.map((indexes, week) => ({
										key: String(week),
										forceRender: true,
										label: <span className="font-medium">{t("workCalendar.schedule.weekN", { n: week + 1 })}</span>,
										extra: <span className="text-xs" style={{ color: token.colorTextSecondary }}>{weekSummary(indexes)}</span>,
										children: (
											<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
												{indexes.map(i => renderDay(i, weekdayLabel(i)))}
											</div>
										),
									}))}
								/>
							)
							: (
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
									{Array.from({ length: dayCount }, (_, i) =>
										renderDay(i, kind !== "cycle" || weekBased ? weekdayLabel(i) : cycleDayLabel(t, i, dayCount, anchorDate)))}
								</div>
							)}
					</Form.Item>
					<Form.Item
						name="ignoreHolidays"
						label={t("workCalendar.schedule.ignoreHolidays")}
						extra={t("workCalendar.schedule.ignoreHolidaysHint")}
						valuePropName="checked"
					>
						<Switch />
					</Form.Item>
					<Form.Item name="description" label={t("workCalendar.description")} rules={[{ max: 500 }]}>
						<Input.TextArea rows={2} />
					</Form.Item>
				</div>
			</Form>
		</Modal>
	);
}
