import type { ReactNode } from "react";
import { Tag } from "antd";

/** Nhãn tab của màn tờ trình: biểu tượng + chữ + số lượng (chỉ hiện khi > 0) */
export function tabLabel(icon: ReactNode, text: string, count?: number) {
	return (
		<span className="inline-flex items-center gap-1.5">
			{icon}
			{text}
			{!!count && <Tag bordered={false} className="m-0 rounded-full px-1.5 leading-4">{count}</Tag>}
		</span>
	);
}
