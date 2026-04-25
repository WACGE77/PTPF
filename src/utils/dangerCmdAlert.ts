import requests from '@/requests'

export interface DangerCmdRule {
  id: string
  group_id: string
  pattern: string
  type: 'exact' | 'prefix' | 'regex'
  priority: number
  description: string
  created_at?: string
  updated_at?: string
}

export interface DangerCmdLog {
  type: 'command_alert'
  target: string
  reason: string
  time: number
  ruleId?: string
}

export class DangerCmdRuleManager {
  static STORAGE_KEY = 'danger_cmd_rules'
  
  getRules(groupId?: string): DangerCmdRule[] {
    const raw = localStorage.getItem(DangerCmdRuleManager.STORAGE_KEY)
    const rules = raw ? JSON.parse(raw) : []
    const validRules = rules.filter((rule: DangerCmdRule) => rule.group_id)
    if (groupId) {
      return validRules.filter((rule: DangerCmdRule) => rule.group_id.toString() === groupId.toString())
    }
    return validRules
  }
  
  addRule(rule: Omit<DangerCmdRule, 'id'>): DangerCmdRule {
    const rules = this.getRules()
    const newRule = { ...rule, id: Date.now().toString() }
    rules.push(newRule)
    localStorage.setItem(DangerCmdRuleManager.STORAGE_KEY, JSON.stringify(rules))
    return newRule
  }
  
  deleteRule(ruleId: string): void {
    let rules = this.getRules()
    rules = rules.filter((rule: DangerCmdRule) => rule.id !== ruleId)
    localStorage.setItem(DangerCmdRuleManager.STORAGE_KEY, JSON.stringify(rules))
  }
  
  updateRule(ruleId: string, updates: Partial<DangerCmdRule>): void {
    let rules = this.getRules()
    rules = rules.map((rule: DangerCmdRule) => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    )
    localStorage.setItem(DangerCmdRuleManager.STORAGE_KEY, JSON.stringify(rules))
  }
  
  clearRules(groupId?: string): void {
    if (groupId) {
      const rules = this.getRules().filter((rule: DangerCmdRule) => rule.group_id !== groupId)
      localStorage.setItem(DangerCmdRuleManager.STORAGE_KEY, JSON.stringify(rules))
    } else {
      localStorage.removeItem(DangerCmdRuleManager.STORAGE_KEY)
    }
  }
}

export class DangerCmdLogManager {
  static STORAGE_KEY = 'danger_cmd_logs'
  static CACHE_KEY = 'danger_cmd_logs_cache'
  
  getLogs(): DangerCmdLog[] {
    const raw = localStorage.getItem(DangerCmdLogManager.STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  }
  
  addLog(log: DangerCmdLog): void {
    let logs = this.getLogs()
    logs.push(log)
    if (logs.length > 100) {
      logs = logs.slice(-100)
    }
    localStorage.setItem(DangerCmdLogManager.STORAGE_KEY, JSON.stringify(logs))
  }
  
  getCachedLogs(): DangerCmdLog[] {
    const raw = localStorage.getItem(DangerCmdLogManager.CACHE_KEY)
    return raw ? JSON.parse(raw) : []
  }
  
  addCachedLog(log: DangerCmdLog): void {
    let logs = this.getCachedLogs()
    logs.push(log)
    localStorage.setItem(DangerCmdLogManager.CACHE_KEY, JSON.stringify(logs))
  }
  
  clearCachedLogs(): void {
    localStorage.removeItem(DangerCmdLogManager.CACHE_KEY)
  }
  
  clearLogs(): void {
    localStorage.removeItem(DangerCmdLogManager.STORAGE_KEY)
  }
}

export class DangerCmdSync {
  constructor(private ruleManager: DangerCmdRuleManager, private logManager: DangerCmdLogManager) {}
  
  async pullRules(groupId: string, pageNumber: number = 1, pageSize: number = 10): Promise<{ rules: DangerCmdRule[], total: number }> {
    try {
      const res = await requests.get(`/danger_cmd/filter/get/`, { 
        group_id: groupId,
        page_number: pageNumber,
        page_size: pageSize
      })
      
      const response = res.data
      const remoteRules = response.detail || response.success || []
      const total = response.total || 0
      
      const formattedRules = remoteRules.map((rule: any) => ({
        ...rule,
        group_id: rule.group_id.toString(),
        id: rule.id.toString()
      }))
      
      const existingRules = this.ruleManager.getRules().filter(rule => rule.group_id && rule.group_id.toString() !== groupId.toString())
      const mergedRules = [...existingRules, ...formattedRules]
      localStorage.setItem(DangerCmdRuleManager.STORAGE_KEY, JSON.stringify(mergedRules))
      console.log('危险命令规则同步成功，规则数量:', formattedRules.length, '总数量:', total)
      return { rules: formattedRules, total }
    } catch (e) {
      console.error('拉取危险命令规则失败', e)
      return { rules: [], total: 0 }
    }
  }
  
  async addRule(rule: Omit<DangerCmdRule, 'id'>): Promise<DangerCmdRule | null> {
    try {
      const ruleWithGroup = {
        group_id: parseInt(rule.group_id),
        pattern: rule.pattern,
        type: rule.type,
        priority: rule.priority,
        description: rule.description
      }
      
      const res = await requests.post('/danger_cmd/filter/add/', ruleWithGroup)
      
      const response = res.data
      const newRule = response.detail || response.success || null
      if (newRule) {
        this.ruleManager.addRule(newRule)
        console.log('添加危险命令规则成功', newRule)
      }
      return newRule
    } catch (e) {
      console.error('添加危险命令规则失败', e)
      return null
    }
  }
  
  async updateRule(ruleId: string, updates: Partial<DangerCmdRule>): Promise<DangerCmdRule | null> {
    try {
      const updatesWithGroup = {
        group_id: updates.group_id ? parseInt(updates.group_id) : undefined,
        pattern: updates.pattern,
        type: updates.type,
        priority: updates.priority,
        description: updates.description,
        id: ruleId
      }
      
      const res = await requests.post('/danger_cmd/filter/edit/', updatesWithGroup)
      
      const response = res.data
      const updatedRule = response.detail || response.success || null
      if (updatedRule) {
        this.ruleManager.updateRule(ruleId, updatedRule)
        console.log('更新危险命令规则成功', updatedRule)
      }
      return updatedRule
    } catch (e) {
      console.error('更新危险命令规则失败', e)
      return null
    }
  }
  
  async deleteRule(ruleId: string): Promise<boolean> {
    try {
      const res = await requests.post('/danger_cmd/filter/del/', { id_list: [parseInt(ruleId)] })
      
      this.ruleManager.deleteRule(ruleId)
      console.log('删除危险命令规则成功', ruleId)
      return true
    } catch (e) {
      console.error('删除危险命令规则失败', e)
      return false
    }
  }
  
  async reportLogs(): Promise<void> {
    try {
      const cachedLogs = this.logManager.getCachedLogs()
      if (cachedLogs.length === 0) return
      
      const res = await requests.post('/danger_cmd/log/list/', cachedLogs)
      
      console.log('上报危险命令告警日志成功', cachedLogs)
      this.logManager.clearCachedLogs()
    } catch (e) {
      console.error('上报危险命令日志失败', e)
    }
  }
}

export class DangerCmdAlertManager {
  ruleManager: DangerCmdRuleManager
  logManager: DangerCmdLogManager
  sync: DangerCmdSync
  
  constructor() {
    this.ruleManager = new DangerCmdRuleManager()
    this.logManager = new DangerCmdLogManager()
    this.sync = new DangerCmdSync(this.ruleManager, this.logManager)
  }
  
  async initialize(): Promise<void> {
    setInterval(() => {
      this.sync.reportLogs()
    }, 5 * 60 * 1000)
  }
  
  async addRule(rule: Omit<DangerCmdRule, 'id'>): Promise<DangerCmdRule | null> {
    return await this.sync.addRule(rule)
  }
  
  async deleteRule(ruleId: string): Promise<boolean> {
    return await this.sync.deleteRule(ruleId)
  }
  
  async updateRule(ruleId: string, updates: Partial<DangerCmdRule>): Promise<DangerCmdRule | null> {
    return await this.sync.updateRule(ruleId, updates)
  }
  
  getRules(groupId?: string): DangerCmdRule[] {
    return this.ruleManager.getRules(groupId)
  }
  
  async syncRules(groupId: string, pageNumber: number = 1, pageSize: number = 10): Promise<{ rules: DangerCmdRule[], total: number }> {
    return await this.sync.pullRules(groupId, pageNumber, pageSize)
  }
  
  getLogs(): DangerCmdLog[] {
    return this.logManager.getLogs()
  }
}

export const dangerCmdAlertManager = new DangerCmdAlertManager()

export const initializeDangerCmdAlert = async () => {
  await dangerCmdAlertManager.initialize()
}
