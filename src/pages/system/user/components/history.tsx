import type { HistoryDrawerRef } from "#src/components/activity-history/history-drawer";
import { userService } from "#src/api/user";
import { HistoryDrawer } from "#src/components/activity-history/history-drawer";
import { useTranslation } from "react-i18next";

const FIELD_LABELS: Record<string, string> = {
	fullName: "system.user.fullName",
	loginName: "system.user.loginName",
	workEmail: "system.user.workEmail",
	phoneNumber: "system.user.phoneNumber",
	department: "system.user.department",
	description: "system.user.description",
	avatar: "system.user.avatar",
	isActive: "common.status",
};

interface HistoryProps {
	ref: React.Ref<HistoryDrawerRef>
}

/** Lịch sử thay đổi của user */
export function History({ ref }: HistoryProps) {
	const { t } = useTranslation();

	return (
		<HistoryDrawer
			ref={ref}
			queryKeyPrefix="user"
			fetcher={id => userService.fetchHistory(id)}
			fieldLabels={FIELD_LABELS}
			formatValue={(field, value) => field === "isActive" ? t(value ? "common.active" : "common.inactive") : undefined}
			valueTone={(field, value) => field === "isActive" && !value ? "error" : undefined}
		/>
	);
}
