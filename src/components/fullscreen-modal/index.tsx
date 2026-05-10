import type { ReactNode } from "react";
import { Modal, theme } from "antd";
import { useImperativeHandle, useState } from "react";

export interface FullscreenModalRef {
	open: () => void
	close: () => void
}

export interface FullscreenModalProps {
	header?: ReactNode
	children?: ReactNode
}

export function FullscreenModal({ ref, header, children }: FullscreenModalProps & { ref?: React.RefObject<FullscreenModalRef | null> }) {
	const { token } = theme.useToken();
	const [visible, setVisible] = useState(false);

	useImperativeHandle(ref, () => ({
		open: () => setVisible(true),
		close: () => setVisible(false),
	}));

	return (
		<Modal
			open={visible}
			closable={false}
			footer={null}
			width="100vw"
			style={{ top: 0, padding: 0, margin: 0, maxWidth: "100vw" }}
			styles={{
				wrapper: { padding: 0 },
				container: {
					height: "100vh",
					padding: 0,
					borderRadius: 0,
					display: "flex",
					flexDirection: "column",
				},
				body: {
					padding: 0,
					flex: 1,
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
				},
			}}
			destroyOnHidden
		>
			{header && (
				<div
					className="flex-none"
					style={{
						backgroundColor: token.colorBgContainer,
						borderBottom: `1px solid ${token.colorBorderSecondary}`,
					}}
				>
					{header}
				</div>
			)}
			<div className="flex-1 overflow-hidden" style={{ backgroundColor: token.colorBgLayout }}>
				{children}
			</div>
		</Modal>
	);
}
