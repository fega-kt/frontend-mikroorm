/**
 * Dung lượng dễ đọc: B, KB, MB, GB (tối đa một chữ số thập phân, bỏ ".0")
 *
 * @example
 * ```ts
 * formatBytes(22053737); // "21 MB"
 * formatBytes(1572864); // "1.5 MB"
 * ```
 */
export function formatBytes(bytes: number): string {
	if (bytes < 1024)
		return `${bytes} B`;
	const units = ["KB", "MB", "GB"];
	let value = bytes / 1024;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}
	// Number(...) bỏ số 0 thừa: 50.0 → 50, 1.5 → 1.5
	return `${Number(value.toFixed(1))} ${units[unit]}`;
}
