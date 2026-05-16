import { BasicButton } from "#src/components/basic-button";

import { MailOutlined } from "@ant-design/icons";
import { Result } from "antd";
import { use } from "react";
import { useTranslation } from "react-i18next";

import { FormModeContext } from "../form-mode-context";

export function RegisterPassword() {
	const { t } = useTranslation();
	const { setFormMode } = use(FormModeContext);

	return (
		<Result
			icon={<MailOutlined className="text-primary" />}
			title={t("authority.registerContactAdminTitle")}
			subTitle={t("authority.registerContactAdmin")}
			extra={(
				<BasicButton
					type="link"
					onPointerDown={() => setFormMode("login")}
				>
					{t("authority.goToLogin")}
				</BasicButton>
			)}
		/>
	);
}
