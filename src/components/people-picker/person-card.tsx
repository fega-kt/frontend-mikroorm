import type { PersonCard, PersonCardProfile, PersonCardUser } from "#src/api/system/principal";
import type { ReactNode, UIEvent } from "react";
import { principalService, PrincipalType } from "#src/api/system/principal";
import { UserAvatar } from "#src/components/user-avatar";
import { getAvatarColor, getAvatarColorStyle } from "#src/utils/avatar";
import { ApartmentOutlined, ExclamationCircleOutlined, LockOutlined, MailOutlined, PhoneOutlined, ReloadOutlined, TeamOutlined } from "@ant-design/icons";
import { Button, Popover, Skeleton, Spin, Tag, theme, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

dayjs.extend(relativeTime);

const { Text } = Typography;

const MEMBER_PAGE_SIZE = 10;
const SCROLL_THRESHOLD = 40;
/** lastActiveAt chỉ ghi tối đa 1 lần / giờ nên "vừa hoạt động" = trong 1 giờ qua */
const RECENT_MINUTES = 60;

export interface PersonCardTarget {
	kind: "user" | "principal"
	id: string
}

const cardCache = new Map<string, Promise<PersonCard>>();

function loadCard({ kind, id }: PersonCardTarget) {
	const key = `${kind}:${id}`;
	let promise = cardCache.get(key);
	if (!promise) {
		promise = kind === "user" ? principalService.fetchUserCard(id) : principalService.fetchCard(id);
		promise.catch(() => cardCache.delete(key));
		cardCache.set(key, promise);
	}
	return promise;
}

function InfoRow({ icon, label, children }: { icon: ReactNode, label: string, children: ReactNode }) {
	const { token } = theme.useToken();
	return (
		<div className="flex items-start gap-2.5 text-[13px] leading-5">
			<span className="flex h-5 w-4 shrink-0 items-center justify-center" style={{ color: token.colorTextTertiary }}>{icon}</span>
			<Text type="secondary" className="w-[68px] shrink-0 text-[13px]">{label}</Text>
			<div className="min-w-0 flex-1">{children}</div>
		</div>
	);
}

function UserCard({ user }: { user: PersonCardProfile }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const locked = !user.isActive;
	const lastActive = user.lastActiveAt ? dayjs(user.lastActiveAt) : null;
	const recent = !locked && !!lastActive && dayjs().diff(lastActive, "minute") < RECENT_MINUTES;
	const activity = !lastActive
		? null
		: recent
			? t("common.personCard.activeRecently")
			: t(locked ? "common.personCard.lastSeen" : "common.personCard.activeAgo", { time: lastActive.fromNow() });
	const { groups } = user;
	const moreGroups = user.groupTotal - groups.length;
	const ring = `0 0 0 3px ${token.colorBgElevated}`;

	return (
		<div>
			<div className="h-14" style={{ background: locked ? token.colorFillTertiary : `${getAvatarColor(user.id)}1f` }} />
			<div className="flex flex-col gap-3 px-4 pb-4">
				<div className="-mt-7 flex items-end justify-between">
					<div className="relative">
						<UserAvatar size={56} user={user} className="text-[22px]" style={locked ? { boxShadow: ring, filter: "grayscale(1)", opacity: 0.55 } : { boxShadow: ring }} />
						{recent && <span className="absolute bottom-0.5 right-0.5 size-3 rounded-full" style={{ background: token.colorSuccess, boxShadow: `0 0 0 2px ${token.colorBgElevated}` }} />}
					</div>
					{locked
						? <Tag color="error" icon={<LockOutlined />} className="m-0">{t("common.personCard.locked")}</Tag>
						: (
							<div className="flex gap-1.5">
								{user.workEmail && (
									<Tooltip title={t("common.personCard.sendEmail")}>
										<Button icon={<MailOutlined />} href={`mailto:${user.workEmail}`} aria-label={t("common.personCard.sendEmail")} />
									</Tooltip>
								)}
								{user.phoneNumber && (
									<Tooltip title={t("common.personCard.call")}>
										<Button icon={<PhoneOutlined />} href={`tel:${user.phoneNumber}`} aria-label={t("common.personCard.call")} />
									</Tooltip>
								)}
							</div>
						)}
				</div>
				<div className="flex flex-col gap-0.5">
					<Text strong type={locked ? "secondary" : undefined} className="text-base leading-[22px]" ellipsis>{user.fullName || user.loginName}</Text>
					{activity && <span className="text-xs" style={{ color: recent ? token.colorSuccessText : token.colorTextSecondary }}>{activity}</span>}
				</div>
				<div className="h-px" style={{ background: token.colorSplit }} />
				<div className="flex flex-col gap-2.5">
					{user.department && (
						<InfoRow icon={<ApartmentOutlined />} label={t("common.personCard.department")}>
							<Text className="text-[13px] font-medium" ellipsis>{user.department.name}</Text>
						</InfoRow>
					)}
					{user.workEmail && (
						<InfoRow icon={<MailOutlined />} label={t("common.personCard.email")}>
							<Text className="text-[13px]" copyable ellipsis>{user.workEmail}</Text>
						</InfoRow>
					)}
					{!locked && user.phoneNumber && (
						<InfoRow icon={<PhoneOutlined />} label={t("common.personCard.phone")}>
							<Text className="text-[13px]" copyable>{user.phoneNumber}</Text>
						</InfoRow>
					)}
					{!locked && groups.length > 0 && (
						<InfoRow icon={<TeamOutlined />} label={t("common.personCard.groups")}>
							<div className="flex flex-wrap gap-1">
								{groups.map(group => <Tag key={group.id} color="blue" bordered={false} className="m-0 max-w-full truncate">{group.name}</Tag>)}
								{moreGroups > 0 && <Tag bordered={false} className="m-0">{`+${moreGroups}`}</Tag>}
							</div>
						</InfoRow>
					)}
				</div>
				{locked && (
					<div className="rounded-md px-2.5 py-2 text-xs" style={{ background: token.colorFillQuaternary, color: token.colorTextSecondary }}>
						{t("common.personCard.lockedNote")}
					</div>
				)}
			</div>
		</div>
	);
}

function MemberRow({ user }: { user: PersonCardUser }) {
	return (
		<div className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-colorFillTertiary">
			<UserAvatar size={26} user={user} className="text-[11px]" />
			<div className="flex min-w-0 flex-1 flex-col leading-tight">
				<Text className="text-[13px]" ellipsis>{user.fullName || user.loginName}</Text>
				{(user.department?.name || user.workEmail) && (
					<Text type="secondary" className="text-[11px]" ellipsis>{user.department?.name || user.workEmail}</Text>
				)}
			</div>
		</div>
	);
}

function GroupMembers({ principalId, first, total }: { principalId: string, first: PersonCardUser[], total: number }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [members, setMembers] = useState(first);
	const [loading, setLoading] = useState(false);
	const [failed, setFailed] = useState(false);
	const [done, setDone] = useState(false);
	const hasMore = !done && members.length < total;

	const loadMore = async () => {
		if (loading || !hasMore)
			return;
		setLoading(true);
		setFailed(false);
		try {
			const page = Math.floor(members.length / MEMBER_PAGE_SIZE) + 1;
			const res = await principalService.fetchGroupMembers(principalId, page);
			if (!res.data.length)
				setDone(true);
			setMembers((prev) => {
				const seen = new Set(prev.map(member => member.id));
				return [...prev, ...res.data.filter(member => !seen.has(member.id))];
			});
		}
		catch {
			setFailed(true);
		}
		finally {
			setLoading(false);
		}
	};

	const handleScroll = (event: UIEvent<HTMLDivElement>) => {
		const el = event.currentTarget;
		if (!failed && el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD)
			loadMore();
	};

	return (
		<div className="max-h-62 overflow-y-auto px-2 pb-2" onScroll={handleScroll}>
			{members.map(member => <MemberRow key={member.id} user={member} />)}
			{loading && (
				<div className="flex items-center justify-center gap-2 py-2 text-xs" style={{ color: token.colorTextSecondary }}>
					<Spin size="small" />
					{t("common.loading")}
				</div>
			)}
			{failed && (
				<div className="mt-1 flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs" style={{ background: token.colorWarningBg, color: token.colorWarningText }}>
					{t("common.personCard.loadMoreFailed")}
					<Typography.Link className="text-xs" onClick={loadMore}>{t("common.personCard.retry")}</Typography.Link>
				</div>
			)}
		</div>
	);
}

function GroupCard({ card }: { card: PersonCard }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const soft = getAvatarColorStyle(card.principalId);
	const members = card.members ?? [];
	const total = card.memberTotal ?? members.length;

	return (
		<div>
			<div className="flex items-center gap-3 p-4" style={{ background: soft.backgroundColor }}>
				<span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] text-[22px]" style={{ background: token.colorBgElevated, color: soft.color }}>
					<TeamOutlined />
				</span>
				<div className="flex min-w-0 flex-col gap-1">
					<Text strong className="text-base leading-[22px]" ellipsis>{card.name}</Text>
					<div className="flex items-center gap-1.5">
						{members.length > 0 && (
							<div className="flex">
								{members.slice(0, 3).map((member, index) => (
									<UserAvatar
										key={member.id}
										size={18}
										user={member}
										className="text-[9px]"
										style={{ boxShadow: `0 0 0 2px ${token.colorBgElevated}`, marginLeft: index ? -5 : 0 }}
									/>
								))}
							</div>
						)}
						<Text className="text-xs">{t("common.personCard.members", { count: total })}</Text>
					</div>
				</div>
			</div>
			{card.description && <Text type="secondary" className="block whitespace-pre-wrap px-4 pt-3 text-xs">{card.description}</Text>}
			{members.length && card.principalId
				? (
					<>
						<Text strong className="block px-4 pb-1.5 pt-3 text-xs">{t("common.personCard.memberList")}</Text>
						<GroupMembers principalId={card.principalId} first={members} total={total} />
					</>
				)
				: <Text type="secondary" className="block p-4 text-xs">{t("common.personCard.noMembers")}</Text>}
		</div>
	);
}

function CardSkeleton() {
	const { token } = theme.useToken();
	return (
		<div>
			<div className="h-10" style={{ background: token.colorFillTertiary }} />
			<div className="px-4 pb-4">
				<Skeleton.Avatar active size={48} className="-mt-6" style={{ boxShadow: `0 0 0 3px ${token.colorBgElevated}` }} />
				<Skeleton active title={{ width: 140 }} paragraph={{ rows: 2, width: [200, 160] }} className="mt-2" />
			</div>
		</div>
	);
}

function CardBody({ target }: { target: PersonCardTarget }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [card, setCard] = useState<PersonCard>();
	const [failed, setFailed] = useState(false);
	const [attempt, setAttempt] = useState(0);
	const { kind, id } = target;

	useEffect(() => {
		let alive = true;
		loadCard({ kind, id })
			.then(res => alive && setCard(res))
			.catch(() => alive && setFailed(true));
		return () => {
			alive = false;
		};
	}, [kind, id, attempt]);

	if (failed) {
		return (
			<div className="flex flex-col items-center gap-2 px-4 py-5 text-center">
				<ExclamationCircleOutlined className="text-[28px]" style={{ color: token.colorWarning }} />
				<Text className="text-[13px] font-medium">{t("common.personCard.loadFailed")}</Text>
				<Button
					size="small"
					icon={<ReloadOutlined />}
					onClick={() => {
						setFailed(false);
						setAttempt(n => n + 1);
					}}
				>
					{t("common.personCard.retry")}
				</Button>
			</div>
		);
	}
	if (!card)
		return <CardSkeleton />;
	if (card.type === PrincipalType.Group)
		return <GroupCard card={card} />;
	return card.user ? <UserCard user={card.user} /> : null;
}

interface PersonHoverCardProps {
	target?: PersonCardTarget | null
	children: ReactNode
}

/** Popover chỉ dựng nội dung (và gọi API) khi mở lần đầu */
export function PersonHoverCard({ target, children }: PersonHoverCardProps) {
	if (!target?.id)
		return children;
	return (
		<Popover
			mouseEnterDelay={0.35}
			arrow={false}
			styles={{ container: { padding: 0, overflow: "hidden", borderRadius: 10 } }}
			content={<div className="w-80"><CardBody target={target} /></div>}
		>
			<span className="inline-flex min-w-0 cursor-pointer">{children}</span>
		</Popover>
	);
}
