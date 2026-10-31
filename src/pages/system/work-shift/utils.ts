import type { ShiftSegment, WorkTargetType } from "#src/api/work-calendar";
import type { Dayjs } from "dayjs";
import type { TFunction } from "i18next";
import dayjs from "dayjs";

/** Màu mặc định của ca chưa chọn màu */
export const DEFAULT_SHIFT_COLOR = "#1677ff";

/** Mốc lịch tuần của backend (một thứ Hai): days[0] = thứ Hai … days[6] = Chủ nhật */
export const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export const DATE_FORMAT = "YYYY-MM-DD";

/** Mốc backend gán cho lịch tuần (WEEK_ANCHOR_DATE) — phân biệt lịch tuần với ca xoay 7 ngày có mốc riêng */
const WEEK_ANCHOR_DATE = "2024-01-01";

export function isWeekly(schedule: { cycleDays: number, anchorDate: string }) {
	return schedule.cycleDays === 7 && schedule.anchorDate === WEEK_ANCHOR_DATE;
}

/** "08:00–12:00, 13:30–17:30" */
export function formatSegments(segments: ShiftSegment[]) {
	return segments.map(s => `${s.start}–${s.end}`).join(", ");
}

/** 480 → "8h", 450 → "7h30" */
export function formatMinutes(minutes: number) {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

/** "HH:mm" ↔ Dayjs cho TimePicker (không cần plugin customParseFormat) */
export function timeToDayjs(value?: string) {
	if (!value)
		return undefined;
	const [h, m] = value.split(":").map(Number);
	return dayjs().hour(h).minute(m).second(0).millisecond(0);
}

export function dayjsToTime(value?: Dayjs | null) {
	return value ? value.format("HH:mm") : undefined;
}

/** Chỉ số thứ trong tuần, 0 = thứ Hai … 6 = Chủ nhật */
export function weekdayIndex(date: string | Dayjs) {
	return (dayjs(date).day() + 6) % 7;
}

/**
 * Nhãn ngày thứ i của ca xoay: có ngày mốc thì kèm thứ trong tuần ("Tuần 2 · T7" với chu kỳ dài hơn một tuần,
 * "Ngày 3 · T4" với chu kỳ ngắn), chưa chọn mốc thì chỉ "Ngày n"
 */
export function cycleDayLabel(t: TFunction, index: number, cycleDays: number, anchorDate?: string | Dayjs | null) {
	if (!anchorDate)
		return t("workCalendar.schedule.dayN", { n: index + 1 });
	const day = t(`workCalendar.weekdayShort.${WEEKDAY_KEYS[weekdayIndex(dayjs(anchorDate).add(index, "day"))]}`);
	return cycleDays > 7
		? t("workCalendar.schedule.weekDay", { week: Math.floor(index / 7) + 1, day })
		: t("workCalendar.schedule.dayNWeekday", { n: index + 1, day });
}

/** Tên đối tượng: "Công ty" / tên phòng / tên người */
export function targetName(t: TFunction, row: { targetType: WorkTargetType, department?: { name: string } | null, user?: { fullName: string } | null }) {
	if (row.department)
		return row.department.name;
	if (row.user)
		return row.user.fullName;
	return t("workCalendar.target.company");
}
