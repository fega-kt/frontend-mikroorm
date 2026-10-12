import { BasicContent } from "#src/components/basic-content";
import { useTranslation } from "react-i18next";
import { RequestTable } from "../components/request-table";

export default function AllApprovalRequests() {
	const { t } = useTranslation();
	return (
		<BasicContent className="h-full">
			<RequestTable mode="all" title={t("common.menu.approvalAllRequests")} />
		</BasicContent>
	);
}
