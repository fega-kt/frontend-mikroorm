import type { FormField } from "#src/api/setting/request-type/types";
import { FormFieldInput } from "#src/pages/approval/components/form-fields";
import { fieldSpan } from "#src/pages/approval/lib/payload";
import { CopyOutlined, DeleteOutlined, HolderOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { theme, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { fieldTypeIcon, spanLabel } from "./field-types";

/** Khoảng cách giữa các cột của lưới (gap-x-4) — dùng để quy đổi px kéo → số cột */
const GRID_GAP = 16;

interface CanvasFieldProps {
	uid: string
	field: FormField
	selected: boolean
	invalid: boolean
	/** Lỗi mã trường (sai quy tắc / trùng) — hiện ngay dưới trường */
	keyError?: string
	/** Đang kéo loại trường mới ngang qua trường này: hiện vạch chèn phía trước */
	insertBefore: boolean
	getGrid: () => HTMLElement | null
	onSelect: () => void
	onResize: (span: number) => void
	onDuplicate: () => void
	onRemove: () => void
}

/** Một trường trên khung thiết kế: kéo ⋮⋮ để sắp xếp, kéo cạnh phải để đổi độ rộng */
export function CanvasField({ uid, field, selected, invalid, keyError, insertBefore, getGrid, onSelect, onResize, onDuplicate, onRemove }: CanvasFieldProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: uid });
	const span = fieldSpan(field);
	const TypeIcon = fieldTypeIcon(field.type);

	const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
		const grid = getGrid();
		if (!grid)
			return;
		event.preventDefault();
		event.stopPropagation();
		onSelect();
		const unit = (grid.clientWidth + GRID_GAP) / 12;
		const startX = event.clientX;
		const startSpan = span;
		let last = startSpan;
		const move = (e: PointerEvent) => {
			const next = Math.min(12, Math.max(1, Math.round(startSpan + (e.clientX - startX) / unit)));
			if (next !== last) {
				last = next;
				onResize(next);
			}
		};
		const stop = () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", stop);
			document.body.style.cursor = "";
		};
		document.body.style.cursor = "ew-resize";
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", stop);
	};

	const borderColor = invalid ? token.colorError : selected ? token.colorPrimary : "transparent";

	return (
		<div
			ref={setNodeRef}
			id={uid}
			onClick={(e) => {
				e.stopPropagation();
				onSelect();
			}}
			className="group relative rounded-[10px] p-2.5"
			style={{
				gridColumn: `span ${span}`,
				transform: CSS.Translate.toString(transform),
				transition,
				opacity: isDragging ? 0.35 : 1,
				border: `1.5px solid ${borderColor}`,
				background: selected ? token.colorPrimaryBg : undefined,
				boxShadow: selected ? `0 0 0 4px ${token.colorPrimaryBgHover}55` : undefined,
				zIndex: selected ? 2 : undefined,
			}}
		>
			{insertBefore && (
				<span className="absolute -left-2 -top-1 bottom-0 w-1 rounded" style={{ background: token.colorPrimary }} />
			)}

			<div
				ref={setActivatorNodeRef}
				{...attributes}
				{...listeners}
				aria-label={t("approval.formSchema.builder.dragToSort")}
				className={`absolute -left-7 top-3 flex h-7 w-5 cursor-grab items-center justify-center rounded text-[14px] active:cursor-grabbing ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`}
				style={{ color: token.colorPrimary }}
			>
				<HolderOutlined />
			</div>

			{selected && (
				<div
					className="absolute -top-3.5 right-2.5 flex h-7 items-center gap-0.5 rounded-lg px-1 text-white"
					style={{ background: token.colorPrimary }}
				>
					<span className="flex items-center gap-1 px-1.5 text-[11px] font-semibold">
						{TypeIcon && <TypeIcon />}
						{spanLabel(span, t("approval.formSchema.builder.full"))}
					</span>
					<span className="h-3.5 w-px bg-white/40" />
					<Tooltip title={t("approval.formSchema.builder.duplicate")}>
						<button
							type="button"
							aria-label={t("approval.formSchema.builder.duplicate")}
							className="flex size-6 cursor-pointer items-center justify-center border-0 bg-transparent text-white"
							onClick={(e) => {
								e.stopPropagation();
								onDuplicate();
							}}
						>
							<CopyOutlined />
						</button>
					</Tooltip>
					<Tooltip title={t("common.delete")}>
						<button
							type="button"
							aria-label={t("common.delete")}
							className="flex size-6 cursor-pointer items-center justify-center border-0 bg-transparent text-white"
							onClick={(e) => {
								e.stopPropagation();
								onRemove();
							}}
						>
							<DeleteOutlined />
						</button>
					</Tooltip>
				</div>
			)}

			<div className="mb-1.5 text-[13px] font-semibold">
				{field.label || <span className="opacity-40">{t("approval.formSchema.label")}</span>}
				{field.required && <span className="ml-1" style={{ color: token.colorError }}>*</span>}
			</div>
			{/* Chỉ để xem hình dạng: không cho tương tác trên khung thiết kế */}
			<div className="pointer-events-none" inert>
				<FormFieldInput field={field} />
			</div>

			{keyError && <div className="mt-1 text-xs" style={{ color: token.colorError }}>{`${field.key}: ${keyError}`}</div>}

			<div
				role="separator"
				aria-label={t("approval.formSchema.builder.dragToResize")}
				onPointerDown={startResize}
				className={`absolute -right-2 top-1/2 h-9 w-2 -translate-y-1/2 cursor-ew-resize rounded border-2 border-white ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-70"}`}
				style={{ background: token.colorPrimary, touchAction: "none" }}
			/>
		</div>
	);
}
