import cssText from "data-text:~index.css"
import React, { useCallback, useEffect, useRef, useState } from "react"

import { Message } from "~node_modules/@arco-design/web-react/es"
import dayjs from "~node_modules/dayjs"

// 定义操作类型
interface Action {
  type: "click" | "input" | "hover"
  target: string
  value?: string
  timestamp: number
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

// 获取元素的CSS选择器 - 移到组件前面定义
function getSelector(element: Element | null): string {
  if (
    !element ||
    element === document.body ||
    element === document.documentElement
  ) {
    return ""
  }

  // 如果元素有ID，使用ID选择器
  if (element.id) {
    return `#${element.id}`
  }

  // 如果元素没有父节点，返回标签名
  if (!element.parentNode) {
    return element.tagName.toLowerCase()
  }

  // 查找元素在其父元素中的索引
  const siblings = Array.from((element.parentNode as ParentNode).children)
  const index = siblings.indexOf(element) + 1

  // 构建选择器
  let selector = `${element.tagName.toLowerCase()}:nth-child(${index})`

  // 递归添加父元素
  const parentSelector = getSelector(element.parentNode as Element)
  return parentSelector ? `${parentSelector} > ${selector}` : selector
}

// 创建一个React组件，并显式导出
export const FormRecorder: React.FC = () => {
  // 使用useState钩子替代全局变量
  const [recordedActions, setRecordedActions] = useState<Action[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isRecordingCompleted, setIsRecordingCompleted] = useState(false)

  // 使用useRef保存DOM引用
  const containerRef = useRef<HTMLDivElement>(null)
  const titleBarRef = useRef<HTMLDivElement>(null)

  // 拖拽状态
  const dragState = useRef({
    isDragging: false,
    offsetX: 0,
    offsetY: 0
  })

  // 开始录制函数
  const startRecording = useCallback(() => {
    setRecordedActions([])
    setIsRecording(true)
  }, [])

  // 停止录制函数
  const stopRecording = useCallback(() => {
    setIsRecording(false)
    setIsRecordingCompleted(true)
  }, [])

  // 点击事件处理器
  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!isRecording) return

      const target = event.target as HTMLElement
      const selector = getSelector(target)

      setRecordedActions((prev) => [
        ...prev,
        {
          type: "click",
          target: selector,
          timestamp: Date.now()
        }
      ])
    },
    [isRecording]
  )

  // 输入事件处理器
  const handleInput = useCallback(
    (event: Event) => {
      if (!isRecording) return

      const target = event.target as HTMLInputElement
      const selector = getSelector(target)

      setRecordedActions((prev) => [
        ...prev,
        {
          type: "input",
          target: selector,
          value: target.value,
          timestamp: Date.now()
        }
      ])
    },
    [isRecording]
  )

  // 悬停事件处理器
  const handleHover = useCallback(
    (event: MouseEvent) => {
      if (!isRecording || event.type !== "mouseover") return

      const target = event.target as HTMLElement
      const selector = getSelector(target)

      // 防止频繁记录悬停事件，仅记录不同元素的悬停
      setRecordedActions((prev) => {
        const lastAction = prev[prev.length - 1]
        if (
          lastAction &&
          lastAction.type === "hover" &&
          lastAction.target === selector
        ) {
          return prev
        }

        return [
          ...prev,
          {
            type: "hover",
            target: selector,
            timestamp: Date.now()
          }
        ]
      })
    },
    [isRecording]
  )

  // 重放操作
  const replayActions = useCallback(async () => {
    if (recordedActions.length === 0) return

    console.log("开始重放用户操作...")

    for (const action of recordedActions) {
      try {
        const elements = document.querySelectorAll(action.target)
        if (elements.length === 0) {
          console.error(`未找到元素: ${action.target}`)
          continue
        }

        const element = elements[0] as HTMLElement

        // 高亮当前操作的元素
        const originalBackground = element.style.backgroundColor
        const originalOutline = element.style.outline
        element.style.backgroundColor = "rgba(255, 255, 0, 0.3)"
        element.style.outline = "2px solid red"

        switch (action.type) {
          case "click":
            element.click()
            break
          case "input":
            ;(element as HTMLInputElement).value = action.value || ""
            element.dispatchEvent(new Event("input", { bubbles: true }))
            element.dispatchEvent(new Event("change", { bubbles: true }))
            break
          case "hover":
            element.dispatchEvent(
              new MouseEvent("mouseover", { bubbles: true })
            )
            break
        }

        // 等待一小段时间以便用户观察
        await new Promise((resolve) => setTimeout(resolve, 500))

        // 恢复元素样式
        element.style.backgroundColor = originalBackground
        element.style.outline = originalOutline
      } catch (error: any) {
        console.error(`重放操作时出错: ${error.message}`, action)
      }
    }
  }, [recordedActions])

  // 保存录制功能
  const saveRecording = useCallback(() => {
    // 获取当前时间作为录制ID
    const recordingId = Date.now().toString()
    const timestamp = dayjs().format("YYYY-MM-DD HH:mm:ss")

    // 从localStorage获取用户设置的名称
    const savedName = localStorage.getItem("currentRecordingName")

    // 准备要保存的录制数据
    const recording = {
      id: recordingId,
      name: savedName || `录制-${new Date().toLocaleString("zh-CN")}`,
      timestamp: timestamp,
      actions: recordedActions,
      count: recordedActions.length
    }

    // 将录制保存到Chrome存储中
    chrome.storage.local.get(["recordings"], (result) => {
      const recordings = result.recordings || []
      recordings.push(recording)

      chrome.storage.local.set({ recordings }, () => {
        console.log("录制已保存到存储中")

        // 关闭当前弹窗
        setIsVisible(false)

        // 通知popup更新列表
        chrome.runtime.sendMessage({ action: "updateRecordings" })
      })
    })
  }, [recordedActions])

  // 重新录制
  const resetRecording = useCallback(() => {
    setRecordedActions([])
    setIsRecordingCompleted(false)
  }, [])

  // 切换录制状态
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  // 注册拖拽功能
  useEffect(() => {
    const container = containerRef.current
    const titleBar = titleBarRef.current

    if (!container || !titleBar) return

    const handleMouseDown = (e: MouseEvent) => {
      dragState.current.isDragging = true
      dragState.current.offsetX =
        e.clientX - container.getBoundingClientRect().left
      dragState.current.offsetY =
        e.clientY - container.getBoundingClientRect().top
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.current.isDragging) return

      const x = e.clientX - dragState.current.offsetX
      const y = e.clientY - dragState.current.offsetY

      if (container) {
        container.style.left = `${x}px`
        container.style.top = `${y}px`
        container.style.right = "auto"
      }
    }

    const handleMouseUp = () => {
      dragState.current.isDragging = false
    }

    titleBar.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      titleBar.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isVisible])

  // 注册事件监听器
  useEffect(() => {
    if (isRecording) {
      document.addEventListener("click", handleClick, true)
      document.addEventListener("input", handleInput, true)
      document.addEventListener("mouseover", handleHover, true)
    } else {
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("input", handleInput, true)
      document.removeEventListener("mouseover", handleHover, true)
    }

    return () => {
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("input", handleInput, true)
      document.removeEventListener("mouseover", handleHover, true)
    }
  }, [isRecording, handleClick, handleInput, handleHover])

  // 注册 tailwind 样式
  useEffect(() => {
    getStyle()
  }, [])

  // 注册 chrome 的 message
  useEffect(() => {
    const messageListener = (message) => {
      if (message.action === "start") {
        setIsVisible(true)
        localStorage.setItem("currentRecordingName", message.name)
      }
      if (message.action === "replay" && message.recording) {
        // 加载录制的操作并开始重放
        const recordingData = message.recording
        setRecordedActions(recordingData.actions)

        // 延迟一点时间让UI更新后再开始重放
        setTimeout(() => {
          replayActions()
        }, 500)
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div
      ref={containerRef}
      className={`border border-black-500 fixed top-[200px] right-[5px] w-[300px] bg-white rounded-[10px] shadow-lg z-[10000] py-[10px] px-[20px] select-none transition-opacity duration-300 ${
        isRecording ? "opacity-100" : "opacity-70 hover:opacity-100"
      }`}>
      {/* 标题栏（可拖动区域） */}
      <div
        ref={titleBarRef}
        className="cursor-move flex justify-between items-center border-b border-gray-100 pb-[5px] mb-[20px]">
        <div className="text-base font-bold">录制工具</div>

        <div className="flex gap-[10px]">
          <button
            className="bg-transparent border-none text-sm cursor-pointer text-gray-600 p-0 px-[2px]"
            onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? "+" : "—"}
          </button>

          <button
            className="bg-transparent border-none text-lg cursor-pointer text-gray-600 p-0 px-[2px]"
            onClick={() => setIsVisible(false)}>
            ×
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="text-sm">
          {/* 按钮容器 */}
          {isRecordingCompleted ? (
            <div className="flex gap-[8px]">
              <button
                className="flex-1 bg-green-500 text-white border-none rounded px-[12px] py-[6px] cursor-pointer text-sm"
                onClick={saveRecording}>
                保存录制
              </button>
              <button
                className="flex-1 bg-blue-500 text-white border-none rounded px-[12px] py-[6px] cursor-pointer text-sm"
                onClick={resetRecording}>
                重新录制
              </button>
            </div>
          ) : (
            <button
              className={`w-full text-white border-none rounded px-[12px] py-[6px] cursor-pointer text-sm ${
                isRecording ? "bg-red-500" : "bg-blue-500"
              }`}
              onClick={toggleRecording}>
              {isRecording ? "结束录制" : "开始录制"}
            </button>
          )}

          {/* 操作列表容器 */}
          <div className="text-xs text-gray-500 my-[8px]">
            已录制的操作: {recordedActions.length}
          </div>

          {recordedActions.length > 0 && (
            <div className="bg-gray-100 p-[4px] rounded max-h-[150px] overflow-y-auto text-xs">
              {recordedActions.map((action, index) => (
                <div key={index} className="mb-[2px]">
                  {action.type}: {action.target}
                  {action.value ? `(${action.value})` : ""}
                </div>
              ))}
            </div>
          )}

          {/* 提示信息 */}
          <div className="text-xs text-gray-500 mt-[8px]">
            提示: 录制会捕获点击、输入和悬停操作
          </div>
        </div>
      )}
    </div>
  )
}

// 分离定义和导出的组件
export default FormRecorder
