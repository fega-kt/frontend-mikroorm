import type { AvatarProps } from "antd";
import type { ReactNode } from "react";

import { getAvatarColor, getAvatarColorStyle } from "#src/utils/avatar";
import { cn } from "#src/utils/cn";

import { Avatar } from "antd";

export interface UserAvatarUser {
	id?: string
	fullName?: string
	loginName?: string
	avatar?: string | null
}

export interface UserAvatarProps extends Omit<AvatarProps, "src" | "icon" | "children"> {
	user?: UserAvatarUser | null
	/** solid: nền đậm chữ trắng (mặc định) · soft: nền nhạt chữ màu, có viền (dùng ở picker) */
	variant?: "solid" | "soft"
	/** Hiện icon này thay cho chữ cái khi không có ảnh (vd: group, user chưa rõ tên) */
	fallbackIcon?: ReactNode
}

/** Chữ cái đầu của tên gọi (từ cuối của họ tên) — dùng khi user chưa có ảnh */
function getInitial(user?: UserAvatarUser | null) {
	const name = user?.fullName?.trim() || user?.loginName?.trim();
	return name?.split(/\s+/).pop()?.[0]?.toUpperCase() || "?";
}

/** Avatar user dùng chung: ưu tiên ảnh, không có/lỗi ảnh thì hiện chữ cái đầu (hoặc icon) trên nền màu theo id */
export function UserAvatar({ user, variant = "solid", fallbackIcon, style, className, ...rest }: UserAvatarProps) {
	const soft = variant === "soft" ? getAvatarColorStyle(user?.id) : undefined;
	const hasImage = !!user?.avatar;

	return (
		<Avatar
			{...rest}
			src={user?.avatar || undefined}
			icon={!hasImage ? fallbackIcon : undefined}
			className={cn("shrink-0 font-semibold", soft && "border-solid", className)}
			style={{
				backgroundColor: soft && !hasImage ? soft.backgroundColor : getAvatarColor(user?.id),
				...(soft && !hasImage ? { color: soft.color, borderColor: soft.borderColor } : undefined),
				...style,
			}}
		>
			{getInitial(user)}
		</Avatar>
	);
}
