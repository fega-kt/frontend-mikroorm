<div align="center">
	<a href="https://github.com/fega-kt/frontend-mikroorm/">
		<img alt="React-antd-admin Logo" width="192" src="https://github.com/user-attachments/assets/1de76309-4cf5-4e34-a32f-92c361bace2a">
	</a>
	<br />
	<h1>zhizhu system</h1>
	<br />
</div>

**English** | [中文](./README.zh-CN.md)

## Introduction

react-antd-admin is a middle and back-office solution based on React Hooks, Vite, and TypeScript. It aims to help you quickly build enterprise-level middle and back-office projects, with no additional configuration required, ready to use out of the box.

## Features

- Cutting-edge technology stack: [React Hooks](https://react.dev/)、[TypeScript](https://www.typescriptlang.org/)、[Vite](https://vitejs.dev/)、[ant design](https://ant.design/)、[React Router](https://reactrouter.com/)、[Tailwind CSS](https://tailwindcss.com/docs/installation)
- Intuitive state management library: [Zustand](https://zustand-demo.pmnd.rs/)
- Internationalization: [I18n](https://react.i18next.com/)
- Fetch requests: [Ky](https://github.com/sindresorhus/ky)、[@tanstack/react-query](https://tanstack.com/query/latest/docs/framework/react/overview)
- Code formatting: [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new/)
- Route-level component caching: [keepalive-for-react](https://github.com/irychen/keepalive-for-react)
- API Mocking: [vite-plugin-fake-server](https://github.com/condorheroblog/vite-plugin-fake-server)
- Permission Routing: Supports both frontend static routing and backend dynamic routing
- Theme Configuration: Built-in multiple theme configurations, supports dark theme, and unified color system for Ant Design and Tailwind CSS

## Development

### Install

```bash
corepack enable

pnpm install
```

### Environment Variables

```bash
cp .env.example .env
```

The backend is split into two services running on different ports — set the matching base URL for each:

- `VITE_API_BASE_URL` — core service (auth, user, department, role, group, notification, attachment, activity-log)
- `VITE_API_APP_BASE_URL` — app service (category, request-type, workflow-setting, home-report, project, task, sprint, milestone, section, comment, time-log)

### Run

```bash
pnpm run dev
```

Open your browser and enter [http://localhost:3333](http://localhost:3333) to see the page.

## Build

```bash
pnpm build
```

The build output is by default in the build folder.

## Preview

```bash
pnpm preview
```

## Credits

Thanks to the following excellent projects for providing inspiration:

- [vue-vben-admin](https://github.com/vbenjs/vue-vben-admin)  for design inspiration
- [vue-pure-admin](https://github.com/pure-admin/vue-pure-admin) for business logic inspiration

## License

[MIT](./LICENSE) License
