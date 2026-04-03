import { useState } from 'react'
import { Play, Loader2, Clock, AlertCircle, Copy, Check, RotateCcw } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { CodeEditor } from './components/CodeEditor'
import { usePyodide } from './hooks/usePyodide'
import { meta } from './meta'
import { useClipboard } from '@/hooks/useClipboard'

const DEFAULT_CODE = `# Python 在线编辑器
# 输入代码并点击运行

def greet(name):
    return f"Hello, {name}!"

print(greet("World"))

# 数学计算
import math
print(f"π = {math.pi}")
print(f"sqrt(2) = {math.sqrt(2)}")

# 列表操作
numbers = [1, 2, 3, 4, 5]
print(f"Sum: {sum(numbers)}")
print(f"Max: {max(numbers)}")
`

export default function PythonEditor() {
  const [code, setCode] = useState(DEFAULT_CODE)
  const [output, setOutput] = useState('')
  const [outputError, setOutputError] = useState('')
  const [execTime, setExecTime] = useState<number | null>(null)
  const { runPython, loading, loadingProgress, error } = usePyodide()
  const { copy, copied } = useClipboard()

  const handleRun = async () => {
    setOutput('')
    setOutputError('')
    setExecTime(null)

    const result = await runPython(code)
    if (result) {
      if (result.stdout) {
        setOutput(result.stdout)
      }
      if (result.stderr) {
        setOutputError(result.stderr)
      }
      setExecTime(result.execTime)
    }
  }

  const reset = () => {
    setCode(DEFAULT_CODE)
    setOutput('')
    setOutputError('')
    setExecTime(null)
  }

  const fullOutput = output + outputError

  return (
    <ToolLayout meta={meta}>
      {/* 工具栏 */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleRun}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {loading && loadingProgress < 100 ? '加载环境...' : loading ? '运行中...' : '运行'}
        </button>

        {/* 加载进度条 */}
        {loading && loadingProgress < 100 && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-bg-base rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <span className="text-xs text-text-muted">{loadingProgress}%</span>
          </div>
        )}

        {execTime !== null && (
          <span className="text-xs text-text-muted flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {execTime.toFixed(2)}ms
          </span>
        )}

        <div className="flex-1" />

        <button onClick={reset} className="btn-ghost text-xs flex items-center gap-1">
          <RotateCcw className="w-3 h-3" />
          重置
        </button>
        <button onClick={() => copy(fullOutput)} className="btn-ghost text-xs flex items-center gap-1">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          复制
        </button>
      </div>

      {/* 初始化错误 */}
      {error && (
        <div className="mb-4 flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="break-all">{error}</span>
        </div>
      )}

      {/* 编辑器区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-20rem)]">
        {/* 输入 */}
        <div className="min-h-[300px] border border-border-base rounded-lg overflow-hidden">
          <CodeEditor value={code} onChange={setCode} />
        </div>

        {/* 输出 */}
        <div className="min-h-[300px] border border-border-base rounded-lg overflow-hidden">
          <CodeEditor value={output || outputError || '# 点击运行查看输出'} onChange={() => {}} readOnly />
        </div>
      </div>
    </ToolLayout>
  )
}