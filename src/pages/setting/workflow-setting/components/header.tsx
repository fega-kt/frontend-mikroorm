import type { ReactNode } from "react";
import { CloseOutlined } from "@ant-design/icons";
import { Button, theme, Typography } from "antd";

const { Text } = Typography;

interface HeaderProps {
	onClose: () => void
	title?: ReactNode
	statusBadge?: ReactNode
	subtitle?: ReactNode
	lastUpdated?: ReactNode
	extra?: ReactNode
}

export function Header({ onClose, title, statusBadge, subtitle, lastUpdated, extra }: HeaderProps) {
	const { token } = theme.useToken();

	return (
		<>
			<div className="flex items-center justify-between px-6 py-2.5">
				<div className="flex items-center gap-2">
					{title && (
						<Text type="secondary" style={{ fontSize: 13 }}>
							{title}
						</Text>
					)}
					{statusBadge}
				</div>
				<Button type="text" icon={<CloseOutlined />} size="small" onClick={onClose} />
			</div>

			<div
				className="flex items-center justify-between px-6 pb-3 pt-2"
				style={{ borderTop: `1px solid ${token.colorBorderSecondary}` }}
			>
				<div>
					{subtitle && (
						<Text strong style={{ fontSize: 16 }}>
							{subtitle}
						</Text>
					)}
					{lastUpdated && (
						<div>
							<Text type="secondary" style={{ fontSize: 12 }}>
								{lastUpdated}
							</Text>
						</div>
					)}
				</div>
				<div className="flex items-center gap-2">{extra}</div>
			</div>
		</>
	);
}
