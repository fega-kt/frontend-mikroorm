import type { ReactNode } from "react";
import { Space, theme } from "antd";

interface FieldTitleProps {
	/** Icon displayed before the text */
	icon: ReactNode
	/** Label text */
	text: ReactNode
}

/**
 * A reusable component for form field labels with an icon.
 */
export function FieldTitle({ icon, text }: FieldTitleProps) {
	const { token } = theme.useToken();

	return (
		<Space size={6}>
			<span style={{ fontSize: 13, display: "flex", alignItems: "center", color: token.colorTextDescription }}>
				{icon}
			</span>
			<span style={{ fontSize: 13 }}>{text}</span>
		</Space>
	);
}
