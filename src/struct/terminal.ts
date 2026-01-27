import {Shell} from '@/utils/terminal.ts'
import type { ComponentPublicInstance } from 'vue'
export type Dom = HTMLElement | null
export interface terminalTab{
  name: string
  shell: Shell
  ele: Dom
}
