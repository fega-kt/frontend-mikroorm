import type { PickerValueType } from "#src/components/people-picker";
import { PeoplePicker } from "#src/components/people-picker";
import { useDesigner } from "../store/designer.store";

interface UserPickerProps {
	value?: string
	onChange?: (value?: string) => void
	disabled?: boolean
	placeholder?: string
}

/** PeoplePicker theo id (string) — ghi nhớ họ tên vào store để node trên canvas hiển thị được tên */
export function UserPicker({ value, onChange, disabled, placeholder }: UserPickerProps) {
	const userNames = useDesigner(s => s.userNames);
	const setUserNames = useDesigner(s => s.setUserNames);

	const pickerValue: PickerValueType = value
		? (userNames[value] ? { id: value, fullName: userNames[value] } : value)
		: undefined;

	return (
		<PeoplePicker
			value={pickerValue}
			disabled={disabled}
			placeholder={placeholder}
			onChange={(v) => {
				const user = (Array.isArray(v) ? v[0] : v) as { id?: string, fullName?: string, loginName?: string } | string | null | undefined;
				if (!user) {
					onChange?.(undefined);
					return;
				}
				if (typeof user === "string") {
					onChange?.(user);
					return;
				}
				if (user.id && (user.fullName || user.loginName))
					setUserNames({ [user.id]: (user.fullName || user.loginName)! });
				onChange?.(user.id);
			}}
		/>
	);
}
