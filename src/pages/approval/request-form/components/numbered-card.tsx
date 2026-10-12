import type { ReactNode } from "react";
import { theme } from "antd";

interface NumberedCardProps {
	index?: number
	title: ReactNode
	extra?: ReactNode
	children: ReactNode
}

/** Thẻ có số thứ tự ở đầu (các khối của màn tạo tờ trình) */
export function NumberedCard({ index, title, extra, children }: NumberedCardProps) {
	const { token } = theme.useToken();
	return (
		<section
			style={{ background: token.colorBgContainer, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadiusLG }}
		>
			<div
				className="flex flex-wrap items-center justify-between gap-2 px-5 py-4"
				style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
			>
				<div className="flex items-center gap-2.5">
					{index !== undefined && (
						<span
							className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-bold"
							style={{ background: token.colorPrimaryBg, color: token.colorPrimary }}
						>
							{index}
						</span>
					)}
					<h2 className="m-0 text-base font-semibold">{title}</h2>
				</div>
				{extra && <div className="text-xs" style={{ color: token.colorTextSecondary }}>{extra}</div>}
			</div>
			<div className="p-5">{children}</div>
		</section>
	);
}
