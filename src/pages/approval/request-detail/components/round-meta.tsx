import type { ApprovalRound } from "../../lib/rounds";
import { ApprovalRequestStatus } from "#src/api/approval-request/types";
import { PeoplePicker } from "#src/components/people-picker";
import { ArrowRightOutlined } from "@ant-design/icons";
import { theme, Typography } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { DATE_TIME_FORMAT } from "../../lib/payload";

const { Text } = Typography;

/**
 * Một dòng mô tả vòng phía trên sơ đồ: ai trình, lúc nào → kết thúc lúc nào.
 * Trạng thái vòng nằm ở tab con, người xử lý + lý do xem trong chi tiết bước nên không lặp ở đây.
 */
export function RoundMeta({ round }: { round: ApprovalRound }) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const endColor: Partial<Record<ApprovalRequestStatus, string>> = {
		[ApprovalRequestStatus.Approved]: token.colorSuccess,
		[ApprovalRequestStatus.Rejected]: token.colorError,
		[ApprovalRequestStatus.Returned]: token.colorWarning,
		[ApprovalRequestStatus.Cancelled]: token.magenta6,
	};
	const format = (value: string) => dayjs(value).format(DATE_TIME_FORMAT);

	return (
		<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
			<div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
				{round.submittedBy
					? <PeoplePicker readonly user={round.submittedBy} showEmail={false} avatarSize={20} className="!min-h-0" />
					: <Text strong>—</Text>}
				<Text type="secondary">·</Text>
				<Text type="secondary">
					<span style={{ color: token.colorPrimary }}>{t(round.round > 1 ? "approval.detail.resubmittedAt" : "approval.detail.submittedAt")}</span>
					{round.submittedAt && ` ${format(round.submittedAt)}`}
				</Text>
				{round.end && (
					<>
						<ArrowRightOutlined className="text-xs" style={{ color: token.colorTextQuaternary }} />
						<Text type="secondary">
							<span style={{ color: endColor[round.outcome] }}>{t(`approval.detail.roundEnd.${round.outcome}`)}</span>
							{` ${format(round.end.createdAt)}`}
						</Text>
					</>
				)}
			</div>
			<Text type="secondary" className="text-xs">{t("approval.detail.stepHint")}</Text>
		</div>
	);
}
