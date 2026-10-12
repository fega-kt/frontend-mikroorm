import type { NotificationEntity } from "#src/api/notifications";
import type { ButtonProps } from "antd";
import type { NotificationEventType } from "./index";

import type { NotificationItem } from "./types";

import { notificationService } from "#src/api/notifications";
import { useInterval, useMount } from "ahooks";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { NotificationPopup } from "./index";
import { getNotificationIcon } from "./notification-icon";
import { getNotificationRoute } from "./notification-ref";

dayjs.extend(relativeTime);

const PAGE_SIZE = 20;
const POLL_INTERVAL = 60_000;

export function NotificationContainer({ ...restProps }: ButtonProps) {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const [rawNotifications, setRawNotifications] = useState<NotificationEntity[]>([]);
	const [hasMore, setHasMore] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);
	const unreadCountRef = useRef<number | null>(null);

	const fetchPage = async (before?: string) => {
		const res = await notificationService.fetchNotifications({ limit: PAGE_SIZE, before });
		setRawNotifications(prev => (before ? [...prev, ...(res.data ?? [])] : (res.data ?? [])));
		setHasMore(res.hasMore);
	};

	// Poll số chưa đọc — đổi thì tải lại trang đầu để noti mới hiện lên (tạm thay realtime)
	const refreshUnread = async () => {
		const { count } = await notificationService.fetchUnreadCount();
		if (unreadCountRef.current !== null && count !== unreadCountRef.current)
			await fetchPage();
		unreadCountRef.current = count;
		setUnreadCount(count);
	};

	useMount(() => {
		fetchPage().catch(() => {});
		refreshUnread().catch(() => {});
	});
	useInterval(() => refreshUnread().catch(() => {}), POLL_INTERVAL);

	const updateUnread = (count: number) => {
		unreadCountRef.current = count;
		setUnreadCount(count);
	};

	const handleEvent = (event: NotificationEventType, item?: NotificationItem) => {
		// Đánh dấu đã đọc ngay ở client, gọi API ở nền không chờ. Nếu API lỗi, lần poll unread-count sau
		// thấy số trên server khác số local → tải lại trang đầu → noti tự hiện lại là chưa đọc
		if (event === "read" && item && !item.isRead) {
			setRawNotifications(prev => prev.map(n => (n.id === item.id ? { ...n, isRead: true } : n)));
			// tính từ ref (giá trị mới nhất), không dùng `unreadCount` của render cũ — đọc liên tiếp nhanh vẫn giảm đúng
			updateUnread(Math.max(0, (unreadCountRef.current ?? 0) - 1));
			notificationService.fetchMarkRead(item.id).catch(() => {});
		}
		if (event === "read" && item?.link)
			navigate(item.link);
		if (event === "makeAll") {
			setRawNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
			updateUnread(0);
			notificationService.fetchMarkAllRead().catch(() => {});
		}
	};

	const handleLoadMore = () => {
		const last = rawNotifications.at(-1);
		if (!last || loadingMore)
			return;
		setLoadingMore(true);
		fetchPage(last.id).catch(() => {}).finally(() => setLoadingMore(false));
	};

	/** Biến thể câu dịch: có nội dung riêng (bước Thông báo) / không có tên bước */
	const messageContext = (data?: Record<string, unknown>) => (data?.message ? "withMessage" : data && "step" in data && !data.step ? "noStep" : undefined);

	// BE chỉ lưu type + data — dịch tại đây để đổi ngôn ngữ là cập nhật ngay
	const notifications = useMemo<NotificationItem[]>(() => rawNotifications.map((n) => {
		const key = i18n.exists(`notification.${n.type}.title`) ? n.type : "unknown";
		const { icon, color } = getNotificationIcon(n.type);
		return {
			id: n.id,
			link: getNotificationRoute(n.refType, n.refId),
			title: t(`notification.${key}.title`, n.data),
			message: t(`notification.${key}.message`, { ...n.data, context: messageContext(n.data) }),
			date: n.createdAt ? dayjs(n.createdAt).fromNow() : "",
			isRead: n.isRead,
			avatar: n.actor?.avatar,
			actorId: n.actor?.id,
			actorName: n.actor?.fullName,
			icon,
			iconColor: color,
		};
	}), [rawNotifications, t, i18n]);

	return (
		<NotificationPopup
			notifications={notifications}
			count={unreadCount}
			showFooter={false}
			onEventChange={handleEvent}
			hasMore={hasMore}
			loadingMore={loadingMore}
			onLoadMore={handleLoadMore}
			{...restProps}
		/>
	);
}
