import type { ActionModalRef } from "#src/pages/approval/components/action-modal";
import type { BannerPetRef } from "./components/banner-pet";
import type { ApprovalResult } from "./components/pending-approvals";
import type { PendingApproval } from "./mock";

import { approvalTaskService } from "#src/api/approval-task";
import { BasicContent } from "#src/components/basic-content";
import { ActionModal } from "#src/pages/approval/components/action-modal";
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
import { MOCK_ACTIVITIES, MOCK_STATS, RequestStatus } from "./mock";
import { useApprovalDashboard } from "./use-approval-dashboard";

dayjs.extend(relativeTime);

export default function Home() {
	const { t } = useTranslation();
	const { message } = App.useApp();
	// Kết quả duyệt tại chỗ — hiện ngay trên dòng, danh sách tải lại sau đó
	const [results, setResults] = useState<Record<string, ApprovalResult>>({});
	const petRef = useRef<BannerPetRef>(null);
	const actionModalRef = useRef<ActionModalRef>(null);
	const { stats, pending, myRequests, delegation, reload } = useApprovalDashboard();

	const openPending = pending.filter(item => !results[item.id]);
	const overdueCount = openPending.filter(item => (item.dueAt ? dayjs(item.dueAt).isBefore(dayjs()) : dayjs().diff(item.createdAt, "hour") >= WAIT_WARNING_HOURS)).length;
	const myInProgressCount = myRequests.filter(item => item.status === RequestStatus.Pending).length;
	const returnedCount = myRequests.filter(item => item.status === RequestStatus.Returned).length;

	const handleAction = async (item: PendingApproval, result: ApprovalResult) => {
		let comment: string | undefined;
		if (result === "rejected") {
			const input = await actionModalRef.current?.open("reject", { requireComment: true });
			if (!input)
				return;
			comment = input.comment;
		}
		try {
			await approvalTaskService.fetchAct(item.id, result === "approved" ? "approve" : "reject", comment);
		}
		catch {
			return;
		}
		setResults(prev => ({ ...prev, [item.id]: result }));
		if (result === "approved")
			petRef.current?.celebrate(openPending.length <= 1);
		else
			petRef.current?.sadden();
		message.success(t(result === "approved" ? "home.pending.approvedMsg" : "home.pending.rejectedMsg", { title: item.title }));
		reload().then(() => setResults({}));
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
					approvedThisMonth={stats.approvedThisMonth}
					approvedLastMonth={stats.approvedLastMonth}
					approvalRate={stats.approvalRate}
					rejectedThisMonth={stats.rejectedThisMonth}
					returnedThisMonth={stats.returnedThisMonth}
				/>

				{/* Lưới 2:1 — mỗi hàng 2 ô cao bằng nhau */}
				<section className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
					<PendingApprovals items={pending} results={results} onAction={handleAction} />
					<div className="flex min-w-0 flex-col gap-4">
						<DelegationCard outgoing={delegation.outgoing} incoming={delegation.incoming} />
						<AvgApprovalTime avgDays={MOCK_STATS.avgDaysPerStep} deltaDays={MOCK_STATS.avgDaysDelta} byType={MOCK_STATS.avgByType} />
					</div>
					<MyRequests items={myRequests} />
					<ApprovalActivityCard items={MOCK_ACTIVITIES} />
				</section>
			</div>
			<ActionModal ref={actionModalRef} />
		</BasicContent>
	);
}
