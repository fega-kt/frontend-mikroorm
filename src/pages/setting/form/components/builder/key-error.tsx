import { Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Text, Link } = Typography;

/** Lỗi mã trường / mã cột kèm gợi ý bấm được (người dùng tự quyết có dùng mã gợi ý không) */
export function KeyError({ message, suggestion, onApply }: { message: string, suggestion?: string, onApply: (key: string) => void }) {
	const { t } = useTranslation();
	return (
		<Text type="danger" className="text-xs">
			{message}
			{suggestion && (
				<>
					{" · "}
					<Link className="text-xs" onClick={() => onApply(suggestion)}>
						{t("approval.formSchema.keySuggest")}
						{" "}
						<code>{suggestion}</code>
					</Link>
				</>
			)}
		</Text>
	);
}
