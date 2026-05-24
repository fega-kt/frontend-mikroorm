import type { DepartmentEntity } from "#src/api/system/dept/types.js";
import { userService } from "#src/api/user";
import { BasicContent } from "#src/components/basic-content";
import { FormAvatarItem, TrimInput, TrimTextArea } from "#src/components/basic-form";
import { VIETNAMESE_MOBILE_REGEXP } from "#src/constants/regular-expressions";
import { useUserStore } from "#src/store/user";
import {
	ProForm,
	ProFormText,
} from "@ant-design/pro-components";
import { Card, Col, Form, Row, Space, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

interface ProfileFormValues {
	fullName: string
	loginName: string
	department: DepartmentEntity
	workEmail: string
	phoneNumber: string
	description?: string
	avatar?: string | File
}

const DIRTY_FIELDS = ["fullName", "workEmail", "phoneNumber", "description"] as const;

export default function Profile() {
	const { t } = useTranslation();
	const currentUser = useUserStore();
	const [form] = Form.useForm<ProfileFormValues>();
	const [isDirty, setIsDirty] = useState(false);
	const [hasErrors, setHasErrors] = useState(false);

	const checkDirty = () => {
		const dirty = DIRTY_FIELDS.some(key => (form.getFieldValue(key) ?? "") !== ((currentUser)[key] ?? ""));
		setIsDirty(dirty);
		setHasErrors(form.getFieldsError().some(({ errors }) => errors.length > 0));
	};

	const handleFinish = async (values: ProfileFormValues) => {
		const data = {
			fullName: values.fullName,
			workEmail: values.workEmail,
			phoneNumber: values.phoneNumber,
			description: values.description,
		};

		try {
			await userService.updateProfile(data);
			await currentUser.getUserInfo();
			setIsDirty(false);
			setHasErrors(false);
			window.$message?.success(t("personal-center.updateSuccess"));
		}
		catch (error) {
			console.error("Update failed", error);
			window.$message?.error(t("common.updateError"));
		}
	};

	return (
		<BasicContent className="flex justify-center items-start p-8">
			<Card
				title={(
					<Space className="py-2">
						<Title level={4} style={{ margin: 0 }}>{t("personal-center.myProfile")}</Title>
					</Space>
				)}
				variant="borderless"
				className="w-full max-w-4xl shadow-md rounded-2xl overflow-hidden"
			>
				<ProForm
					form={form}
					layout="vertical"
					onFinish={handleFinish}
					onFieldsChange={checkDirty}
					initialValues={currentUser}
					submitter={{
						render: (_, doms) => (
							<div className="flex justify-end gap-3 mt-4 pt-2 pr-2">
								{doms}
							</div>
						),
						searchConfig: {
							submitText: t("common.save"),
							resetText: t("common.reset"),
						},
						submitButtonProps: { disabled: !isDirty || hasErrors },
						resetButtonProps: { disabled: !isDirty, onClick: () => setIsDirty(false) },
					}}
					requiredMark
				>
					<Row gutter={48}>
						{/* Left Column: Profile Picture Visuals */}
						<Col xs={24} md={8} className="flex flex-col items-center mb-10 md:mb-0">
							<div className="text-center w-full">
								<Text type="secondary" className="block mb-4 text-[13px] font-medium uppercase tracking-wider">
									{t("personal-center.avatar")}
								</Text>
								<div className="relative group inline-block">
									<Form.Item
										name="avatar"
										className="mb-0"
									>
										<FormAvatarItem />
									</Form.Item>
								</div>
								<div className="mt-6 px-4">
									<Title level={5} className="mb-1">{currentUser.fullName}</Title>
									<Text type="secondary">{currentUser.workEmail}</Text>
								</div>
							</div>
						</Col>

						{/* Right Column: Detailed Form Fields */}
						<Col xs={24} md={16}>
							<Row gutter={[16, 0]}>
								<Col span={24}>
									<Form.Item
										name="fullName"
										label={t("personal-center.fullName")}
										required
										rules={[
											{
												validator: (_: unknown, value: string) => {
													const v = (value ?? "").trim();
													if (!v)
														return Promise.reject(new Error(t("personal-center.fullNameRequired")));
													if (v.length > 255)
														return Promise.reject(new Error(t("personal-center.fullNameMaxLength")));
													if (!/^\p{L}+(?:\s\p{L}+)*$/u.test(v))
														return Promise.reject(new Error(t("personal-center.fullNameInvalidFormat")));
													return Promise.resolve();
												},
											},
										]}
									>
										<TrimInput placeholder={t("personal-center.fullName")} />
									</Form.Item>
								</Col>
								<Col xs={24} lg={12}>
									<ProFormText
										name="loginName"
										label={t("personal-center.loginName")}
										disabled
										placeholder={t("personal-center.loginName")}
									/>
								</Col>
								<Col xs={24} lg={12}>
									<ProFormText
										name={["department", "name"]}
										label={t("system.dept.name")}
										disabled
									/>
								</Col>
								<Col xs={24} lg={12}>
									<ProFormText
										name="workEmail"
										label={t("personal-center.email")}
										rules={[{ type: "email", message: t("personal-center.pleaseInputEmail") }]}
										placeholder={t("personal-center.email")}
									/>
								</Col>
								<Col xs={24} lg={12}>
									<ProFormText
										name="phoneNumber"
										label={t("personal-center.phoneNumber")}
										rules={[
											{
												validator: (_: unknown, value: string) => {
													if (!value || value.trim() === "")
														return Promise.resolve();
													if (!VIETNAMESE_MOBILE_REGEXP.test(value.trim()))
														return Promise.reject(new Error(t("personal-center.pleaseInputValidPhoneNumber")));
													return Promise.resolve();
												},
											},
										]}
										fieldProps={{
											type: "tel",
											allowClear: true,
											placeholder: t("personal-center.phoneNumber"),
										}}
									/>
								</Col>
								<Col span={24}>
									<Form.Item
										name="description"
										label={t("personal-center.description")}
										rules={[
											{
												validator: (_: unknown, value: string) => {
													if (!value || value.trim().length <= 1000)
														return Promise.resolve();
													return Promise.reject(new Error(t("personal-center.descriptionMaxLength")));
												},
											},
										]}
									>
										<TrimTextArea
											allowClear
											placeholder={t("personal-center.descriptionPlaceholder")}
											autoSize={{ minRows: 3, maxRows: 6 }}
										/>
									</Form.Item>
								</Col>
							</Row>
						</Col>
					</Row>
				</ProForm>
			</Card>
		</BasicContent>
	);
};
