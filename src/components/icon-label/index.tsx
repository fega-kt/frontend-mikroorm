import type { ReactNode } from "react";
import { Space, Tag, theme } from "antd";

interface IconLabelProps {
	/** Icon or Emoji to display */
	icon?: ReactNode
	/** Text label to display */
	label?: ReactNode
	/** Color for the badge variant */
	color?: string
	/** Whether to show as a Tag (Badge) or a simple Icon+Text */
	variant?: "simple" | "badge"
	/** Custom font size for icon (default 12) */
	iconSize?: number
	/** Custom font size for label (default 13) */
	labelSize?: number
}

/**
 * A Generic Component to render Icon + Label pairs with a premium aesthetic.
 * Perfect for Select options, status indicators, and metadata displays.
 */
export function IconLabel({
	icon,
	label,
	color,
	variant = "simple",
	iconSize = 12,
	labelSize = 13,
}: IconLabelProps) {
	const { token } = theme.useToken();

	if (variant === "badge") {
		return (
			<Tag
				color={color}
				bordered={false}
				className="m-0 font-bold px-1.5 py-0 rounded uppercase"
				style={{ fontSize: 10 }}
			>
				{icon && <span className="mr-1">{icon}</span>}
				{label}
			</Tag>
		);
	}

	return (
		<Space size={6} className="inline-flex items-center align-middle">
			{icon && (
				<span style={{ fontSize: iconSize, opacity: 0.8, lineHeight: 1, display: "flex", alignItems: "center" }}>
					{icon}
				</span>
			)}
			{label && (
				<span style={{ fontSize: labelSize, color: token.colorText }}>
					{label}
				</span>
			)}
		</Space>
	);
}
