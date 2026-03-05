import {Shell} from '@/utils/terminal.ts'
import {RdpShell} from '@/utils/rdpTerminal.ts'
export type Dom = HTMLElement | null
export interface terminalTab{
  name: string
  shell: Shell | RdpShell
  ele: Dom
  type: 'ssh' | 'rdp'
  resourceId: number
  voucherId: number
  token: string
  resourceName: string
}
