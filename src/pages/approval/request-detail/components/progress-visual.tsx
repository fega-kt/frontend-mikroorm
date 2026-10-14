import type { ReactNode } from "react";
import type { NodeProgress } from "../../lib/progress";
import {
	CheckOutlined,
	ClockCircleFilled,
	CloseOutlined,
	MinusOutlined,
	RollbackOutlined,
	StopOutlined,
} from "@ant-design/icons";
import { theme } from "antd";

/** Màu + icon của từng trạng thái bước — dùng chung cho tiến trình thu gọn và diễn biến từng vòng */
export function useProgressVisual(): Record<NodeProgress, { color: string, icon: ReactNode }> {
	const { token } = theme.useToken();
	return {
		done: { color: token.colorSuccess, icon: <CheckOutlined /> },
		current: { color: token.colorPrimary, icon: <ClockCircleFilled /> },
		rejected: { color: token.colorError, icon: <CloseOutlined /> },
		returned: { color: token.colorWarning, icon: <RollbackOutlined /> },
		skipped: { color: token.colorTextTertiary, icon: <MinusOutlined /> },
		cancelled: { color: token.magenta6, icon: <StopOutlined /> },
		pending: { color: token.colorTextQuaternary, icon: null },
	};
}
