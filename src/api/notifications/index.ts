import type { NotificationEntity } from "./types";
import { ApiService, CrudServiceBase } from "../service-base";

export * from "./types";

export class NotificationService extends CrudServiceBase<NotificationEntity> {
	constructor() {
		super({ endpoint: "notification", service: ApiService.Core });
	}

	/** GET /notification?limit=20&before=<id>&onlyUnread=false — cursor pagination, `before` = id item cuối trang trước */
	async fetchNotifications(params?: { limit?: number, before?: string, onlyUnread?: boolean }) {
		return this.get<{ data: NotificationEntity[], hasMore: boolean }>("", {
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
