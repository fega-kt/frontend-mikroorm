import type { Ref } from "react";
import type { BannerPetRef } from "./banner-pet";

import { UserAvatar } from "#src/components/user-avatar";
import { approvalRequestPath } from "#src/router/extra-info";
import { useUserStore } from "#src/store/user";

import { PlusOutlined } from "@ant-design/icons";
import { Button, theme } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { BannerPet } from "./banner-pet";

interface GreetingBannerProps {
	pendingCount: number
	overdueCount: number
	returnedCount: number
	/** Ref tới chú mèo để trang chủ gọi ăn mừng khi duyệt */
	petRef?: Ref<BannerPetRef>
}

function getGreetingKey(hour: number) {
	if (hour < 11)
		return "home.greeting.morning";
	if (hour < 14)
		return "home.greeting.noon";
	if (hour < 18)
		return "home.greeting.afternoon";
	return "home.greeting.evening";
}

export function GreetingBanner({ pendingCount, overdueCount, returnedCount, petRef }: GreetingBannerProps) {
	const { t, i18n } = useTranslation();
	const { token } = theme.useToken();
	const navigate = useNavigate();
	const { id, fullName, avatar } = useUserStore();

	const now = new Date();
	const dateLabel = new Intl.DateTimeFormat(i18n.language, { weekday: "long", day: "numeric", month: "numeric", year: "numeric" }).format(now);

	const chips = [
		{ key: "pending", value: pendingCount, label: t("home.chip.pending"), color: token.colorPrimary, bg: token.colorPrimaryBg, border: token.colorPrimaryBorder },
		{ key: "overdue", value: overdueCount, label: t("home.chip.overdue"), color: token.colorError, bg: token.colorErrorBg, border: token.colorErrorBorder },
		{ key: "returned", value: returnedCount, label: t("home.chip.returned"), color: token.colorWarning, bg: token.colorWarningBg, border: token.colorWarningBorder },
	];

	return (
		<section
			className="relative flex flex-wrap items-center justify-between gap-5 overflow-hidden px-7 pb-[72px] pt-6"
			style={{
				background: `linear-gradient(110deg, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 60%)`,
				border: `1px solid ${token.colorBorderSecondary}`,
				borderRadius: token.borderRadiusLG * 1.5,
			}}
		>
			{/* Họa tiết quỹ đạo lấy từ logo */}
			<svg aria-hidden="true" width="320" height="320" viewBox="0 0 320 320" className="pointer-events-none absolute -right-16 -top-28">
				<circle cx="160" cy="160" r="150" fill="none" stroke={token.colorPrimary} strokeOpacity="0.22" strokeWidth="1.5" />
				<circle cx="160" cy="160" r="104" fill="none" stroke={token.colorPrimary} strokeOpacity="0.14" strokeWidth="1.5" />
				<circle cx="160" cy="10" r="5" fill={token.colorPrimary} fillOpacity="0.5" />
				<circle cx="10" cy="160" r="5" fill={token.colorPrimary} fillOpacity="0.5" />
				<circle cx="160" cy="310" r="5" fill={token.colorPrimary} fillOpacity="0.5" />
			</svg>

			<div className="relative flex min-w-0 items-center gap-4">
				<UserAvatar
					size={60}
					user={{ id, fullName, avatar }}
					className="text-[22px]"
					style={{ boxShadow: `0 0 0 3px ${token.colorPrimaryBg}, 0 0 0 5px ${token.colorPrimary}` }}
				/>
				<div className="flex min-w-0 flex-col gap-2">
					<div className="flex flex-col gap-0.5">
						<span className="text-[13px] capitalize text-colorTextTertiary">{dateLabel}</span>
						<h1 className="m-0 text-2xl font-semibold text-colorText">
							{t(getGreetingKey(now.getHours()))}
							{fullName ? `, ${fullName}` : ""}
						</h1>
					</div>
					<div className="flex flex-wrap gap-2">
						{chips.map(chip => (
							<span
								key={chip.key}
								className="flex h-[26px] items-center gap-1.5 rounded-full px-2.5 text-xs"
								style={{ color: chip.color, background: chip.bg, border: `1px solid ${chip.border}` }}
							>
								<span className="size-1.5 rounded-full" style={{ background: chip.color }} />
								<strong className="font-semibold">{chip.value}</strong>
								{chip.label}
							</span>
						))}
					</div>
				</div>
			</div>

			<BannerPet ref={petRef} />

			<Button className="relative" type="primary" size="large" icon={<PlusOutlined />} onClick={() => navigate(approvalRequestPath.create)}>
				{t("home.createRequest")}
			</Button>
		</section>
	);
}
