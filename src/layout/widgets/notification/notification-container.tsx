import type { ButtonProps } from "antd";
import type { NotificationItem } from "./types";

import { notificationService } from "#src/api/notifications";

import { useEffect, useState } from "react";
import { NotificationPopup } from "./index";

export function NotificationContainer({ ...restProps }: ButtonProps) {
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);

	useEffect(() => {
		notificationService.fetchNotifications({ limit: 20 }).then((res) => {
			const items: NotificationItem[] = (res.data ?? []).map(n => ({
				title: n.title,
				message: n.message,
				date: n.createdAt?.toString() ?? "",
				isRead: n.isRead,
				avatar: "",
			}));
			setNotifications(items);
		}).catch(() => {});
	}, []);

	return (
		<NotificationPopup
			notifications={notifications}
			{...restProps}
		/>
	);
}
