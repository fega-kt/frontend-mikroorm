import type { MenuItemType } from "./types";
import { ArrowLeftOutlined, SettingOutlined } from "@ant-design/icons";
import { findDeepestFirstItem } from "./utils";

/**
 * Các nhóm menu cấp 1 thuộc khu quản trị: ở menu chính chỉ hiện một mục "Quản trị hệ thống",
 * bấm vào thì sidebar chuyển sang menu quản trị (kiểu Central Administration).
 */
export const ADMIN_MENU_ROOTS = ["/setting", "/system", "/system-config", "/activity-log"];

/** Key giả của mục mở khu quản trị / quay lại menu chính (không phải route) */
export const ADMIN_ENTRY_KEY = "__admin_entry__";
export const ADMIN_BACK_KEY = "__admin_back__";

export const isAdminRoot = (key: string) => ADMIN_MENU_ROOTS.includes(key);

/** Đường dẫn hiện tại có thuộc khu quản trị không */
export const isAdminPath = (path: string) => ADMIN_MENU_ROOTS.some(root => path === root || path.startsWith(`${root}/`));

/** Trang đầu tiên của khu quản trị mà user được vào */
export function firstAdminPath(menus: MenuItemType[]) {
	return findDeepestFirstItem(menus.filter(item => isAdminRoot(item.key)))?.key;
}

/**
 * Tách menu theo khu vực.
 * - Menu chính: bỏ các nhóm quản trị, thêm mục "Quản trị hệ thống" (trước Hồ sơ cá nhân nếu có).
 * - Menu quản trị: dòng "Quay lại trang chủ" + các nhóm quản trị (đóng/mở như menu chính).
 */
export function scopeMenus(menus: MenuItemType[], options: { admin: boolean, t: (key: string) => string }): MenuItemType[] {
	const adminRoots = menus.filter(item => isAdminRoot(item.key));
	if (!adminRoots.length)
		return menus;

	if (options.admin) {
		const back: MenuItemType = { key: ADMIN_BACK_KEY, label: options.t("common.menu.backToMain"), icon: <ArrowLeftOutlined /> };
		return [back, ...adminRoots];
	}

	const entry: MenuItemType = { key: ADMIN_ENTRY_KEY, label: options.t("common.menu.administration"), icon: <SettingOutlined /> };
	const main = menus.filter(item => !isAdminRoot(item.key));
	const at = main.findIndex(item => item.key.startsWith("/personal-center"));
	return at < 0 ? [...main, entry] : [...main.slice(0, at), entry, ...main.slice(at)];
}
