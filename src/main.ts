import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import { initializeSSHBlacklist } from './utils/sshBlacklist'

// 初始化SSH黑名单功能
initializeSSHBlacklist().catch(console.error)

// 创建app实例
const app = createApp(App)

// 配置Element Plus
app.use(ElementPlus, {
  locale: zhCn,
})

// 使用Pinia
app.use(createPinia())

// 使用路由
app.use(router)

// 挂载app
app.mount('#app')
