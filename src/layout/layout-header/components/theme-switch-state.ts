/**
 * Trạng thái hiệu ứng đổi theme (vòng tròn lan ra) — dùng chung giữa theme-button và layout-root.
 * Biến module, không phải state React: chỉ để chặn bấm chồng và không gỡ `stop-transition` sớm.
 */
let switching = false;

/** Hiệu ứng vòng tròn đổi theme (kể cả khoảng nghỉ sau đó) còn đang chạy không */
export function isThemeViewTransitionRunning() {
	return switching;
}

export function setThemeViewTransitionRunning(value: boolean) {
	switching = value;
}
