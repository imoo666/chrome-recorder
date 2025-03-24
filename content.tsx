import cssText from "data-text:~index.css"
import React, { useEffect, useState } from "react"

import RecorderPanel from "~components/RecorderPanel"
import ReplayerPanel from "~components/ReplayerPanel"

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

// 创建一个React组件，并显式导出
export const FormRecorder: React.FC = () => {
  const [isRecorderVisible, setIsRecorderVisible] = useState(false)
  const [isReplayerVisible, setIsReplayerVisible] = useState(false)

  // 监听消息，显示适当的面板
  useEffect(() => {
    const messageListener = (message) => {
      if (message.action === "start") {
        // 显示录制面板
        setIsRecorderVisible(true)
        setIsReplayerVisible(false)
      } else if (message.action === "replay") {
        // 显示回放面板
        setIsReplayerVisible(true)
        setIsRecorderVisible(false)
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }, [])

  return (
    <>
      <RecorderPanel
        isVisible={isRecorderVisible}
        setIsVisible={setIsRecorderVisible}
      />
      <ReplayerPanel
        isVisible={isReplayerVisible}
        setIsVisible={setIsReplayerVisible}
      />
    </>
  )
}

// 分离定义和导出的组件
export default FormRecorder
