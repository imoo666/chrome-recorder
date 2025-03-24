// 定义操作类型
export interface Action {
  type: "click" | "input" | "scroll"
  target: string
  value?: string
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
