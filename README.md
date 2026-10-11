<div align="center">
	<a href="https://zhizhu.online">
		<img alt="zhizhu logo" width="120" src="https://pub-07279aa6f8b34608b2a6b442ecd835a9.r2.dev/Logo/logo.svg">
	</a>
	<h1>zhizhu system — Frontend</h1>
	<p>Hệ thống quản lý dự án, công việc và phê duyệt cho đội nhóm</p>
	<p>
		<a href="https://zhizhu.online">zhizhu.online</a>
	</p>
</div>

## Giới thiệu

Frontend của zhizhu system: ứng dụng quản trị nội bộ để quản lý dự án, công việc, sprint và các luồng phê duyệt yêu cầu (nghỉ phép, tạm ứng, mua sắm, công tác…). Xây dựng bằng React 19, Vite, TypeScript và Ant Design 6.

## Tính năng chính

- **Dashboard phê duyệt**: yêu cầu chờ tôi duyệt (duyệt / từ chối ngay trên trang chủ), yêu cầu của tôi kèm tiến trình từng bước, ủy quyền, thời gian duyệt trung bình, hoạt động gần đây
- **Luồng phê duyệt**: thiết kế quy trình bằng BPMN (bpmn-js), loại yêu cầu, ủy quyền duyệt
- **Quản lý dự án**: dự án, công việc (kanban, gantt), sprint, phân bổ nguồn lực, báo cáo
- **Quản trị hệ thống**: người dùng, vai trò, phòng ban, nhóm, menu, nhật ký hoạt động
- **Phân quyền**: phân quyền theo route và theo nút bấm; hỗ trợ route tĩnh ở frontend lẫn route động từ backend
- **Thông báo**: chuông thông báo, đánh dấu đã đọc, cảnh báo đăng nhập trên thiết bị mới
- **Giao diện**: sáng / tối (hiệu ứng chuyển vòng tròn), đổi màu chủ đạo, hệ màu thống nhất giữa Ant Design và Tailwind CSS, tab đa trang có cache (keep-alive)
- **Đa ngôn ngữ**: Tiếng Việt (mặc định), English, 简体中文

## Công nghệ

| Nhóm | Công nghệ |
| --- | --- |
| Nền tảng | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 7](https://vitejs.dev/) |
| Giao diện | [Ant Design 6](https://ant.design/), [ProComponents](https://procomponents.ant.design/), [Tailwind CSS 4](https://tailwindcss.com/), [react-jss](https://cssinjs.org/react-jss) |
| Router & state | [React Router 7](https://reactrouter.com/), [Zustand](https://zustand-demo.pmnd.rs/) |
| Gọi API | [Ky](https://github.com/sindresorhus/ky), [TanStack Query](https://tanstack.com/query) |
| Xác thực | [Supabase Auth](https://supabase.com/docs/guides/auth) |
| Biểu đồ & quy trình | [ECharts](https://echarts.apache.org/), [bpmn-js](https://bpmn.io/toolkit/bpmn-js/) |
| Đa ngôn ngữ | [i18next](https://www.i18next.com/), [react-i18next](https://react.i18next.com/) |
| Chất lượng code | [ESLint](https://eslint.org/) ([@antfu/eslint-config](https://github.com/antfu/eslint-config)), [Vitest](https://vitest.dev/), [commitlint](https://commitlint.js.org/) |

## Bắt đầu

### Yêu cầu

- Node.js 22+
- pnpm 10 (bật qua corepack)

### Cài đặt

```bash
corepack enable
pnpm install
```

### Biến môi trường

Biến môi trường được lấy từ Vault. Ghi ra file `.env` để chạy local:

```bash
pnpm pull:env
```

Hoặc tự tạo `.env` dựa trên [`.env.example`](./.env.example). Các biến chính:

| Biến | Ý nghĩa |
| --- | --- |
| `VITE_API_BASE_URL` | URL API của core service |
| `VITE_API_APP_BASE_URL` | URL API của app service |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Cấu hình Supabase Auth |
| `VITE_GLOB_APP_TITLE` | Tên ứng dụng (tiêu đề tab, banner, link preview) |
| `VITE_GLOB_APP_URL` | Địa chỉ public, không có `/` cuối (dùng cho link preview) |
| `VITE_GLOB_APP_OG_IMAGE_URL` | Ảnh preview khi chia sẻ link (để trống: `<APP_URL>/og-image.png`) |
| `VITE_GLOB_APP_LOGO_URL` | Logo (để trống: dùng logo trong code) |

### Chạy và build

```bash
pnpm dev        # dev server tại http://localhost:3333 (tự lấy env từ Vault)
pnpm build      # build production ra thư mục build/
pnpm preview    # xem thử bản build
```

### Kiểm tra code

```bash
pnpm lint       # ESLint
pnpm lint:fix   # ESLint tự sửa
pnpm typecheck  # kiểm tra kiểu TypeScript
pnpm test       # Vitest
```

## Cấu trúc thư mục

```
src/
├── api/          # Service gọi API, mỗi domain một thư mục (kế thừa CrudServiceBase)
├── components/   # Component dùng chung (basic-table, basic-form, picker…)
├── hooks/        # use-access (phân quyền), use-preferences (theme, ngôn ngữ, layout)
├── layout/       # Khung ứng dụng: header, sidebar, tab bar, widget
├── locales/      # Bản dịch vi-VN / en-US / zh-CN (tự nạp theo tên file)
├── pages/        # Các trang, cấu trúc theo domain như api/
├── router/       # Route (tự nạp từ routes/modules), guard đăng nhập
├── store/        # Zustand store: user, access, tabs, preferences
└── styles/       # CSS toàn cục, theme token
```

Quy ước chi tiết (mẫu module, trang danh sách, modal chi tiết, phân quyền…) xem trong [`CLAUDE.md`](./CLAUDE.md).

## Quy ước commit

Commit theo [Conventional Commits](https://www.conventionalcommits.org/), được kiểm tra bởi commitlint:

```
feat | fix | perf | style | docs | test | refactor | build | ci | chore | revert | wip | workflow | types | release
```

Ví dụ: `feat(home): redesign home page as approval dashboard`

## Triển khai

Push lên nhánh `main` sẽ chạy GitHub Actions ([`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)):

1. Chạy test
2. Build Docker image (Node build → Nginx), đẩy lên GitHub Container Registry
3. Deploy lên server qua Cloudflare Tunnel (`docker compose pull` + `up -d`), dọn image cũ của frontend

Thông tin bản build đang chạy (commit, nhánh, tác giả, thời gian build) xem bằng `window.BUILD_INFO` trong Console của trình duyệt.

## Giấy phép

[MIT](./LICENSE)
