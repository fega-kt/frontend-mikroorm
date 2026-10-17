import { DownloadOutlined } from "@ant-design/icons";
import { Button, Empty } from "antd";
import { useTranslation } from "react-i18next";

/** Không xem được (lỗi / loại tệp chưa hỗ trợ): báo lý do và cho tải tệp về */
export function ViewFallback({ description, onDownload }: { description: string, onDownload: () => Promise<void> | void }) {
	const { t } = useTranslation();
	return (
		<Empty className="mt-16" description={description}>
			<Button icon={<DownloadOutlined />} onClick={() => onDownload()}>
				{t("common.fileViewer.download")}
			</Button>
		</Empty>
	);
}
