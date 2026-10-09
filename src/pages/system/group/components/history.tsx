import type { HistoryDrawerRef } from "#src/components/activity-history/history-drawer";
import { groupService } from "#src/api/system/group";
import { HistoryDrawer } from "#src/components/activity-history/history-drawer";

const FIELD_LABELS: Record<string, string> = {
	name: "system.userGroup.name",
	description: "system.userGroup.description",
	users: "system.userGroup.users",
};

interface HistoryProps {
	ref: React.Ref<HistoryDrawerRef>
}

/** Lịch sử thay đổi của nhóm người dùng */
export function History({ ref }: HistoryProps) {
	return (
		<HistoryDrawer
			ref={ref}
			queryKeyPrefix="group"
			fetcher={id => groupService.fetchHistory(id)}
			fieldLabels={FIELD_LABELS}
		/>
	);
}
