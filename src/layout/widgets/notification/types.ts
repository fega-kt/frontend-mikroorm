import type { ReactNode } from "react";

export interface NotificationItem {
	id: string
	/** Trang mở khi bấm vào noti — map từ refType/refId */
	link?: string
	/** Ảnh người gây ra noti — có thì ưu tiên hiện */
	avatar?: string
	/** Id người gây ra noti — dùng để tô màu avatar chữ cái */
	actorId?: string
	/** Tên người gây ra noti — dùng chữ cái đầu khi không có ảnh */
	actorName?: string
	/** Icon theo loại noti — dùng cho noti hệ thống (không có actor) */
	icon?: ReactNode
	iconColor?: string
	date: string
	isRead?: boolean
	message: string
	title: string
}
