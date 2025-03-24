import { useEffect, useState } from "react"

import {
  Button,
  Empty,
  Message,
  Popconfirm,
  Select,
  Tooltip
} from "~node_modules/@arco-design/web-react/es"
import { IconDelete, IconPlus } from "~node_modules/@arco-design/web-react/icon"
import dayjs from "~node_modules/dayjs"
import { sendMessage } from "~utils/sendMessage"

// 定义录制数据类型
interface Recording {
  id: string
  name: string
  timestamp: string
  actions: any[]
  count: number
}

interface Props {
  setIsCreated: (isCreated: boolean) => void
}

export const ReplayerList = ({ setIsCreated }: Props) => {
  const [selectedRecord, setSelectedRecord] = useState<string>()
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(
    null
  )

  // 从Chrome存储加载录制列表
  const loadRecordings = () => {
    chrome.storage.local.get(["recordings", "currentRecordingId"], (result) => {
      const loadedRecordings = result.recordings || []
      const currentRecordingId = result.currentRecordingId
      setRecordings(loadedRecordings)

      setSelectedRecord(currentRecordingId)
    })
  }

  // 删除录制
  const handleDelete = () => {
    if (!selectedRecord) return

    chrome.storage.local.get(["recordings"], (result) => {
      const existingRecordings = result.recordings || []
      const updatedRecordings = existingRecordings.filter(
        (r) => r.id !== selectedRecord
      )

      chrome.storage.local.set({ recordings: updatedRecordings }, () => {
        setSelectedRecord(undefined)
        setSelectedRecording(null)
        loadRecordings()
      })
      chrome.storage.local.remove("currentRecordingId")
    })
  }

  // 启动回放
  const handleClick = () => {
    if (!selectedRecording) return

    // 向当前选项卡发送回放指令和录制数据
    sendMessage({
      action: "replay",
      recording: selectedRecording
    })
    window.close()
  }

  const handleSelect = (value: string) => {
    setSelectedRecord(value)
    chrome.storage.local.set({ currentRecordingId: value })
  }

  // 组件挂载时加载录制列表
  useEffect(() => {
    loadRecordings()

    // 监听来自其他组件的消息，更新录制列表
    const handleMessage = (message) => {
      if (message.action === "updateRecordings") {
        loadRecordings()

        // 如果消息中包含要选中的录制ID，则设置选中状态
        if (message.selectedRecordingId) {
          setSelectedRecord(message.selectedRecordingId)
        }
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [])

  // 当选择的录制ID变化时，查找并设置当前选中的录制对象
  useEffect(() => {
    if (selectedRecord) {
      const recording = recordings.find((r) => r.id === selectedRecord) || null
      setSelectedRecording(recording)
    } else {
      setSelectedRecording(null)
    }
  }, [selectedRecord, recordings])

  return (
    <>
      <div className="w-full border-b pb-2 flex flex-col gap-[4px]">
        <div className="text-base font-bold">录制重放工具</div>
        <div className="text-xs text-gray-500">选中录像并进行回放</div>
      </div>
      <div className="flex items-center gap-2 w-full">
        <Tooltip content="创建新录制">
          <IconPlus
            className="cursor-pointer"
            onClick={() => setIsCreated(true)}
          />
        </Tooltip>
        <Select
          className="flex-1"
          options={recordings.map((r) => ({ label: r.name, value: r.id }))}
          placeholder="请选择录像"
          value={selectedRecord}
          onChange={handleSelect}></Select>

        {selectedRecord && (
          <Popconfirm
            icon={null}
            content={
              <div className="text-xs mr-[20px] text-gray-500">
                确定要删除当前这条录像吗？
              </div>
            }
            position="lt"
            onOk={() => {
              handleDelete()
            }}>
            <IconDelete className="cursor-pointer" />
          </Popconfirm>
        )}
      </div>
      <div className="w-full">
        {selectedRecording &&
          [
            { label: "录制名称", field: "name" },
            { label: "录制时间", field: "timestamp" },
            { label: "操作数量", field: "count" }
          ].map((item) => (
            <div
              key={item.field}
              className="flex text-xs my-[10px] break-all w-full">
              <div className="w-[80px] text-gray-500 text-left">
                {item.label}
              </div>
              <div className="flex-1 text-black overflow-hidden font-[500] mr-[20px]">
                {selectedRecording?.[item.field]}
              </div>
            </div>
          ))}
        {!selectedRecording && (
          <Empty description=" " className="h-[88px]"></Empty>
        )}
      </div>

      <Button
        className="w-full"
        type="primary"
        disabled={!selectedRecord}
        onClick={handleClick}>
        {selectedRecord ? "启动回放" : "请先选择录像"}
      </Button>
    </>
  )
}
