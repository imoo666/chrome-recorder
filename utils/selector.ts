import { getCssSelector } from "css-selector-generator"

// 获取元素的CSS选择器
export function getSelector(element: Element | null): string {
  if (!element) return ""
  return getCssSelector(element, {
    blacklist: [
      // 匹配以"-数字"结尾的ID
      /^#.*-\d+$/,
      // 匹配以"_数字"结尾的ID
      /^#.*_\d+$/,
      // 匹配以 ed 结尾的 class
      /.*ed$/,
      // 匹配所有含有 checked/focus 的任意选择器
      /.*checked.*$/,
      /.*focus.*$/
    ]
  })
}
