import type { PrincipalEntity } from "#src/api/system/principal/types";
import { PrincipalPicker } from "#src/components/principal-picker";
import { useDesigner } from "../store/designer.store";

interface PrincipalSelectProps {
	value?: string
	onChange?: (value?: string) => void
	disabled?: boolean
	placeholder?: string
}

const principalName = (p: Partial<PrincipalEntity>) => p.name || p.group?.name || p.user?.fullName || p.user?.loginName;

/** PrincipalPicker (người dùng hoặc nhóm) theo id — ghi nhớ tên vào store để node trên canvas hiển thị được */
export function PrincipalSelect({ value, onChange, disabled, placeholder }: PrincipalSelectProps) {
	const names = useDesigner(s => s.userNames);
	const setNames = useDesigner(s => s.setUserNames);

	const pickerValue = value ? (names[value] ? ({ id: value, name: names[value] } as PrincipalEntity) : value) : undefined;

	return (
		<PrincipalPicker
			value={pickerValue}
			disabled={disabled}
			placeholder={placeholder}
			allowClear
			onChange={(v) => {
				const picked = (Array.isArray(v) ? v[0] : v) as Partial<PrincipalEntity> | string | null | undefined;
				if (!picked) {
					onChange?.(undefined);
					return;
				}
				if (typeof picked === "string") {
					onChange?.(picked);
					return;
				}
				const name = principalName(picked);
				if (picked.id && name)
					setNames({ [picked.id]: name });
				onChange?.(picked.id);
			}}
		/>
	);
}
