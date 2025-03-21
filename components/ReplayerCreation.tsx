import { useState } from "react"

import { Button, Input, Tooltip } from "~node_modules/@arco-design/web-react/es"
import { IconCheck, IconLeft } from "~node_modules/@arco-design/web-react/icon"
import { sendMessage } from "~utils/sendMessage"

interface Props {
  setIsCreated: (isCreated: boolean) => void
}
export const ReplayerCreation = ({ setIsCreated }: Props) => {
  const [name, setName] = useState<string>(
    "replayer-" + Date.now().toString().slice(0, -3)
  )

  const handleClick = () => {
    sendMessage({
      action: "start",
      name: name
    })
    window.close()
  }
  return (
    <>
      <div className="w-full border-b pb-2 flex flex-col gap-[4px]">
        <div className="text-base font-bold">创建新录像</div>
        <div className="text-xs text-gray-500">将记录您对浏览器的各种操作</div>
      </div>

      <div className="flex items-center w-full mt-[10px]">
        <div className="w-[80px] text-xs text-gray-500">新录像名称</div>
        <Input
          placeholder="请输入新录像名称"
          className="flex-1"
          value={name}
          onChange={(value) => setName(value)}
        />
      </div>
      <div className="flex gap-2 mt-[10px] w-full">
        <Button className="flex-1" type="primary" onClick={handleClick}>
          开始录制
        </Button>
        <Button className="flex-1" onClick={() => setIsCreated(false)}>
          取消
        </Button>
      </div>
    </>
  )
}
