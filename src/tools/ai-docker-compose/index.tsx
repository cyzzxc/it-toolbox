import { useState } from 'react'
import { Copy, Check, AlertCircle, Sparkles } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface DockerComposeResult {
  compose: string
  explanation: string
}

export default function AiDockerCompose() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<DockerComposeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { copy, copied } = useClipboard()

  const generate = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/ai/docker-compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      const json = await res.json() as { success: boolean; data?: DockerComposeResult; error?: string }
      if (json.success && json.data) {
        setResult(json.data)
      } else {
        setError(json.error ?? 'AI 请求失败')
      }
    } catch (e) {
      setError('网络错误：' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const examples = [
    'docker run -d -p 8080:80 --name nginx nginx:alpine',
    'docker run -d -e MYSQL_ROOT_PASSWORD=secret -v mysql_data:/var/lib/mysql -p 3306:3306 mysql:8',
    'redis 服务，端口 6379，持久化存储',
    'PostgreSQL 数据库，用户 admin，密码 pass123，端口 5432',
  ]

  return (
    <ToolLayout meta={meta} onReset={() => { setInput(''); setResult(null); setError('') }}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
            docker run 命令或服务描述
          </label>
          <textarea
            className="tool-input min-h-[120px] font-mono"
            placeholder="粘贴 docker run 命令，或描述你需要的服务..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {examples.map(ex => (
              <button
                key={ex}
                onClick={() => setInput(ex)}
                className="px-2 py-1 text-xs rounded-md bg-bg-raised text-text-muted hover:text-text-primary hover:bg-bg-surface border border-border-base transition-colors"
              >
                {ex.length > 40 ? ex.slice(0, 40) + '...' : ex}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading || !input.trim()}
          className="btn-primary gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? '生成中...' : 'AI 生成 Compose'}
        </button>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-3">
            <div className="bg-bg-surface rounded-lg border border-border-base p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  docker-compose.yml
                </span>
                <button onClick={() => copy(result.compose)} className="btn-ghost text-xs gap-1">
                  {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                  复制
                </button>
              </div>
              <pre className="font-mono text-sm text-text-primary bg-bg-raised rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                {result.compose}
              </pre>
              <div className="text-xs text-text-secondary leading-relaxed">
                <span className="font-medium text-text-primary">说明：</span>
                {result.explanation}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}