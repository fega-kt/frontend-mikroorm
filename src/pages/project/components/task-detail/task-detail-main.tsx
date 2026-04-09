import type { TaskEntity } from "#src/api/task/types";
import { taskService } from "#src/api/task";
import { TaskStatus } from "#src/api/task/types";
import { getAvatarColor } from "#src/utils/avatar";
import { cn } from "#src/utils/cn";
import {
	CheckOutlined,
	DeleteOutlined,
	FileTextOutlined,
	NodeIndexOutlined,
	PlusOutlined,
} from "@ant-design/icons";
import { ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { Avatar, Button, Card, Checkbox, Input, Spin, theme, Typography } from "antd";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";

const { Text } = Typography;

interface TaskDetailMainProps {
	taskId: string
	isEditing: boolean
}

interface SubtaskRowProps {
	task: TaskEntity
	onToggle: (id: string, done: boolean) => Promise<void>
	onDelete: (id: string) => Promise<void>
}

function SubtaskRow({ task, onToggle, onDelete }: SubtaskRowProps) {
	const isDone = task.status === TaskStatus.DONE;

	return (
		<div
			className="flex items-center gap-2 py-1.5 px-2 rounded-lg group hover:bg-gray-50 transition-colors"
			style={{ backgroundColor: "transparent" }}
		>
			<Checkbox
				checked={isDone}
				onChange={e => onToggle(task.id, e.target.checked)}
			/>
			<div className="flex-1 min-w-0">
				<Text
					className={cn("text-[13px]", isDone && "line-through opacity-50")}
					ellipsis
				>
					{task.title}
				</Text>
			</div>
			{task.assignee && (
				<Avatar
					size={18}
					src={task.assignee.avatar}
					className="shrink-0 text-[8px] font-bold"
					style={{ backgroundColor: getAvatarColor(task.assignee.id) }}
				>
					{task.assignee.loginName?.[0]?.toUpperCase()}
				</Avatar>
			)}
			<Button
				type="text"
				size="small"
				icon={<DeleteOutlined />}
				danger
				className="opacity-0 group-hover:opacity-100 h-5 w-5"
				onClick={() => onDelete(task.id)}
			/>
		</div>
	);
}

export function TaskDetailMain({ taskId, isEditing }: TaskDetailMainProps) {
	const { token } = theme.useToken();
	const [subtasks, setSubtasks] = useState<TaskEntity[]>([]);
	const [subtasksLoading, setSubtasksLoading] = useState(false);
	const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
	const [addingSubtask, setAddingSubtask] = useState(false);
	const [showSubtaskInput, setShowSubtaskInput] = useState(false);

	const loadSubtasks = useCallback(async () => {
		if (!taskId)
			return;
		setSubtasksLoading(true);
		try {
			const res = await taskService.fetchSubtasks(taskId);
			setSubtasks(res.data ?? []);
		}
		finally {
			setSubtasksLoading(false);
		}
	}, [taskId]);

	useEffect(() => {
		if (isEditing && taskId)
			loadSubtasks();
	}, [isEditing, taskId, loadSubtasks]);

	const handleToggleSubtask = async (id: string, done: boolean) => {
		await taskService.fetchUpdateTask(id, {
			status: done ? TaskStatus.DONE : TaskStatus.TODO,
		});
		setSubtasks(prev =>
			prev.map(t => t.id === id ? { ...t, status: done ? TaskStatus.DONE : TaskStatus.TODO } : t),
		);
	};

	const handleDeleteSubtask = async (id: string) => {
		await taskService.fetchDeleteTask(id);
		setSubtasks(prev => prev.filter(t => t.id !== id));
	};

	const handleAddSubtask = async () => {
		const title = newSubtaskTitle.trim();
		if (!title)
			return;
		setAddingSubtask(true);
		try {
			const created = await taskService.fetchCreateTask({
				title,
				parentTask: taskId,
				status: TaskStatus.TODO,
				priority: "MEDIUM" as any,
			});
			setSubtasks(prev => [...prev, created]);
			setNewSubtaskTitle("");
			setShowSubtaskInput(false);
		}
		finally {
			setAddingSubtask(false);
		}
	};

	const doneCount = subtasks.filter(t => t.status === TaskStatus.DONE).length;
	const progress = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;

	return (
		<>
			{/* Title */}
			<div className="mb-8 px-2">
				<ProFormText
					name="title"
					placeholder="Tên task..."
					rules={[{ required: true, message: "" }]}
					formItemProps={{ className: "[&_.ant-form-item-label]:hidden" }}
					fieldProps={{
						variant: "borderless",
						className: "mb-1",
						style: { fontSize: 22, fontWeight: 700, padding: 0, height: "auto" },
					}}
				/>
			</div>

			{/* Description */}
			<Card
				className="mb-4 border-none shadow-sm"
				bodyStyle={{ padding: "20px" }}
				style={{ borderRadius: 12, backgroundColor: token.colorBgContainer }}
			>
				<div className="flex items-center gap-2 mb-4">
					<Typography.Title level={5} className="m-0 flex items-center gap-2">
						<FileTextOutlined style={{ color: token.colorPrimary }} />
						Mô tả
					</Typography.Title>
				</div>
				<ProFormTextArea
					name="description"
					placeholder="Mô tả chi tiết task..."
					fieldProps={{
						rows: 6,
						className: "border-none rounded-xl p-4 transition-all",
						style: { backgroundColor: token.colorFillQuaternary },
					}}
				/>
			</Card>

			{/* Subtasks — chỉ hiển thị khi đang edit */}
			{isEditing && (
				<Card
					className="border-none shadow-sm"
					bodyStyle={{ padding: "20px" }}
					style={{ borderRadius: 12, backgroundColor: token.colorBgContainer }}
				>
					<div className="flex items-center justify-between mb-4">
						<Typography.Title level={5} className="m-0 flex items-center gap-2">
							<NodeIndexOutlined style={{ color: token.colorPrimary }} />
							Sub-tasks
							{subtasks.length > 0 && (
								<Text type="secondary" className="font-normal text-[12px]">
									{doneCount}
									/
									{subtasks.length}
									{" "}
									(
									{progress}
									%)
								</Text>
							)}
						</Typography.Title>
						<Button
							type="text"
							size="small"
							icon={<PlusOutlined />}
							onClick={() => setShowSubtaskInput(true)}
						>
							Thêm
						</Button>
					</div>

					{/* Progress bar */}
					{subtasks.length > 0 && (
						<div className="mb-3 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: token.colorFillSecondary }}>
							<div
								className="h-full rounded-full transition-all duration-500"
								style={{ width: `${progress}%`, backgroundColor: token.colorSuccess }}
							/>
						</div>
					)}

					<Spin spinning={subtasksLoading}>
						<div className="flex flex-col gap-0.5">
							{subtasks.map(sub => (
								<SubtaskRow
									key={sub.id}
									task={sub}
									onToggle={handleToggleSubtask}
									onDelete={handleDeleteSubtask}
								/>
							))}
						</div>
					</Spin>

					{/* Inline add input */}
					{showSubtaskInput && (
						<div className="flex gap-2 mt-3">
							<Input
								autoFocus
								size="small"
								placeholder="Tên sub-task..."
								value={newSubtaskTitle}
								onChange={e => setNewSubtaskTitle(e.target.value)}
								onPressEnter={handleAddSubtask}
								onKeyDown={e => e.key === "Escape" && setShowSubtaskInput(false)}
								className="flex-1"
							/>
							<Button
								size="small"
								type="primary"
								icon={<CheckOutlined />}
								loading={addingSubtask}
								onClick={handleAddSubtask}
							/>
							<Button size="small" onClick={() => setShowSubtaskInput(false)}>Hủy</Button>
						</div>
					)}

					{!subtasksLoading && subtasks.length === 0 && !showSubtaskInput && (
						<Text type="secondary" className="text-[12px] italic">Chưa có sub-task nào.</Text>
					)}
				</Card>
			)}
		</>
	);
}
