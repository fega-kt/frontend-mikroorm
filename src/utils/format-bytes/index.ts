/**
 * Dung lượng dễ đọc: B, KB, MB (một chữ số thập phân)
 *
 * @example
 * ```ts
 * formatBytes(22053737); // "21.0 MB"
 * ```
 */
export function formatBytes(bytes: number): string {
	if (bytes < 1024)
		return `${bytes} B`;
	if (bytes < 1024 * 1024)
		return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
