/** Ngôn ngữ mặc định khi không truyền (khớp phần còn lại của ứng dụng, đang dùng "vi-VN") */
const DEFAULT_LOCALE = "vi-VN";

/**
 * Số có dấu phân cách hàng nghìn theo ngôn ngữ. Không phải số hợp lệ (null, undefined, NaN, Infinity) → chuỗi rỗng,
 * để chỗ gọi không phải kiểm tra trước.
 *
 * @example
 * ```ts
 * formatNumber(78005); // "78.005"
 * formatNumber(78005, "en-US"); // "78,005"
 * formatNumber(1234.5, "vi-VN", { maximumFractionDigits: 1 }); // "1.234,5"
 * formatNumber(undefined); // ""
 * ```
 */
export function formatNumber(value: number | null | undefined, locale: string = DEFAULT_LOCALE, options?: Intl.NumberFormatOptions): string {
	if (value === null || value === undefined || !Number.isFinite(value))
		return "";
	return value.toLocaleString(locale, options);
}
