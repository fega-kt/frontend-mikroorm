import { SectionCard } from "#src/components/section-card";
import { Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export function FormDocTab() {
	const { t } = useTranslation();
	return (
		<SectionCard title={t("setting.requestType.tabs.formDoc")}>
			<div className="text-center py-8">
				<Text type="secondary">{t("common.noData")}</Text>
			</div>
		</SectionCard>
	);
}
