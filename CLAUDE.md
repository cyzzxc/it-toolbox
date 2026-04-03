# IT Toolbox 项目指南

## 项目概述

面向开发者的在线工具箱，146 款高频开发工具，基于 Cloudflare Pages Functions 全栈部署。

**核心特性**：
- 90% 工具浏览器端计算，隐私安全，无网络往返
- 全球 300+ Cloudflare 边缘节点，API 响应 <50ms
- 按路由懒加载，单工具 JS <50KB gzip
- Git 驱动部署，push 即自动构建

---

## 项目结构

```
src/                          # 前端源码
├── components/               # React 组件
│   ├── layout/               # Header, Sidebar 布局组件
│   ├── tool/                 # ToolLayout 工具通用容器
│   └── ui/                   # ThemeToggle, ToolCard 等基础组件
├── pages/                    # HomePage, ToolPage, CategoryPage 等
├── store/                    # Zustand 状态管理（收藏/历史/主题）
├── tools/                    # 工具目录（每个工具一个文件夹）
│   └── {tool-id}/
│       ├── meta.ts           # 工具元信息
│       └── index.tsx         # 工具 UI
├── registry.ts               # 工具注册表（核心）
└── routeTree.tsx             # 路由配置

functions/api/                # Cloudflare Pages Functions
├── [[route]].ts              # Hono 统一入口
└── routes/                   # ip.ts, dns.ts, ai.ts 等路由模块

packages/
├── core/                     # 纯计算逻辑（前后端共用）
│   ├── encoding.ts           # 编解码
│   ├── crypto.ts             # 加密
│   ├── format.ts             # 格式化
│   ├── text.ts               # 文本处理
│   └── ...
└── types/                    # ToolMeta, ApiResponse 等类型定义
```

---

## 新增工具规范

### 5 步流程

1. `src/tools/{tool-id}/` 创建文件夹
2. 创建 `meta.ts`（工具元信息）
3. 创建 `index.tsx`（工具 UI）
4. `src/registry.ts` 添加注册记录
5. `src/pages/ToolPage.tsx` 添加懒加载映射

### meta.ts 模板

```typescript
import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'tool-id',              // 唯一标识，用于路由 /tool/{id}
  name: '工具名称',            // 中文显示名
  nameEn: 'Tool Name',        // 英文名称
  description: '工具描述',     // 简短说明
  category: 'format',         // 分类：format/encoding/crypto/network/text/color/generator/converter/datetime/ai
  tags: ['tag1', 'tag2'],     // 搜索标签
  keywords: ['中文关键词'],    // 中文搜索关键词
  icon: 'Braces',             // Lucide 图标名称
  requiresApi: false,         // 是否需要后端 API
  isNew: false,               // 是否标记为新工具
}
```

### index.tsx 模板

```typescript
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'

export default function ToolComponent() {
  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={output}>
      {/* 工具内容 */}
    </ToolLayout>
  )
}
```

### 纯计算逻辑

如有可复用计算逻辑，放入 `packages/core/src/` 对应模块，前后端共用。

### 需要后端 API 的工具

1. `functions/api/routes/` 创建路由模块
2. `functions/api/[[route]].ts` 注册路由
3. `meta.ts` 设置 `requiresApi: true`

---

## API 接口清单

| 接口 | 方法 | 功能 | 缓存 |
|------|------|------|------|
| `/api/health` | GET | 健康检查 | 无 |
| `/api/ip` | GET | IP 信息查询 | 1h |
| `/api/dns` | GET | DNS 记录查询 | 5min |
| `/api/exchange` | GET | 汇率换算 | 1h |
| `/api/proxy` | POST | HTTP 代理请求 | 无 |
| `/api/ai/explain` | POST | AI 代码解释 | 无 |
| `/api/ai/regex` | POST | AI 生成正则 | 无 |
| `/api/ai/sql` | POST | AI 生成 SQL | 无 |
| `/api/ai/review` | POST | AI 代码 Review | 无 |

### 通用响应格式

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

### KV 缓存策略

- `cache:ip:{ip}` → 3600s
- `cache:dns:{domain}:{type}` → 300s
- `cache:exchange:{from}:{to}` → 3600s

---

## 架构设计要点

### 性能优化

| 机制 | 说明 |
|------|------|
| 按路由懒加载 | TanStack Router + Vite 代码分割，访问哪个工具才加载哪个代码 |
| 内存搜索索引 | 工具注册表编译时确定，运行时 Fuse.js 索引，无网络查询 |
| localStorage 持久化 | 收藏/历史/主题本地存储，无数据库往返 |
| 前端计算优先 | 90% 工具浏览器端运算，无服务器延迟 |
| 边缘缓存 | KV 缓存外部 API 结果，减少重复请求 |

### 工具分类

| 分类 | 标识 |
|------|------|
| 格式化 | format |
| 编码解码 | encoding |
| 加密安全 | crypto |
| 网络 HTTP | network |
| 文本处理 | text |
| 颜色设计 | color |
| 生成器 | generator |
| 单位换算 | converter |
| 时间日期 | datetime |
| AI 增强 | ai |

### 技术栈

- 前端：React 18 + TypeScript 5 + TanStack Router + Zustand + Tailwind CSS
- 后端：Hono + Cloudflare Pages Functions + KV + Workers AI
- 构建：Vite 6 + pnpm

---

## 开发命令

```bash
pnpm dev          # 前端开发（日常使用）
pnpm pages:dev    # 全栈开发（调试 API）
pnpm typecheck    # 类型检查
pnpm build        # 构建
pnpm preview      # 本地预览
```

---

## 前端样式规范

### 颜色系统（语义化 CSS 变量）

使用 CSS 变量定义语义化颜色，自动适配亮色/暗色主题：

| 语义 | 用途 | Tailwind 类 |
|------|------|-------------|
| `bg-base` | 页面主背景 | `bg-bg-base` |
| `bg-surface` | 卡片/面板背景 | `bg-bg-surface` |
| `bg-raised` | 按钮/高亮区域 | `bg-bg-raised` |
| `bg-overlay` | 浮层/弹窗 | `bg-bg-overlay` |
| `border-subtle` | 微弱边框 | `border-border-subtle` |
| `border-base` | 标准边框 | `border-border-base` |
| `border-strong` | 强调边框 | `border-border-strong` |
| `accent` | 主色调 | `text-accent` / `bg-accent` |
| `text-primary` | 主文字 | `text-text-primary` |
| `text-secondary` | 次级文字 | `text-text-secondary` |
| `text-muted` | 辅助/禁用文字 | `text-text-muted` |

**禁止硬编码颜色值**（如 `#10b981`），统一使用语义化变量。

### 预设组件类

优先使用预设类，避免重复编写 Tailwind 组合：

| 类名 | 用途 | 示例 |
|------|------|------|
| `.tool-input` | 输入框 | `<textarea className="tool-input" />` |
| `.btn-primary` | 主操作按钮 | `<button className="btn-primary">执行</button>` |
| `.btn-secondary` | 次级按钮 | `<button className="btn-secondary">取消</button>` |
| `.btn-ghost` | 透明按钮 | `<button className="btn-ghost">复制</button>` |
| `.btn-group` | 按钮组容器 | `<div className="btn-group">...</div>` |
| `.btn-group-item` | 按钮组子项 | `<button className="btn-group-item">A</button>` |
| `.btn-group-item-active` | 激活态 | `className="btn-group-item btn-group-item-active"` |
| `.card` | 卡片容器 | `<div className="card">...</div>` |
| `.badge` | 标签徽章 | `<span className="badge">新</span>` |
| `.tool-section` | 工具区块 | `<div className="tool-section">...</div>` |
| `.tool-label` | 区块标签 | `<label className="tool-label">输入</label>` |
| `.tool-error` | 错误提示 | `<div className="tool-error">{error}</div>` |
| `.tool-editor` | 双栏编辑器布局 | `<div className="tool-editor">...</div>` |

### 工具 UI 结构规范

```tsx
<ToolLayout meta={meta} onReset={reset} outputValue={output}>
  {/* 工具栏：操作按钮 + 模式切换 */}
  <div className="flex items-center gap-2 mb-4 flex-wrap">
    <button className="btn-primary">执行</button>
    <div className="btn-group">
      <button className="btn-group-item btn-group-item-active">模式A</button>
      <button className="btn-group-item">模式B</button>
    </div>
  </div>

  {/* 编辑器区域：输入 + 输出 */}
  <div className="tool-editor">
    <div className="tool-section">
      <label className="tool-label">输入</label>
      <textarea className="tool-input" />
    </div>
    <div className="tool-section">
      <label className="tool-label">输出</label>
      <textarea className="tool-input" readOnly value={output} />
    </div>
  </div>

  {/* 错误提示 */}
  {error && <div className="tool-error">{error}</div>}
</ToolLayout>
```

### 按钮组切换模式

```tsx
<div className="flex items-center gap-1 bg-bg-raised rounded-lg p-1">
  {modes.map(m => (
    <button
      key={m}
      onClick={() => setMode(m)}
      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
        ${mode === m ? 'bg-accent text-bg-base' : 'text-text-muted hover:text-text-primary'}`}
    >
      {m}
    </button>
  ))}
</div>
```

### 图标使用

使用 Lucide React 图标，统一尺寸：

| 场景 | 尺寸 |
|------|------|
| 按钮内图标 | `w-4 h-4` |
| 标题图标 | `w-5 h-5` |
| 大图标 | `w-6 h-6` |

```tsx
import { Copy, Check, RotateCcw } from 'lucide-react'

<button className="btn-ghost">
  <Copy className="w-4 h-4" />
  复制
</button>
```

### 动画

| 类名 | 用途 |
|------|------|
| `animate-fade-in` | 进入淡入 |
| `animate-slide-up` | 进入上滑 |
| `animate-shimmer` | 加载闪烁 |

### 字体

| 类型 | 字体 | 使用场景 |
|------|------|----------|
| mono | JetBrains Mono / Fira Code | 代码、输入框、输出框 |
| sans | Geist | UI 文字 |

```tsx
// 代码/输入输出使用 mono
<textarea className="tool-input font-mono" />

// UI 文字默认 sans，无需指定
<button className="btn-primary">执行</button>
```

---

## Git 规范

- 格式：`类型: 简述`（如 `功能: 添加 Base64 工具`）
- 类型：功能 / 修复 / 重构 / 文档 / 测试 / 构建 / 杂项