import { ApproverType } from "#src/api/approval-workflow/types";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Select } from "antd";
import { useTranslation } from "react-i18next";
import { useApproverTypeOptions } from "./approver-form";
import { PrincipalSelect } from "./PrincipalSelect";
import { UserPicker } from "./UserPicker";

interface ApproverListFieldProps {
	name: string
	addText: string
	disabled?: boolean
}

/** Danh sách người duyệt / người nhận: mỗi dòng là Trưởng phòng / Phó phòng / Người hoặc nhóm (một suất duyệt) */
export function ApproverListField({ name, addText, disabled }: ApproverListFieldProps) {
	const { t } = useTranslation();
	const form = Form.useFormInstance();
	const rows = (Form.useWatch(name, form) ?? []) as { type?: ApproverType }[];
	const typeOptions = useApproverTypeOptions(rows.some(r => r?.type === ApproverType.SpecificUser));

	return (
		<Form.List name={name}>
			{(fields, { add, remove }) => (
				<div className="flex flex-col gap-2">
					{fields.map(field => (
						<div key={field.key} className="flex items-start gap-1.5">
							<Form.Item name={[field.name, "type"]} noStyle>
								<Select options={typeOptions} className="w-[130px] shrink-0" disabled={disabled} />
							</Form.Item>
							<Form.Item noStyle shouldUpdate>
								{({ getFieldValue }) => {
									const type = getFieldValue([name, field.name, "type"]);
									if (type === ApproverType.Principal) {
										return (
											<div className="min-w-0 flex-1">
												<Form.Item name={[field.name, "principalId"]} noStyle>
													<PrincipalSelect disabled={disabled} placeholder={t("workflowDesigner.inspector.selectPrincipal")} />
												</Form.Item>
											</div>
										);
									}
									if (type === ApproverType.SpecificUser) {
										return (
											<div className="min-w-0 flex-1">
												<Form.Item name={[field.name, "userId"]} noStyle>
													<UserPicker disabled={disabled} placeholder={t("workflowDesigner.inspector.selectUser")} />
												</Form.Item>
											</div>
										);
									}
									return <div className="flex-1" />;
								}}
							</Form.Item>
							<Button type="text" danger icon={<DeleteOutlined />} disabled={disabled} onClick={() => remove(field.name)} />
						</div>
					))}
					<Button type="dashed" block icon={<PlusOutlined />} disabled={disabled} onClick={() => add({ type: ApproverType.DeptHead })}>
						{addText}
					</Button>
				</div>
			)}
		</Form.List>
	);
}
