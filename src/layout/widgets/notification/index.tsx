import type { ButtonProps } from "antd";
import type { NotificationItem } from "./types";

import { BasicButton } from "#src/components/basic-button";
import { RiMailCheckLine } from "#src/icons";
import { getAvatarColor } from "#src/utils/avatar";
import { cn } from "#src/utils/cn";

import { BellOutlined } from "@ant-design/icons";
import { useLatest, useToggle } from "ahooks";
import { Avatar, List, Popover, Skeleton, Tooltip } from "antd";
import { clsx } from "clsx";
import { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { createUseStyles } from "react-jss";

const useStyles = createUseStyles(({ token }) => (
	{
		notification: {
			"& .ant-popover-inner": {
				padding: 0,
			},
			"& .ant-list-footer": {
				borderTop: `1px solid ${token.colorBorder}`,
			},
			"& .ant-list-items": {
				height: 380,
				overflowY: "auto",
			},
		},
		item: {
			"transition": `background-color ${token.motionDurationMid}`,
			"&:hover": {
				backgroundColor: token.controlItemBgHover,
			},
		},
	}
));

export type NotificationEventType = "viewAll" | "makeAll" | "clear" | "read";

/** Dòng giả cuối danh sách khi đang tải thêm */
const LOADING_ROW = { id: "__loading__" } as const;

function isLoadingRow(row: NotificationItem | typeof LOADING_ROW): row is typeof LOADING_ROW {
	return row === LOADING_ROW;
}

interface Props extends ButtonProps {
	/**
	 * 显示圆点
	 */
	onEventChange?: (event: NotificationEventType, item?: NotificationItem) => void
	/**
	 * 显示圆点
	 */
	dot?: boolean
	/** Số chưa đọc — có thì hiện số thay cho chấm */
	count?: number
	/**
	 * 消息列表
	 */
	notifications?: NotificationItem[]
	/** Còn noti cũ hơn để tải */
	hasMore?: boolean
	loadingMore?: boolean
	onLoadMore?: () => void
	/** Hiện footer (Xóa / Xem tất cả) — mặc định true */
	showFooter?: boolean
}

export const NotificationPopup: React.FC<Props> = ({ dot, count, notifications, hasMore, loadingMore, onLoadMore, showFooter = true, onEventChange, ...restProps }) => {
	const [open, action] = useToggle();
	const classes = useStyles();
	const { t } = useTranslation();

	const close = () => {
		action.set(false);
	};

	const handleViewAll = () => {
		onEventChange && onEventChange("viewAll");
		close();
	};

	const handleMakeAll = () => {
		onEventChange && onEventChange("makeAll");
	};

	const handleClear = () => {
		onEventChange && onEventChange("clear");
	};

	const handleClick = (item: NotificationItem) => {
		onEventChange && onEventChange("read", item);
		if (item.link)
			close();
	};

	// Ưu tiên `dot` từ ngoài (vd: unread-count từ API), không có thì tự tính từ list
	const localDot = useMemo(() => {
		return !!notifications?.filter(item => !item.isRead).length;
	}, [notifications]);
	const showDot = dot ?? localDot;

	// Ref ổn định → chỉ cuộn 1 lần lúc dòng loading xuất hiện, không kéo ngược khi user đang cuộn lên
	const scrollLoadingRowIntoView = useCallback((node: HTMLDivElement | null) => {
		node?.scrollIntoView({ block: "nearest", behavior: "smooth" });
	}, []);

	const rows = useMemo<Array<NotificationItem | typeof LOADING_ROW>>(
		() => (loadingMore ? [...(notifications ?? []), LOADING_ROW] : (notifications ?? [])),
		[notifications, loadingMore],
	);

	// Cuộn tới noti cuối thì tự tải thêm. Observer không đặt root: phần bị overflow của list cuộn
	// cũng bị cắt khi tính giao nhau, nên chỉ kích hoạt khi noti cuối thực sự hiện ra
	const onLoadMoreRef = useLatest(onLoadMore);
	const observerRef = useRef<IntersectionObserver>(null);
	const loadMoreSentinelRef = useCallback((node: HTMLSpanElement | null) => {
		observerRef.current?.disconnect();
		if (!node)
			return;
		observerRef.current = new IntersectionObserver(([entry]) => {
			if (entry?.isIntersecting)
				onLoadMoreRef.current?.();
		});
		observerRef.current.observe(node);
	}, [onLoadMoreRef]);

	return (
		<Popover
			// getPopupContainer={triggerNode => triggerNode}
			placement="bottomLeft"
			classNames={{
				root: clsx(classes.notification, "w-72 md:w-96 right-4"),
			}}
			open={open}
			arrow={false}
			trigger="click"
			onOpenChange={action.set}
			content={(

				<List
					size="small"
					bordered
					header={(
						<div className="flex items-center justify-between">
							<div>{t("widgets.notifications")}</div>
							<Tooltip title={notifications?.length ? t("widgets.markAllAsRead") : null}>
								<BasicButton
									disabled={!notifications?.length}
									onClick={handleMakeAll}
									type="text"
									icon={<RiMailCheckLine />}
								/>
							</Tooltip>
						</div>
					)}
					footer={showFooter && (
						<div className="flex items-center justify-between">
							<BasicButton
								disabled={!notifications?.length}
								type="text"
								onClick={handleClear}
							>
								{t("widgets.clearNotifications")}
							</BasicButton>
							<BasicButton onClick={handleViewAll}>
								{t("widgets.viewAll")}
							</BasicButton>
						</div>
					)}
					dataSource={rows}
					renderItem={(item, index) => isLoadingRow(item)
						? (
							// Dòng loading nằm trong vùng cuộn (không phải loadMore bên ngoài) → popup không đổi chiều cao.
							// Cuộn nhẹ cho dòng này hiện ra → các noti trượt lên thay vì giao diện nhảy
							// Skeleton cùng bố cục với 1 noti (avatar 40px + tiêu đề, nội dung, thời gian) → như noti đang hiện dần ra
							<List.Item ref={scrollLoadingRowIntoView} className="gap-5">
								<Skeleton.Avatar active size={40} className="shrink-0" />
								<Skeleton active title={{ width: "60%" }} paragraph={{ rows: 2, width: ["90%", "30%"] }} />
							</List.Item>
						)
						: (
							<List.Item className={clsx(classes.item, "relative justify-start gap-5 cursor-pointer")} onClick={() => handleClick(item)}>
								{/* Mốc cuộn: noti cuối lọt vào vùng nhìn thấy → tự tải trang sau */}
								{hasMore && index === notifications!.length - 1 && <span ref={loadMoreSentinelRef} className="absolute bottom-0 left-0 h-px w-px" />}
								{!item.isRead && <span className="absolute w-2 h-2 rounded bg-primary right-2 top-2"></span>}
								{item.avatar || item.actorName
									? (
										<Avatar size={40} src={item.avatar} className="shrink-0 font-semibold" style={{ backgroundColor: getAvatarColor(item.actorId) }}>
											{item.actorName?.[0]?.toUpperCase()}
										</Avatar>
									)
									: (
										<Avatar size={40} icon={item.icon} className="shrink-0" style={{ backgroundColor: item.iconColor }} />
									)}
								<div className="flex flex-col gap-1 leading-none">
									<p className="font-semibold">{item.title}</p>
									<p className="my-1 text-xs text-muted-foreground line-clamp-2">{item.message}</p>
									<p className="text-xs text-muted-foreground line-clamp-2">{item.date}</p>
								</div>
							</List.Item>
						)}
				/>
			)}
		>

			<BasicButton
				size="large"
				type="text"
				{...restProps}
				className={cn("relative group", restProps.className)}
				icon={<BellOutlined className="group-hover:animate-wiggle" />}
			>
				{count !== undefined
					? count > 0 && (
						<span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
							{count > 99 ? "99+" : count}
						</span>
					)
					: showDot && <span className="bg-blue-600 absolute right-2 top-1.5 h-2 w-2 rounded"></span>}
			</BasicButton>

		</Popover>
	);
};
