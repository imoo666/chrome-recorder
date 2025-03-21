// 传给当前标签页内容脚本的消息
export const sendMessage = (message: string | object) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, message)
    }
  })
}
