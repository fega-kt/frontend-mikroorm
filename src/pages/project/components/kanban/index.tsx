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
import { arrayMove, horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Button, Empty, Input, Modal, Spin, theme } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { TaskDetail } from "../task-detail";
import { KanbanCardOverlay } from "./kanban-card";
import { KanbanColumn, KanbanColumnOverlay } from "./kanban-column";

interface KanbanBoardProps {
	projectId: string
}

type TaskMap = Record<string, TaskEntity[]>;
type SubtaskCountMap = Record<string, number>;

export function KanbanBoard({ projectId }: KanbanBoardProps) {
	const { token } = theme.useToken();
	const [sections, setSections] = useState<SectionEntity[]>([]);
	const [taskMap, setTaskMap] = useState<TaskMap>({});
	const [subtaskCountMap, setSubtaskCountMap] = useState<SubtaskCountMap>({});
	const [loading, setLoading] = useState(true);
	const [activeDragTask, setActiveDragTask] = useState<TaskEntity | null>(null);
	const [activeDragSection, setActiveDragSection] = useState<SectionEntity | null>(null);
	const [addSectionLoading, setAddSectionLoading] = useState(false);
	const [sourceSectionId, setSourceSectionId] = useState<string | null>(null);
	const taskDetailRef = useRef<TaskDetailRef>(null);

	const loadData = useCallback(async (silent = false) => {
		if (!silent)
			setLoading(true);
		try {
			const [sectionsRes, tasksData] = await Promise.all([
				sectionService.fetchSectionsByProject(projectId),
				taskService.fetchTasksByProject(projectId, { limit: 50 }),
			]);

			const sectionsData = sectionsRes.data ?? [];
			setSections(sectionsData);

			const map: TaskMap = {};
			sectionsData.forEach(s => (map[s.id] = []));

			const countMap: SubtaskCountMap = {};
			tasksData.data.forEach((task) => {
				if (task.parentTask) {
					const pid = typeof task.parentTask === "string" ? task.parentTask : task.parentTask.id;
					countMap[pid] = (countMap[pid] ?? 0) + 1;
					return;
				}
				const sectionId = task.section?.id;
				if (sectionId && map[sectionId]) {
					map[sectionId].push(task);
				}
			});

			Object.keys(map).forEach(sid => map[sid].sort((a, b) => a.order - b.order));
			setTaskMap(map);
			setSubtaskCountMap(countMap);
		}
		finally {
			if (!silent)
				setLoading(false);
		}
	}, [projectId]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	const findSectionIdByTaskId = (taskId: string) => {
		return Object.keys(taskMap).find(sid => taskMap[sid].some(t => t.id === taskId));
	};

	const onDragStart = ({ active }: DragStartEvent) => {
		if (active.data.current?.type === "task") {
			const task = active.data.current.task as TaskEntity;
			setActiveDragTask(task);
			setSourceSectionId(findSectionIdByTaskId(task.id) || null);
		}
		else if (active.data.current?.type === "section") {
			setActiveDragSection(active.data.current.section as SectionEntity);
		}
	};

	const onDragOver = ({ active, over }: DragOverEvent) => {
		if (active.data.current?.type === "section")
			return;
		if (!over)
			return;

		const activeId = String(active.id);
		const overId = String(over.id);
		if (activeId === overId)
			return;

		const activeSectionId = findSectionIdByTaskId(activeId);
		const overSectionId = taskMap[overId] !== undefined
			? overId
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
		const sourceId = sourceSectionId;
		setActiveDragTask(null);
		setActiveDragSection(null);
		setSourceSectionId(null);

		if (!over)
			return;

		const activeId = String(active.id);
		const overId = String(over.id);

		// Section reorder
		if (active.data.current?.type === "section") {
			if (activeId === overId)
				return;
			const oldIndex = sections.findIndex(s => s.id === activeId);
			const newIndex = sections.findIndex(s => s.id === overId);
			if (oldIndex === -1 || newIndex === -1)
				return;
			const reordered = arrayMove(sections, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }));
			setSections(reordered);
			await sectionService.fetchReorderSections(projectId, reordered.map(s => ({ id: s.id, order: s.order })));
			return;
		}

		// Task reorder / move
		if (!sourceId)
			return;

		const destinationSectionId = taskMap[overId] !== undefined ? overId : findSectionIdByTaskId(overId);
		if (!destinationSectionId)
			return;

		if (sourceId === destinationSectionId) {
			const tasks = taskMap[sourceId];
			const oldIndex = tasks.findIndex(t => t.id === activeId);
			const newIndex = tasks.findIndex(t => t.id === overId);
			if (oldIndex === newIndex)
				return;
			const reordered = arrayMove(tasks, oldIndex, newIndex).map((t, i) => ({ ...t, order: i }));
			setTaskMap(prev => ({ ...prev, [sourceId]: reordered }));
			await taskService.fetchReorderTasks(reordered.map(t => ({ id: t.id, order: t.order })));
		}
		else {
			await taskService.fetchMoveTask(activeId, destinationSectionId);
			loadData(true);
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
						<SortableContext items={sections.map(s => s.id)} strategy={horizontalListSortingStrategy}>
							<div className="flex gap-4 overflow-x-auto pb-4 group">
								{sections.map(section => (
									<KanbanColumn
										key={section.id}
										section={section}
										tasks={taskMap[section.id] ?? []}
										subtaskCountMap={subtaskCountMap}
										onAddTask={handleAddTask}
										onEditTask={handleEditTask}
										onRenameSection={handleRenameSection}
										onDeleteSection={handleDeleteSection}
									/>
								))}
							</div>
						</SortableContext>

						<DragOverlay>
							{activeDragTask && <KanbanCardOverlay task={activeDragTask} />}
							{activeDragSection && (
								<KanbanColumnOverlay
									section={activeDragSection}
									taskCount={taskMap[activeDragSection.id]?.length ?? 0}
								/>
							)}
						</DragOverlay>
					</DndContext>
				)}

			<TaskDetail ref={taskDetailRef} />
		</div>
	);
}
