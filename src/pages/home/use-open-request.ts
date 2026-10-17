import type { MouseEvent } from "react";
import { approvalRequestPath } from "#src/router/extra-info";
import { useNavigate } from "react-router";

/**
 * Bấm vào cả dòng để mở chi tiết tờ trình; bấm vào nút / link bên trong dòng (Duyệt, Từ chối, tiêu đề…)
 * thì để chúng tự xử lý, không mở chi tiết.
 */
export function useOpenRequest() {
	const navigate = useNavigate();
	return (id: string) => (event: MouseEvent<HTMLElement>) => {
		if ((event.target as HTMLElement).closest("button, a, input, [role='button']"))
			return;
		navigate(approvalRequestPath.detail(id));
	};
}
