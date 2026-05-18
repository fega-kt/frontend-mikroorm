import { BasicContent } from "#src/components/basic-content";
import { useTranslation } from "react-i18next";

export default function Settings() {
	const { t } = useTranslation();
	return (
		<BasicContent className="flex items-center justify-center">
			<span className="text-gray-400 text-base">{t("common.featureUpdating")}</span>
		</BasicContent>
	);
}
