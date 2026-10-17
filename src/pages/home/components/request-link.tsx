import { approvalRequestPath } from "#src/router/extra-info";
import { Link } from "react-router";

/** Tiêu đề tờ trình là link thật tới trang chi tiết (Tab / Ctrl+click / chuột giữa mở tab mới được) */
export function RequestTitleLink({ id, title }: { id: string, title: string }) {
	return (
		<Link to={approvalRequestPath.detail(id)} className="truncate text-sm text-colorText! hover:text-primary!">
			{title}
		</Link>
	);
}
