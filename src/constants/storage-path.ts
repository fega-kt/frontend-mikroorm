export const STORAGE_PATH = {
	USER_AVATAR: "UserAvatars",
	ATTACHMENTS: "Attachments",
	PROJECT: "Projects",
} as const;

export type StoragePathKey = keyof typeof STORAGE_PATH;
export type StoragePathValue = (typeof STORAGE_PATH)[StoragePathKey];

/**
 * Tạo đường dẫn lưu trữ cho attachment của project.
 * Format: Projects/{YYYY-MM-DD}/{projectId}
 *
 * @param projectId  ID thực của project (edit) hoặc tempId tạm (create)
 * @param createdAt  Ngày tạo project; nếu không truyền thì dùng ngày hôm nay
 */
export function buildProjectStoragePath(projectId: string, createdAt?: Date | string): string {
	const date = createdAt ? new Date(createdAt) : new Date();
	const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
	return `${STORAGE_PATH.PROJECT}/${dateStr}/${projectId}`;
}
