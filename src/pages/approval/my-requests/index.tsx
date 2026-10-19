import { BasicContent } from "#src/components/basic-content";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { RequestTable } from "../components/request-table";
import { RequestScope, RequestTableMode, SCOPE_TITLE } from "../lib/scope";

/** Tờ trình của tôi — /approval/my/{draft|pending|completed|all} */
export default function MyApprovalRequests() {
	const { t } = useTranslation();
	const { pathname } = useLocation();
	// Chốt nhóm lúc mở: trang nằm trong KeepAlive nên bản đang ẩn vẫn nhận đường dẫn mới khi chuyển menu,
	// nếu tính lại theo đường dẫn thì nó tự đổi nhóm và gọi API thừa song song với trang mới
	const [scope] = useState(() => {
		const segment = pathname.split("/").filter(Boolean).pop();
		return Object.values(RequestScope).find(value => value === segment) ?? RequestScope.All;
	});
	return (
		<BasicContent className="h-full">
			<RequestTable mode={RequestTableMode.Mine} scope={scope} title={t(SCOPE_TITLE[scope])} />
		</BasicContent>
	);
}
