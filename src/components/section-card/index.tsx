import type { ReactNode } from "react";
import { cn } from "#src/utils/cn";
import { Card, theme, Typography } from "antd";

const { Title } = Typography;

interface SectionCardProps {
	/** Icon displayed before the title */
	icon?: ReactNode
	/** Section title text */
	title: ReactNode
	/** Extra content on the right side of the header (e.g. buttons) */
	extra?: ReactNode
	/** Card body content */
	children: ReactNode
	/** Custom className for the card */
	className?: string
	/** Custom className for the body wrapper (default: "px-6 pb-5") */
	bodyClassName?: string
	/** If true, removes the inner padding and uses no body wrapper div */
	noPadding?: boolean
}

/**
 * A reusable card with an icon + title header.
 * Used for sections like Attachments, WBS, etc.
 */
export function SectionCard({ icon, title, extra, children, className, bodyClassName = "px-6 pb-5", noPadding }: SectionCardProps) {
	const { token } = theme.useToken();
	return (
		<Card
			className={cn("border-none shadow-sm overflow-hidden", className)}
			bodyStyle={{ padding: noPadding ? 0 : "16px 20px" }}
			style={{ borderRadius: token.borderRadiusLG, backgroundColor: token.colorBgContainer }}
		>
			<div className="flex items-center justify-between px-6 pt-5 pb-3">
				<div className="flex items-center gap-2">
					{icon && (
						<span style={{ fontSize: 15, display: "flex", color: token.colorTextSecondary }}>
							{icon}
						</span>
					)}
					<Title level={5} className="m-0" style={{ fontSize: 14, fontWeight: 600 }}>
						{title}
					</Title>
				</div>
				{extra}
			</div>
			<div className={bodyClassName}>
				{children}
			</div>
		</Card>
	);
}
