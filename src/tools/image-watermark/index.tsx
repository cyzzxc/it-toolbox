import { useState, useCallback, useRef, useEffect } from 'react'
import { Stamp, Upload, Download, Trash2, Settings, MapPin, Clock, Calendar, Shuffle } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useAppStore } from '@/store/app'
import { meta } from './meta'

interface WatermarkOptions {
  text: string
  showDate: boolean
  showTime: boolean
  randomTime: boolean
  timeRange: { start: string; end: string }
  showLocation: boolean
  location: string
  fontSizeRatio: number
  color: string
  opacity: number
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  marginRatio: number
  shadow: boolean
}

interface ImageItem {
  id: string
  name: string
  original: File
  previewUrl: string
  processedUrl?: string
  status: 'pending' | 'processing' | 'done' | 'error'
  watermarkText: string
  error?: string
}

const defaultOptions: WatermarkOptions = {
  text: '',
  showDate: true,
  showTime: true,
  randomTime: false,
  timeRange: { start: '08:00', end: '20:00' },
  showLocation: false,
  location: '',
  fontSizeRatio: 3,
  color: '#ffffff',
  opacity: 80,
  position: 'bottom-left',
  marginRatio: 2,
  shadow: true,
}

function generateRandomTime(start: string, end: string): string {
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  const randomMinutes = Math.floor(Math.random() * (endMinutes - startMinutes + 1)) + startMinutes
  const hours = Math.floor(randomMinutes / 60)
  const minutes = randomMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function generateWatermarkText(options: WatermarkOptions): string {
  const parts: string[] = []
  if (options.text) parts.push(options.text)
  if (options.showDate) {
    const now = new Date()
    parts.push(`${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}`)
  }
  if (options.showTime) {
    if (options.randomTime) {
      parts.push(generateRandomTime(options.timeRange.start, options.timeRange.end))
    } else {
      const now = new Date()
      parts.push(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`)
    }
  }
  if (options.showLocation && options.location) parts.push(options.location)
  return parts.join(' ')
}

function getPositionCoords(
  position: WatermarkOptions['position'],
  width: number,
  height: number,
  textWidth: number,
  textHeight: number,
  margin: number
): { x: number; y: number } {
  switch (position) {
    case 'top-left': return { x: margin, y: margin + textHeight }
    case 'top-right': return { x: width - textWidth - margin, y: margin + textHeight }
    case 'bottom-left': return { x: margin, y: height - margin }
    case 'bottom-right': return { x: width - textWidth - margin, y: height - margin }
    default: return { x: margin, y: height - margin }
  }
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (e) => {
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target!.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

async function addWatermark(imageFile: File, options: WatermarkOptions): Promise<{ blob: Blob; watermarkText: string }> {
  const img = await loadImage(imageFile)
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const fontSize = Math.round(img.height * (options.fontSizeRatio / 100))
  const margin = Math.round(img.height * (options.marginRatio / 100))
  ctx.font = `${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`
  ctx.textBaseline = 'bottom'

  const opacity = options.opacity / 100
  const hex = options.color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  const watermarkText = generateWatermarkText(options)
  const textWidth = ctx.measureText(watermarkText).width
  const textHeight = fontSize

  const { x, y } = getPositionCoords(options.position, canvas.width, canvas.height, textWidth, textHeight, margin)

  if (options.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
    ctx.shadowBlur = Math.round(fontSize / 4)
    ctx.shadowOffsetX = Math.round(fontSize / 8)
    ctx.shadowOffsetY = Math.round(fontSize / 8)
  }

  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`
  ctx.fillText(watermarkText, x, y)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve({ blob, watermarkText })
      else reject(new Error('Failed to create blob'))
    }, 'image/jpeg', 0.95)
  })
}

function PreviewCanvas({ imageFile, options }: { imageFile: File | null; options: WatermarkOptions }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!imageFile || !canvasRef.current) return

    const render = async () => {
      const img = await loadImage(imageFile)
      const canvas = canvasRef.current!
      const ctx = canvas.getContext('2d')!
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const watermarkText = generateWatermarkText(options)
      if (!watermarkText) return

      const fontSize = Math.round(img.height * (options.fontSizeRatio / 100))
      const margin = Math.round(img.height * (options.marginRatio / 100))
      ctx.font = `${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`
      ctx.textBaseline = 'bottom'

      const opacity = options.opacity / 100
      const hex = options.color.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)

      const textWidth = ctx.measureText(watermarkText).width
      const textHeight = fontSize

      const { x, y } = getPositionCoords(options.position, canvas.width, canvas.height, textWidth, textHeight, margin)

      if (options.shadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
        ctx.shadowBlur = Math.round(fontSize / 4)
        ctx.shadowOffsetX = Math.round(fontSize / 8)
        ctx.shadowOffsetY = Math.round(fontSize / 8)
      }

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`
      ctx.fillText(watermarkText, x, y)
    }
    render()
  }, [imageFile, options])

  if (!imageFile) return null

  return (
    <canvas
      ref={canvasRef}
      className="max-w-full max-h-[400px] object-contain rounded-lg shadow-lg mx-auto"
    />
  )
}

export default function ImageWatermark() {
  const [items, setItems] = useState<ImageItem[]>([])
  const [options, setOptions] = useState<WatermarkOptions>(defaultOptions)
  const [processing, setProcessing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { addRecentTool } = useAppStore()

  const previewImage = items[0]?.original || null

  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems: ImageItem[] = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({
        id: Math.random().toString(36).slice(2),
        name: f.name,
        original: f,
        previewUrl: URL.createObjectURL(f),
        status: 'pending',
        watermarkText: '',
      }))
    setItems(prev => [...prev, ...newItems])
  }, [])

  const processAll = useCallback(async () => {
    const pending = items.filter(i => i.status === 'pending' || i.status === 'error')
    if (!pending.length) return
    addRecentTool(meta.id)
    setProcessing(true)

    for (const item of pending) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing' } : i))
      try {
        const { blob, watermarkText } = await addWatermark(item.original, options)
        const url = URL.createObjectURL(blob)
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, processedUrl: url, watermarkText, status: 'done' } : i))
      } catch (e) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: e instanceof Error ? e.message : '处理失败' } : i))
      }
    }
    setProcessing(false)
  }, [items, options, addRecentTool])

  const downloadItem = (item: ImageItem) => {
    if (!item.processedUrl) return
    const a = document.createElement('a')
    a.href = item.processedUrl
    a.download = `watermark_${item.name.replace(/\.[^.]+$/, '.jpg')}`
    a.click()
  }

  const downloadAll = () => items.filter(i => i.status === 'done').forEach(downloadItem)

  const removeItem = (id: string) => {
    const item = items.find(i => i.id === id)
    if (item) {
      URL.revokeObjectURL(item.previewUrl)
      if (item.processedUrl) URL.revokeObjectURL(item.processedUrl)
    }
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const reset = () => {
    items.forEach(i => {
      URL.revokeObjectURL(i.previewUrl)
      if (i.processedUrl) URL.revokeObjectURL(i.processedUrl)
    })
    setItems([])
    setOptions(defaultOptions)
  }

  const doneCount = items.filter(i => i.status === 'done').length

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">

        {/* 上传区域 */}
        <label
          className="border-2 border-dashed border-border-base rounded-xl p-8 text-center hover:border-accent transition-colors cursor-pointer"
          onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
          onDragOver={e => e.preventDefault()}
        >
          <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-text-secondary text-sm">拖拽图片到此处，或点击添加</p>
          <p className="text-xs text-text-muted mt-1">支持 JPEG、PNG、WebP 等格式，可批量添加</p>
          <input type="file" multiple accept="image/*" className="hidden" onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }} />
        </label>

        {/* 预览区域 */}
        {items.length > 0 && (
          <div className="flex justify-center bg-bg-surface border border-border-base rounded-xl p-4">
            <PreviewCanvas imageFile={previewImage} options={options} />
          </div>
        )}

        {/* 文件列表 */}
        {items.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">{items.length} 个文件</span>
              <div className="flex gap-2">
                <button onClick={() => setShowSettings(!showSettings)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${showSettings ? 'bg-accent text-bg-base' : 'bg-bg-raised hover:bg-bg-surface text-text-secondary'}`}>
                  <Settings className="w-3.5 h-3.5" />设置
                </button>
                {doneCount > 0 && (
                  <button onClick={downloadAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-raised hover:bg-bg-surface text-sm text-text-secondary transition-colors">
                    <Download className="w-3.5 h-3.5" />全部下载
                  </button>
                )}
                <button onClick={processAll} disabled={processing || items.every(i => i.status === 'done')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-bg-base text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <Stamp className="w-3.5 h-3.5" />
                  {processing ? '添加中...' : '添加水印'}
                </button>
              </div>
            </div>

            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-bg-surface border border-border-base rounded-lg">
                <img src={item.processedUrl || item.previewUrl} alt={item.name} className="w-12 h-12 object-cover rounded border border-border-base" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary truncate">{item.name}</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {item.status === 'pending' && '待处理'}
                    {item.status === 'processing' && <span className="text-accent">添加水印中...</span>}
                    {item.status === 'done' && <span className="text-green-400">水印: {item.watermarkText}</span>}
                    {item.status === 'error' && <span className="text-red-400">{item.error}</span>}
                  </div>
                </div>
                {item.status === 'done' && (
                  <button onClick={() => downloadItem(item)} className="p-1.5 rounded-md hover:bg-bg-raised transition-colors" title="下载">
                    <Download className="w-4 h-4 text-text-muted" />
                  </button>
                )}
                <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-md hover:bg-bg-raised transition-colors" title="删除">
                  <Trash2 className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 设置面板 - 放在下方，避免抖动 */}
        {showSettings && items.length > 0 && (
          <div className="bg-bg-surface border border-border-base rounded-xl p-4 space-y-4">
            <div className="space-y-3">
              <div className="text-xs text-text-muted font-medium flex items-center gap-2">
                <Stamp className="w-3.5 h-3.5" />水印内容
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">自定义文本</label>
                  <input
                    type="text"
                    value={options.text}
                    onChange={e => setOptions(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="可选前缀"
                    className="w-full px-3 py-2 bg-bg-raised border border-border-base rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                  />
                </div>
                {options.showLocation && (
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">地点</label>
                    <input
                      type="text"
                      value={options.location}
                      onChange={e => setOptions(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="拍摄地点"
                      className="w-full px-3 py-2 bg-bg-raised border border-border-base rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={options.showDate} onChange={e => setOptions(prev => ({ ...prev, showDate: e.target.checked }))} className="w-4 h-4 rounded border-border-base accent-accent" />
                  <Calendar className="w-4 h-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">日期</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={options.showTime} onChange={e => setOptions(prev => ({ ...prev, showTime: e.target.checked }))} className="w-4 h-4 rounded border-border-base accent-accent" />
                  <Clock className="w-4 h-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">时间</span>
                </label>

                {options.showTime && (
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={options.randomTime} onChange={e => setOptions(prev => ({ ...prev, randomTime: e.target.checked }))} className="w-4 h-4 rounded border-border-base accent-accent" />
                    <Shuffle className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-secondary">随机时间</span>
                  </label>
                )}

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={options.showLocation} onChange={e => setOptions(prev => ({ ...prev, showLocation: e.target.checked }))} className="w-4 h-4 rounded border-border-base accent-accent" />
                  <MapPin className="w-4 h-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">地点</span>
                </label>
              </div>

              {options.showTime && options.randomTime && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted">时间范围</span>
                  <input type="time" value={options.timeRange.start} onChange={e => setOptions(prev => ({ ...prev, timeRange: { ...prev.timeRange, start: e.target.value } }))} className="px-2 py-1 bg-bg-raised border border-border-base rounded text-xs text-text-primary focus:outline-none focus:border-accent" />
                  <span className="text-xs text-text-muted">至</span>
                  <input type="time" value={options.timeRange.end} onChange={e => setOptions(prev => ({ ...prev, timeRange: { ...prev.timeRange, end: e.target.value } }))} className="px-2 py-1 bg-bg-raised border border-border-base rounded text-xs text-text-primary focus:outline-none focus:border-accent" />
                </div>
              )}
            </div>

            <div className="space-y-3 pt-3 border-t border-border-subtle">
              <div className="text-xs text-text-muted font-medium">样式</div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">位置</label>
                  <select value={options.position} onChange={e => setOptions(prev => ({ ...prev, position: e.target.value as WatermarkOptions['position'] }))} className="w-full px-3 py-2 bg-bg-raised border border-border-base rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent">
                    <option value="bottom-left">左下角</option>
                    <option value="bottom-right">右下角</option>
                    <option value="top-left">左上角</option>
                    <option value="top-right">右上角</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-text-muted mb-1 block">颜色</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={options.color} onChange={e => setOptions(prev => ({ ...prev, color: e.target.value }))} className="w-8 h-8 rounded border border-border-base cursor-pointer bg-transparent" />
                    <span className="font-mono text-xs text-text-secondary">{options.color}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-muted mb-1 block">阴影</label>
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input type="checkbox" checked={options.shadow} onChange={e => setOptions(prev => ({ ...prev, shadow: e.target.checked }))} className="w-4 h-4 rounded border-border-base accent-accent" />
                    <span className="text-sm text-text-secondary">启用</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">字体大小 <span className="font-mono">{options.fontSizeRatio}%</span></label>
                  <input type="range" min={1} max={8} step={0.5} value={options.fontSizeRatio} onChange={e => setOptions(prev => ({ ...prev, fontSizeRatio: +e.target.value }))} className="w-full accent-accent" />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">透明度 <span className="font-mono">{options.opacity}%</span></label>
                  <input type="range" min={20} max={100} value={options.opacity} onChange={e => setOptions(prev => ({ ...prev, opacity: +e.target.value }))} className="w-full accent-accent" />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">边距 <span className="font-mono">{options.marginRatio}%</span></label>
                  <input type="range" min={1} max={8} step={0.5} value={options.marginRatio} onChange={e => setOptions(prev => ({ ...prev, marginRatio: +e.target.value }))} className="w-full accent-accent" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}