import type { RequestTypeEntity } from "#src/api/setting/request-type";
import type { FormInstance } from "antd";
import { categoryService } from "#src/api/setting/category";
import { RequestTypeStatus } from "#src/api/setting/request-type";
import { SectionCard } from "#src/components/section-card";
import { InfoCircleOutlined } from "@ant-design/icons";
import { ProForm, ProFormSelect, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";

interface GeneralTabProps {
	form: FormInstance<RequestTypeEntity>
	loading: boolean
	onFinish: (values: RequestTypeEntity) => Promise<void>
}

export function GeneralTab({ form, loading, onFinish }: GeneralTabProps) {
	const { t } = useTranslation();

	return (
		<SectionCard icon={<InfoCircleOutlined />} title={t("setting.requestType.basicInfo")}>
			<ProForm form={form} layout="vertical" submitter={false} onFinish={onFinish} loading={loading}>
				<div className="grid grid-cols-2 gap-x-4">
					<ProFormSelect
						name="category"
						label={t("setting.requestType.category")}
						rules={[{ required: true }]}
						fieldProps={{ placeholder: t("common.pleaseSelect"), showSearch: true }}
						request={async () => {
							const res = await categoryService.fetchCategoryList({ limit: 10 });
							return (res.data ?? []).map(c => ({ label: c.name, value: c.id }));
						}}
					/>
					<ProFormSelect
						name="status"
						label={t("setting.requestType.status")}
						rules={[{ required: true }]}
						initialValue={RequestTypeStatus.Draft}
						options={Object.values(RequestTypeStatus).map(s => ({
							label: t(`setting.requestType.statusOptions.${s}`),
							value: s,
						}))}
					/>
				</div>

				<div className="grid grid-cols-2 gap-x-4">
					<ProFormText
						name="code"
						label={t("setting.requestType.code")}
						placeholder={t("common.pleaseInput")}
						normalize={v => v?.toUpperCase()}
						rules={[
							{ required: true },
							{ min: 2 },
							{ max: 50 },
							{ pattern: /^[A-Z0-9_]+$/, message: t("setting.requestType.codePattern") },
						]}
					/>
					<ProFormText
						name="prefix"
						label={t("setting.requestType.prefix")}
						placeholder={t("common.pleaseInput")}
						normalize={v => v?.toUpperCase()}
						rules={[
							{ required: true },
							{ max: 10 },
							{ pattern: /^[A-Z0-9]+$/, message: t("setting.requestType.prefixPattern") },
						]}
					/>
				</div>

				<ProFormText
					name="name"
					label={t("setting.requestType.name")}
					placeholder={t("common.pleaseInput")}
					rules={[{ required: true }, { max: 255 }]}
				/>

				<ProFormTextArea
					name="description"
					label={t("setting.requestType.description")}
					placeholder={t("common.pleaseInput")}
					fieldProps={{ rows: 3 }}
					rules={[{ max: 500 }]}
				/>
			</ProForm>
		</SectionCard>
	);
}
