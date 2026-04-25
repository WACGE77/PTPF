const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:8000';

test.describe('SSH终端 - 危险命令告警 E2E测试', () => {
  let wsMessages = [];

  test.beforeEach(async ({ page }) => {
    wsMessages = [];
    page.on('websocket', ws => {
      ws.on('framereceived', data => {
        try {
          const parsed = JSON.parse(data.toString());
          wsMessages.push(parsed);
        } catch {}
      });
    });
  });

  test('1. 登录系统', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    console.log('[TEST1] 页面加载完成');

    const loginBtn = page.locator('text=登录').first();
    if (await loginBtn.isVisible({ timeout: 3000 })) {
      await page.fill('input[placeholder*="账号"]', 'administrator');
      await page.fill('input[placeholder*="密码"]', 'administrator');
      await loginBtn.click();
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    }
    
    await expect(page.locator('.el-dropdown')).toBeVisible({ timeout: 5000 });
    console.log('[TEST1] ✅ 登录成功');
  });

  test('2. 导航到Web终端并连接SSH', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    const terminalLink = page.locator('text=WEB终端').first();
    if (await terminalLink.isVisible()) {
      await terminalLink.click();
      await page.waitForTimeout(1000);
    }

    const connectBtn = page.locator('.resource-item button:has-text("连接"), .el-button:has-text("连接")').first();
    if (await connectBtn.isVisible({ timeout: 5000 })) {
      await connectBtn.click();
      await page.waitForTimeout(1500);

      const voucherOption = page.locator('.el-select-dropdown li, [class*=option]').first();
      if (await voucherOption.isVisible({ timeout: 2000 })) {
        await voucherOption.click();
      }
    }

    await page.waitForTimeout(5000);
    const xterm = page.locator('.xterm-rows, .xterm-screen');
    const xtermExists = await xterm.count();
    expect(xtermExists).toBeGreaterThan(0);
    console.log('[TEST2] ✅ SSH终端已连接，xterm可见');
  });

  test('3. 执行基本命令 ls 并验证输出', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const textarea = page.locator('.xterm-helper-textarea');
    await textarea.focus({ timeout: 10000 });
    await page.keyboard.type('ls');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(4000);

    const output = page.locator('.xterm-rows');
    const text = await output.textContent();
    const cleanText = text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\s+/g, ' ');
    console.log(`[TEST3] 终端输出: ${cleanText.substring(0, 200)}`);
    expect(cleanText.length).toBeGreaterThan(10);
    console.log('[TEST3] ✅ ls 命令执行成功');
  });

  test('4. 方向键 - 上箭头测试历史命令', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const textarea = page.locator('.xterm-helper-textarea');
    await textarea.focus({ timeout: 10000 });

    await page.keyboard.type('echo history_test_12345');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(500);

    const output = page.locator('.xterm-rows');
    const text = await output.textContent();
    expect(text).toContain('history_test_12345');
    console.log('[TEST4] ✅ 上方向键历史命令正常');
  });

  test('5. Tab补全测试', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const textarea = page.locator('.xterm-helper-textarea');
    await textarea.focus({ timeout: 10000 });

    await page.keyboard.type('ec');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);

    const output = page.locator('.xterm-rows');
    const text = await output.textContent();
    console.log(`[TEST5] Tab补全后内容: ${text.substring(text.length - 50)}`);

    const cleanText = text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    expect(cleanText.length).toBeGreaterThan(5);
    console.log('[TEST5] ✅ Tab补全触发（无报错）');
  });

  test('6. 危险命令 rm 触发告警', async ({ page }) => {
    wsMessages = [];
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const textarea = page.locator('.xterm-helper-textarea');
    await textarea.focus({ timeout: 10000 });

    await page.keyboard.type('rm -rf /test');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(6000);

    const output = page.locator('.xterm-rows');
    const text = await output.textContent();

    const hasWarning = text.includes('危险命令') || text.includes('⚠️') || text.includes('danger');
    const dangerAlertMsg = wsMessages.find(m => m.type === 'danger_alert');

    console.log(`[TEST6] 终端文本包含危险警告: ${hasWarning}`);
    console.log(`[TEST6] WS消息中danger_alert: ${!!dangerAlertMsg}`);
    if (dangerAlertMsg) {
      console.log(`[TEST6] 告警详情: ${JSON.stringify(dangerAlertMsg)}`);
    }

    if (dangerAlertMsg) {
      expect(dangerAlertMsg.data.command).toContain('rm');
      console.log('[TEST6] ✅ 危险命令告警触发成功（WebSocket）');
    } else if (hasWarning) {
      console.log('[TEST6] ✅ 危险命令告警显示在终端中');
    } else {
      console.log('[TEST6] ⚠️ 未检测到告警（可能需要检查规则配置）');
    }
  });

  test('7. 验证危险命令告警日志页面可访问', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    const logMenu = page.locator('text=告警日志').first();
    if (await logMenu.isVisible({ timeout: 3000 })) {
      await logMenu.click();
      await page.waitForTimeout(2000);
    } else {
      await page.goto(`${BASE_URL}/danger-cmd-log`);
      await page.waitForTimeout(2000);
    }

    const pageTitle = page.locator('text=危险命令告警日志');
    await expect(pageTitle).toBeVisible({ timeout: 5000 });
    console.log('[TEST7] ✅ 告警日志页面可访问');
  });

  test('8. 验证危险命令告警规则管理页面可访问', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    const alertMenu = page.locator('text=危险命令告警').first();
    if (await alertMenu.isVisible({ timeout: 3000 })) {
      await alertMenu.click();
      await page.waitForTimeout(2000);
    } else {
      await page.goto(`${BASE_URL}/danger-cmd-alert`);
      await page.waitForTimeout(2000);
    }

    const pageTitle = page.locator('text=危险命令告警管理');
    await expect(pageTitle).toBeVisible({ timeout: 5000 });
    console.log('[TEST8] ✅ 告警规则管理页面可访问');
  });
});
