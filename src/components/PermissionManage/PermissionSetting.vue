<template>
  <el-card class="permission-card" v-if="permissionStore.selectedRole">
    <template #header>
      <div class="card-header">
        <span class="card-title">权限设置 - {{ permissionStore.selectedRole.name }}</span>
        <el-tag v-if="permissionStore.selectedRole.protected" type="warning" size="small" class="protected-tag">受保护</el-tag>
      </div>
    </template>
    <div class="permission-content">
      <el-alert
        v-if="permissionStore.selectedRole.protected"
        title="受保护角色，无法修改权限"
        type="warning"
        :closable="false"
        class="protected-alert"
      />
      <div class="permission-section" v-for="(section, index) in permissionStore.permissionSections" :key="index">
        <h3 class="section-title">{{ section.name }}</h3>
        <el-checkbox-group 
          v-model="permissionStore.selectedPermissions"
          :disabled="permissionStore.selectedRole.protected"
        >
          <el-checkbox
            v-for="permission in section.permissions"
            :key="permission.id"
            :label="permission.id"
            class="permission-item"
            :disabled="permissionStore.selectedRole.protected"
          >
            {{ permission.name }}
            <span class="permission-desc">{{ permission.description }}</span>
          </el-checkbox>
        </el-checkbox-group>
      </div>
    </div>
    <div class="card-footer">
      <el-button 
        type="primary" 
        @click="savePermissions"
        :disabled="permissionStore.selectedRole.protected"
        :loading="permissionStore.isLoading"
      >
        <component :is="getIconComponent('Check')" />
        <span>保存权限</span>
      </el-button>
    </div>
  </el-card>
  <el-empty v-else description="请选择一个角色" class="empty-state" />
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getIconComponent } from '@/utils/iconMap.ts'
import { usePermissionStore } from '@/stores/permission.ts'
import type { Role } from '@/struct/rbac.ts'

const props = defineProps<{
  selectedRole: Role | null
}>()

const emit = defineEmits<{
  (e: 'permission-saved'): void
}>()

const permissionStore = usePermissionStore()

const savePermissions = async () => {
  const result = await permissionStore.savePermissions()
  if (result.success) {
    ElMessage.success(result.message)
    emit('permission-saved')
  } else {
    ElMessage.warning(result.message)
  }
}

// 监听角色变化，更新 store 中的选中角色
watch(() => props.selectedRole, (newRole) => {
  permissionStore.setSelectedRole(newRole)
}, { immediate: true })

// 组件初始化时初始化 store
onMounted(async () => {
  await permissionStore.initialize()
})
</script>

<style scoped lang="scss">
$primary-color: #409eff;
$text-primary: #303133;
$text-regular: #606266;
$border-color: #e6e6e6;
$bg-light: #f8f9fa;

.permission-card {
  height: 100%;
  display: flex;
  flex-direction: column;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: $text-primary;
    }
  }

  .permission-content {
    flex: 1;
    overflow: auto;
    padding: 0 16px;

    .permission-section {
      margin-bottom: 24px;

      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: $text-primary;
        margin: 0 0 12px 0;
        padding-bottom: 8px;
        border-bottom: 1px solid $border-color;
      }

      .permission-item {
        display: block;
        margin-bottom: 12px;
        padding: 8px 12px;
        border-radius: 4px;
        transition: all 0.3s;

        &:hover {
          background-color: $bg-light;
        }

        .permission-desc {
          display: block;
          font-size: 12px;
          color: $text-regular;
          margin-top: 4px;
          margin-left: 20px;
        }
      }
    }
  }

  .card-footer {
    padding: 16px;
    border-top: 1px solid $border-color;
    text-align: right;

    :deep(.el-button) {
      --el-button-border-radius: 6px;
      height: 40px;
      padding: 0 16px;

      span {
        margin-left: 6px;
      }
    }
  }
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $bg-light;
  border-radius: 6px;
}
</style>