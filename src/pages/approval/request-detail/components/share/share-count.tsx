import { theme } from "antd";

/** Số lượt chia sẻ cạnh tiêu đề thẻ: nền trắng, chữ màu chính để nổi trên nền xanh nhạt của header */
export function ShareCount({ count }: { count: number }) {
	const { token } = theme.useToken();
	if (!count)
		return null;
	return (
		<span
			className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold leading-none"
			style={{ background: token.colorBgContainer, color: token.colorPrimary, boxShadow: `0 0 0 1px ${token.colorPrimaryBorder}` }}
		>
			{count}
		</span>
	);
}
