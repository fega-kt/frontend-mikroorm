import { BasicContent } from "#src/components/basic-content";
import { useTranslation } from "react-i18next";
import { RequestTable } from "../components/request-table";
import { RequestTableMode } from "../lib/scope";

export default function AllApprovalRequests() {
	const { t } = useTranslation();
	return (
		<BasicContent className="h-full">
			<RequestTable mode={RequestTableMode.All} title={t("common.menu.approvalAllRequests")} />
		</BasicContent>
	);
}
