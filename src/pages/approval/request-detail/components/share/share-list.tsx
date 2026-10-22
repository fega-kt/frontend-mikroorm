import type { ApprovalShareItem } from "#src/api/approval-request";
import { PrincipalPicker } from "#src/components/principal-picker";
import { CloseOutlined, MessageOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Popover, Typography } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { DATE_TIME_FORMAT } from "../../../lib/payload";
import { ShareDetail } from "./share-detail";

const { Text } = Typography;

interface ShareListProps {
	shares: ApprovalShareItem[]
	/** Có quyền thu hồi chia sẻ */
	canRemove: boolean
	onRemove: (share: ApprovalShareItem) => void
}

/** Danh sách người / nhóm đã được chia sẻ tờ trình */
export function ShareList({ shares, canRemove, onRemove }: ShareListProps) {
	const { t } = useTranslation();

	if (!shares.length)
		return <div className="py-2 text-center"><Text type="secondary">{t("approval.share.empty")}</Text></div>;

	return (
		<ul className="m-0 flex list-none flex-col gap-3 p-0">
			{shares.map((share) => {
				return (
					<li key={share.id} className="flex items-start gap-2">
						<PrincipalPicker
							readonly
							principal={share.principal}
							avatarSize={28}
							className="!min-h-0 min-w-0 flex-1"
							description={(
								<Popover content={<ShareDetail share={share} />} placement="topLeft" mouseEnterDelay={0.3}>
									<span>
										{[t("approval.share.sharedBy", { name: share.sharedBy.fullName }), dayjs(share.createdAt).format(DATE_TIME_FORMAT)].join(" · ")}
										{/* Có lời nhắn: hiện biểu tượng, chi tiết xem ở popover khi rê chuột */}
										{share.message && <MessageOutlined className="ml-1.5" />}
									</span>
								</Popover>
							)}
						/>
						{canRemove && (
							<Popconfirm
								title={t("approval.share.confirmRemove")}
								okText={t("common.confirm")}
								cancelText={t("common.cancel")}
								onConfirm={() => onRemove(share)}
							>
								<Button type="text" size="small" icon={<CloseOutlined />} />
							</Popconfirm>
						)}
					</li>
				);
			})}
		</ul>
	);
}
