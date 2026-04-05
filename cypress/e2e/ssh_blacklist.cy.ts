describe('SSH黑名单管理页面测试', () => {
  beforeEach(() => {
    // 登录系统
    cy.visit('http://localhost:5173/')
    
    // 等待登录页面加载
    cy.wait(1000)
    
    // 输入用户名和密码
    cy.get('input').first().type('administrator')
    cy.get('input').eq(1).type('administrator')
    
    // 点击登录按钮
    cy.get('button').contains('登录').click()
    
    // 等待页面跳转
    cy.wait(1000)
    
    // 导航到SSH黑名单管理页面
    cy.get('.el-menu-item').contains('SSH黑名单').click()
  })

  it('测试页面是否正常渲染，数据是否正确显示', () => {
    // 检查页面标题
    cy.get('h2').contains('SSH黑名单管理')
    
    // 检查系统组选择器
    cy.get('.system-group-selector .el-select').should('be.visible')
    
    // 检查添加规则按钮
    cy.get('.system-group-selector .el-button').contains('+ 添加规则')
    
    // 等待数据加载
    cy.wait(2000)
    
    // 检查规则列表是否有数据
    cy.get('.rules-card').should('be.visible')
    cy.get('.rules-card .el-table').should('be.visible')
    
    // 检查是否有规则数据
    cy.get('.rules-card .el-table__body-wrapper').then(($body) => {
      const text = $body.text()
      cy.log('表格内容:', text)
      
      // 如果没有数据，显示提示信息
      if (text.includes('暂无规则')) {
        cy.log('没有规则数据')
      } else {
        // 如果有数据，检查是否有规则ID列
        cy.get('.rules-card .el-table__body-wrapper .el-table__row').should('have.length.greaterThan', 0)
      }
    })
    
    // 检查拦截日志
    cy.get('.logs-card').should('be.visible')
    cy.get('.logs-card .el-table').should('be.visible')
  })

  it('测试点击按钮是否能弹出弹窗', () => {
    // 等待添加规则按钮加载
    cy.wait(1000)
    
    // 点击添加规则按钮
    cy.get('.system-group-selector .el-button').contains('+ 添加规则').click()
    
    // 等待弹窗加载
    cy.wait(1000)
    
    // 检查弹窗是否显示
    cy.get('.el-dialog').should('be.visible')
    cy.get('.el-dialog__title').contains('添加规则')
    
    // 关闭弹窗
    cy.get('.el-dialog__footer .el-button').contains('取消').click()
    
    // 等待弹窗关闭
    cy.wait(1000)
    
    cy.get('.el-dialog').should('not.be.visible')
  })

  it('测试表单输入是否正常', () => {
    // 等待添加规则按钮加载
    cy.wait(1000)
    
    // 点击添加规则按钮
    cy.get('.system-group-selector .el-button').contains('+ 添加规则').click()
    
    // 等待弹窗加载
    cy.wait(1000)
    
    // 输入匹配模式
    cy.get('input[placeholder="输入匹配模式"]').type('test_pattern')
    
    // 选择匹配类型
    cy.get('.el-radio').contains('前缀匹配').click()
    
    // 输入优先级
    cy.get('.el-input-number__increase').click()
    
    // 输入规则描述
    cy.get('textarea[placeholder="输入规则描述"]').type('测试规则描述')
    
    // 关闭弹窗
    cy.get('.el-dialog__footer .el-button').contains('取消').click()
  })

  it('测试接口请求是否正常', () => {
    // 拦截获取规则列表的请求
    cy.intercept('GET', '/api/ssh_filter/filter/list/?group_id=*').as('getRules')
    
    // 等待系统组选择器加载
    cy.wait(1000)
    
    // 切换系统组，触发接口请求
    cy.get('.system-group-selector .el-select').click()
    
    // 等待下拉菜单加载
    cy.wait(1000)
    
    cy.get('.el-select-dropdown__item').first().click()
    
    // 检查接口请求是否成功
    cy.wait('@getRules').its('response.statusCode').should('be.oneOf', [200, 304])
  })
})
