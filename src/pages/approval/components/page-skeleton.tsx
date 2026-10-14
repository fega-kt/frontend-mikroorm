import { BasicContent } from "#src/components/basic-content";
import { Skeleton, theme } from "antd";

function CardSkeleton({ rows = 3 }: { rows?: number }) {
	const { token } = theme.useToken();
	return (
		<section
			className="p-5"
			style={{ background: token.colorBgContainer, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadiusLG }}
		>
			<Skeleton.Input active size="small" style={{ width: 180 }} />
			<Skeleton active title={false} paragraph={{ rows, width: ["100%", "85%", "60%", "75%"] }} className="mt-4" />
		</section>
	);
}

/** Khung chờ của trang chi tiết tờ trình: header, tab con, các card nội dung */
export function RequestDetailSkeleton() {
	return (
		<BasicContent>
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="flex flex-col gap-2">
						<Skeleton.Input active style={{ width: 280, height: 28 }} />
						<Skeleton.Input active size="small" style={{ width: 200 }} />
					</div>
					<div className="flex gap-2">
						<Skeleton.Button active />
						<Skeleton.Button active />
					</div>
				</div>
				<div className="flex gap-4">
					{[0, 1, 2, 3].map(i => <Skeleton.Button key={i} active size="small" style={{ width: 96 }} />)}
				</div>
				<div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
					<div className="flex flex-col gap-4">
						<CardSkeleton rows={3} />
						<CardSkeleton rows={4} />
					</div>
					<CardSkeleton rows={5} />
				</div>
			</div>
		</BasicContent>
	);
}

/** Khung chờ của form tờ trình: tiêu đề + cột form bên trái + cột luồng bên phải */
export function RequestFormSkeleton() {
	return (
		<BasicContent>
			<div className="mx-auto flex max-w-[1280px] flex-col gap-5">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex flex-col gap-2">
						<Skeleton.Input active style={{ width: 220, height: 28 }} />
						<Skeleton.Input active size="small" style={{ width: 160 }} />
					</div>
					<div className="flex gap-2">
						<Skeleton.Button active />
						<Skeleton.Button active />
						<Skeleton.Button active />
					</div>
				</div>
				<div className="flex flex-wrap items-start gap-5">
					<div className="flex min-w-0 flex-col gap-5" style={{ flex: "999 1 560px" }}>
						<CardSkeleton rows={4} />
						<CardSkeleton rows={3} />
					</div>
					<aside className="flex min-w-0 flex-col gap-5" style={{ flex: "1 1 320px", maxWidth: 380 }}>
						<CardSkeleton rows={4} />
						<CardSkeleton rows={3} />
					</aside>
				</div>
			</div>
		</BasicContent>
	);
}
