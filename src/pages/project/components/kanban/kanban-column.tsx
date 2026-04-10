import type { SectionEntity } from "#src/api/section/types";
import type { TaskEntity } from "#src/api/task/types";
import { cn } from "#src/utils/cn";
import {
	DeleteOutlined,
	EditOutlined,
	MoreOutlined,
	PlusOutlined,
} from "@ant-design/icons";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button, Dropdown, Input, theme, Typography } from "antd";
import * as React from "react";
import { useState } from "react";
import { KanbanCard } from "./kanban-card";

const { Text } = Typography;

interface KanbanColumnProps {
	section: SectionEntity
	tasks: TaskEntity[]
	onAddTask: (sectionId: string) => void
	onEditTask: (task: TaskEntity) => void
	onRenameSection: (id: string, name: string) => Promise<void>
	onDeleteSection: (id: string) => Promise<void>
}

export function KanbanColumn({
	section,
	tasks,
	onAddTask,
	onEditTask,
	onRenameSection,
	onDeleteSection,
}: KanbanColumnProps) {
	const { token } = theme.useToken();
	const [isRenaming, setIsRenaming] = useState(false);
	const [nameInput, setNameInput] = useState(section.name);

	const { setNodeRef, isOver } = useDroppable({
		id: section.id,
		data: { type: "section", section },
	});

	const handleRenameConfirm = async () => {
		const trimmed = nameInput.trim();
		if (trimmed && trimmed !== section.name) {
			await onRenameSection(section.id, trimmed);
		}
		setIsRenaming(false);
	};

	const menuItems = [
		{
			key: "rename",
			icon: <EditOutlined />,
			label: "Đổi tên",
			onClick: () => {
				setNameInput(section.name);
				setIsRenaming(true);
			},
		},
		{ type: "divider" as const },
		{
			key: "delete",
			icon: <DeleteOutlined />,
			label: "Xóa section",
			danger: true,
			onClick: () => onDeleteSection(section.id),
		},
	];

	const taskIds = tasks.map(t => t.id);

	return (
		<div
			className="flex flex-col rounded-2xl min-h-[200px] w-[260px] shrink-0"
			style={{
				backgroundColor: isOver ? token.colorPrimaryBg : token.colorFillQuaternary,
				border: `1.5px solid ${isOver ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
				transition: "background 0.15s, border 0.15s",
			}}
		>
			{/* Column header */}
			<div className="flex items-center justify-between px-3 pt-3 pb-2">
				<div className="flex items-center gap-2 flex-1 min-w-0">
					{isRenaming
						? (
							<Input
								autoFocus
								size="small"
								value={nameInput}
								className="text-[13px] font-semibold"
								onChange={e => setNameInput(e.target.value)}
								onBlur={handleRenameConfirm}
								onPressEnter={handleRenameConfirm}
								onKeyDown={e => e.key === "Escape" && setIsRenaming(false)}
							/>
						)
						: (
							<Text strong className="text-[13px] truncate">{section.name}</Text>
						)}
					<Text
						type="secondary"
						className="text-[11px] shrink-0 tabular-nums"
						style={{
							backgroundColor: token.colorFillSecondary,
							padding: "0 6px",
							borderRadius: 20,
							lineHeight: "18px",
						}}
					>
						{tasks.length}
					</Text>
				</div>

				<div className="flex items-center gap-1 ml-1">
					<Button
						type="text"
						size="small"
						icon={<PlusOutlined />}
						className="opacity-0 group-hover:opacity-100 h-6 w-6"
						onClick={() => onAddTask(section.id)}
					/>
					<Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
						<Button type="text" size="small" icon={<MoreOutlined />} className="h-6 w-6" />
					</Dropdown>
				</div>
			</div>

			{/* Task list */}
			<div
				ref={setNodeRef}
				className={cn("flex flex-col gap-2 px-3 flex-1 min-h-[60px] pb-2")}
			>
				<SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
					{tasks.map(task => (
						<KanbanCard key={task.id} task={task} onClick={onEditTask} />
					))}
				</SortableContext>
			</div>

			{/* Add task button */}
			<div className="px-3 pb-3 pt-1">
				<Button
					type="dashed"
					size="small"
					icon={<PlusOutlined />}
					onClick={() => onAddTask(section.id)}
					className="w-full rounded-lg text-[12px] border-dashed"
					style={{ borderColor: token.colorBorderSecondary, color: token.colorTextSecondary }}
				>
					Thêm task
				</Button>
			</div>
		</div>
	);
}
