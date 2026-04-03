import { useState, useRef, useCallback, useEffect } from 'react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { Play, Pause, RotateCcw } from 'lucide-react'

type TimerMode = 'stopwatch' | 'countdown'

function getTimeSegments(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

function parseTimeInput(input: string): number {
  if (/^\d+$/.test(input)) return parseInt(input, 10) * 1000
  if (/^\d+:\d+$/.test(input)) {
    const [m, s] = input.split(':').map(Number)
    return (m * 60 + s) * 1000
  }
  if (/^\d+:\d+:\d+$/.test(input)) {
    const [h, m, s] = input.split(':').map(Number)
    return (h * 3600 + m * 60 + s) * 1000
  }
  return 0
}

export default function TimerTool() {
  const [mode, setMode] = useState<TimerMode>('stopwatch')
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [countdownInput, setCountdownInput] = useState('')
  const [isFinished, setIsFinished] = useState(false)

  const intervalRef = useRef<number | null>(null)
  const startTimeRef = useRef(0)
  const pausedTimeRef = useRef(0)
  const countdownTotalRef = useRef(0)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const updateStopwatch = useCallback(() => {
    setTime(Date.now() - startTimeRef.current + pausedTimeRef.current)
  }, [])

  const updateCountdown = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current + pausedTimeRef.current
    const remaining = countdownTotalRef.current - elapsed
    if (remaining <= 0) {
      setTime(0)
      setIsRunning(false)
      setIsFinished(true)
      clearTimer()
    } else {
      setTime(remaining)
    }
  }, [clearTimer])

  const start = useCallback(() => {
    if (isRunning) return

    if (mode === 'countdown') {
      const total = parseTimeInput(countdownInput)
      if (total <= 0) return
      countdownTotalRef.current = total
      setTime(total)
      pausedTimeRef.current = 0
    }

    setIsFinished(false)
    startTimeRef.current = Date.now()
    setIsRunning(true)

    const updateFn = mode === 'stopwatch' ? updateStopwatch : updateCountdown
    intervalRef.current = window.setInterval(updateFn, 100)
  }, [isRunning, mode, countdownInput, updateStopwatch, updateCountdown])

  const pause = useCallback(() => {
    if (!isRunning) return
    pausedTimeRef.current = time
    setIsRunning(false)
    clearTimer()
  }, [isRunning, time, clearTimer])

  const reset = useCallback(() => {
    clearTimer()
    setTime(0)
    setIsRunning(false)
    setIsFinished(false)
    pausedTimeRef.current = 0
    startTimeRef.current = 0
    countdownTotalRef.current = 0
  }, [clearTimer])

  useEffect(() => {
    reset()
    if (mode === 'countdown') {
      setTime(parseTimeInput(countdownInput))
    }
  }, [mode])

  useEffect(() => {
    if (mode === 'countdown' && !isRunning) {
      setTime(parseTimeInput(countdownInput))
    }
  }, [countdownInput, mode, isRunning])

  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  const handleReset = () => {
    reset()
    setCountdownInput('')
  }

  const segments = getTimeSegments(time)

  const TimeDigit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="text-5xl md:text-7xl font-mono font-bold text-text-primary tabular-nums">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-xs text-text-muted uppercase tracking-widest mt-1">{label}</div>
    </div>
  )

  return (
    <ToolLayout meta={meta} onReset={handleReset}>
      {/* 模式切换 + 倒计时输入 */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="flex items-center gap-1 bg-bg-raised rounded-xl p-1.5">
          {(['stopwatch', 'countdown'] as TimerMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all
                ${mode === m
                  ? 'bg-accent text-bg-base shadow-sm'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-surface'}`}
            >
              {m === 'stopwatch' ? '正计时' : '倒计时'}
            </button>
          ))}
        </div>

        {/* 倒计时输入（始终显示，运行时禁用） */}
        {mode === 'countdown' && (
          <input
            type="text"
            value={countdownInput}
            onChange={(e) => setCountdownInput(e.target.value)}
            placeholder="60 / 1:30 / 1:30:45"
            disabled={isRunning}
            className="tool-input w-36 text-center font-mono disabled:opacity-50 disabled:cursor-not-allowed"
          />
        )}
      </div>

      {/* 时间显示 */}
      <div className={`flex flex-col items-center justify-center py-8
        ${isFinished ? 'animate-pulse' : ''}`}>
        <div className="flex items-center gap-2 md:gap-4">
          {segments.hours > 0 && (
            <>
              <TimeDigit value={segments.hours} label="时" />
              <div className="text-4xl md:text-6xl font-mono font-bold text-text-muted">:</div>
            </>
          )}
          <TimeDigit value={segments.minutes} label="分" />
          <div className="text-4xl md:text-6xl font-mono font-bold text-text-muted">:</div>
          <TimeDigit value={segments.seconds} label="秒" />
        </div>

        {isFinished && (
          <div className="mt-6 px-6 py-3 bg-accent/20 border border-accent/30 rounded-xl">
            <div className="text-lg text-accent font-medium">计时结束</div>
          </div>
        )}
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center justify-center gap-4 mt-4">
        {isRunning ? (
          <button onClick={pause} className="btn-primary flex items-center gap-2 px-8 py-3 text-lg">
            <Pause className="w-5 h-5" />
            暂停
          </button>
        ) : (
          <button onClick={start} className="btn-primary flex items-center gap-2 px-8 py-3 text-lg">
            <Play className="w-5 h-5" />
            {time > 0 && !isFinished && mode === 'stopwatch' ? '继续' : '开始'}
          </button>
        )}

        <button onClick={handleReset} className="btn-secondary flex items-center gap-2 px-8 py-3 text-lg">
          <RotateCcw className="w-5 h-5" />
          重置
        </button>
      </div>
    </ToolLayout>
  )
}