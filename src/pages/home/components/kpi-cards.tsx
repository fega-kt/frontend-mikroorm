import type { CSSProperties, ReactNode } from "react";

import { CheckCircleOutlined, ClockCircleOutlined, RiseOutlined, SendOutlined } from "@ant-design/icons";
import { theme } from "antd";
import { useTranslation } from "react-i18next";

interface KpiCardsProps {
	pendingCount: number
	overdueCount: number
	myInProgressCount: number
	returnedCount: number
	approvedThisMonth: number
	approvedLastMonth: number
	approvalRate: number
	rejectedThisMonth: number
	returnedThisMonth: number
}

interface KpiItem {
	key: string
	label: string
	value: ReactNode
	unit?: string
	note: string
	noteColor: string
	icon: ReactNode
	/** Màu chủ đạo / nền / viền của thẻ */
	color: string
	bg: string
	border: string
	/** Hiện vòng % thay cho ô icon */
	percent?: number
}

function PercentRing({ percent, color, track }: { percent: number, color: string, track: string }) {
	const radius = 18;
	const circumference = 2 * Math.PI * radius;
	return (
		<svg aria-hidden="true" width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
			<circle cx="22" cy="22" r={radius} fill="none" stroke={track} strokeWidth="5" />
			<circle
				cx="22"
				cy="22"
				r={radius}
				fill="none"
				stroke={color}
				strokeWidth="5"
				strokeLinecap="round"
				strokeDasharray={`${(percent / 100) * circumference} ${circumference}`}
				transform="rotate(-90 22 22)"
			/>
		</svg>
	);
}

export function KpiCards(props: KpiCardsProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const delta = props.approvedThisMonth - props.approvedLastMonth;

	const items: KpiItem[] = [
		{
			key: "pending",
			label: t("home.kpi.pending"),
			value: props.pendingCount,
			unit: t("home.unit.request"),
			note: t("home.kpi.pendingNote", { count: props.overdueCount }),
			noteColor: props.overdueCount ? token.colorError : token.colorTextTertiary,
			icon: <ClockCircleOutlined />,
			color: token.colorWarning,
			bg: token.colorWarningBg,
			border: token.colorWarningBorder,
		},
		{
			key: "mine",
			label: t("home.kpi.myInProgress"),
			value: props.myInProgressCount,
			unit: t("home.unit.request"),
			note: t("home.kpi.myInProgressNote", { count: props.returnedCount }),
			noteColor: props.returnedCount ? token.colorWarning : token.colorTextTertiary,
			icon: <SendOutlined />,
			color: token.blue6,
			bg: token.blue1,
			border: token.blue3,
		},
		{
			key: "approved",
			label: t("home.kpi.approvedThisMonth"),
			value: props.approvedThisMonth,
			unit: t("home.unit.request"),
			note: t("home.kpi.approvedNote", { delta: `${delta >= 0 ? "+" : ""}${delta}` }),
			noteColor: delta >= 0 ? token.colorSuccess : token.colorError,
			icon: <CheckCircleOutlined />,
			color: token.colorSuccess,
			bg: token.colorSuccessBg,
			border: token.colorSuccessBorder,
		},
		{
			key: "rate",
			label: t("home.kpi.approvalRate"),
			value: `${props.approvalRate}%`,
			note: t("home.kpi.approvalRateNote", { rejected: props.rejectedThisMonth, returned: props.returnedThisMonth }),
			noteColor: token.colorTextTertiary,
			icon: <RiseOutlined />,
			color: token.cyan6,
			bg: token.cyan1,
			border: token.cyan3,
			percent: props.approvalRate,
		},
	];

	return (
		<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{items.map(item => (
				<div
					key={item.key}
					className={[
						"group relative overflow-hidden border border-solid px-5 py-[18px]",
						// Thẻ không bấm được nên hover chỉ nhẹ (viền + icon chìm), không nhấc lên/đổ bóng để khỏi gợi ý click
						"border-[var(--kpi-border)] transition-colors duration-300 hover:border-[var(--kpi-color)] motion-reduce:transition-none",
					].join(" ")}
					style={{
						"background": `linear-gradient(135deg, ${item.bg} 0%, ${token.colorBgContainer} 75%)`,
						"borderRadius": token.borderRadiusLG * 1.5,
						"--kpi-color": item.color,
						"--kpi-border": item.border,
					} as CSSProperties}
				>
					{/* Icon lớn chìm ở góc làm họa tiết — hover thì rõ hơn chút */}
					<span
						aria-hidden="true"
						className="pointer-events-none absolute -bottom-5 -right-3 text-[96px] leading-none opacity-[0.08] transition-opacity duration-500 group-hover:opacity-[0.14] motion-reduce:transition-none"
						style={{ color: item.color }}
					>
						{item.icon}
					</span>

					<div className="relative flex flex-col gap-2.5">
						<div className="flex min-h-9 items-center justify-between gap-3">
							<span className="text-sm font-medium text-colorTextSecondary">{item.label}</span>
							{item.percent === undefined && (
								<span
									className="flex size-9 shrink-0 items-center justify-center text-lg text-white"
									style={{ background: item.color, borderRadius: token.borderRadiusLG, boxShadow: `0 4px 12px ${item.border}` }}
								>
									{item.icon}
								</span>
							)}
						</div>
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-baseline gap-1.5">
								<span className="text-[30px] font-bold leading-none" style={{ color: item.color }}>{item.value}</span>
								{item.unit && <span className="text-sm text-colorTextTertiary">{item.unit}</span>}
							</div>
							{item.percent !== undefined && <PercentRing percent={item.percent} color={item.color} track={item.border} />}
						</div>
						<span className="text-xs" style={{ color: item.noteColor }}>{item.note}</span>
					</div>
				</div>
			))}
		</section>
	);
}
