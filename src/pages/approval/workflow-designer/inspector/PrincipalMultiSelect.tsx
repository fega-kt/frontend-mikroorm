import type { PrincipalEntity } from "#src/api/system/principal/types";
import { PrincipalPicker } from "#src/components/principal-picker";
import { useDesigner } from "../store/designer.store";

interface PrincipalMultiSelectProps {
	value?: string[]
	onChange?: (value: string[]) => void
	disabled?: boolean
	placeholder?: string
}

const principalName = (p: Partial<PrincipalEntity>) => p.name || p.group?.name || p.user?.fullName || p.user?.loginName;

/** Chọn nhiều người dùng / nhóm theo id — ghi nhớ tên vào store để node trên canvas hiển thị được */
export function PrincipalMultiSelect({ value = [], onChange, disabled, placeholder }: PrincipalMultiSelectProps) {
	const names = useDesigner(s => s.userNames);
	const setNames = useDesigner(s => s.setUserNames);

	const pickerValue = value.map(id => (names[id] ? ({ id, name: names[id] } as PrincipalEntity) : id)) as PrincipalEntity[];

	return (
		<PrincipalPicker
			mode="multiple"
			value={pickerValue}
			disabled={disabled}
			placeholder={placeholder}
			onChange={(v) => {
				const list = (Array.isArray(v) ? v : v ? [v] : []) as (Partial<PrincipalEntity> | string)[];
				const known: Record<string, string> = {};
				const ids = list.map((item) => {
					if (typeof item === "string")
						return item;
					const name = principalName(item);
					if (item.id && name)
						known[item.id] = name;
					return item.id!;
				}).filter(Boolean);
				if (Object.keys(known).length)
					setNames(known);
				onChange?.(ids);
			}}
		/>
	);
}
