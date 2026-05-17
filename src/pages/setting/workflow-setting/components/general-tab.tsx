import type { CategoryEntity } from "#src/api/setting/category";
import type { WorkflowSettingEntity } from "#src/api/setting/workflow-setting";
import type { FormInstance } from "antd";
import { categoryService } from "#src/api/setting/category";
import { WorkflowSettingStatus } from "#src/api/setting/workflow-setting";
import { ProFormApiSelect } from "#src/components/api-select";
import { SectionCard } from "#src/components/section-card";
import { ProFormStaticSelect } from "#src/components/static-select";
import { InfoCircleOutlined } from "@ant-design/icons";
import { ProForm, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";

interface GeneralTabProps {
	form: FormInstance<WorkflowSettingEntity>
	onFinish: () => Promise<void>
}

export function GeneralTab({ form, onFinish }: GeneralTabProps) {
	const { t } = useTranslation();

	return (
		<SectionCard icon={<InfoCircleOutlined />} title={t("setting.workflowSetting.basicInfo")}>
			<ProForm form={form} layout="vertical" submitter={false} onFinish={onFinish}>
				<div className="grid grid-cols-2 gap-x-4">
					<ProFormApiSelect<CategoryEntity>
						name="category"
						label={t("setting.workflowSetting.category")}
						rules={[{ required: true }]}
						fetcher={async (keyword) => {
							const res = await categoryService.fetchCategoryList({ limit: 50, keyword });
							return res.data ?? [];
						}}
						fieldProps={{ placeholder: t("common.pleaseSelect") }}
					/>
					<ProFormStaticSelect
						name="status"
						label={t("setting.workflowSetting.status")}
						rules={[{ required: true }]}
						initialValue={WorkflowSettingStatus.Draft}
						options={Object.values(WorkflowSettingStatus).map(s => ({
							label: t(`setting.workflowSetting.statusOptions.${s}`),
							value: s,
						}))}
					/>
				</div>

				<ProFormText
					name="name"
					label={t("setting.workflowSetting.name")}
					placeholder={t("common.pleaseInput")}
					rules={[{ required: true }, { max: 255 }]}
				/>

				<ProFormTextArea
					name="description"
					label={t("setting.workflowSetting.description")}
					placeholder={t("common.pleaseInput")}
					fieldProps={{ rows: 3 }}
					rules={[{ max: 500 }]}
				/>
			</ProForm>
		</SectionCard>
	);
}
