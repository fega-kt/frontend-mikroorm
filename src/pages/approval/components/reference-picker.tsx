import type { FormField, FormReference } from "#src/api/setting/request-type/types";
import type { PrincipalEntity } from "#src/api/system/principal/types";
import type { UserEntity } from "#src/api/user/types";
import { FormFieldType } from "#src/api/setting/request-type/types";
import { DepartmentPicker } from "#src/components/department-picker";
import { PeoplePicker } from "#src/components/people-picker";
import { PrincipalPicker } from "#src/components/principal-picker";

const asArray = (value: unknown): FormReference[] => (Array.isArray(value) ? value : value ? [value as FormReference] : []);

/**
 * Ô chọn người / nhóm: payload lưu { id, name } (không lưu cả entity) nên đổi qua lại với giá trị picker.
 * `value`/`onChange` do Form.Item truyền xuống.
 */
export function ReferencePicker({ field, disabled, value, onChange }: { field: FormField, disabled?: boolean, value?: FormReference | FormReference[], onChange?: (value: unknown) => void }) {
	const multiple = !!field.multiple;
	const emit = (picked: unknown) => {
		const picks = (Array.isArray(picked) ? picked : picked ? [picked] : []) as (Partial<FormReference> & Partial<UserEntity>)[];
		const list = picks.map(item => ({ id: item.id!, name: item.name ?? item.fullName ?? item.loginName ?? item.id! }));
		onChange?.(multiple ? list : list[0]);
	};
	if (field.type === FormFieldType.Department)
		return <DepartmentPicker multiple={multiple} placeholder={field.placeholder} disabled={disabled} value={value as never} onChange={onChange as never} />;
	if (field.type === FormFieldType.Principal) {
		const principals = asArray(value) as PrincipalEntity[];
		return <PrincipalPicker mode={multiple ? "multiple" : undefined} placeholder={field.placeholder} disabled={disabled} value={(multiple ? principals : principals[0]) as never} onChange={emit} allowClear />;
	}
	const users = asArray(value).map(item => ({ id: item.id, fullName: item.name }) as UserEntity);
	return <PeoplePicker mode={multiple ? "multiple" : undefined} placeholder={field.placeholder} disabled={disabled} value={(multiple ? users : users[0]) as never} onChange={emit} allowClear />;
}
