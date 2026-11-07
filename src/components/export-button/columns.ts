import type { ExportColumnRequest, ExportLanguage } from "#src/api/export/types";

/** Cột bảng (chỉ phần cần dùng) — khớp ProColumns mà không phụ thuộc kiểu của nó */
interface TableColumn {
	key?: unknown
	title?: unknown
}

/** Trạng thái hiện / ẩn cột của ProTable (`columnsState`) */
export type ColumnsVisibility = Record<string, { show?: boolean }>;

/**
 * Cột cần xuất = cột bảng đang hiển thị, theo thứ tự trong bảng. `mapping`: khóa cột bảng → khóa cột của backend
 * (một cột bảng có thể gồm nhiều cột xuất, vd: ô "tiêu đề" kèm mã tờ trình). Cột bảng không có trong `mapping`
 * (thao tác, ô tìm kiếm…) và cột người dùng đã ẩn thì bỏ. Nhãn lấy từ tiêu đề cột khi cột chỉ ứng với một cột xuất.
 */
export function visibleExportColumns(columns: TableColumn[], visibility: ColumnsVisibility, mapping: Record<string, string[]>): ExportColumnRequest[] {
	const seen = new Set<string>();
	const result: ExportColumnRequest[] = [];
	for (const column of columns) {
		if (typeof column.key !== "string")
			continue;
		const keys = mapping[column.key];
		if (!keys?.length || visibility[column.key]?.show === false)
			continue;
		for (const key of keys) {
			if (seen.has(key))
				continue;
			seen.add(key);
			result.push({ key, header: keys.length === 1 && typeof column.title === "string" ? column.title : undefined });
		}
	}
	return result;
}

const SUPPORTED_LANGUAGES: ExportLanguage[] = ["vi-VN", "en-US", "zh-CN"];

/** Ngôn ngữ nhãn của file xuất theo ngôn ngữ giao diện (lạ → tiếng Việt) */
export function toExportLanguage(language: string): ExportLanguage {
	return SUPPORTED_LANGUAGES.find(item => item === language) ?? "vi-VN";
}
