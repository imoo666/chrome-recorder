import { debounce } from "lodash"
import React, { useCallback, useEffect, useState } from "react"

import dayjs from "~node_modules/dayjs"
import { getSelector } from "~utils/selector"

import BasePanel from "./BasePanel"
import type { Action, Recording } from "./types"

interface RecorderPanelProps {
  isVisible: boolean
  setIsVisible: (visible: boolean) => void
}

export const RecorderPanel: React.FC<RecorderPanelProps> = ({
  isVisible,
  setIsVisible
}) => {
  const [recordedActions, setRecordedActions] = useState<Action[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isRecordingCompleted, setIsRecordingCompleted] = useState(false)

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

  // 点击事件处理器 - 使用最早的捕获阶段
  const handleClick = useCallback((event: PointerEvent) => {
    const target = event.target as HTMLElement

    // 如果是组件库的隐藏事件？
    if (event.pointerId === -1) {
      return
    }

    const selector = getSelector(target)
    if (selector.includes("plasmo")) {
      return
    }

    // 记录动作
    setRecordedActions((prev) => [
      ...prev,
      {
        type: "click",
        target: selector,
        timestamp: Date.now()
      }
    ])
  }, [])

  // 键盘事件处理器
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement
    const selector = getSelector(target)

    setRecordedActions((prev) => [
      ...prev,
      {
        type: "keydown",
        target: selector,
        key: event.key,
        keyCode: event.keyCode,
        code: event.code,
        timestamp: Date.now()
      }
    ])
  }, [])

  // 滚动事件处理器
  const handleScroll = useCallback(
    debounce((event: Event) => {
      const target = event.target as HTMLElement
      const selector = getSelector(target)

      // 获取滚动位置
      const scrollX =
        target === document.documentElement
          ? window.scrollX
          : (target as Element).scrollLeft
      const scrollY =
        target === document.documentElement
          ? window.scrollY
          : (target as Element).scrollTop

      setRecordedActions((prev) => [
        ...prev,
        {
          type: "scroll",
          target: selector,
          timestamp: Date.now(),
          scrollX,
          scrollY
        }
      ])
    }, 300),
    []
  )

  // 保存录制功能
  const saveRecording = useCallback(() => {
    setIsRecording(false)
    setIsRecordingCompleted(true)

    // 获取当前时间作为录制ID
    const recordingId = Date.now().toString()
    const timestamp = dayjs().format("YYYY-MM-DD HH:mm:ss")

    // 从localStorage获取用户设置的名称
    const savedName = localStorage.getItem("currentRecordingName")

    // 准备要保存的录制数据
    const recording: Recording = {
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

      chrome.storage.local.set(
        { recordings, currentRecordingId: recordingId },
        () => {
          // 关闭当前弹窗
          setIsVisible(false)
          setRecordedActions([])
          // 打开popup窗口
          chrome.runtime.sendMessage("openPopup")
        }
      )
    })
  }, [recordedActions, setIsVisible])

  // 重新录制
  const resetRecording = useCallback(() => {
    setRecordedActions([])
    setIsRecordingCompleted(false)
  }, [])

  // 注册事件监听器 - 使用更底层的事件监听方式
  useEffect(() => {
    const registerEvents = () => {
      document.addEventListener("click", handleClick, { capture: true })
      document.addEventListener("keydown", handleKeyDown, { capture: true })
      document.addEventListener("scroll", handleScroll, {
        capture: true,
        passive: true
      })
    }

    const unregisterEvents = () => {
      document.removeEventListener("click", handleClick, { capture: true })
      document.removeEventListener("keydown", handleKeyDown, { capture: true })
      document.removeEventListener("scroll", handleScroll, { capture: true })
    }

    if (isRecording) {
      registerEvents()
    } else {
      unregisterEvents()
    }

    return unregisterEvents
  }, [isRecording, handleClick, handleKeyDown, handleScroll])

  // 接收消息
  useEffect(() => {
    const messageListener = (message) => {
      if (message.action === "start") {
        setIsVisible(true)
        setIsRecordingCompleted(false)
        startRecording()
        localStorage.setItem("currentRecordingName", message.name)
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }, [setIsVisible])

  return (
    <BasePanel
      title="录制工具"
      isVisible={isVisible}
      setIsVisible={setIsVisible}
      containerClassName="opacity-70 hover:opacity-100">
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

      <div className="text-xs text-gray-500 my-[8px]">
        已录制的操作: {recordedActions.length}
      </div>

      {/* 提示信息 */}
      <div className="text-xs text-gray-500">
        提示: 录制会捕获点击、键盘和滚动操作
      </div>
    </BasePanel>
  )
}

export default RecorderPanel
