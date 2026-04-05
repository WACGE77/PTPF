import requests from '@/requests'

// 黑名单规则结构
export interface BlacklistRule {
  id: string
  group_id: string
  pattern: string
  type: 'exact' | 'prefix' | 'regex'
  priority: number
  description: string
  create_date?: string
  update_date?: string
}

// 日志结构
export interface BlacklistLog {
  type: 'command_block'
  target: string
  reason: string
  time: number
  ruleId?: string
}

// 规则管理器
export class BlacklistRuleManager {
  static STORAGE_KEY = 'ssh_blacklist_rules'
  
  getRules(groupId?: string): BlacklistRule[] {
    const raw = localStorage.getItem(BlacklistRuleManager.STORAGE_KEY)
    const rules = raw ? JSON.parse(raw) : []
    // 过滤掉没有group_id的规则
    const validRules = rules.filter((rule: BlacklistRule) => rule.group_id)
    if (groupId) {
      return validRules.filter((rule: BlacklistRule) => rule.group_id.toString() === groupId.toString())
    }
    return validRules
  }
  
  addRule(rule: Omit<BlacklistRule, 'id'>): BlacklistRule {
    const rules = this.getRules()
    const newRule = { ...rule, id: Date.now().toString() }
    rules.push(newRule)
    localStorage.setItem(BlacklistRuleManager.STORAGE_KEY, JSON.stringify(rules))
    return newRule
  }
  
  deleteRule(ruleId: string): void {
    let rules = this.getRules()
    rules = rules.filter((rule: BlacklistRule) => rule.id !== ruleId)
    localStorage.setItem(BlacklistRuleManager.STORAGE_KEY, JSON.stringify(rules))
  }
  
  updateRule(ruleId: string, updates: Partial<BlacklistRule>): void {
    let rules = this.getRules()
    rules = rules.map((rule: BlacklistRule) => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    )
    localStorage.setItem(BlacklistRuleManager.STORAGE_KEY, JSON.stringify(rules))
  }
  
  clearRules(groupId?: string): void {
    if (groupId) {
      const rules = this.getRules().filter((rule: BlacklistRule) => rule.group_id !== groupId)
      localStorage.setItem(BlacklistRuleManager.STORAGE_KEY, JSON.stringify(rules))
    } else {
      localStorage.removeItem(BlacklistRuleManager.STORAGE_KEY)
    }
  }
}

// 校验引擎
export class BlacklistChecker {
  constructor(private ruleManager: BlacklistRuleManager) {}
  
  checkCommand(command: string, groupId: string): { blocked: boolean; rule?: BlacklistRule } {
    const rules = this.ruleManager.getRules(groupId)
    
    // 按优先级排序规则
    rules.sort((a, b) => b.priority - a.priority)
    
    for (const rule of rules) {
      // 匹配命令
      if (!rule || !rule.pattern) {
        continue
      }
      const pattern = rule.pattern.trim()
      if (!pattern) {
        continue
      }
      
      const command_stripped = command.trim()
      
      // 精确匹配
      if (rule.type === 'exact') {
        if (command_stripped === pattern) {
          return { 
            blocked: true, 
            rule 
          }
        }
      }
      // 前缀匹配
      else if (rule.type === 'prefix') {
        if (command_stripped.startsWith(pattern)) {
          return { 
            blocked: true, 
            rule 
          }
        }
      }
      // 正则匹配
      else if (rule.type === 'regex') {
        try {
          if (new RegExp(pattern).test(command_stripped)) {
            return { 
              blocked: true, 
              rule 
            }
          }
        } catch (error) {
          console.error('正则错误:', error)
        }
      }
    }
    
    return { blocked: false }
  }
}

// 日志管理器
export class BlacklistLogManager {
  static STORAGE_KEY = 'ssh_blacklist_logs'
  static CACHE_KEY = 'ssh_blacklist_logs_cache'
  
  getLogs(): BlacklistLog[] {
    const raw = localStorage.getItem(BlacklistLogManager.STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  }
  
  addLog(log: BlacklistLog): void {
    let logs = this.getLogs()
    logs.push(log)
    // 只保留最近100条日志
    if (logs.length > 100) {
      logs = logs.slice(-100)
    }
    localStorage.setItem(BlacklistLogManager.STORAGE_KEY, JSON.stringify(logs))
  }
  
  getCachedLogs(): BlacklistLog[] {
    const raw = localStorage.getItem(BlacklistLogManager.CACHE_KEY)
    return raw ? JSON.parse(raw) : []
  }
  
  addCachedLog(log: BlacklistLog): void {
    let logs = this.getCachedLogs()
    logs.push(log)
    localStorage.setItem(BlacklistLogManager.CACHE_KEY, JSON.stringify(logs))
  }
  
  clearCachedLogs(): void {
    localStorage.removeItem(BlacklistLogManager.CACHE_KEY)
  }
  
  clearLogs(): void {
    localStorage.removeItem(BlacklistLogManager.STORAGE_KEY)
  }
}

// 行为执行器
export class BlacklistBlocker {
  constructor(private logManager: BlacklistLogManager) {}
  
  blockCommand(command: string, reason: string, rule?: BlacklistRule): void {
    // 展示拦截提示
    this.showNotification('error', 'SSH指令被阻断', `禁止执行指令 "${command}"：${reason}`)
    
    // 记录拦截日志
    const log: BlacklistLog = {
      type: 'command_block',
      target: command,
      reason,
      time: Date.now(),
      ruleId: rule?.id
    }
    this.logManager.addLog(log)
    this.logManager.addCachedLog(log)
  }
  
  private showNotification(type: 'error', title: string, content: string): void {
    // 集成 Element Plus 的 ElMessage
    if (typeof window !== 'undefined') {
      try {
        const { ElMessage } = require('element-plus')
        ElMessage.error({
          message: content,
          duration: 3000
        })
      } catch (error) {
        // 临时实现，实际项目中应确保 Element Plus 已正确导入
        console.log(`[${type.toUpperCase()}] ${title}: ${content}`)
      }
    }
  }
}

// 规则同步器
export class BlacklistSync {
  constructor(private ruleManager: BlacklistRuleManager, private logManager: BlacklistLogManager) {}
  
  async pullRules(groupId: string, pageNumber: number = 1, pageSize: number = 10): Promise<{ rules: BlacklistRule[], total: number }> {
    try {
      // 从后端拉取规则
      const res = await requests.get(`/ssh_filter/filter/get/`, { 
        group_id: groupId,
        page_number: pageNumber,
        page_size: pageSize
      })
      
      const response = res.data
      // 从 detail 字段获取数据，而不是 success 字段
      const remoteRules = response.detail || response.success || []
      const total = response.total || 0
      
      // 转换规则格式，确保group_id和id是字符串类型
      const formattedRules = remoteRules.map((rule: any) => ({
        ...rule,
        group_id: rule.group_id.toString(),
        id: rule.id.toString()
      }))
      
      // 保存规则到本地存储（只保存当前页的规则）
      const existingRules = this.ruleManager.getRules().filter(rule => rule.group_id && rule.group_id.toString() !== groupId.toString())
      const mergedRules = [...existingRules, ...formattedRules]
      localStorage.setItem(BlacklistRuleManager.STORAGE_KEY, JSON.stringify(mergedRules))
      console.log('黑名单规则同步成功，规则数量:', formattedRules.length, '总数量:', total)
      return { rules: formattedRules, total }
    } catch (e) {
      console.error('拉取黑名单规则失败', e)
      return { rules: [], total: 0 }
    }
  }
  
  async addRule(rule: Omit<BlacklistRule, 'id'>): Promise<BlacklistRule | null> {
    try {
      // 只发送 group_id 字段，让后端来处理
      const ruleWithGroup = {
        group_id: parseInt(rule.group_id),
        pattern: rule.pattern,
        type: rule.type,
        priority: rule.priority,
        description: rule.description
      }
      
      const res = await requests.post('/ssh_filter/filter/add/', ruleWithGroup)
      
      const response = res.data
      // 从 detail 字段获取数据，而不是 success 字段
      const newRule = response.detail || response.success || null
      if (newRule) {
        this.ruleManager.addRule(newRule)
        console.log('添加黑名单规则成功', newRule)
      }
      return newRule
    } catch (e) {
      console.error('添加黑名单规则失败', e)
      return null
    }
  }
  
  async updateRule(ruleId: string, updates: Partial<BlacklistRule>): Promise<BlacklistRule | null> {
    try {
      // 只发送 group_id 字段，让后端来处理
      const updatesWithGroup = {
        group_id: updates.group_id ? parseInt(updates.group_id) : undefined,
        pattern: updates.pattern,
        type: updates.type,
        priority: updates.priority,
        description: updates.description,
        id: ruleId
      }
      
      const res = await requests.post('/ssh_filter/filter/edit/', updatesWithGroup)
      
      const response = res.data
      // 从 detail 字段获取数据，而不是 success 字段
      const updatedRule = response.detail || response.success || null
      if (updatedRule) {
        this.ruleManager.updateRule(ruleId, updatedRule)
        console.log('更新黑名单规则成功', updatedRule)
      }
      return updatedRule
    } catch (e) {
      console.error('更新黑名单规则失败', e)
      return null
    }
  }
  
  async deleteRule(ruleId: string): Promise<boolean> {
    try {
      const res = await requests.post('/ssh_filter/filter/del/', { id_list: [parseInt(ruleId)] })
      
      this.ruleManager.deleteRule(ruleId)
      console.log('删除黑名单规则成功', ruleId)
      return true
    } catch (e) {
      console.error('删除黑名单规则失败', e)
      return false
    }
  }
  
  async reportLogs(): Promise<void> {
    try {
      const cachedLogs = this.logManager.getCachedLogs()
      if (cachedLogs.length === 0) return
      
      const res = await requests.post('/ssh_filter/log/list/', cachedLogs)
      
      console.log('上报黑名单拦截日志成功', cachedLogs)
      this.logManager.clearCachedLogs()
    } catch (e) {
      console.error('上报黑名单日志失败', e)
      // 上报失败，保留缓存
    }
  }
}

// 主管理器
export class SSHBlacklistManager {
  ruleManager: BlacklistRuleManager
  checker: BlacklistChecker
  blocker: BlacklistBlocker
  logManager: BlacklistLogManager
  sync: BlacklistSync
  
  constructor() {
    this.ruleManager = new BlacklistRuleManager()
    this.logManager = new BlacklistLogManager()
    this.checker = new BlacklistChecker(this.ruleManager)
    this.blocker = new BlacklistBlocker(this.logManager)
    this.sync = new BlacklistSync(this.ruleManager, this.logManager)
  }
  
  // 初始化
  async initialize(): Promise<void> {
    // 定时上报日志
    setInterval(() => {
      this.sync.reportLogs()
    }, 5 * 60 * 1000) // 每5分钟
  }
  
  // 检查命令
  checkCommand(command: string, groupId: string): boolean {
    const result = this.checker.checkCommand(command, groupId)
    if (result.blocked) {
      this.blocker.blockCommand(command, result.rule?.description || '命令被禁止', result.rule)
      return false
    }
    return true
  }
  
  // 管理规则
  async addRule(rule: Omit<BlacklistRule, 'id'>): Promise<BlacklistRule | null> {
    return await this.sync.addRule(rule)
  }
  
  async deleteRule(ruleId: string): Promise<boolean> {
    return await this.sync.deleteRule(ruleId)
  }
  
  async updateRule(ruleId: string, updates: Partial<BlacklistRule>): Promise<BlacklistRule | null> {
    return await this.sync.updateRule(ruleId, updates)
  }
  
  getRules(groupId?: string): BlacklistRule[] {
    return this.ruleManager.getRules(groupId)
  }
  
  async syncRules(groupId: string, pageNumber: number = 1, pageSize: number = 10): Promise<{ rules: BlacklistRule[], total: number }> {
    return await this.sync.pullRules(groupId, pageNumber, pageSize)
  }
  
  getLogs(): BlacklistLog[] {
    return this.logManager.getLogs()
  }
}

// 单例实例
export const sshBlacklistManager = new SSHBlacklistManager()

// 导出便捷方法
export const checkSSHCommand = (command: string, groupId: string) => {
  return sshBlacklistManager.checkCommand(command, groupId)
}

export const initializeSSHBlacklist = async () => {
  await sshBlacklistManager.initialize()
}
