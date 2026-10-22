import type { PrincipalType as PrincipalTypeEnum } from "#src/api/system/principal";
import type { UserEntity } from "#src/api/user/types";
import type { ReactNode } from "react";
import type { PersonCardTarget } from "./person-card";
import { PrincipalType } from "#src/api/system/principal";
import { UserAvatar } from "#src/components/user-avatar";
import { cn } from "#src/utils/cn";
import { TeamOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import { PersonHoverCard } from "./person-card";

const { Text } = Typography;

/** Thông tin tối thiểu để hiển thị 1 user (UserEntity đầy đủ hoặc bản rút gọn từ các API khác) */
export type PeopleUser = Pick<UserEntity, "id"> & Partial<Pick<UserEntity, "fullName" | "loginName" | "workEmail">> & { avatar?: string | null };

export interface PeoplePrincipal {
	id: string
	name: string
	type?: PrincipalTypeEnum
	user?: { id?: string, fullName?: string, avatar?: string | null } | null
}

export interface PersonDisplayProps {
	user?: PeopleUser | null
	principal?: PeoplePrincipal | null
	showAvatar?: boolean
	showEmail?: boolean
	/** Dòng phụ tùy ý dưới tên, thay cho email */
	description?: ReactNode
	size?: "small" | "middle"
	avatarOnly?: boolean
	/** Tên chữ thường màu phụ — khi nằm trong dòng thông tin phụ (lịch sử, meta) */
	subtle?: boolean
	avatarSize?: number
	hoverCard?: boolean
	className?: string
}

function personCardTarget(user?: PeopleUser | null, principal?: PeoplePrincipal | null): PersonCardTarget | null {
	if (principal?.id)
		return { kind: "principal", id: principal.id };
	if (user?.id)
		return { kind: "user", id: user.id };
	return null;
}

export function PersonDisplay({ user, principal, showAvatar = true, showEmail = false, description, size = "middle", avatarOnly, subtle, avatarSize, hoverCard = true, className }: PersonDisplayProps) {
	const isGroup = !!principal && principal.type === PrincipalType.Group;
	const name = principal ? (principal.user?.fullName || principal.name) : (user?.fullName || user?.loginName || user?.id);
	const email = !principal && showEmail ? (user?.workEmail || user?.loginName) : undefined;
	const iconSize = avatarSize ?? (size === "small" ? 18 : 22);

	const avatar = isGroup
		? <UserAvatar size={iconSize} variant="soft" user={{ id: principal.id, fullName: principal.name }} fallbackIcon={<TeamOutlined className="text-[12px]" />} />
		: (
			<UserAvatar
				size={iconSize}
				user={principal ? { id: principal.user?.id ?? principal.id, fullName: name, avatar: principal.user?.avatar } : user}
				className={size === "small" ? "text-[10px]" : "text-[11px]"}
			/>
		);

	const content = avatarOnly
		? avatar
		: (
			<span className={cn("inline-flex min-w-0 items-center", size === "small" ? "gap-1.5" : "gap-2", className)}>
				{showAvatar && avatar}
				{description
					? (
						<span className="flex min-w-0 flex-col gap-0.5 leading-tight">
							<Text strong={!subtle} type={subtle ? "secondary" : undefined} className={size === "small" ? "text-[12px]" : "text-[13px]"} ellipsis>{name}</Text>
							<Text type="secondary" className="text-xs" ellipsis>{description}</Text>
						</span>
					)
					: (
						<span className="flex min-w-0 flex-col leading-none">
							<Text strong={!subtle} type={subtle ? "secondary" : undefined} className={cn(size === "small" ? "text-[12px]" : "text-[13px]", email && "-mb-0.5")} ellipsis>{name}</Text>
							{email && <Text type="secondary" className={size === "small" ? "text-[9px]" : "text-[10px]"} ellipsis>{email}</Text>}
						</span>
					)}
			</span>
		);

	return hoverCard ? <PersonHoverCard target={personCardTarget(user, principal)}>{content}</PersonHoverCard> : content;
}
