import type { ApprovalTaskItem } from "#src/api/approval-request";
import { ApprovalTaskStatus } from "#src/api/approval-request/types";
import { UserAvatar } from "#src/components/user-avatar";
import { UserSwitchOutlined } from "@ant-design/icons";
import { Button, Divider, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { TaskStatusTag } from "../../components/status-tag";
import { DATE_TIME_FORMAT } from "../../lib/payload";

const { Text } = Typography;

interface TaskListProps {
	tasks: ApprovalTaskItem[]
	canReassign: boolean
	onReassign: (task: ApprovalTaskItem) => void
}

/** Các lượt duyệt, nhóm theo lượt gửi (mới nhất trước) */
export function TaskList({ tasks, canReassign, onReassign }: TaskListProps) {
	const { t } = useTranslation();
	const rounds = [...new Set(tasks.map(task => task.round))].sort((a, b) => b - a);

	if (!tasks.length)
		return <Text type="secondary">{t("common.noData")}</Text>;

	return (
		<div className="flex flex-col">
			{rounds.map((round, index) => (
				<Fragment key={round}>
					{rounds.length > 1 && <Divider plain className={index ? "!my-3" : "!mt-0 !mb-3"}>{t("approval.detail.round", { n: round })}</Divider>}
					<div className="flex flex-col gap-3">
						{tasks.filter(task => task.round === round).map((task) => {
							const overdue = task.status === ApprovalTaskStatus.Pending && task.dueAt && dayjs(task.dueAt).isBefore(dayjs());
							return (
								<div key={task.id} className="flex items-start gap-3">
									<UserAvatar size={28} user={task.approver} />
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between gap-2">
											<Text strong ellipsis>{task.approver?.fullName}</Text>
											<TaskStatusTag status={task.status} />
										</div>
										<Text type="secondary" className="text-xs block">
											{task.nodeName ?? task.nodeId}
											{task.originalApprover && ` · ${t(task.escalatedAt ? "approval.detail.escalatedFrom" : "approval.detail.delegatedFrom", { name: task.originalApprover.fullName })}`}
										</Text>
										<div className="flex items-center gap-2 flex-wrap mt-0.5">
											{task.actedAt && <Text type="secondary" className="text-xs">{dayjs(task.actedAt).format(DATE_TIME_FORMAT)}</Text>}
											{task.status === ApprovalTaskStatus.Pending && task.dueAt && (
												<Tag color={overdue ? "error" : "default"} className="m-0 text-xs">
													{`${t("approval.fields.dueAt")}: ${dayjs(task.dueAt).format(DATE_TIME_FORMAT)}`}
												</Tag>
											)}
											{canReassign && task.status === ApprovalTaskStatus.Pending && (
												<Tooltip title={t("approval.actions.reassign")}>
													<Button size="small" type="link" className="!px-0" icon={<UserSwitchOutlined />} onClick={() => onReassign(task)} />
												</Tooltip>
											)}
										</div>
										{task.comment && <Text className="text-[13px] block mt-1 whitespace-pre-wrap">{task.comment}</Text>}
									</div>
								</div>
							);
						})}
					</div>
				</Fragment>
			))}
		</div>
	);
}
