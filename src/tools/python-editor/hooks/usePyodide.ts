import { useRef, useCallback, useState, useEffect } from 'react'

interface PyodideResult {
  stdout: string
  stderr: string
  execTime: number
}

interface PyodideState {
  loading: boolean
  loadingProgress: number
  ready: boolean
  error: string | null
}

// Pyodide 类型声明
interface PyodideInterface {
  runPython: (code: string) => unknown
  runPythonAsync: (code: string) => Promise<unknown>
}

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string; fullStdLib?: boolean }) => Promise<PyodideInterface>
  }
}

// 预估加载时间 7 秒
const ESTIMATED_LOAD_TIME = 7000

export function usePyodide() {
  const [state, setState] = useState<PyodideState>({
    loading: false,
    loadingProgress: 0,
    ready: false,
    error: null,
  })

  const pyodideRef = useRef<PyodideInterface | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  // 清理进度定时器
  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }, [])

  // 启动假进度条
  const startFakeProgress = useCallback(() => {
    startTimeRef.current = Date.now()
    setState((prev) => ({ ...prev, loadingProgress: 0 }))

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      // 使用缓动函数，前期快后期慢，最多到 90%，留 10% 给真实完成
      const rawProgress = Math.min(elapsed / ESTIMATED_LOAD_TIME, 1)
      // 缓动：开方函数让前期快后期慢
      const easedProgress = Math.sqrt(rawProgress) * 90
      setState((prev) => ({ ...prev, loadingProgress: Math.floor(easedProgress) }))
    }, 100)
  }, [])

  const loadPyodide = useCallback(async () => {
    if (pyodideRef.current) return pyodideRef.current

    setState({ loading: true, loadingProgress: 0, ready: false, error: null })
    startFakeProgress()

    try {
      // 创建 script 标签加载 Pyodide
      const script = document.createElement('script')
      script.src = 'https://x.t1.gs/pyodide/v0.26.2/full/pyodide.js'
      document.head.appendChild(script)

      // 等待脚本加载完成
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Pyodide 脚本加载失败'))
      })

      // 初始化 Pyodide
      pyodideRef.current = await window.loadPyodide!({
        indexURL: 'https://x.t1.gs/pyodide/v0.26.2/full/',
        fullStdLib: false,
      })

      // 停止假进度，直接完成
      clearProgressInterval()
      setState({ loading: false, loadingProgress: 100, ready: true, error: null })
      return pyodideRef.current
    } catch (e) {
      clearProgressInterval()
      const errorMsg = (e as Error).message
      setState({ loading: false, loadingProgress: 0, ready: false, error: errorMsg })
      throw e
    }
  }, [startFakeProgress, clearProgressInterval])

  // 组件卸载时清理
  useEffect(() => {
    return () => clearProgressInterval()
  }, [clearProgressInterval])

  const runPython = useCallback(async (code: string): Promise<PyodideResult | null> => {
    try {
      // 确保 Pyodide 已加载
      if (!pyodideRef.current) {
        await loadPyodide()
      }

      if (!pyodideRef.current) {
        throw new Error('Pyodide 未初始化')
      }

      const pyodide = pyodideRef.current

      // 重定向 stdout/stderr
      pyodide.runPython(`
import sys
from io import StringIO
_stdout_buffer = StringIO()
_stderr_buffer = StringIO()
sys.stdout = _stdout_buffer
sys.stderr = _stderr_buffer
      `)

      // 执行用户代码
      const startTime = performance.now()
      pyodide.runPython(code)
      const execTime = performance.now() - startTime

      // 获取输出
      const stdout = pyodide.runPython('_stdout_buffer.getvalue()') as string
      const stderr = pyodide.runPython('_stderr_buffer.getvalue()') as string

      // 恢复 stdout/stderr
      pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
      `)

      return { stdout, stderr, execTime }
    } catch (e) {
      // 恢复 stdout/stderr
      try {
        pyodideRef.current?.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
        `)
      } catch {
        // 忽略恢复错误
      }

      return {
        stdout: '',
        stderr: (e as Error).message,
        execTime: 0,
      }
    }
  }, [loadPyodide])

  return {
    ...state,
    loadPyodide,
    runPython,
  }
}