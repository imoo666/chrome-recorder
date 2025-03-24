import React, { useEffect, useRef, useState } from "react"

interface BasePanelProps {
  title: string
  isVisible: boolean
  setIsVisible: (visible: boolean) => void
  children: React.ReactNode
  containerClassName?: string
}

export const BasePanel: React.FC<BasePanelProps> = ({
  title,
  isVisible,
  setIsVisible,
  children,
  containerClassName = ""
}) => {
  const [isMinimized, setIsMinimized] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const titleBarRef = useRef<HTMLDivElement>(null)

  // 拖拽状态
  const dragState = useRef({
    isDragging: false,
    offsetX: 0,
    offsetY: 0
  })

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

  if (!isVisible) return null

  return (
    <div
      ref={containerRef}
      className={`border border-black-500 fixed top-[200px] right-[5px] w-[300px] bg-white rounded-[10px] shadow-lg z-[10000] py-[10px] px-[20px] select-none transition-opacity duration-300 ${containerClassName}`}>
      {/* 标题栏（可拖动区域） */}
      <div
        ref={titleBarRef}
        className="cursor-move flex justify-between items-center border-b border-gray-100 pb-[5px] mb-[20px]">
        <div className="text-base font-bold flex items-center">{title}</div>

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

      {!isMinimized && <div className="text-sm">{children}</div>}
    </div>
  )
}

export default BasePanel
