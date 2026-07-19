<div align="center">
	<a href="https://github.com/fega-kt/frontend-mikroorm/">
		<img alt="React-antd-admin Logo" width="192" src="https://github.com/user-attachments/assets/1de76309-4cf5-4e34-a32f-92c361bace2a">
	</a>
	<br />
	<h1>zhizhu system</h1>
	<br />
</div>

**中文** | [English](./README.md)

## 介绍

react-antd-admin 是一个基于 React Hooks、Vite 和 TypeScript 的中后台解决方案。它旨在帮助您快速搭建企业级中后台项目，无需额外配置，开箱即用。

## 特性

- 前沿技术栈：[React Hooks](https://react.dev/)、[TypeScript](https://www.typescriptlang.org/)、[Vite](https://vitejs.dev/)、[ant design](https://ant.design/index-cn/)、[React Router](https://reactrouter.com/)、[Tailwind CSS](https://tailwindcss.com/docs/installation)
- 符合直觉的状态管理库：[Zustand](https://zustand-demo.pmnd.rs/)
- 国际化：[I18n](https://react.i18next.com/)
- Fetch 请求：[Ky](https://github.com/sindresorhus/ky)、[@tanstack/react-query](https://tanstack.com/query/latest/docs/framework/react/overview)
- 代码格式化：[ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new/)
- 路由级别组件缓存：[keepalive-for-react](https://github.com/irychen/keepalive-for-react)
- API 模拟：[vite-plugin-fake-server](https://github.com/condorheroblog/vite-plugin-fake-server)
- 权限路由：支持前端静态路由和后端动态路由
- 主题配置：内置多种主题配置，支持暗黑主题，统一了 antd 和 Tailwind CSS 的颜色体系

## 开发

### 安装依赖

```bash
corepack enable

pnpm install
```

### 环境变量

```bash
cp .env.example .env
```

后端拆分成了 2 个独立端口的服务，需要分别配置对应的地址：

- `VITE_API_BASE_URL` — core 服务（auth、user、department、role、group、notification、attachment、activity-log）
- `VITE_API_APP_BASE_URL` — app 服务（category、request-type、workflow-setting、home-report、project、task、sprint、milestone、section、comment、time-log）

### 运行

```bash
pnpm run dev
```

打开浏览器输入 [http://localhost:3333](http://localhost:3333) 即可看到页面。

## 构建

```bash
pnpm build
```

构建产物默认在 build 文件夹。

## 预览

```bash
pnpm preview
```

## 致谢

感谢以下优秀项目对本项目提供灵感：

- [vue-vben-admin](https://github.com/vbenjs/vue-vben-admin) 提供了设计方面的灵感
- [vue-pure-admin](https://github.com/pure-admin/vue-pure-admin) 提供了业务逻辑方面的灵感

## License

[MIT](./LICENSE) License
