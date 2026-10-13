import type { ApprovalPriority } from "#src/api/approval-request/types";
import { ApprovalRequestStatus, ApprovalTaskStatus } from "#src/api/approval-request/types";
import { Tag } from "antd";
import { useTranslation } from "react-i18next";
import { PRIORITY_META, REQUEST_STATUS_COLOR, REQUEST_STATUS_ICON, TASK_STATUS_COLOR, TASK_STATUS_ICON } from "../lib/status";

export function RequestStatusTag({ status }: { status: ApprovalRequestStatus }) {
	const { t } = useTranslation();
	const Icon = REQUEST_STATUS_ICON[status];
	return (
		<Tag color={REQUEST_STATUS_COLOR[status]} icon={Icon && <Icon spin={status === ApprovalRequestStatus.Pending} />} className="m-0">
			{t(`approval.status.${status}`)}
		</Tag>
	);
}

export function TaskStatusTag({ status }: { status: ApprovalTaskStatus }) {
	const { t } = useTranslation();
	const Icon = TASK_STATUS_ICON[status];
	return (
		<Tag color={TASK_STATUS_COLOR[status]} icon={Icon && <Icon spin={status === ApprovalTaskStatus.Pending} />} className="m-0">
			{t(`approval.taskStatus.${status}`)}
		</Tag>
	);
}

export function PriorityTag({ priority }: { priority: ApprovalPriority }) {
	const { t } = useTranslation();
	const meta = PRIORITY_META[priority] ?? PRIORITY_META[1];
	return <Tag color={meta.tag} bordered={false} className="m-0">{t(`approval.priority.${priority}`)}</Tag>;
}
