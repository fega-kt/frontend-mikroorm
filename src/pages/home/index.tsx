import type { BannerPetRef } from "./components/banner-pet";
import type { ApprovalResult } from "./components/pending-approvals";
import type { PendingApproval } from "./mock";

import { BasicContent } from "#src/components/basic-content";
import { App } from "antd";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ApprovalActivityCard } from "./components/approval-activity";

import { AvgApprovalTime } from "./components/avg-approval-time";
import { DelegationCard } from "./components/delegation-card";
import { GreetingBanner } from "./components/greeting-banner";
import { KpiCards } from "./components/kpi-cards";
import { MyRequests } from "./components/my-requests";
import { PendingApprovals } from "./components/pending-approvals";
import { WAIT_WARNING_HOURS } from "./constants";
import { MOCK_ACTIVITIES, MOCK_DELEGATION, MOCK_MY_REQUESTS, MOCK_PENDING, MOCK_STATS, RequestStatus } from "./mock";

dayjs.extend(relativeTime);

export default function Home() {
	const { t } = useTranslation();
	const { message } = App.useApp();
	// Kết quả duyệt tại chỗ — dữ liệu giả nên chỉ lưu ở state
	const [results, setResults] = useState<Record<string, ApprovalResult>>({});
	const petRef = useRef<BannerPetRef>(null);

	const openPending = MOCK_PENDING.filter(item => !results[item.id]);
	const overdueCount = openPending.filter(item => dayjs().diff(item.createdAt, "hour") >= WAIT_WARNING_HOURS).length;
	const myInProgressCount = MOCK_MY_REQUESTS.filter(item => item.status === RequestStatus.Pending).length;
	const returnedCount = MOCK_MY_REQUESTS.filter(item => item.status === RequestStatus.Returned).length;

	// TODO: gọi API duyệt/từ chối của module phê duyệt khi nối API
	const handleAction = (item: PendingApproval, result: ApprovalResult) => {
		setResults(prev => ({ ...prev, [item.id]: result }));
		if (result === "approved") {
			const remaining = MOCK_PENDING.filter(pending => pending.id !== item.id && !results[pending.id]).length;
			petRef.current?.celebrate(remaining === 0);
		}
		else {
			petRef.current?.sadden();
		}
		message.success(t(result === "approved" ? "home.pending.approvedMsg" : "home.pending.rejectedMsg", { title: item.title }));
	};

	return (
		<BasicContent>
			<div className="flex flex-col gap-5">
				<GreetingBanner
					pendingCount={openPending.length}
					overdueCount={overdueCount}
					returnedCount={returnedCount}
					petRef={petRef}
				/>

				<KpiCards
					pendingCount={openPending.length}
					overdueCount={overdueCount}
					myInProgressCount={myInProgressCount}
					returnedCount={returnedCount}
					approvedThisMonth={MOCK_STATS.approvedThisMonth}
					approvedLastMonth={MOCK_STATS.approvedLastMonth}
					approvalRate={MOCK_STATS.approvalRate}
					rejectedThisMonth={MOCK_STATS.rejectedThisMonth}
					returnedThisMonth={MOCK_STATS.returnedThisMonth}
				/>

				{/* Lưới 2:1 — mỗi hàng 2 ô cao bằng nhau */}
				<section className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
					<PendingApprovals items={MOCK_PENDING} results={results} onAction={handleAction} />
					<div className="flex min-w-0 flex-col gap-4">
						<DelegationCard outgoing={MOCK_DELEGATION.outgoing} incoming={MOCK_DELEGATION.incoming} />
						<AvgApprovalTime avgDays={MOCK_STATS.avgDaysPerStep} deltaDays={MOCK_STATS.avgDaysDelta} byType={MOCK_STATS.avgByType} />
					</div>
					<MyRequests items={MOCK_MY_REQUESTS} />
					<ApprovalActivityCard items={MOCK_ACTIVITIES} />
				</section>
			</div>
		</BasicContent>
	);
}
