# Peace Vision Frontend Project

基于 Vue 3 + Vite 构建的和平愿景前端项目。

## 项目结构

```
vite-project/
├── .vscode/           # VS Code 配置
│   └── extensions.json
├── public/            # 静态资源
│   ├── favicon.svg    # 网站图标
│   └── icons.svg      # 图标资源
├── src/               # 源代码
│   ├── components/    # 组件目录
│   │   ├── map/       # map 小组组件目录
│   │   └── river/     # river 小组组件目录
│   ├── App.vue        # 根组件
│   ├── main.js        # 入口文件
│   └── style.css      # 全局样式
├── .gitignore         # Git 忽略配置
├── index.html         # HTML 模板
├── package.json       # 项目依赖配置
├── vite.config.js     # Vite 配置
└── README.md          # 项目说明文档
```

## 组件目录说明

### Map 小组组件

**位置**: `src/components/map/`

### River 小组组件

**位置**: `src/components/river/`


## 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite 9，Echarts, Element Plus等，自行配置与下载
- **语言**: JavaScript

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 开发规范

1. 组件命名采用 PascalCase 命名法
2. 每个组件应有独立的目录，包含组件文件和相关资源
3. map 小组的组件放入 `src/components/map/`
4. river 小组的组件放入 `src/components/river/`
5. 注意使用git时，不要提交 `node_modules` 等目录，详情见 `.gitignore`
文件