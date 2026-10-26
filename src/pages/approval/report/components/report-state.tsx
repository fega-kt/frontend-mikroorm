import { Alert, Skeleton } from "antd";
import { useTranslation } from "react-i18next";

/** Đang tải lần đầu → khung xương; lỗi → thông báo (vd chọn phòng ban ngoài phạm vi được xem); có dữ liệu → nội dung */
export function ReportState({ loading, error, hasData, children }: { loading: boolean, error: unknown, hasData: boolean, children: React.ReactNode }) {
	const { t } = useTranslation();
	if (error)
		return <Alert type="error" showIcon title={t("approval.report.loadFailed")} />;
	if (loading && !hasData)
		return <Skeleton active paragraph={{ rows: 8 }} />;
	return <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity .2s" }}>{children}</div>;
}
