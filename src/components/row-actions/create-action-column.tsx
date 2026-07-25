import type { ProColumns, ProCoreActionType } from "@ant-design/pro-components";
import type { TFunction } from "i18next";
import { RowActions } from "#src/components/row-actions";

interface CreateActionColumnToggleActive<T> {
	active: (record: T) => boolean
	onToggle: (record: T, action?: ProCoreActionType<object>) => void
	enabled?: boolean
	confirmTitle: (record: T) => string
	tooltipTitle: (record: T) => string
}

interface CreateActionColumnOptions<T> {
	width?: number
	onEdit?: (record: T) => void
	editEnabled?: boolean
	toggleActive?: CreateActionColumnToggleActive<T>
	onDelete?: (record: T, action?: ProCoreActionType<object>) => void
	deleteEnabled?: boolean
	deleteConfirmTitle?: string
}

export function createActionColumn<T extends object>(t: TFunction<"translation", undefined>, options: CreateActionColumnOptions<T>): ProColumns<T>[] {
	const { width = 96, onEdit, editEnabled, toggleActive, onDelete, deleteEnabled, deleteConfirmTitle } = options;

	const visible = (!!onEdit && !!editEnabled) || (!!toggleActive && !!toggleActive.enabled) || (!!onDelete && !!deleteEnabled);

	if (!visible) {
		return [];
	}

	return [{
		title: t("common.action"),
		valueType: "option",
		key: "option",
		width,
		fixed: "right",
		render: (_, record, __, action) => (
			<RowActions
				onEdit={onEdit && (() => onEdit(record))}
				editEnabled={editEnabled}
				toggleActive={toggleActive && {
					active: toggleActive.active(record),
					onToggle: () => toggleActive.onToggle(record, action),
					enabled: toggleActive.enabled,
					confirmTitle: toggleActive.confirmTitle(record),
					tooltipTitle: toggleActive.tooltipTitle(record),
				}}
				onDelete={onDelete && (() => onDelete(record, action))}
				deleteEnabled={deleteEnabled}
				deleteConfirmTitle={deleteConfirmTitle}
			/>
		),
	}];
}
