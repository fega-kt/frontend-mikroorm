import { theme, Tooltip } from "antd";
import { formatNumber, STATUS_COLORS } from "../lib";

/** Khung trắng của một khối báo cáo: tiêu đề, chú thích, nội dung */
export function Panel({ title, hint, extra, children }: { title: string, hint?: string, extra?: React.ReactNode, children: React.ReactNode }) {
	const { token } = theme.useToken();
	return (
		<section className="flex min-w-0 flex-col gap-3 rounded-lg p-4" style={{ background: token.colorBgContainer }}>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<h3 className="m-0 text-[15px] font-semibold">{title}</h3>
					{hint && <div className="mt-0.5 text-xs" style={{ color: token.colorTextTertiary }}>{hint}</div>}
				</div>
				{extra}
			</div>
			{children}
		</section>
	);
}

export interface KpiProps {
	label: string
	value: React.ReactNode
	unit?: string
	/** Dòng phụ: so sánh kỳ trước hoặc giải thích cách tính */
	note?: React.ReactNode
	danger?: boolean
}

export function Kpi({ label, value, unit, note, danger }: KpiProps) {
	const { token } = theme.useToken();
	return (
		<div className="flex min-w-0 flex-col gap-1.5 rounded-lg p-4" style={{ background: token.colorBgContainer }}>
			<div className="text-[13px]" style={{ color: token.colorTextSecondary }}>{label}</div>
			<div className="text-[28px] font-bold leading-tight" style={{ color: danger ? token.colorError : token.colorText }}>
				{value}
				{unit && <span className="ml-1 text-sm font-medium" style={{ color: token.colorTextSecondary }}>{unit}</span>}
			</div>
			{note && <div className="text-xs" style={{ color: token.colorTextSecondary }}>{note}</div>}
		</div>
	);
}

/** Thay đổi so với kỳ trước; good = tăng là tốt (xanh) hay xấu (đỏ) */
export function Delta({ value, suffix, good = "up" }: { value: number | null, suffix: string, good?: "up" | "down" }) {
	const { token } = theme.useToken();
	if (value === null || !Number.isFinite(value) || value === 0)
		return null;
	const positive = value > 0;
	const color = positive === (good === "up") ? token.colorSuccess : token.colorError;
	return <b style={{ color }}>{`${positive ? "▲" : "▼"} ${formatNumber(Math.abs(value))}${suffix}`}</b>;
}

export interface HBarItem {
	key: string
	label: string
	value: number
	/** Chữ hiển thị bên phải (mặc định là value) */
	display?: React.ReactNode
	tooltip?: React.ReactNode
	color?: string
	onClick?: () => void
}

/** Thanh ngang so độ lớn, mốc 0 cố định bên trái */
export function HBarList({ items, labelWidth = 150, empty }: { items: HBarItem[], labelWidth?: number, empty: string }) {
	const { token } = theme.useToken();
	const max = Math.max(...items.map(item => item.value), 0);
	if (!items.length)
		return <div className="py-6 text-center text-[13px]" style={{ color: token.colorTextTertiary }}>{empty}</div>;
	return (
		<div className="flex flex-col gap-2.5">
			{items.map(item => (
				<Tooltip key={item.key} title={item.tooltip}>
					<button
						type="button"
						disabled={!item.onClick}
						onClick={item.onClick}
						className="grid w-full items-center gap-2.5 border-0 bg-transparent p-0 text-left"
						style={{ gridTemplateColumns: `${labelWidth}px minmax(0, 1fr) auto`, cursor: item.onClick ? "pointer" : "default", color: token.colorText }}
					>
						<span className="truncate text-[13px]">{item.label}</span>
						<span className="h-3.5 rounded-r" style={{ background: token.colorFillTertiary }}>
							<span
								className="block h-3.5 rounded-r"
								style={{ width: `${max ? (item.value / max) * 100 : 0}%`, background: item.color ?? token.colorPrimary }}
							/>
						</span>
						<span className="min-w-10 text-right text-[13px] tabular-nums">{item.display ?? formatNumber(item.value)}</span>
					</button>
				</Tooltip>
			))}
		</div>
	);
}

/** Thanh tỉ lệ nhỏ trong bảng, kèm số % */
export function PercentBar({ value, danger }: { value: number | null, danger?: boolean }) {
	const { token } = theme.useToken();
	if (value === null)
		return <span style={{ color: token.colorTextTertiary }}>—</span>;
	return (
		<span className="inline-flex items-center gap-2">
			<span className="inline-block h-2 w-20 rounded" style={{ background: token.colorFillSecondary }}>
				<span className="block h-2 rounded" style={{ width: `${value}%`, background: danger ? STATUS_COLORS.rejected : STATUS_COLORS.approved }} />
			</span>
			<span className="tabular-nums">{`${formatNumber(value)}%`}</span>
		</span>
	);
}

export function Legend({ items }: { items: { label: string, color: string }[] }) {
	const { token } = theme.useToken();
	return (
		<div className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs" style={{ color: token.colorTextSecondary }}>
			{items.map(item => (
				<span key={item.label} className="inline-flex items-center gap-1.5">
					<span className="inline-block size-2.5 rounded-sm" style={{ background: item.color }} />
					{item.label}
				</span>
			))}
		</div>
	);
}
