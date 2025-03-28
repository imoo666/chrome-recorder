// 定义操作类型
export interface Action {
  type: "click" | "scroll" | "keydown"
  target: string
  value?: string
  key?: string
  keyCode?: number
  code?: string
  timestamp: number
  scrollX?: number
  scrollY?: number
}

// 录制的数据结构
export interface Recording {
  id: string
  name: string
  timestamp: string
  actions: Action[]
  count: number
}
