import type { HistoryDrawerRef } from "#src/components/activity-history/history-drawer";
import { roleService } from "#src/api/system/role";
import { HistoryDrawer } from "#src/components/activity-history/history-drawer";
import { useTranslation } from "react-i18next";
import { PERMISSION_GROUPS } from "./permissions";

const FIELD_LABELS: Record<string, string> = {
	name: "system.role.name",
	description: "system.role.description",
	rights: "system.role.rights",
	usersAndGroups: "system.role.usersAndGroups",
};

/** Mã quyền → nhóm quyền chứa nó, để ghép nhãn giống màn sửa vai trò */
const PERMISSION_TO_GROUP = new Map<string, string>(
	Object.entries(PERMISSION_GROUPS).flatMap(([group, permissions]) => permissions.map(permission => [permission, group])),
);

interface HistoryProps {
	ref: React.Ref<HistoryDrawerRef>
}

/** Lịch sử thay đổi của vai trò */
export function History({ ref }: HistoryProps) {
	const { t } = useTranslation();

	/** "permission:user:view" → "Quản lý người dùng · Xem chi tiết"; mã không có trong nhóm nào thì giữ nguyên */
	const formatItem = (field: string, item: any): string | undefined => {
		if (field !== "rights" || typeof item !== "string")
			return undefined;
		const group = PERMISSION_TO_GROUP.get(item);
		if (!group)
			return item;
		const action = t(`system.role.permission.${item.split(":").pop()}`, { defaultValue: item });
		return `${t(`system.role.group.${group.toLowerCase()}`)} · ${action}`;
	};

	return (
		<HistoryDrawer
			ref={ref}
			queryKeyPrefix="role"
			fetcher={id => roleService.fetchHistory(id)}
			fieldLabels={FIELD_LABELS}
			formatItem={formatItem}
		/>
	);
}
