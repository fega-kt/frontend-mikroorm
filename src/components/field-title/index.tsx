import type { ReactNode } from "react";
import { cn } from "#src/utils/cn";
import { Space, theme } from "antd";

interface FieldTitleProps {
	/** Label text */
	title: ReactNode
	/** Optional icon displayed before the text */
	icon?: ReactNode

	/** Optional class name for the wrapper */
	className?: string
}

/**
 * A reusable component for form field labels, supporting icons and required markers.
 */
export function FieldTitle({ icon, title, className }: FieldTitleProps) {
	const { token } = theme.useToken();

	return (
		<Space size={4} className={cn("inline-flex items-center", className)}>
			{icon && (
				<span style={{ fontSize: 13, display: "flex", alignItems: "center", color: token.colorTextDescription }}>
					{icon}
				</span>
			)}
			<span style={{ fontSize: 13, color: token.colorTextDescription }}>
				{title}
			</span>
		</Space>
	);
}
