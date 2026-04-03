import type { ToolMeta } from '@toolbox/types/tool'

export const meta: ToolMeta = {
  id: 'image-watermark',
  name: '图片水印',
  nameEn: 'Image Watermark',
  description: '批量添加时间/日期/地点水印，支持时间随机生成，自定义字体颜色透明度位置',
  category: 'image',
  tags: ['image', 'watermark', 'photo', 'date', 'time', 'location'],
  keywords: ['水印', '照片', '时间水印', '地点水印', '批量水印'],
  icon: 'Stamp',
}