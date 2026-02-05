<template>
  <div class="bastion-layout">
    <div class="main-container">
      <el-container style="height: 100%">
        <!-- 左侧主内容 -->
        <el-main class="bastion-main-left">
          <div class="section-title">最近会话</div>

          <el-table
            :data="sessionList"
            stripe
            border
            class="session-table"
          >
            <el-table-column prop="id" label="ID" width="50"/>
            <el-table-column prop="user.name" label="用户" width="100"/>
            <el-table-column prop="ip" label="客户端" width="120"/>
            <el-table-column prop="resource.name" label="服务端" width="70"/>
            <el-table-column prop="resource.ip" label="服务端IP" width="120"/>
            <el-table-column prop="voucher.username" label="账户名" width="70"/>
            <el-table-column prop="status" label="状态" width="70"/>
            <el-table-column
              prop="start_time"
              label="开始时间"
              :formatter="(row:SessionRecord) => formatIsoTimeToReadable(row.start_time, 'YYYY-MM-DD HH:mm:ss')"
            />
            <el-table-column
              prop="end_time"
              label="结束时间"
              :formatter="(row:SessionRecord) => formatIsoTimeToReadable(row.start_time, 'YYYY-MM-DD HH:mm:ss')"
            />
          </el-table>
        </el-main>

        <!-- 右侧信息 -->
        <el-aside class="bastion-aside-right">
          <!-- 用户信息 -->
          <div class="card">
            <div class="card-header">个人信息</div>

            <div class="card-body">
              <div class="user-avatar-wrapper">
                <el-avatar :src="userAvatar" size="large" />
              </div>

              <div class="user-info">
                <span class="label">用户名</span>
                <span class="value">{{ userinfo.user.name }}</span>
              </div>

              <div class="user-info">
                <span class="label">邮箱</span>
                <span class="value">{{ userinfo.user.email }}</span>
              </div>
            </div>
          </div>

          <!-- 登录记录 -->
          <div class="card mt-20">
            <div class="card-header">最近登录</div>

            <div class="card-body">
              <el-table :data="loginRecords" border>
                <el-table-column label="登录IP">
                  <template #default="{ row }">
                    {{ row.ip }}
                  </template>
                </el-table-column>

                <el-table-column label="时间">
                  <template #default="{ row }">
                    {{ formatIsoTimeToReadable(row.date) }}
                  </template>
                </el-table-column>

                 <el-table-column label="状态">
                  <template #default="{ row }">
                    {{ row.status }}
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-aside>
      </el-container>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userProfile } from '@/stores/userProfile'
import type { SessionRecord,LoginRecord } from '@/struct'
import api from '@/api'
import { ElMessage } from 'element-plus'
import { request_error } from '@/requests'
import {formatIsoTimeToReadable} from '@/utils/time.ts'
const userinfo = userProfile()

const sessionList = ref<SessionRecord[]>([])
const loginRecords = ref<LoginRecord[]>([])
const userAvatar = ref('')
const getSessionList = async () => {
  try{
    const res = await api.auditApi.sessionLog({ desc:true, self:true})
    if (res.status === 200) {
      Object.assign(sessionList.value, res.data.detail)
    }else{
      ElMessage.error(res.data.detail)
    }
  }catch(err:any){
    request_error(err)
  }
}
const getLoginList = async () => {
  try{
    const res = await api.auditApi.loginLog({ desc:true, self:true,page_size:5})
    if (res.status === 200) {
      Object.assign(loginRecords.value, res.data.detail)
    }else{
      ElMessage.error(res.data.detail)
    }
  }catch(err:any){
    request_error(err)
  }
}
onMounted(async () => {
  await userinfo.getuser()
  await getSessionList()
  await getLoginList()
  userAvatar.value =
    'https://ui-avatars.com/api/?name=' +
    (userinfo.user.name || 'User') +
    '&background=4F46E5&color=fff&size=100'
})
</script>

<style scoped>
/* ===== 页面基础 ===== */
.bastion-layout {
  width: 100%;
  min-height: 100vh;
  background: #f5f7fa;
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
}

/* 页面居中 */
.main-container {
  width: 1600px;
  max-width: 96%;
  margin: 0 auto;
  height: 100vh;
}

/* ===== 左侧内容 ===== */
.bastion-main-left {
  padding: 24px;
  background: #f5f7fa;
}

/* ===== 右侧面板 ===== */
.bastion-aside-right {
  width: 450px;
  padding: 24px;
  background: #f5f7fa;
}

/* ===== 标题 ===== */
.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 18px;
  color: #303133;
}

/* ===== 卡片 ===== */
.card {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.card-header {
  padding: 14px 18px;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 1px solid #ebeef5;
  color: #303133;
}

.card-body {
  padding: 18px;
}

/* ===== 用户头像 ===== */
.user-avatar-wrapper {
  text-align: center;
  margin-bottom: 16px;
}

/* ===== 用户信息 ===== */
.user-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}

.label {
  color: #909399;
}

.value {
  color: #303133;
  word-break: break-all;
}

/* ===== 表格 ===== */
.session-table{
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

/* ===== 间距 ===== */
.mt-20 {
  margin-top: 20px;
}
</style>
