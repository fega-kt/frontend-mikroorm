import type { TaskEntity } from "#src/api/task/types";
import { TaskPriority, TaskStatus } from "#src/api/task/types";
import { getAvatarColor } from "#src/utils/avatar";
import { cn } from "#src/utils/cn";
import {
	CalendarOutlined,
	CheckCircleOutlined,
	ClockCircleOutlined,
	NodeIndexOutlined,
} from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, Badge, Tag, theme, Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

const PRIORITY_CONFIG: Record<TaskPriority, { color: string, icon: string }> = {
	[TaskPriority.HIGH]: { color: "red", icon: "🔴" },
	[TaskPriority.MEDIUM]: { color: "orange", icon: "🟡" },
	[TaskPriority.LOW]: { color: "blue", icon: "🟢" },
};

interface KanbanCardProps {
	task: TaskEntity
	subtaskCount?: number
	onClick: (task: TaskEntity) => void
	isDragging?: boolean
}

export function KanbanCard({ task, subtaskCount = 0, onClick, isDragging }: KanbanCardProps) {
	const { token } = theme.useToken();
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging: isSortableDragging,
	} = useSortable({ id: task.id, data: { type: "task", task } });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isSortableDragging ? 0.4 : 1,
	};

	const isOverdue = task.dueDate && task.status !== TaskStatus.DONE && dayjs(task.dueDate).isBefore(dayjs(), "day");
	const priorityCfg = PRIORITY_CONFIG[task.priority];

	return (
		<div
			ref={setNodeRef}
			style={{ ...style, borderColor: token.colorBorderSecondary }}
			className={cn(
				"rounded-xl border border-solid p-3 cursor-pointer select-none group",
				"transition-shadow duration-150",
				isDragging ? "shadow-xl" : "hover:shadow-md",
			)}
			{...attributes}
			{...listeners}
			onClick={() => onClick(task)}
		>
			{/* Labels */}
			{task.labels && task.labels.length > 0 && (
				<div className="flex flex-wrap gap-1 mb-2">
					{task.labels.map(label => (
						<Tag key={label} className="text-[10px] m-0 px-1.5 py-0 leading-4 rounded-full">
							{label}
						</Tag>
					))}
				</div>
			)}

			{/* Title */}
			<Text
				className={cn(
					"text-[13px] font-medium leading-snug block mb-2",
					task.status === TaskStatus.DONE && "line-through opacity-50",
				)}
			>
				{task.status === TaskStatus.DONE && (
					<CheckCircleOutlined className="mr-1.5 text-green-500 text-[11px]" />
				)}
				{task.title}
			</Text>

			{/* Footer */}
			<div className="flex items-center justify-between gap-1">
				<div className="flex items-center gap-2">
					{/* Priority */}
					{priorityCfg && (
						<span className="text-[11px] leading-none">{priorityCfg.icon}</span>
					)}

					{/* Due date */}
					{task.dueDate && (
						<span
							className={cn(
								"flex items-center gap-0.5 text-[11px]",
								isOverdue ? "text-red-500" : "text-gray-400",
							)}
						>
							<CalendarOutlined />
							{dayjs(task.dueDate).format("DD/MM")}
						</span>
					)}

					{/* Estimated hours */}
					{task.estimatedHours && (
						<span className="flex items-center gap-0.5 text-[11px] text-gray-400">
							<ClockCircleOutlined />
							{task.estimatedHours}
							h
						</span>
					)}

					{/* Milestone badge */}
					{task.isMilestone && (
						<Badge color="purple" text={<span className="text-[10px]">Milestone</span>} />
					)}
				</div>

				<div className="flex items-center gap-1.5">
					{/* Subtask count */}
					{subtaskCount > 0 && (
						<span className="flex items-center gap-0.5 text-[11px] text-gray-400">
							<NodeIndexOutlined />
							{subtaskCount}
						</span>
					)}

					{/* Assignee avatar */}
					{task.assignee && (
						<Avatar
							size={20}
							src={task.assignee.avatar}
							className="shrink-0 text-[9px] font-bold border-none"
							style={{ backgroundColor: getAvatarColor(task.assignee.id) }}
						>
							{task.assignee.loginName?.[0]?.toUpperCase()}
						</Avatar>
					)}
				</div>
			</div>
		</div>
	);
}

/** Overlay ghost card hiển thị khi đang kéo */
export function KanbanCardOverlay({ task }: { task: TaskEntity }) {
	const { token } = theme.useToken();
	return (
		<div
			style={{ borderColor: token.colorPrimary, backgroundColor: token.colorBgContainer }}
			className="rounded-xl border-2 border-solid p-3 shadow-2xl w-[240px] rotate-3 opacity-90"
		>
			<Text className="text-[13px] font-medium">{task.title}</Text>
		</div>
	);
}
