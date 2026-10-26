import type { TFunction } from "i18next";

/** Màu trạng thái tờ trình trong biểu đồ (đã kiểm tra phân biệt được với người mù màu); "Đã hủy" là màu trung tính */
export const STATUS_COLORS = {
	approved: "#389e0d",
	pending: "#1677ff",
	returned: "#d48806",
	rejected: "#cf1322",
	cancelled: "#8c8c8c",
} as const;

export type ReportStatus = keyof typeof STATUS_COLORS;

const HOUR = 3600;
const DAY = 24 * HOUR;

export function formatNumber(value: number, maximumFractionDigits = 1) {
	return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);
}

/** Thời lượng dễ đọc: dưới 1 giờ → phút, dưới 2 ngày → giờ, còn lại → ngày */
export function formatDuration(seconds: number | null | undefined, t: TFunction) {
	if (seconds === null || seconds === undefined)
		return "—";
	if (seconds < HOUR)
		return t("approval.report.unit.minutes", { value: formatNumber(Math.max(1, Math.round(seconds / 60)), 0) });
	if (seconds < 2 * DAY)
		return t("approval.report.unit.hours", { value: formatNumber(seconds / HOUR) });
	return t("approval.report.unit.days", { value: formatNumber(seconds / DAY) });
}

/** Thời lượng tính bằng ngày (cho KPI có đơn vị riêng) */
export function toDays(seconds: number | null | undefined) {
	return seconds === null || seconds === undefined ? null : seconds / DAY;
}

export function toHours(seconds: number | null | undefined) {
	return seconds === null || seconds === undefined ? null : seconds / HOUR;
}
