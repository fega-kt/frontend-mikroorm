/**
 * SVG icon components used across the project module.
 * Uses Antd theme tokens for consistent theming.
 */
import { theme } from "antd";

export function EmptyTasksIcon({ size = 64 }: { size?: number }) {
	const { token } = theme.useToken();
	const ratio = size / 120;
	return (
		<svg width={size} height={Math.round(100 * ratio)} viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="20" y="15" width="80" height="55" rx="8" fill={token.colorFillQuaternary} stroke={token.colorBorder} strokeWidth="1.5" />
			<rect x="32" y="28" width="56" height="5" rx="2.5" fill={token.colorBorder} />
			<rect x="32" y="38" width="40" height="5" rx="2.5" fill={token.colorBorder} />
			<circle cx="60" cy="82" r="5" fill={token.colorBorder} />
			<circle cx="48" cy="82" r="3" fill={token.colorBorder} />
			<circle cx="72" cy="82" r="3" fill={token.colorBorder} />
		</svg>
	);
}
