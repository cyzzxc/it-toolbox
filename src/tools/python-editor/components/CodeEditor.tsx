import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { keymap } from '@codemirror/view'
import { python } from '@codemirror/lang-python'
import { EditorState, TransactionSpec } from '@codemirror/state'
import { syntaxHighlighting, HighlightStyle, indentOnInput } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { indentWithTab } from '@codemirror/commands'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

// 自定义亮色主题高亮样式
const customHighlightStyle = HighlightStyle.define([
  // 关键字：蓝色
  { tag: tags.keyword, color: '#0000ff', fontWeight: 'bold' },
  // 注释：绿色 + 非衬线体（中文更友好）
  { tag: tags.comment, color: '#008000', fontStyle: 'normal', fontFamily: 'system-ui, -apple-system, sans-serif' },
  // 字符串：棕色
  { tag: tags.string, color: '#a31515' },
  // 数字：深蓝
  { tag: tags.number, color: '#098658' },
  // 操作符
  { tag: tags.operator, color: '#d16969' },
  // 变量/标识符
  { tag: tags.variableName, color: '#001080' },
  // 函数名
  { tag: tags.function(tags.variableName), color: '#795e26' },
  // 类型/类名
  { tag: tags.typeName, color: '#267f99' },
])

// 编辑器基础样式
const editorBaseTheme = EditorView.baseTheme({
  '&': {
    backgroundColor: '#ffffff',
    color: '#1f2937',
  },
  '.cm-content': {
    fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
    fontSize: '18px',
    caretColor: '#1f2937',
  },
  '.cm-cursor': {
    borderLeftColor: '#1f2937',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#add6ff !important',
  },
  '.cm-gutters': {
    backgroundColor: '#f8fafc',
    color: '#64748b',
    borderRight: '1px solid #e2e8f0',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
  // 注释强制使用非衬线体
  '.cm-comment': {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  // 移除底部虚线
  '.cm-scroller': {
    borderBottom: 'none',
  },
  '.cm-content:focus': {
    outline: 'none',
  },
  '&.cm-focused': {
    outline: 'none',
  },
})

export function CodeEditor({ value, onChange, readOnly = false }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !readOnly) {
        onChange(update.state.doc.toString())
      }
    })

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        python(),
        syntaxHighlighting(customHighlightStyle, { fallback: true }),
        editorBaseTheme,
        updateListener,
        EditorView.lineWrapping,
        EditorState.tabSize.of(4),
        indentOnInput(),
        keymap.of([indentWithTab]),
      ].concat(readOnly ? [EditorState.readOnly.of(true)] : []),
    })

    viewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    })

    return () => viewRef.current?.destroy()
  }, [readOnly])

  // 外部值更新（仅当值真正不同时）
  useEffect(() => {
    if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
      const transaction: TransactionSpec = {
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
      }
      viewRef.current.dispatch(transaction)
    }
  }, [value])

  return (
    <div
      ref={editorRef}
      className="h-full w-full overflow-hidden rounded-lg border border-border-base bg-white"
    />
  )
}