import type { CategoryEntity } from "#src/api/setting/category";
import type { FormEntity } from "#src/api/setting/form";
import type { RequestTypeEntity } from "#src/api/setting/request-type";
import type { FormInstance } from "antd";
import { categoryService } from "#src/api/setting/category";
import { formService } from "#src/api/setting/form";
import { RequestTypeStatus } from "#src/api/setting/request-type";
import { ProFormApiSelect } from "#src/components/api-select";
import { SectionCard } from "#src/components/section-card";
import { ProFormStaticSelect } from "#src/components/static-select";
import { InfoCircleOutlined } from "@ant-design/icons";
import { ProForm, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { useTranslation } from "react-i18next";

interface GeneralTabProps {
	form: FormInstance<RequestTypeEntity>
	onFinish: (values: RequestTypeEntity) => Promise<void>
}

export function GeneralTab({ form, onFinish }: GeneralTabProps) {
	const { t } = useTranslation();

	return (
		<SectionCard icon={<InfoCircleOutlined />} title={t("setting.requestType.basicInfo")}>
			<ProForm form={form} layout="vertical" submitter={false} onFinish={onFinish}>
				<div className="grid grid-cols-2 gap-x-4">
					<ProFormApiSelect<CategoryEntity>
						name="category"
						label={t("setting.requestType.category")}
						rules={[{ required: true }]}
						fetcher={async (keyword) => {
							const res = await categoryService.fetchCategoryList({ limit: 50, keyword });
							return res.data ?? [];
						}}
						fieldProps={{ placeholder: t("common.pleaseSelect") }}
					/>
					<ProFormStaticSelect
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

				<ProFormApiSelect<FormEntity>
					name="form"
					label={t("setting.requestType.form")}
					extra={t("setting.requestType.formHint")}
					rules={[{ required: true }]}
					fetcher={async (keyword) => {
						// Danh sách rút gọn chỉ có id / mã / tên — đủ cho ô chọn (backend trả bản rút gọn, không kèm các trường audit)
						const options = (await formService.fetchFormOptions()) as FormEntity[];
						const key = keyword?.trim().toLowerCase();
						return key ? options.filter(o => o.name.toLowerCase().includes(key) || o.code.toLowerCase().includes(key)) : options;
					}}
					fieldProps={{ placeholder: t("common.pleaseSelect") }}
				/>

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
