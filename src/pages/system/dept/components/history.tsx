import type { HistoryDrawerRef } from "#src/components/activity-history/history-drawer";
import { departmentService } from "#src/api/system/dept";
import { HistoryDrawer } from "#src/components/activity-history/history-drawer";
import { useTranslation } from "react-i18next";

const FIELD_LABELS: Record<string, string> = {
	code: "system.dept.code",
	name: "system.dept.name",
	parent: "system.dept.parentDept",
	manager: "system.dept.manager",
	deputy: "system.dept.deputy",
	status: "common.status",
};

interface HistoryProps {
	ref: React.Ref<HistoryDrawerRef>
}

/** Lịch sử thay đổi của phòng ban */
export function History({ ref }: HistoryProps) {
	const { t } = useTranslation();

	return (
		<HistoryDrawer
			ref={ref}
			queryKeyPrefix="department"
			fetcher={id => departmentService.fetchHistory(id)}
			fieldLabels={FIELD_LABELS}
			formatValue={(field, value) => field === "status" ? t(value === 1 ? "common.active" : "common.inactive") : undefined}
			valueTone={(field, value) => field === "status" && value !== 1 ? "error" : undefined}
		/>
	);
}
