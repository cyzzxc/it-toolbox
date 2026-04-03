import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'ai-docker-compose',
  name: 'AI 生成 Docker Compose',
  nameEn: 'AI Docker Compose Generator',
  description: '从 docker run 命令或文档生成规范的 docker-compose.yml',
  category: 'ai',
  tags: ['ai', 'docker', 'compose', 'container', 'devops'],
  keywords: ['Docker', 'Compose', '容器', 'Docker Run', 'DevOps'],
  icon: 'Container',
  requiresApi: true,
}