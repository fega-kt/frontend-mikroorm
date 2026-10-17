import type { RequestTypeCode } from "../mock";

import { FileTextOutlined } from "@ant-design/icons";
import { theme } from "antd";
import { useState } from "react";

import { getRequestTypeColors, REQUEST_TYPE_ICON } from "../constants";

/**
 * Ô icon của tờ trình:
 * - nhóm có ảnh icon (cấu hình ở Nhóm danh mục) → ảnh đó, viền / nền theo màu nhóm
 * - nhóm chưa có ảnh (hoặc ảnh lỗi) → icon tài liệu theo màu nhóm (khớp tag nhóm)
 * - không có nhóm (dữ liệu mẫu) → icon / màu theo loại đoán từ tên như trước
 */
export function RequestTypeIcon({ type, category, size = 38 }: {
	type: RequestTypeCode
	category?: { id: string, icon?: string | null } | null
	size?: number
}) {
	const { token } = theme.useToken();
	const colors = getRequestTypeColors(token, type, category?.id);
	const [broken, setBroken] = useState(false);
	const image = category?.icon && !broken ? category.icon : undefined;

	return (
		<span
			aria-hidden="true"
			className="flex shrink-0 items-center justify-center overflow-hidden"
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
			{image
				? <img src={image} alt="" className="object-contain" style={{ width: size * 0.62, height: size * 0.62 }} onError={() => setBroken(true)} />
				: category ? <FileTextOutlined /> : REQUEST_TYPE_ICON[type]}
		</span>
	);
}
