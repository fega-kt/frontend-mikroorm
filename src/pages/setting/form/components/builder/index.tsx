import type { FormField } from "#src/api/setting/request-type/types";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { FormFieldType } from "#src/api/setting/request-type/types";
import { fieldSpan } from "#src/pages/approval/lib/payload";
import { PlusOutlined } from "@ant-design/icons";
import { closestCenter, DndContext, DragOverlay, KeyboardSensor, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Empty, theme, Typography } from "antd";
import { createElement, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FIELD_KEY_PATTERN } from "../../form-schema";
import { CanvasField } from "./canvas-field";
import { FIELD_TYPES } from "./field-types";
import { Palette, PALETTE_ID_PREFIX } from "./palette";
import { PropertiesPanel } from "./properties-panel";

const { Text } = Typography;

const END_ID = "canvas-end";

// Id duy nhất (không dùng bộ đếm module: HMR đặt lại bộ đếm làm hai trường trùng id và cùng được chọn)
const nextUid = () => crypto.randomUUID();

interface FormBuilderProps {
	value: FormField[]
	onChange: (value: FormField[]) => void
}

function EndDropZone({ active }: { active: boolean }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { setNodeRef, isOver } = useDroppable({ id: END_ID });
	return (
		<div
			ref={setNodeRef}
			className="mx-2.5 mt-4 flex h-16 items-center justify-center gap-2 rounded-[10px] text-[13px] transition-colors"
			style={{
				border: `1.5px dashed ${isOver || active ? token.colorPrimary : token.colorBorder}`,
				background: isOver ? token.colorPrimaryBg : undefined,
				color: isOver || active ? token.colorPrimary : token.colorTextTertiary,
			}}
		>
			<PlusOutlined />
			{t("approval.formSchema.builder.dropHere")}
		</div>
	);
}

/**
 * Trình thiết kế form 3 cột: thư viện loại trường · khung form (lưới 12 cột) · thuộc tính.
 * Kéo từ thư viện để thêm, kéo ⋮⋮ để sắp xếp, kéo cạnh phải để đổi độ rộng — mỗi cột tự cuộn nên không có cuộn lồng nhau.
 */
export function FormBuilder({ value, onChange }: FormBuilderProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const gridRef = useRef<HTMLDivElement>(null);
	// id React ổn định cho từng trường (mã trường đổi khi đang gõ nên không dùng làm id được)
	const uids = useRef<string[]>([]);
	if (uids.current.length !== value.length)
		uids.current = value.map(() => nextUid());

	const [selectedUid, setSelectedUid] = useState<string | null>(null);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [overId, setOverId] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	const selectedIndex = selectedUid ? uids.current.indexOf(selectedUid) : -1;
	const selected = selectedIndex >= 0 ? value[selectedIndex] : undefined;

	const keyCounts = useMemo(() => value.reduce<Record<string, number>>((acc, f) => ({ ...acc, [f.key]: (acc[f.key] ?? 0) + 1 }), {}), [value]);
	const keyError = (field: FormField) => {
		if (!FIELD_KEY_PATTERN.test(field.key))
			return t("approval.formSchema.keyPattern");
		if (keyCounts[field.key] > 1)
			return t("approval.formSchema.keyDuplicate");
		return undefined;
	};
	const isInvalid = (field: FormField) => !!keyError(field) || !field.label.trim() || (field.type === FormFieldType.Select && !field.options?.length);

	const update = (index: number, patch: Partial<FormField>) => onChange(value.map((f, i) => (i === index ? { ...f, ...patch } : f)));

	const insert = (type: FormFieldType, index: number) => {
		let n = value.length + 1;
		while (value.some(f => f.key === `${type}${n}`)) n++;
		const field: FormField = {
			key: `${type}${n}`,
			label: t(`approval.formSchema.types.${type}`),
			type,
			required: false,
			span: type === FormFieldType.Textarea ? 12 : 6,
			options: type === FormFieldType.Select ? [] : undefined,
		};
		const uid = nextUid();
		const ids = [...uids.current];
		ids.splice(index, 0, uid);
		uids.current = ids;
		const next = [...value];
		next.splice(index, 0, field);
		onChange(next);
		setSelectedUid(uid);
		requestAnimationFrame(() => document.getElementById(uid)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
	};

	const remove = (index: number) => {
		uids.current = uids.current.filter((_, i) => i !== index);
		onChange(value.filter((_, i) => i !== index));
		setSelectedUid(null);
	};

	const duplicate = (index: number) => {
		const src = value[index];
		let n = 2;
		while (value.some(f => f.key === `${src.key}_${n}`)) n++;
		const uid = nextUid();
		const ids = [...uids.current];
		ids.splice(index + 1, 0, uid);
		uids.current = ids;
		const next = [...value];
		next.splice(index + 1, 0, { ...src, key: `${src.key}_${n}` });
		onChange(next);
		setSelectedUid(uid);
	};

	const isPaletteDrag = !!activeId?.startsWith(PALETTE_ID_PREFIX);

	const onDragStart = ({ active }: DragStartEvent) => setActiveId(String(active.id));

	const onDragEnd = ({ active, over }: DragEndEvent) => {
		setActiveId(null);
		setOverId(null);
		if (!over)
			return;
		const activeKey = String(active.id);
		const overKey = String(over.id);
		if (activeKey.startsWith(PALETTE_ID_PREFIX)) {
			const type = activeKey.slice(PALETTE_ID_PREFIX.length) as FormFieldType;
			const index = overKey === END_ID ? value.length : uids.current.indexOf(overKey);
			insert(type, index < 0 ? value.length : index);
			return;
		}
		const from = uids.current.indexOf(activeKey);
		const to = overKey === END_ID ? value.length - 1 : uids.current.indexOf(overKey);
		if (from < 0 || to < 0 || from === to)
			return;
		uids.current = arrayMove(uids.current, from, to);
		onChange(arrayMove(value, from, to));
	};

	const activeField = activeId && !isPaletteDrag ? value[uids.current.indexOf(activeId)] : undefined;
	const activePaletteType = isPaletteDrag ? FIELD_TYPES.find(item => `${PALETTE_ID_PREFIX}${item.type}` === activeId) : undefined;

	const panelClass = "min-h-0 overflow-y-auto rounded-lg";
	const panelStyle = { background: token.colorBgContainer, border: `1px solid ${token.colorBorderSecondary}` };

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={onDragStart}
			onDragOver={({ over }) => setOverId(over ? String(over.id) : null)}
			onDragEnd={onDragEnd}
			onDragCancel={() => {
				setActiveId(null);
				setOverId(null);
			}}
		>
			<div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
				<aside className={`${panelClass} p-4`} style={panelStyle}>
					<Palette onAdd={type => insert(type, value.length)} />
				</aside>

				<main className={`${panelClass} p-6`} style={{ background: token.colorFillQuaternary, border: `1px solid ${token.colorBorderSecondary}` }} onClick={() => setSelectedUid(null)}>
					<div
						className="mx-auto max-w-[760px] rounded-xl px-9 py-7"
						style={{ background: token.colorBgContainer, border: `1px solid ${token.colorBorderSecondary}`, boxShadow: token.boxShadowTertiary }}
					>
						{!value.length && <Empty description={t("approval.formSchema.empty")} className="mb-2" />}
						<SortableContext items={uids.current} strategy={rectSortingStrategy}>
							<div ref={gridRef} className="grid grid-cols-12 gap-x-4 gap-y-1">
								{value.map((field, index) => {
									const uid = uids.current[index];
									return (
										<CanvasField
											key={uid}
											uid={uid}
											field={field}
											selected={uid === selectedUid}
											invalid={isInvalid(field)}
											keyError={keyError(field)}
											insertBefore={isPaletteDrag && overId === uid}
											getGrid={() => gridRef.current}
											onSelect={() => setSelectedUid(uid)}
											onResize={span => update(uids.current.indexOf(uid), { span })}
											onDuplicate={() => duplicate(uids.current.indexOf(uid))}
											onRemove={() => remove(uids.current.indexOf(uid))}
										/>
									);
								})}
							</div>
						</SortableContext>
						<EndDropZone active={isPaletteDrag} />
					</div>
				</main>

				<aside className={`${panelClass} p-4`} style={panelStyle}>
					{selected
						? <PropertiesPanel key={selectedUid} field={selected} keyError={keyError(selected)} onChange={patch => update(selectedIndex, patch)} />
						: <Text type="secondary" className="block py-8 text-center text-[13px]">{t("approval.formSchema.builder.selectHint")}</Text>}
				</aside>
			</div>

			<DragOverlay dropAnimation={null}>
				{activePaletteType && (
					<div className="flex h-[52px] w-[170px] -rotate-3 items-center gap-2.5 rounded-[10px] px-3.5 text-[13px] font-semibold" style={{ background: token.colorBgElevated, border: `1.5px solid ${token.colorPrimary}`, boxShadow: token.boxShadowSecondary }}>
						<span style={{ color: token.colorPrimary }}>{createElement(activePaletteType.icon)}</span>
						{t(`approval.formSchema.types.${activePaletteType.type}`)}
					</div>
				)}
				{activeField && (
					<div className="rounded-[10px] px-3 py-2.5 text-[13px] font-semibold" style={{ width: `${(fieldSpan(activeField) / 12) * 100}%`, minWidth: 180, background: token.colorBgElevated, border: `1.5px solid ${token.colorPrimary}`, boxShadow: token.boxShadowSecondary }}>
						{activeField.label || activeField.key}
					</div>
				)}
			</DragOverlay>
		</DndContext>
	);
}
