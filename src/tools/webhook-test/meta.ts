import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'webhook-test',
  name: 'Webhook 测试',
  nameEn: 'Webhook Tester',
  description: '生成临时端点，接收并展示请求',
  category: 'network',
  tags: ['webhook', 'test', 'api', 'debug', 'http'],
  keywords: ['Webhook', '测试', 'API', '调试'],
  icon: 'Webhook',
  requiresApi: true,
}
