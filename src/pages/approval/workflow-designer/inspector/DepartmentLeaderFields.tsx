import type { NamePath } from "antd/es/form/interface";
import { LeaderRole } from "#src/api/approval-workflow/types";
import { DepartmentPicker } from "#src/components/department-picker";
import { Checkbox, Form, Segmented, Select } from "antd";
import { useTranslation } from "react-i18next";

const ROLES = [LeaderRole.Head, LeaderRole.Deputy, LeaderRole.HeadOrDeputy];

interface DepartmentLeaderFieldsProps {
	/** Tiền tố đường dẫn trong form: [] ở bước duyệt, [index] trong danh sách người duyệt */
	prefix?: (string | number)[]
	disabled?: boolean
	/** Dòng gọn trong danh sách người duyệt song song: chọn vai trò bằng select, không có tùy chọn leo lên */
	compact?: boolean
}

/** Chọn lãnh đạo của một phòng cụ thể: phòng ban + vai trò (trưởng / phó / trưởng hoặc phó) + có leo lên phòng cha khi trống */
export function DepartmentLeaderFields({ prefix = [], disabled, compact }: DepartmentLeaderFieldsProps) {
	const { t } = useTranslation();
	const path = (name: string): NamePath => [...prefix, name];
	const roleOptions = ROLES.map(value => ({ value, label: t(`workflowDesigner.leaderRole.${value}`) }));

	if (compact) {
		return (
			<div className="flex min-w-0 flex-1 gap-1.5">
				<Form.Item name={path("department")} noStyle>
					<DepartmentPicker disabled={disabled} placeholder={t("workflowDesigner.inspector.selectDepartment")} />
				</Form.Item>
				<Form.Item name={path("role")} noStyle initialValue={LeaderRole.Head}>
					<Select options={roleOptions} disabled={disabled} className="w-[130px] shrink-0" popupMatchSelectWidth={false} />
				</Form.Item>
			</div>
		);
	}

	return (
		<>
			<Form.Item name={path("department")} className="mb-2" rules={[{ required: true, message: t("workflowDesigner.inspector.selectDepartment") }]}>
				<DepartmentPicker disabled={disabled} placeholder={t("workflowDesigner.inspector.selectDepartment")} />
			</Form.Item>
			<Form.Item name={path("role")} className="mb-2" initialValue={LeaderRole.Head}>
				<Segmented block options={roleOptions} disabled={disabled} />
			</Form.Item>
			<Form.Item name={path("climbIfEmpty")} valuePropName="checked" extra={t("workflowDesigner.inspector.climbIfEmptyHint")}>
				<Checkbox disabled={disabled}>{t("workflowDesigner.inspector.climbIfEmpty")}</Checkbox>
			</Form.Item>
		</>
	);
}
