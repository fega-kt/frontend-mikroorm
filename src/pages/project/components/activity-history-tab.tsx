import type { ActivityLogEntity } from "#src/api/activity-log/types";
import { activityLogService } from "#src/api/activity-log";
import { ActivityLogAction } from "#src/api/activity-log/types";
import { RichTextEditor } from "#src/components/rich-text-editor";
import {
	CheckCircleOutlined,
	CloseCircleOutlined,
	DeleteOutlined,
	EditOutlined,
	HistoryOutlined,
	PlusCircleOutlined,
	RedoOutlined,
	RobotOutlined,
	SwapOutlined,
	TeamOutlined,
	UserOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Empty, Skeleton, Space, Tag, Timeline, Typography } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTranslation } from "react-i18next";
import "dayjs/locale/vi";

const FIELD_KEY_MAP: Record<string, string> = {
	name: "project.fields.name",
	description: "project.fields.description",
	status: "project.fields.status",
	priority: "project.fields.priority",
	visibility: "project.fields.visibility",
	startDate: "project.fields.start_date",
	dueDate: "project.fields.due_date",
	budget: "project.fields.budget",
	tags: "project.fields.tags",
};

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Text, Title } = Typography;

const ACTION_COLORS: Record<ActivityLogAction, string> = {
	[ActivityLogAction.CREATE]: "green",
	[ActivityLogAction.UPDATE]: "blue",
	[ActivityLogAction.DELETE]: "red",
	[ActivityLogAction.RESTORE]: "cyan",
	[ActivityLogAction.STATUS_CHANGE]: "purple",
	[ActivityLogAction.ASSIGN]: "orange",
	[ActivityLogAction.APPROVE]: "green",
	[ActivityLogAction.REJECT]: "red",
};

const ACTION_ICONS: Record<ActivityLogAction, React.ReactNode> = {
	[ActivityLogAction.CREATE]: <PlusCircleOutlined />,
	[ActivityLogAction.UPDATE]: <EditOutlined />,
	[ActivityLogAction.DELETE]: <DeleteOutlined />,
	[ActivityLogAction.RESTORE]: <RedoOutlined />,
	[ActivityLogAction.STATUS_CHANGE]: <SwapOutlined />,
	[ActivityLogAction.ASSIGN]: <TeamOutlined />,
	[ActivityLogAction.APPROVE]: <CheckCircleOutlined />,
	[ActivityLogAction.REJECT]: <CloseCircleOutlined />,
};

// Fields stored as HTML (rich text)
const HTML_FIELDS = new Set(["description", "note", "content"]);

function isHtml(field: string, value: any): boolean {
	return HTML_FIELDS.has(field) && typeof value === "string" && value.includes("<");
}

function formatText(field: string, value: any): string {
	if (value === null || value === undefined)
		return "(trống)";
	if (field === "startDate" || field === "dueDate")
		return dayjs(value).format("DD/MM/YYYY");
	if (field === "budget")
		return Number(value).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
	if (Array.isArray(value))
		return value.length === 0 ? "(trống)" : value.join(", ");
	return String(value);
}

// ─── Field row wrapper ────────────────────────────────────────────────────────

function FieldRow({ field, children }: { field: string, children: React.ReactNode }) {
	const { t } = useTranslation();
	const label = FIELD_KEY_MAP[field] ? t(FIELD_KEY_MAP[field]) : field;

	return (
		<div className="rounded-md border border-solid border-gray-100 bg-gray-50 px-3 py-2 text-xs">
			<span className="block mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
				{label}
			</span>
			{children}
		</div>
	);
}

// ─── Diff block (UPDATE / STATUS_CHANGE) ─────────────────────────────────────

function DiffBlock({ oldData, newData }: { oldData?: Record<string, any>, newData?: Record<string, any> }) {
	const fields = Array.from(new Set([...Object.keys(oldData ?? {}), ...Object.keys(newData ?? {})]));
	if (fields.length === 0)
		return null;

	return (
		<div className="mt-2 flex flex-col gap-1.5">
			{fields.map((field) => {
				const oldVal = oldData?.[field];
				const newVal = newData?.[field];

				if (isHtml(field, oldVal) || isHtml(field, newVal)) {
					return (
						<FieldRow key={field} field={field}>
							<div className="flex flex-col gap-2">
								<div>
									<span className="text-[10px] text-gray-400 mb-1 block">Trước</span>
									<div className="rounded border border-solid border-gray-200 bg-white opacity-60 line-through">
										<RichTextEditor value={oldVal ?? ""} readOnly />
									</div>
								</div>
								<div>
									<span className="text-[10px] text-gray-400 mb-1 block">Sau</span>
									<div className="rounded border border-solid border-green-100 bg-green-50/30">
										<RichTextEditor value={newVal ?? ""} readOnly />
									</div>
								</div>
							</div>
						</FieldRow>
					);
				}

				return (
					<FieldRow key={field} field={field}>
						<div className="flex items-center gap-2 flex-wrap">
							<span className="rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-400 line-through">
								{formatText(field, oldVal)}
							</span>
							<span className="text-gray-400">→</span>
							<span className="rounded bg-green-50 px-2 py-0.5 font-medium text-green-700">
								{formatText(field, newVal)}
							</span>
						</div>
					</FieldRow>
				);
			})}
		</div>
	);
}

// ─── Single data block (CREATE / DELETE / RESTORE) ────────────────────────────

function DataBlock({ data, variant }: { data?: Record<string, any>, variant: "new" | "old" }) {
	if (!data || Object.keys(data).length === 0)
		return null;
	const isNew = variant === "new";

	return (
		<div className="mt-2 flex flex-col gap-1.5">
			{Object.entries(data).map(([field, value]) => {
				if (isHtml(field, value)) {
					return (
						<FieldRow key={field} field={field}>
							<div className={`rounded border border-solid ${isNew ? "border-green-100 bg-green-50/30" : "border-gray-200 bg-white opacity-60 line-through"}`}>
								<RichTextEditor value={value ?? ""} readOnly />
							</div>
						</FieldRow>
					);
				}

				return (
					<FieldRow key={field} field={field}>
						<span className={`rounded px-2 py-0.5 font-medium ${isNew ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400 line-through"}`}>
							{formatText(field, value)}
						</span>
					</FieldRow>
				);
			})}
		</div>
	);
}

// ─── Activity item ────────────────────────────────────────────────────────────

function ActivityItem({ log }: { log: ActivityLogEntity }) {
	const { t } = useTranslation();
	const user = (log as any).createdBy;
	const color = ACTION_COLORS[log.action] ?? "default";
	const actionLabel = t(`project.history.action.${log.action}`, { defaultValue: log.action });

	const renderBody = () => {
		switch (log.action) {
			case ActivityLogAction.CREATE:
			case ActivityLogAction.RESTORE:
				return <DataBlock data={log.newData} variant="new" />;
			case ActivityLogAction.DELETE:
				return <DataBlock data={log.oldData} variant="old" />;
			case ActivityLogAction.UPDATE:
			case ActivityLogAction.STATUS_CHANGE:
				return <DiffBlock oldData={log.oldData} newData={log.newData} />;
			case ActivityLogAction.ASSIGN:
				return (
					<div className="mt-1 text-xs text-gray-500">
						{log.newData?.assignee
							? t("project.history.assigned_to", { name: log.newData.assignee })
							: t("project.history.assigned_updated")}
					</div>
				);
			case ActivityLogAction.APPROVE:
			case ActivityLogAction.REJECT:
				return log.newData?.rejectReason
					? (
						<div className="mt-1 text-xs text-gray-500">
							{t("project.history.reject_reason", { reason: log.newData.rejectReason })}
						</div>
					)
					: null;
			default:
				return null;
		}
	};

	return (
		<div className="flex flex-col gap-0.5">
			<div className="flex items-center gap-2 flex-wrap">
				{user
					? (
						<Space size={6}>
							<Avatar src={user.avatar} icon={<UserOutlined />} size={20} className="shrink-0" />
							<Text strong className="text-sm">{user.fullName ?? user.loginName ?? t("project.history.user")}</Text>
						</Space>
					)
					: (
						<Space size={6}>
							<Avatar icon={<RobotOutlined />} size={20} className="shrink-0" />
							<Text strong className="text-sm">{t("project.history.system")}</Text>
						</Space>
					)}
				<Tag color={color} className="text-xs">{actionLabel}</Tag>
				<Text type="secondary" className="text-xs">
					{dayjs(log.createdAt).format("DD/MM/YYYY HH:mm")}
					{" · "}
					{dayjs(log.createdAt).fromNow()}
				</Text>
			</div>
			{renderBody()}
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ActivityHistoryTabProps {
	projectId: string
	active: boolean
}

export function ActivityHistoryTab({ projectId, active }: ActivityHistoryTabProps) {
	const { t } = useTranslation();
	const { data, isLoading } = useQuery({
		queryKey: ["activity-log", "by-parent", projectId],
		queryFn: () => activityLogService.fetchByParent(projectId, { limit: 100 }),
		enabled: active && !!projectId,
		staleTime: 30_000,
	});

	const logs: ActivityLogEntity[] = data?.data ?? [];

	if (isLoading) {
		return <div className="py-4"><Skeleton active paragraph={{ rows: 4 }} /></div>;
	}

	if (logs.length === 0) {
		return (
			<Empty
				image={Empty.PRESENTED_IMAGE_SIMPLE}
				description={t("project.history.no_records")}
				className="py-10"
			/>
		);
	}

	const timelineItems = logs.map((log) => {
		const color = ACTION_COLORS[log.action] ?? "gray";
		const icon = ACTION_ICONS[log.action] ?? <EditOutlined />;
		return {
			key: log.id,
			dot: icon,
			color: color === "green" ? "green" : color === "red" ? "red" : color === "purple" ? "purple" : "blue",
			children: <ActivityItem log={log} />,
		};
	});

	return (
		<div className="py-4">
			<div className="flex items-center gap-2 mb-4">
				<HistoryOutlined />
				<Title level={5} className="mb-0!">
					{t("project.history.title")}
					<Text type="secondary" className="text-sm font-normal ml-2">
						{`(${logs.length} ${t("project.history.records")})`}
					</Text>
				</Title>
			</div>
			<Timeline items={timelineItems} />
		</div>
	);
}
