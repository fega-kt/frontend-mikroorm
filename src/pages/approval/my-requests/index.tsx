import type { RequestScope } from "../components/request-table";
import { BasicContent } from "#src/components/basic-content";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { RequestTable } from "../components/request-table";

const SCOPE_TITLE: Record<RequestScope, string> = {
	draft: "common.menu.approvalMyDraft",
	pending: "common.menu.approvalMyPending",
	completed: "common.menu.approvalMyCompleted",
	all: "common.menu.approvalMy",
};

/** Tờ trình của tôi — /approval/my/{draft|pending|completed|all} */
export default function MyApprovalRequests() {
	const { t } = useTranslation();
	const { pathname } = useLocation();
	const segment = pathname.split("/").filter(Boolean).pop() as RequestScope;
	const scope: RequestScope = segment in SCOPE_TITLE ? segment : "all";
	return (
		<BasicContent className="h-full">
			<RequestTable key={scope} mode="mine" scope={scope} title={t(SCOPE_TITLE[scope])} />
		</BasicContent>
	);
}
