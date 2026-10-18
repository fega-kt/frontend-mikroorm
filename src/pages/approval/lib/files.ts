import type { FileBlockConfig, FileKind } from "#src/api/setting/request-type/types";
import { FILE_KIND_EXTENSIONS } from "#src/api/setting/request-type/types";
import { formatBytes } from "#src/utils/format-bytes";

/** Đuôi tệp viết thường, không có dấu chấm ("" nếu không có đuôi) */
export const extOf = (filename: string) => (filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "");

/** Chuỗi accept cho <input type="file"> từ các nhóm loại tệp */
export function acceptFor(kinds: FileKind[]) {
	return kinds.flatMap(kind => FILE_KIND_EXTENSIONS[kind]).map(ext => `.${ext}`).join(",");
}

/** Mô tả ngắn của khối: "Bắt buộc · 1–5 tệp · PDF, Word · ≤ 10 MB" */
export function blockSummary(config: FileBlockConfig, t: (key: string, options?: Record<string, unknown>) => string) {
	const min = config.required ? Math.max(config.minFiles, 1) : 0;
	const parts = [
		t(config.required ? "approval.files.required" : "approval.files.optional"),
		min ? t("approval.files.countRange", { min, max: config.maxFiles }) : t("approval.files.countMax", { max: config.maxFiles }),
		config.fileTypes.map(kind => t(`approval.files.kinds.${kind}`)).join(", "),
		`≤ ${config.maxSizeMb} MB`,
	];
	return parts.join(" · ");
}

/** Tổng số tệp và dung lượng của một khối: "3 tệp · 44.4 MB" */
export function fileListSummary(files: { size: number }[], t: (key: string, options?: Record<string, unknown>) => string) {
	const total = files.reduce((sum, file) => sum + file.size, 0);
	return `${t("approval.files.count", { count: files.length })} · ${formatBytes(total)}`;
}

/**
 * Kiểm tra trước khi gửi (bản FE của backend validateFileBlock) — trả về mã lỗi đầu tiên hoặc null.
 * Backend vẫn kiểm tra lại khi gửi.
 */
export function checkFileBlock(config: FileBlockConfig, files: { filename: string, size: number }[]) {
	if (!config.enabled)
		return null;
	const min = Math.max(config.minFiles, 1);
	if (config.required && files.length < min)
		return { code: "MIN_FILES" as const, min };
	if (files.length > config.maxFiles)
		return { code: "MAX_FILES" as const, max: config.maxFiles };
	const allowed = new Set(config.fileTypes.flatMap(kind => FILE_KIND_EXTENSIONS[kind]));
	const wrong = files.find(f => !allowed.has(extOf(f.filename)));
	if (wrong)
		return { code: "FILE_TYPE" as const, filename: wrong.filename };
	const big = files.find(f => f.size > config.maxSizeMb * 1024 * 1024);
	if (big)
		return { code: "FILE_SIZE" as const, filename: big.filename, max: config.maxSizeMb };
	return null;
}
