<div align="center">
	<a href="https://zhizhu.online">
		<img alt="zhizhu logo" width="120" src="https://pub-07279aa6f8b34608b2a6b442ecd835a9.r2.dev/Logo/logo.svg">
	</a>
	<h1>zhizhu system — Frontend</h1>
	<p>Hệ thống phê duyệt tờ trình, ký số và quản trị nội bộ cho doanh nghiệp</p>
	<p>
		<a href="https://zhizhu.online">zhizhu.online</a>
	</p>
</div>

## Giới thiệu

Frontend của zhizhu system: ứng dụng quản trị nội bộ để lập tờ trình, phê duyệt theo luồng nhiều bước, ký số văn bản và quản trị hệ thống. Xây dựng bằng React 19, Vite, TypeScript và Ant Design 6.

## Tính năng chính

- **Tờ trình**: tạo / sửa / gửi tờ trình theo từng loại (nội dung theo form cấu hình, tệp đính kèm, văn bản PDF), xem luồng phê duyệt dự kiến trước khi gửi, lịch sử xử lý, chia sẻ tờ trình. Các hộp thư: đang soạn, chờ xử lý, đã hoàn thành, toàn bộ, tất cả tờ trình
- **Phê duyệt**: duyệt / từ chối / trả lại theo từng bước và từng vòng, ủy quyền duyệt
- **Chữ ký số nội bộ**: đăng ký chứng thư (mã PIN 6 số + ảnh chữ ký tay), quản trị duyệt chứng thư, "Ký và duyệt" trực tiếp lên văn bản PDF
- **Thiết kế luồng phê duyệt**: kéo thả trên canvas ([React Flow](https://reactflow.dev/) + dagre), nhánh điều kiện, quản lý phiên bản, chạy mô phỏng luồng
- **Dashboard & báo cáo**: trang chủ (tờ trình chờ tôi duyệt, tờ trình của tôi kèm tiến trình, ủy quyền, thời gian duyệt trung bình, hoạt động gần đây); báo cáo tổng quan, hiệu suất, tồn đọng & quá hạn, theo loại tờ trình
- **Cấu hình**: nhóm tờ trình, loại tờ trình, form động, mẫu email, quản lý i18n, cài đặt ứng dụng, chứng thư số
- **Quản trị hệ thống**: người dùng, vai trò, phòng ban, nhóm, menu, lịch làm việc & ca làm việc, nhật ký hoạt động
- **Xuất dữ liệu**: xuất file bất đồng bộ, xem lại lịch sử xuất
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
| Gọi API | [Ky](https://github.com/sindresorhus/ky), [ahooks](https://ahooks.js.org/) (`useRequest`), [TanStack Query](https://tanstack.com/query) |
| Xác thực | [Supabase Auth](https://supabase.com/docs/guides/auth) |
| Luồng phê duyệt | [@xyflow/react](https://reactflow.dev/), [dagre](https://github.com/dagrejs/dagre) |
| Soạn thảo & tài liệu | [Tiptap](https://tiptap.dev/) (rich text), [pdf.js](https://mozilla.github.io/pdf.js/) (xem / ký PDF), [dnd-kit](https://dndkit.com/) (kéo thả) |
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
| `VITE_API_TIMEOUT` | Timeout gọi API, đơn vị ms (mặc định 10000, không bắt buộc) |
| `VITE_BASE_HOME_PATH` | Route mặc định sau khi đăng nhập (vd `/home`) |
| `VITE_ROUTER_MODE` | Đặt `hash` để dùng hash router (không bắt buộc) |
| `VITE_APP_NAMESPACE` | Tiền tố key của store / localStorage, tránh trùng khi chạy nhiều ứng dụng cùng domain |
| `VITE_AUTH_PROVIDER` | Nhà cung cấp xác thực, hiện dùng `supabase` |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Cấu hình Supabase Auth |
| `VITE_GLOB_APP_TITLE` | Tên ứng dụng (tiêu đề tab, banner, link preview) |
| `VITE_GLOB_APP_DESCRIPTION` | Mô tả ứng dụng (meta description, link preview) |
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
├── components/   # Component dùng chung (basic-table, basic-form, picker, signature-pad, file-viewer…)
├── hooks/        # use-access (phân quyền), use-preferences (theme, ngôn ngữ, layout)
├── icons/        # Icon dùng cho menu (đăng ký trong menu-icons.ts)
├── layout/       # Khung ứng dụng: header, sidebar, tab bar, widget
├── locales/      # Bản dịch vi-VN / en-US / zh-CN (tự nạp theo tên file)
├── pages/        # Các trang, cấu trúc theo domain như api/ (approval, setting, system, system-config…)
├── router/       # Route (tự nạp từ routes/modules), guard đăng nhập
├── store/        # Zustand store: user, access, tabs, preferences
├── styles/       # CSS toàn cục, theme token
└── utils/        # Tiện ích: HTTP client (request), format số, antd tĩnh…
```

Quy ước chi tiết (mẫu module, trang danh sách, modal chi tiết, phân quyền, thông báo antd…) xem trong [`CLAUDE.md`](./CLAUDE.md).

## Quy ước commit

Commit theo [Conventional Commits](https://www.conventionalcommits.org/), được kiểm tra bởi commitlint:

```
feat | fix | perf | style | docs | test | refactor | build | ci | chore | revert | wip | workflow | types | release
```

Ví dụ: `feat(approval): split signature enroll form in two columns`

## Triển khai

Push lên nhánh `main` sẽ chạy GitHub Actions ([`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)):

1. Chạy test
2. Build Docker image (Node build → Nginx), đẩy lên GitHub Container Registry
3. Deploy lên server qua Cloudflare Tunnel (`docker compose pull` + `up -d`), dọn image cũ của frontend

Thông tin bản build đang chạy (commit, nhánh, tác giả, thời gian build) xem bằng `window.BUILD_INFO` trong Console của trình duyệt.

## Giấy phép

[MIT](./LICENSE)
