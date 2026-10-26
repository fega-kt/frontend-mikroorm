import { BasicContent } from "#src/components/basic-content";
import { Skeleton } from "antd";

/** Khung xương của trang báo cáo: tiêu đề, bộ lọc, hàng chỉ số, hai khối biểu đồ */
export default function ApprovalReportLoading() {
	return (
		<BasicContent>
			<div className="flex flex-col gap-4">
				<Skeleton active title={{ width: 240 }} paragraph={{ rows: 1, width: 420 }} />
				<Skeleton.Input active block style={{ height: 56 }} />
				<div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
					{Array.from({ length: 5 }, (_, i) => <Skeleton.Node key={i} active style={{ width: "100%", height: 104 }} />)}
				</div>
				<div className="grid gap-3 lg:grid-cols-2">
					<Skeleton.Node active style={{ width: "100%", height: 300 }} />
					<Skeleton.Node active style={{ width: "100%", height: 300 }} />
				</div>
			</div>
		</BasicContent>
	);
}
