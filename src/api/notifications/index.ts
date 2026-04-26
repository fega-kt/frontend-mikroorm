import type { NotificationEntity } from "./types";
import { CrudServiceBase } from "../service-base";

export * from "./types";

export class NotificationService extends CrudServiceBase<NotificationEntity> {
	constructor() {
		super({ endpoint: "notification" });
	}

	/** GET /notification?page=1&limit=20&onlyUnread=false */
	async fetchNotifications(params?: { page?: number, limit?: number, onlyUnread?: boolean }) {
		return this.get<{ data: NotificationEntity[], total: number }>("", {
			searchParams: params as any,
			ignoreLoading: true,
		});
	}

	/** GET /notification/unread-count */
	async fetchUnreadCount() {
		return this.get<{ count: number }>("unread-count", { ignoreLoading: true });
	}

	/** PATCH /notification/read-all */
	async fetchMarkAllRead() {
		return this.patch<void>("read-all", { ignoreLoading: true });
	}

	/** PATCH /notification/:id/read */
	async fetchMarkRead(id: string) {
		return this.patch<void>(`${id}/read`, { ignoreLoading: true });
	}
}

export const notificationService = new NotificationService();
