import type { ApprovalShareItem } from "#src/api/approval-request";
import { PeoplePicker } from "#src/components/people-picker";
import { Typography } from "antd";
import dayjs from "dayjs";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

/** Popover chi tiết hiện cả giây để phân biệt các lượt chia sẻ sát nhau */
const DETAIL_TIME_FORMAT = "DD/MM/YYYY HH:mm:ss";

/** Chi tiết một lượt chia sẻ (popover khi rê chuột): ai chia sẻ, lúc nào, lời nhắn */
export function ShareDetail({ share }: { share: ApprovalShareItem }) {
	const { t } = useTranslation();
	const rows = [
		{
			label: t("approval.share.sharedByLabel"),
			value: <PeoplePicker readonly user={share.sharedBy} size="small" showEmail={false} hoverCard={false} className="!min-h-0" />,
		},
		{ label: t("approval.share.sharedAt"), value: dayjs(share.createdAt).format(DETAIL_TIME_FORMAT) },
		{
			label: t("approval.share.message"),
			value: share.message
				? <span className="whitespace-pre-wrap break-words">{share.message}</span>
				: <Text type="secondary">{t("approval.share.noMessage")}</Text>,
		},
	];
	return (
		<dl className="m-0 grid max-w-72 grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[13px]">
			{rows.map(row => (
				<Fragment key={row.label}>
					<dt className="text-xs leading-5" style={{ opacity: 0.55 }}>{`${row.label}:`}</dt>
					<dd className="m-0 min-w-0">{row.value}</dd>
				</Fragment>
			))}
		</dl>
	);
}
