import { BasicContent } from "#src/components/basic-content";
import { Skeleton, theme } from "antd";

const COLUMN_WIDTHS = ["22%", "18%", "16%", "14%", "12%"];
const ROW_COUNT = 10;
/** Cao đúng một dòng của antd Table: padding 16 + 16, chữ 22, viền dưới 1 */
const ROW_HEIGHT = 55;
const TEXT_HEIGHT = 22;

/** Khung chờ khi tải chunk của trang lazy: dựng lại bố cục trang danh sách (ô lọc + bảng) để chuyển sang trang thật không bị nhảy */
export function PageLoading() {
	const { token } = theme.useToken();
	const card = {
		background: token.colorBgContainer,
		border: `1px solid ${token.colorBorderSecondary}`,
		borderRadius: token.borderRadiusLG,
	};
	const rowBorder = `1px solid ${token.colorSplit}`;
	const bar = (width: string | number): React.CSSProperties => ({ width, minWidth: 0, height: TEXT_HEIGHT });

	return (
		<BasicContent className="h-full">
			<div className="flex flex-col gap-4">
				{/* Ô tìm kiếm: padding 24, input cao 32 */}
				<div className="flex flex-wrap items-center gap-4 p-6" style={card}>
					<Skeleton.Input active style={{ width: 240 }} />
					<Skeleton.Input active style={{ width: 240 }} />
					<div className="ml-auto flex gap-2">
						<Skeleton.Button active style={{ width: 72 }} />
						<Skeleton.Button active style={{ width: 88 }} />
					</div>
				</div>

				{/* Bảng: toolbar padding-block 16, cột bảng inset 24 hai bên như ProTable */}
				<div className="px-6" style={card}>
					<div className="flex items-center justify-between py-4">
						<Skeleton.Input active style={{ width: 160, minWidth: 0 }} />
						<Skeleton.Button active style={{ width: 96 }} />
					</div>

					<div style={{ borderRadius: token.borderRadius, overflow: "hidden" }}>
						<div
							className="flex items-center gap-4 px-4"
							style={{ height: ROW_HEIGHT, background: token.colorFillAlter, borderBottom: rowBorder }}
						>
							{COLUMN_WIDTHS.map(width => (
								<div key={width} style={{ width }}>
									<Skeleton.Input active style={bar("55%")} />
								</div>
							))}
						</div>

						{Array.from({ length: ROW_COUNT }, (_, row) => (
							<div
								key={row}
								className="flex items-center gap-4 px-4"
								style={{ height: ROW_HEIGHT, borderBottom: rowBorder }}
							>
								{COLUMN_WIDTHS.map((width, col) => (
									<div key={width} style={{ width }}>
										{/* Độ dài lệch nhau để trông như dữ liệu thật */}
										<Skeleton.Input active style={bar(`${55 + ((row * 3 + col * 5) % 5) * 9}%`)} />
									</div>
								))}
							</div>
						))}
					</div>

					{/* Phân trang: cách bảng 16, nút cao 32 */}
					<div className="flex justify-end py-4">
						<Skeleton.Button active style={{ width: 280 }} />
					</div>
				</div>
			</div>
		</BasicContent>
	);
}
