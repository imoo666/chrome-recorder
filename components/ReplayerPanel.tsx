import React, { useCallback, useEffect, useRef, useState } from "react"

import BasePanel from "./BasePanel"
import type { Action, Recording } from "./types"

interface ReplayerPanelProps {
  isVisible: boolean
  setIsVisible: (visible: boolean) => void
}

export const ReplayerPanel: React.FC<ReplayerPanelProps> = ({
  isVisible,
  setIsVisible
}) => {
  const [actions, setActions] = useState<Action[]>([])
  const [isReplaying, setIsReplaying] = useState(false)
  const [currentReplayIndex, setCurrentReplayIndex] = useState(0)
  const [replayErrors, setReplayErrors] = useState<
    Array<{ message: string; action: Action }>
  >([])
  const [currentRecordingName, setCurrentRecordingName] = useState("")

  // 用于停止回放的控制变量
  const shouldStopReplay = useRef(false)

  // 停止回放功能
  const stopReplay = useCallback(() => {
    shouldStopReplay.current = true
  }, [])

  // 重放操作
  const replayActions = async (
    actionsToReplay: Action[],
    recordingName: string = ""
  ) => {
    if (actionsToReplay.length === 0) return

    // 重置状态
    setIsReplaying(true)
    setCurrentReplayIndex(0)
    setReplayErrors([])
    shouldStopReplay.current = false
    setCurrentRecordingName(recordingName)

    for (let i = 0; i < actionsToReplay.length; i++) {
      // 检查是否应该停止回放
      if (shouldStopReplay.current) {
        break
      }

      const action = actionsToReplay[i]
      setCurrentReplayIndex(i + 1)

      try {
        const elements = document.querySelectorAll(action.target)
        if (elements.length === 0) {
          const errorMsg = `未找到元素: ${action.target}`
          console.error(errorMsg)
          setReplayErrors((prev) => [...prev, { message: errorMsg, action }])
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
            element.click?.()
            break
          case "keydown":
            // 创建并分发一个键盘事件
            const keyEvent = new KeyboardEvent("keydown", {
              key: action.key,
              keyCode: action.keyCode,
              code:
                action.code ||
                (action.key.length === 1
                  ? `Key${action.key.toUpperCase()}`
                  : action.key),
              bubbles: true,
              cancelable: true
            })
            element.dispatchEvent(keyEvent)

            // 特殊处理输入框元素
            if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
              // 更新输入框的值
              if (action.key.length === 1) {
                // 单个字符输入
                const input = element as HTMLInputElement
                const currentValue = input.value

                input.value = currentValue + action.key

                // 触发input事件
                const inputEvent = new Event("input", { bubbles: true })
                element.dispatchEvent(inputEvent)
              } else if (action.key === "Backspace") {
                // 处理退格键
                const input = element as HTMLInputElement
                const start = input.selectionStart || 0
                const currentValue = input.value
                input.value = currentValue.substring(0, start - 1)

                // 触发input事件
                const inputEvent = new Event("input", { bubbles: true })
                element.dispatchEvent(inputEvent)
              }
            }
            break
          case "scroll":
            if (
              element === document.documentElement ||
              element === document.body
            ) {
              window.scrollTo({
                left: action.scrollX || 0,
                top: action.scrollY || 0,
                behavior: "smooth"
              })
            } else {
              element.scrollLeft = action.scrollX || 0
              element.scrollTop = action.scrollY || 0
            }
            break
        }

        // 等待一小段时间以便用户观察
        await new Promise((resolve) => setTimeout(resolve, 800))

        // 恢复元素样式
        element.style.backgroundColor = originalBackground
        element.style.outline = originalOutline
      } catch (error: any) {
        const errorMsg = `重放操作时出错: ${error.message}`
        console.log(errorMsg, action)
        setReplayErrors((prev) => [...prev, { message: errorMsg, action }])
      }
    }

    // 回放完成
    setIsReplaying(false)
  }

  // 注册 chrome 的 message
  useEffect(() => {
    const messageListener = (message) => {
      if (message.action === "replay" && message.recording) {
        // 加载录制的操作并开始重放
        const recordingData = message.recording
        setActions(recordingData.actions)
        setIsVisible(true)

        replayActions(recordingData.actions, recordingData.name)
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }, [setIsVisible])

  return (
    <BasePanel
      title="回放工具"
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      containerClassName="opacity-100">
      {/* 回放状态显示 */}
      <div className="mb-[10px]">
        <div className="flex mb-[6px]">
          <div className="w-[60px]">录像名：</div>
          <div className="flex-1">{currentRecordingName}</div>
        </div>
        <div className="flex mb-[8px] justify-between">
          <div className="flex">
            <div className="w-[60px]">进度：</div>
            <div className="flex-1">
              {currentReplayIndex}/{actions.length}
            </div>
          </div>
          {isReplaying && (
            <button
              className="bg-red-500 text-white border-none rounded px-[6px] py-[2px] cursor-pointer text-xs"
              onClick={stopReplay}>
              停止回放
            </button>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded h-[5px]">
          <div
            className="bg-blue-500 h-full rounded"
            style={{
              width: `${(currentReplayIndex / Math.max(1, actions.length)) * 100}%`
            }}></div>
        </div>

        {replayErrors.length > 0 && (
          <div className="mt-[10px]">
            <details>
              <summary className="text-red-500 cursor-pointer">
                {replayErrors.length} 个错误
              </summary>
              <div className="mt-[6px] max-h-[100px] overflow-y-auto text-xs">
                {replayErrors.map((error, idx) => (
                  <div key={idx} className="bg-red-50 p-[2px] mb-[2px] rounded">
                    {error.message}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>

      {!isReplaying && currentReplayIndex > 0 && (
        <div className="text-center text-gray-500 text-xs">
          回放已{shouldStopReplay.current ? "中止" : "完成"}
        </div>
      )}
    </BasePanel>
  )
}

export default ReplayerPanel
