import type { ApprovalRequestStatus, ApprovalTaskStatus } from "#src/api/approval-request/types";
import { Tag } from "antd";
import { useTranslation } from "react-i18next";
import { REQUEST_STATUS_COLOR, TASK_STATUS_COLOR } from "../lib/status";

export function RequestStatusTag({ status }: { status: ApprovalRequestStatus }) {
	const { t } = useTranslation();
	return <Tag color={REQUEST_STATUS_COLOR[status]} className="m-0">{t(`approval.status.${status}`)}</Tag>;
}

export function TaskStatusTag({ status }: { status: ApprovalTaskStatus }) {
	const { t } = useTranslation();
	return <Tag color={TASK_STATUS_COLOR[status]} className="m-0">{t(`approval.taskStatus.${status}`)}</Tag>;
}
