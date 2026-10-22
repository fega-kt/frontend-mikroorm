import { BasicContent } from "#src/components/basic-content";
import { Skeleton, theme } from "antd";

function useBox() {
	const { token } = theme.useToken();
	return {
		token,
		box: {
			background: token.colorBgContainer,
			border: `1px solid ${token.colorBorderSecondary}`,
			borderRadius: token.borderRadiusLG * 1.5,
		},
	};
}

/** Card có tiêu đề + các dòng icon, 2 dòng chữ, nút bên phải (chờ duyệt, tờ trình của tôi) */
function ListCard({ rows }: { rows: number }) {
	const { token, box } = useBox();
	return (
		<div style={box}>
			<div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${token.colorSplit}` }}>
				<Skeleton.Input active size="small" style={{ width: 160 }} />
				<Skeleton.Input active size="small" style={{ width: 100, height: 14 }} />
			</div>
			{Array.from({ length: rows }, (_, row) => (
				<div key={row} className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: `1px solid ${token.colorSplit}` }}>
					<Skeleton.Avatar active shape="square" size={38} />
					<div className="flex min-w-0 flex-1 flex-col gap-2">
						<Skeleton.Input active size="small" style={{ width: "70%", minWidth: 0 }} />
						<Skeleton.Input active size="small" style={{ width: "40%", minWidth: 0, height: 12 }} />
					</div>
					<Skeleton.Button active size="small" style={{ width: 88 }} />
				</div>
			))}
			<div className="flex justify-center py-3">
				<Skeleton.Input active size="small" style={{ width: 100, height: 14 }} />
			</div>
		</div>
	);
}

/** Card có tiêu đề + đoạn nội dung (ủy quyền, thời gian duyệt, hoạt động) */
function SideCard({ rows, grow }: { rows: number, grow?: boolean }) {
	const { token, box } = useBox();
	return (
		<div className={grow ? "flex-1" : undefined} style={box}>
			<div className="px-5 py-4" style={{ borderBottom: `1px solid ${token.colorSplit}` }}>
				<Skeleton.Input active size="small" style={{ width: 140 }} />
			</div>
			<div className="px-5 py-4">
				<Skeleton active avatar={{ size: 28 }} title={false} paragraph={{ rows }} />
			</div>
		</div>
	);
}

/** Khung chờ trang chủ: lời chào, 4 ô KPI, lưới 2:1 các card */
export default function HomeLoading() {
	const { box } = useBox();
	return (
		<BasicContent>
			<div className="flex flex-col gap-5">
				<div className="flex flex-wrap items-start justify-between gap-6 px-7 pb-[72px] pt-6" style={box}>
					<div className="flex items-center gap-4">
						<Skeleton.Avatar active size={60} />
						<div className="flex flex-col gap-2">
							<Skeleton.Input active size="small" style={{ width: 140, height: 14 }} />
							<Skeleton.Input active style={{ width: 280, height: 30 }} />
							<div className="flex gap-2">
								{[96, 110, 90].map(width => <Skeleton.Button key={width} active size="small" shape="round" style={{ width }} />)}
							</div>
						</div>
					</div>
					<Skeleton.Button active size="large" style={{ width: 140 }} />
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{[0, 1, 2, 3].map(i => (
						<div key={i} className="flex flex-col gap-3 px-5 py-[18px]" style={box}>
							<div className="flex items-center justify-between">
								<Skeleton.Input active size="small" style={{ width: 100 }} />
								<Skeleton.Avatar active shape="square" size={36} />
							</div>
							<Skeleton.Input active style={{ width: 80, height: 30 }} />
							<Skeleton.Input active size="small" style={{ width: 140, height: 12 }} />
						</div>
					))}
				</div>

				<div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
					<ListCard rows={5} />
					<div className="flex flex-col gap-4">
						<SideCard rows={2} />
						<SideCard rows={4} grow />
					</div>
					<ListCard rows={4} />
					<SideCard rows={6} />
				</div>
			</div>
		</BasicContent>
	);
}
