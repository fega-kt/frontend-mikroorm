import type { ApprovalHistoryItem, ApprovalRequestDetail } from "#src/api/approval-request";
import { ApprovalRequestStatus } from "#src/api/approval-request";
import { RollbackOutlined } from "@ant-design/icons";
import { Tag, theme, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTranslation } from "react-i18next";

dayjs.extend(relativeTime);

const { Text } = Typography;

const formatTime = (value?: string) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "—");

/** Ngày tạo và cập nhật coi là trùng nếu cách nhau dưới 1 phút (lưu ngay sau khi tạo) */
const SAME_TIME_MS = 60_000;

/** Tờ trình bị trả lại: ai trả, ở bước nào, lúc nào, ý kiến — nằm đầu khối Thông tin chung để sửa theo đó */
export function ReturnedNotice({ item }: { item: ApprovalHistoryItem }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const who = [item.actor?.fullName, item.nodeName, formatTime(item.createdAt)].filter(Boolean).join(" · ");
	return (
		<div
			className="flex gap-3 rounded-lg p-4"
			style={{ background: token.colorWarningBg, border: `1px solid ${token.colorWarningBorder}` }}
		>
			<RollbackOutlined className="mt-0.5 text-lg" style={{ color: token.colorWarning }} />
			<div className="flex min-w-0 flex-1 flex-col gap-1.5">
				<Text strong style={{ color: token.colorWarningText }}>{t("approval.form.returnedTitle")}</Text>
				<Text type="secondary" className="text-[13px]">{who}</Text>
				{item.comment && (
					<blockquote
						className="m-0 mt-1 whitespace-pre-wrap rounded-md px-3 py-2"
						style={{ background: token.colorBgContainer, color: token.colorText }}
					>
						{item.comment}
					</blockquote>
				)}
				<Text type="secondary" className="text-xs">{t("approval.form.returnedHint")}</Text>
			</div>
		</div>
	);
}

/**
 * Dòng phụ dưới tiêu đề trang: trạng thái · mã (chưa có = sinh khi gửi) · ngày tạo · cập nhật (tương đối, hover xem giờ đầy đủ).
 * Tờ trình mới chỉ có trạng thái nháp + gợi ý mã; cập nhật trùng ngày tạo thì không hiện.
 */
export function RequestHeaderMeta({ request }: { request?: ApprovalRequestDetail }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const status = request?.status ?? ApprovalRequestStatus.Draft;
	const updated = !!request && Math.abs(dayjs(request.updatedAt).diff(request.createdAt)) >= SAME_TIME_MS;
	const dot = <span aria-hidden="true">·</span>;
	return (
		<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]" style={{ color: token.colorTextSecondary }}>
			<Tag bordered={false} color={status === ApprovalRequestStatus.Returned ? "warning" : undefined} className="m-0">
				{t(`approval.status.${status}`)}
			</Tag>
			{request?.code
				? <Text copyable className="font-mono text-[13px]">{request.code}</Text>
				: <span>{t("approval.form.codeHint")}</span>}
			{request && (
				<>
					{dot}
					<span>{t("approval.form.createdAtShort", { time: formatTime(request.createdAt) })}</span>
					{updated && (
						<>
							{dot}
							<Tooltip title={formatTime(request.updatedAt)}>
								<span className="cursor-help" tabIndex={0}>{t("approval.form.updatedAtShort", { time: dayjs(request.updatedAt).fromNow() })}</span>
							</Tooltip>
						</>
					)}
				</>
			)}
		</div>
	);
}
