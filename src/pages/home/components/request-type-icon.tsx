import type { RequestTypeCode } from "../mock";

import { theme } from "antd";

import { getRequestTypeColors, REQUEST_TYPE_ICON } from "../constants";

/** Ô icon màu theo loại yêu cầu */
export function RequestTypeIcon({ type, size = 38 }: { type: RequestTypeCode, size?: number }) {
	const { token } = theme.useToken();
	const colors = getRequestTypeColors(token, type);

	return (
		<span
			aria-hidden="true"
			className="flex shrink-0 items-center justify-center"
			style={{
				width: size,
				height: size,
				fontSize: size * 0.45,
				color: colors.color,
				background: colors.bg,
				border: `1px solid ${colors.border}`,
				borderRadius: token.borderRadiusLG,
			}}
		>
			{REQUEST_TYPE_ICON[type]}
		</span>
	);
}
