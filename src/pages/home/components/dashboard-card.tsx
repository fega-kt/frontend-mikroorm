import type { CardProps } from "antd";
import type { ReactNode } from "react";

import { Card, theme } from "antd";
import { Link } from "react-router";

interface DashboardCardProps extends Omit<CardProps, "title"> {
	title: ReactNode
	/** Link "Xem tất cả" ở chân card */
	footerLink?: { to: string, label: ReactNode }
	/** Bỏ padding body để list chạm mép card */
	flush?: boolean
}

export function DashboardCard({ title, footerLink, flush, children, className, ...restProps }: DashboardCardProps) {
	const { token } = theme.useToken();

	return (
		<Card
			title={title}
			className={`flex flex-col ${className ?? ""}`}
			style={{ borderRadius: token.borderRadiusLG * 1.5 }}
			styles={{
				header: { paddingInline: 20 },
				body: { padding: flush ? 0 : "16px 20px", flex: 1, display: "flex", flexDirection: "column" },
			}}
			{...restProps}
		>
			<div className="flex-1">{children}</div>
			{footerLink && (
				<Link to={footerLink.to} className="block py-3 text-center text-[13px]">
					{footerLink.label}
				</Link>
			)}
		</Card>
	);
}
