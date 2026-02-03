// src/utils/iconMap.ts
import {
  User,
  Key,
  Document,
  House,
  Setting,
  Monitor,
  FullScreen,
  ArrowDown,
  ArrowRight,
  UserFilled,
  Delete,
  Edit,
  Plus,
  Lock,
  Van,
  RefreshRight,
  Close,
} from '@element-plus/icons-vue'

export function getIconComponent(iconName: string) {
  // 检查 iconName 是否是 iconMap 的有效 key
  if (iconName in iconMap) {
    return iconMap[iconName as IconName]
  }
  // 可选：返回默认图标，比如一个问号
  // return QuestionFilled
  return undefined
}

export const iconMap = {
  User,
  Key,
  Document,
  House,
  Setting,
  Monitor,
  FullScreen,
  ArrowDown,
  ArrowRight,
  UserFilled,
  Delete,
  Edit,
  Plus,
  Lock,
  Van,
  RefreshRight,
  Close,

}
export type IconName = keyof typeof iconMap
