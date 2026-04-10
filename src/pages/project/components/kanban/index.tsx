import type { SectionEntity } from "#src/api/section/types";
import type { TaskEntity } from "#src/api/task/types";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import type { TaskDetailRef } from "../task-detail";
import { sectionService } from "#src/api/section";
import { taskService } from "#src/api/task";
import { PlusOutlined } from "@ant-design/icons";
import {
	closestCorners,
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Button, Empty, Input, Modal, Spin, theme } from "antd";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { TaskDetail } from "../task-detail";
import { KanbanCardOverlay } from "./kanban-card";
import { KanbanColumn } from "./kanban-column";

interface KanbanBoardProps {
	projectId: string
}

type TaskMap = Record<string, TaskEntity[]>;

export function KanbanBoard({ projectId }: KanbanBoardProps) {
	const { token } = theme.useToken();
	const [sections, setSections] = useState<SectionEntity[]>([]);
	const [taskMap, setTaskMap] = useState<TaskMap>({});
	const [loading, setLoading] = useState(true);
	const [activeDragTask, setActiveDragTask] = useState<TaskEntity | null>(null);
	const [addSectionLoading, setAddSectionLoading] = useState(false);
	const taskDetailRef = useRef<TaskDetailRef>(null);

	// Load sections + tasks
	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			const [sectionsRes, tasksData] = await Promise.all([
				sectionService.fetchSectionsByProject(projectId),
				taskService.fetchTasksByProject(projectId, { limit: 50 }),
			]);

			const sectionsData = sectionsRes.data ?? [];
			setSections(sectionsData);

			// Group tasks by section id
			const map: TaskMap = {};
			sectionsData.forEach(s => (map[s.id] = []));

			tasksData.data.forEach((task) => {
				const sectionId = task.section?.id;
				if (sectionId && map[sectionId]) {
					map[sectionId].push(task);
				}
			});

			// Sort by order
			Object.keys(map).forEach(sid => map[sid].sort((a, b) => a.order - b.order));

			setTaskMap(map);
		}
		finally {
			setLoading(false);
		}
	}, [projectId]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	// --- DnD sensors ---
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	const findSectionIdByTaskId = (taskId: string) => {
		return Object.keys(taskMap).find(sid => taskMap[sid].some(t => t.id === taskId));
	};

	const onDragStart = ({ active }: DragStartEvent) => {
		if (active.data.current?.type === "task") {
			setActiveDragTask(active.data.current.task);
		}
	};

	const onDragOver = ({ active, over }: DragOverEvent) => {
		if (!over)
			return;
		const activeId = String(active.id);
		const overId = String(over.id);
		if (activeId === overId)
			return;

		const activeSectionId = findSectionIdByTaskId(activeId);
		// over could be a section or another task
		const overSectionId = taskMap[overId] !== undefined
			? overId // dropped over a section container
			: findSectionIdByTaskId(overId);

		if (!activeSectionId || !overSectionId || activeSectionId === overSectionId)
			return;

		setTaskMap((prev) => {
			const activeTask = prev[activeSectionId].find(t => t.id === activeId)!;
			const newActiveTasks = prev[activeSectionId].filter(t => t.id !== activeId);
			const overIndex = prev[overSectionId].findIndex(t => t.id === overId);
			const insertAt = overIndex >= 0 ? overIndex : prev[overSectionId].length;
			const newOverTasks = [...prev[overSectionId]];
			newOverTasks.splice(insertAt, 0, { ...activeTask, section: sections.find(s => s.id === overSectionId) });

			return { ...prev, [activeSectionId]: newActiveTasks, [overSectionId]: newOverTasks };
		});
	};

	const onDragEnd = async ({ active, over }: DragEndEvent) => {
		setActiveDragTask(null);
		if (!over)
			return;

		const activeId = String(active.id);
		const overId = String(over.id);

		const activeSectionId = findSectionIdByTaskId(activeId);
		const overSectionId = taskMap[overId] !== undefined ? overId : findSectionIdByTaskId(overId);
		if (!activeSectionId || !overSectionId)
			return;

		if (activeSectionId === overSectionId) {
			// Reorder within same section
			const tasks = taskMap[activeSectionId];
			const oldIndex = tasks.findIndex(t => t.id === activeId);
			const newIndex = tasks.findIndex(t => t.id === overId);
			if (oldIndex === newIndex)
				return;

			const reordered = arrayMove(tasks, oldIndex, newIndex).map((t, i) => ({ ...t, order: i }));
			setTaskMap(prev => ({ ...prev, [activeSectionId]: reordered }));

			await taskService.fetchReorderTasks(reordered.map(t => ({ id: t.id, order: t.order })));
		}
		else {
			// Move to another section — backend chỉ nhận sectionId
			await taskService.fetchMoveTask(activeId, overSectionId);
		}
	};

	// --- Section actions ---
	const handleAddSection = () => {
		let name = "";
		Modal.confirm({
			title: "Thêm section mới",
			content: (
				<Input
					placeholder="Tên section..."
					autoFocus
					onChange={e => (name = e.target.value)}
					onPressEnter={() => Modal.destroyAll()}
				/>
			),
			okText: "Tạo",
			cancelText: "Hủy",
			onOk: async () => {
				const trimmed = name.trim();
				if (!trimmed)
					return;
				setAddSectionLoading(true);
				try {
					const created = await sectionService.fetchCreateSection(projectId, trimmed);
					setSections(prev => [...prev, created]);
					setTaskMap(prev => ({ ...prev, [created.id]: [] }));
				}
				finally {
					setAddSectionLoading(false);
				}
			},
		});
	};

	const handleRenameSection = async (id: string, name: string) => {
		await sectionService.fetchUpdateSection(projectId, id, { name });
		setSections(prev => prev.map(s => s.id === id ? { ...s, name } : s));
	};

	const handleDeleteSection = async (id: string) => {
		await sectionService.fetchDeleteSection(projectId, id);
		setSections(prev => prev.filter(s => s.id !== id));
		setTaskMap((prev) => {
			const next = { ...prev };
			delete next[id];
			return next;
		});
	};

	// --- Task actions ---
	const handleAddTask = async (sectionId: string) => {
		const res = await taskDetailRef.current?.show(undefined, { projectId, sectionId });
		if (res?.isChange)
			loadData();
	};

	const handleEditTask = async (task: TaskEntity) => {
		const res = await taskDetailRef.current?.show(task.id);
		if (res?.isChange)
			loadData();
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Spin />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{/* Add section button */}
			<div className="flex justify-end">
				<Button
					icon={<PlusOutlined />}
					loading={addSectionLoading}
					onClick={handleAddSection}
					style={{ borderColor: token.colorBorderSecondary }}
				>
					Thêm section
				</Button>
			</div>

			{sections.length === 0
				? (
					<Empty description="Chưa có section nào. Thêm section để bắt đầu tổ chức task." className="py-12" />
				)
				: (
					<DndContext
						sensors={sensors}
						collisionDetection={closestCorners}
						onDragStart={onDragStart}
						onDragOver={onDragOver}
						onDragEnd={onDragEnd}
					>
						<div className="flex gap-4 overflow-x-auto pb-4 group">
							{sections.map(section => (
								<KanbanColumn
									key={section.id}
									section={section}
									tasks={taskMap[section.id] ?? []}
									onAddTask={handleAddTask}
									onEditTask={handleEditTask}
									onRenameSection={handleRenameSection}
									onDeleteSection={handleDeleteSection}
								/>
							))}
						</div>

						<DragOverlay>
							{activeDragTask && <KanbanCardOverlay task={activeDragTask} />}
						</DragOverlay>
					</DndContext>
				)}

			<TaskDetail ref={taskDetailRef} />
		</div>
	);
}
