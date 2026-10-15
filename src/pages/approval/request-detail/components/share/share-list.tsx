import type { ApprovalShareItem } from "#src/api/approval-request";
import { PrincipalType } from "#src/api/system/principal";
import { UserAvatar } from "#src/components/user-avatar";
import { CloseOutlined, MessageOutlined, TeamOutlined } from "@ant-design/icons";
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
				const { principal } = share;
				const isGroup = principal.type === PrincipalType.Group;
				return (
					<li key={share.id} className="flex items-start gap-2.5">
						<UserAvatar
							size={28}
							user={{ id: principal.id, fullName: principal.name, avatar: isGroup ? undefined : principal.user?.avatar }}
							fallbackIcon={isGroup ? <TeamOutlined className="text-[14px]" /> : undefined}
						/>
						<Popover content={<ShareDetail share={share} />} placement="topLeft" mouseEnterDelay={0.3}>
							<div className="flex min-w-0 flex-1 flex-col">
								<Text strong ellipsis>
									{principal.name}
									{isGroup && <Text type="secondary" className="ml-1.5 font-normal">{`· ${t("approval.share.group")}`}</Text>}
								</Text>
								<Text type="secondary" className="text-xs" ellipsis>
									{[t("approval.share.sharedBy", { name: share.sharedBy.fullName }), dayjs(share.createdAt).format(DATE_TIME_FORMAT)].join(" · ")}
									{/* Có lời nhắn: hiện biểu tượng, chi tiết xem ở popover khi rê chuột */}
									{share.message && <MessageOutlined className="ml-1.5" />}
								</Text>
							</div>
						</Popover>
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
