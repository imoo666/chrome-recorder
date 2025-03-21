import { useEffect, useState } from "react"

import "@arco-design/web-react/dist/css/arco.css"
import "./index.css"

import { ReplayerCreation } from "~components/ReplayerCreation"
import { ReplayerList } from "~components/ReplayerList"
import { Message } from "~node_modules/@arco-design/web-react/es"

function IndexPopup() {
  const [isCreated, setIsCreated] = useState(false)
  return (
    <div className="p-4 flex flex-col items-center w-[400px] gap-[10px]">
      {isCreated ? (
        <ReplayerCreation setIsCreated={setIsCreated} />
      ) : (
        <ReplayerList setIsCreated={setIsCreated} />
      )}
    </div>
  )
}

export default IndexPopup
