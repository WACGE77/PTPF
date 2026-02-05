import {Shell} from '@/utils/terminal.ts'
export type Dom = HTMLElement | null
export interface terminalTab{
  name: string
  shell: Shell
  ele: Dom
}
