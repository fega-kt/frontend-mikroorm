/**
 * Device token do backend cấp + ký (header X-Device-Id) để phát hiện đăng nhập trên thiết bị mới.
 * FE chỉ lưu và gửi lại nguyên văn — không tự tạo/sửa (sửa thì sai chữ ký, backend coi là thiết bị mới).
 */
const STORAGE_KEY = "device-token";

export function getDeviceToken(): string | undefined {
	try {
		return localStorage.getItem(STORAGE_KEY) ?? undefined;
	}
	catch {
		return undefined;
	}
}

export function saveDeviceToken(token: string | null) {
	if (!token)
		return;
	try {
		localStorage.setItem(STORAGE_KEY, token);
	}
	catch {
		// localStorage bị chặn (vd: chế độ riêng tư) — mỗi phiên sẽ được coi là thiết bị mới
	}
}
