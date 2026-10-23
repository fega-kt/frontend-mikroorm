import { theme } from "antd";

export interface TimelineNodeStyle {
	icon: React.ReactNode
	/** Màu icon */
	color: string
	/** Nền nút tròn */
	background: string
	/** Viền nét đứt: việc đang chờ (chưa xảy ra) */
	dashed?: boolean
}

interface TimelineRowProps {
	/** Cột trái: giờ (hoặc "Hiện tại") */
	time: React.ReactNode
	timeColor?: string
	node: TimelineNodeStyle
	/** Dòng cuối: không vẽ đường nối xuống dưới */
	last?: boolean
	/** Đường nối nét đứt (từ việc đang chờ xuống sự kiện đã xảy ra) */
	dashedLine?: boolean
	children: React.ReactNode
}

/** Một dòng của dòng thời gian: cột giờ | nút tròn + đường nối | nội dung */
export function TimelineRow({ time, timeColor, node, last, dashedLine, children }: TimelineRowProps) {
	const { token } = theme.useToken();
	return (
		<div className="grid grid-cols-[56px_32px_minmax(0,1fr)] gap-x-3 sm:grid-cols-[64px_36px_minmax(0,1fr)]">
			<div className="pt-1.5 text-right text-[13px] font-semibold tabular-nums" style={{ color: timeColor }}>{time}</div>
			<div className="flex flex-col items-center">
				<span
					className="flex size-8 shrink-0 items-center justify-center rounded-full text-[15px]"
					style={{
						color: node.color,
						background: node.dashed ? token.colorBgContainer : node.background,
						border: node.dashed ? `2px dashed ${node.color}` : undefined,
					}}
				>
					{node.icon}
				</span>
				{!last && (
					<span
						className="min-h-4 w-0.5 flex-1"
						style={{ background: dashedLine ? `repeating-linear-gradient(${token.colorBorder} 0 4px, transparent 4px 8px)` : token.colorBorderSecondary }}
					/>
				)}
			</div>
			<div className={`flex min-w-0 flex-col gap-2 pt-1 ${last ? "pb-1" : "pb-7"}`}>{children}</div>
		</div>
	);
}
