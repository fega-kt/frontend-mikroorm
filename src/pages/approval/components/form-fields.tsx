import type { FormField, FormReference } from "#src/api/setting/request-type/types";
import type { PrincipalEntity } from "#src/api/system/principal/types";
import type { UserEntity } from "#src/api/user/types";
import type { FormProps } from "antd";
import { FormFieldType } from "#src/api/setting/request-type/types";
import { PrincipalType } from "#src/api/system/principal/types";
import { DepartmentPicker } from "#src/components/department-picker";
import { PeoplePicker } from "#src/components/people-picker";
import { PrincipalPicker } from "#src/components/principal-picker";
import { useUserBriefs } from "#src/hooks/use-user-briefs";
import { DatePicker, Descriptions, Form, Input, InputNumber, Select, Switch, theme, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { DATE_FORMAT, disabledDateFor, fieldSpanClass, formatMoney, formatPayloadValue, parseMoney, PAYLOAD_FORM_LAYOUT, PAYLOAD_GRID_CLASS } from "../lib/payload";
import { tableRowsError } from "../lib/table-field";
import { TableFieldInput, TableFieldView } from "./table-field";

interface FormFieldInputProps {
	field: FormField
	disabled?: boolean
	/** value / onChange / checked / id… do Form.Item truyền xuống — phải chuyển tiếp cho ô nhập, nếu không Form không nhận được giá trị */
	[control: string]: any
}

const asArray = (value: unknown): FormReference[] => (Array.isArray(value) ? value : value ? [value as FormReference] : []);

/**
 * Ô chọn người / nhóm: payload lưu bản rút gọn ({ id, name }; người / nhóm thêm type + userId) chứ không lưu cả entity,
 * nên đổi qua lại với giá trị picker. `value`/`onChange` do Form.Item truyền xuống.
 */
function ReferencePicker({ field, disabled, value, onChange }: { field: FormField, disabled?: boolean, value?: FormReference | FormReference[], onChange?: (value: unknown) => void }) {
	const multiple = !!field.multiple;
	const emit = (list: FormReference[]) => onChange?.(multiple ? list : list[0]);
	const picksOf = <T,>(picked: unknown) => (Array.isArray(picked) ? picked : picked ? [picked] : []) as T[];
	if (field.type === FormFieldType.Department)
		return <DepartmentPicker multiple={multiple} placeholder={field.placeholder} disabled={disabled} value={value as never} onChange={onChange as never} />;
	if (field.type === FormFieldType.Principal) {
		return (
			<PrincipalReferencePicker
				field={field}
				disabled={disabled}
				value={value}
				onChange={picked => emit(picksOf<Partial<PrincipalEntity> & Partial<FormReference>>(picked).map(principalReference))}
			/>
		);
	}
	return (
		<UserReferencePicker
			field={field}
			disabled={disabled}
			value={value}
			onChange={picked => emit(picksOf<Partial<FormReference> & Partial<UserEntity>>(picked).map(item => ({ id: item.id!, name: item.name ?? item.fullName ?? item.loginName ?? item.id! })))}
		/>
	);
}

/** Principal chọn từ picker (entity đủ) hoặc giá trị đã lưu → bản lưu trong payload */
function principalReference(item: Partial<PrincipalEntity> & Partial<FormReference>): FormReference {
	const type = item.type;
	const userId = type === PrincipalType.User ? (item.user?.id ?? item.userId) : undefined;
	return {
		id: item.id!,
		name: item.name ?? item.group?.name ?? item.user?.fullName ?? item.id!,
		...(type ? { type } : {}),
		...(userId ? { userId } : {}),
	};
}

/** Id user cần tra để hiện avatar / email: trường người dùng = chính id; người / nhóm là người = userId */
const userIdOf = (field: FormField, item: FormReference) => (field.type === FormFieldType.User ? item.id : item.type === PrincipalType.User ? item.userId : undefined);

/** Ô chọn người: giá trị đã lưu chỉ có { id, name } — bổ sung avatar / email mới nhất để hiện giống lúc chọn */
function UserReferencePicker({ field, disabled, value, onChange }: { field: FormField, disabled?: boolean, value?: FormReference | FormReference[], onChange: (value: unknown) => void }) {
	const refs = asArray(value);
	const briefs = useUserBriefs(refs.map(item => item.id));
	const users = refs.map(item => ({ ...briefs.get(item.id), id: item.id, fullName: briefs.get(item.id)?.fullName ?? item.name }) as UserEntity);
	const multiple = !!field.multiple;
	return <PeoplePicker mode={multiple ? "multiple" : undefined} placeholder={field.placeholder} disabled={disabled} value={(multiple ? users : users[0]) as never} onChange={onChange} allowClear />;
}

/** Ô chọn người / nhóm: dựng lại principal từ giá trị đã lưu (loại + avatar mới nhất của người) để hiện đúng icon / ảnh */
function PrincipalReferencePicker({ field, disabled, value, onChange }: { field: FormField, disabled?: boolean, value?: FormReference | FormReference[], onChange: (value: unknown) => void }) {
	const refs = asArray(value);
	const briefs = useUserBriefs(refs.map(item => userIdOf(field, item) ?? ""));
	const principals = refs.map((item) => {
		const user = item.userId ? briefs.get(item.userId) : undefined;
		return {
			id: item.id,
			name: item.name,
			type: item.type,
			user: item.userId ? { ...user, id: item.userId } : undefined,
		} as PrincipalEntity;
	});
	const multiple = !!field.multiple;
	return <PrincipalPicker mode={multiple ? "multiple" : undefined} placeholder={field.placeholder} disabled={disabled} value={(multiple ? principals : principals[0]) as never} onChange={onChange} allowClear />;
}

/**
 * Người / người-nhóm đã chọn (chỉ đọc): avatar + tên, hover xem thẻ thông tin (nhóm: thành viên); nhóm hiện icon nhóm.
 * Không tra được (đã xóa, payload cũ thiếu loại…) thì dùng tên đã lưu với avatar chữ cái đầu.
 */
function ReferenceList({ field, value }: { field: FormField, value: unknown }) {
	const refs = asArray(value);
	const briefs = useUserBriefs(refs.map(item => userIdOf(field, item) ?? ""));
	return (
		<span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 align-middle">
			{refs.map((item) => {
				const userId = userIdOf(field, item);
				const user = userId ? briefs.get(userId) : undefined;
				return field.type === FormFieldType.User
					? <PeoplePicker key={item.id} readonly user={user ?? { id: item.id, fullName: item.name }} showEmail={false} avatarSize={20} className="!min-h-0" />
					: (
						<PrincipalPicker
							key={item.id}
							readonly
							principal={{ id: item.id, name: user?.fullName ?? item.name, type: item.type, user: userId ? { id: userId, avatar: user?.avatar } : undefined }}
							avatarSize={20}
							className="!min-h-0"
						/>
					);
			})}
		</span>
	);
}

/** Giá trị chỉ đọc của một trường: trường người dùng / người-nhóm hiện avatar, còn lại là chữ */
function PayloadValue({ field, value }: { field: FormField, value: unknown }) {
	const { t } = useTranslation();
	if ((field.type === FormFieldType.User || field.type === FormFieldType.Principal) && asArray(value).length)
		return <ReferenceList field={field} value={value} />;
	return <>{formatPayloadValue(field, value, t)}</>;
}

/** Ô nhập cho một trường của form loại tờ trình */
export function FormFieldInput({ field, disabled, ...control }: FormFieldInputProps) {
	const { t } = useTranslation();
	switch (field.type) {
		case FormFieldType.Textarea:
			return <Input.TextArea rows={4} maxLength={field.max ?? 5000} showCount placeholder={field.placeholder} disabled={disabled} {...control} />;
		case FormFieldType.Number:
			return <InputNumber className="w-full" min={field.min} max={field.max} placeholder={field.placeholder} disabled={disabled} {...control} />;
		case FormFieldType.Money:
			return (
				<InputNumber<number>
					className="w-full"
					min={field.min}
					max={field.max}
					formatter={formatMoney}
					parser={parseMoney}
					placeholder={field.placeholder}
					disabled={disabled}
					{...control}
				/>
			);
		case FormFieldType.Date:
			return <DatePicker className="w-full" format={DATE_FORMAT} disabledDate={disabledDateFor(field)} disabled={disabled} {...control} />;
		case FormFieldType.DateRange:
			return <DatePicker.RangePicker className="w-full" format={DATE_FORMAT} disabledDate={disabledDateFor(field)} disabled={disabled} {...control} />;
		case FormFieldType.Select:
			return <Select className="w-full" options={field.options} placeholder={field.placeholder} disabled={disabled} allowClear={!field.required} {...control} />;
		case FormFieldType.Switch:
			return <Switch checkedChildren={t("approval.yes")} unCheckedChildren={t("approval.no")} disabled={disabled} {...control} />;
		case FormFieldType.User:
		case FormFieldType.Department:
		case FormFieldType.Principal:
			return <ReferencePicker field={field} disabled={disabled} {...control} />;
		case FormFieldType.Table:
			return <TableFieldInput field={field} disabled={disabled} {...control} />;
		case FormFieldType.Text:
		default:
			return <Input maxLength={field.max ?? 500} placeholder={field.placeholder} disabled={disabled} {...control} />;
	}
}

/** Các Form.Item sinh từ formSchema, giá trị nằm dưới `payload.<key>` */
export function PayloadFormItems({ fields, disabled }: { fields: FormField[], disabled?: boolean }) {
	const { t } = useTranslation();
	/** Bảng: kiểm số dòng và ô bắt buộc của từng dòng (báo lỗi đầu tiên) */
	const tableRule = (field: FormField) => ({
		validator: (_: unknown, value: unknown) => {
			const error = tableRowsError(field, value);
			return error ? Promise.reject(new Error(t(`approval.formSchema.table.errors.${error.code}`, { ...error }))) : Promise.resolve();
		},
	});
	const rulesOf = (field: FormField) => {
		if (field.type === FormFieldType.Table)
			return [tableRule(field)];
		return field.required && field.type !== FormFieldType.Switch ? [{ required: true, message: t("form.required") }] : undefined;
	};
	return (
		<>
			{fields.map(field => (
				<Form.Item
					key={field.key}
					className={fieldSpanClass(field)}
					name={["payload", field.key]}
					label={field.label}
					valuePropName={field.type === FormFieldType.Switch ? "checked" : "value"}
					required={field.type === FormFieldType.Table ? !!field.required : undefined}
					rules={rulesOf(field)}
				>
					<FormFieldInput field={field} disabled={disabled} />
				</Form.Item>
			))}
		</>
	);
}

/**
 * Nội dung tờ trình chỉ đọc, cùng bố cục với form soạn (lưới 2 cột, nhãn trên, ô nhiều dòng chiếm cả hàng):
 * mỗi giá trị nằm trong một ô viền giống ô nhập nhưng không sửa được.
 */
export function PayloadView({ fields, payload, layout = PAYLOAD_FORM_LAYOUT }: {
	fields: FormField[]
	payload: Record<string, unknown>
	/** Mặc định theo form soạn; truyền "horizontal" khi cần nhãn nằm ngang (vd: khung hẹp) */
	layout?: FormProps["layout"]
}) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	if (!fields.length)
		return <Typography.Text type="secondary">{t("common.noData")}</Typography.Text>;
	return (
		<Form layout={layout} component="div" className={PAYLOAD_GRID_CLASS}>
			{fields.map((field) => {
				const multiline = field.type === FormFieldType.Textarea;
				const value = payload[field.key];
				// Trường không nhập: để ô trống như trên form (không hiện "—")
				const empty = value == null || value === "" || (Array.isArray(value) && !value.length);
				// Bảng tự có khung viền nên không bọc thêm ô giả
				if (field.type === FormFieldType.Table) {
					return (
						<Form.Item key={field.key} label={field.label} className={fieldSpanClass(field)}>
							<TableFieldView field={field} value={value} />
						</Form.Item>
					);
				}
				return (
					<Form.Item key={field.key} label={field.label} className={fieldSpanClass(field)}>
						<div
							className="whitespace-pre-wrap break-words rounded-md px-[11px] py-[4px] leading-[22px]"
							style={{
								minHeight: multiline ? 98 : 32,
								border: `1px solid ${token.colorBorder}`,
								background: token.colorFillQuaternary,
							}}
						>
							{!empty && <PayloadValue field={field} value={value} />}
						</div>
					</Form.Item>
				);
			})}
		</Form>
	);
}

/** Dữ liệu đơn dạng bảng mô tả theo formSchema */
export function PayloadDescriptions({ fields, payload, column = 2 }: { fields: FormField[], payload: Record<string, unknown>, column?: number }) {
	const { t } = useTranslation();
	if (!fields.length)
		return <Typography.Text type="secondary">{t("common.noData")}</Typography.Text>;
	return (
		<Descriptions
			size="small"
			bordered
			column={{ xs: 1, sm: 1, md: column }}
			items={fields.map(field => ({
				key: field.key,
				label: field.label,
				span: field.type === FormFieldType.Textarea || field.type === FormFieldType.Table ? column : 1,
				children: field.type === FormFieldType.Table
					? <TableFieldView field={field} value={payload[field.key]} />
					: <span className="whitespace-pre-wrap"><PayloadValue field={field} value={payload[field.key]} /></span>,
			}))}
		/>
	);
}
