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
      <el-tabs v-model="activeTab" type="card" class="permission-tabs">
        <el-tab-pane label="系统权限" name="system">
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
        </el-tab-pane>
        <el-tab-pane label="资源组权限" name="resource">
          <div class="resource-group-section" v-for="group in resourceGroups" :key="group.id">
            <el-collapse class="group-collapse">
              <el-collapse-item :name="group.id">
                <template #title>
                  <div class="group-title">
                    <span>{{ group.name }}</span>
                    <el-tag size="small" type="info">
                      {{ getGroupSelectedPermissionCount(group.id) }}/{{ resourcePermissions.length }}
                    </el-tag>
                  </div>
                </template>
                <el-checkbox-group 
                  v-model="groupPermissions[group.id]"
                  :disabled="permissionStore.selectedRole.protected"
                >
                  <el-checkbox
                    v-for="perm in resourcePermissions"
                    :key="perm.id"
                    :label="perm.id"
                    class="permission-item"
                    :disabled="permissionStore.selectedRole.protected"
                  >
                    {{ perm.name }}
                  </el-checkbox>
                </el-checkbox-group>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    <div class="card-footer">
      <el-button 
        type="primary" 
        @click="savePermissions"
        :disabled="permissionStore.selectedRole.protected"
        :loading="permissionStore.isLoading || isGroupLoading"
      >
        <component :is="getIconComponent('Check')" />
        <span>保存权限</span>
      </el-button>
    </div>
  </el-card>
  <el-empty v-else description="请选择一个角色" class="empty-state" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getIconComponent } from '@/utils/iconMap.ts'
import { usePermissionStore } from '@/stores/permission.ts'
import api from '@/api'
import type { Role } from '@/struct/rbac.ts'

const props = defineProps<{
  selectedRole: Role | null
}>()

const emit = defineEmits<{
  (e: 'permission-saved'): void
}>()

const permissionStore = usePermissionStore()
const activeTab = ref('system')
const resourceGroups = ref<any[]>([])
const resourcePermissions = ref<any[]>([])
const groupPermissions = ref<Record<number, number[]>>({})
const isGroupLoading = ref(false)

const getGroupSelectedPermissionCount = (groupId: number) => {
  return groupPermissions.value[groupId]?.length || 0
}

const loadResourceGroups = async () => {
  try {
    const res = await api.groupApi.getGroup({})
    if (res.data.code === 200) {
      resourceGroups.value = res.data.detail || []
    }
  } catch (error) {
    console.error('加载资源组失败:', error)
  }
}

const loadResourcePermissions = async () => {
  try {
    const res = await api.permissionApi.getPermissionList({})
    if (res.data.code === 200) {
      resourcePermissions.value = (res.data.detail || []).filter((p: any) => 
        p.scope === 'resource' || (p.id >= 21 && p.id <= 31)
      )
    }
  } catch (error) {
    console.error('加载资源权限失败:', error)
  }
}

const loadGroupPermissions = async () => {
  if (!props.selectedRole) return
  
  isGroupLoading.value = true
  try {
    const res = await api.permissionApi.getGroupPermission({ role_id: props.selectedRole.id })
    if (res.data.code === 200) {
      const auths = res.data.detail || []
      const perms: Record<number, number[]> = {}
      
      resourceGroups.value.forEach(group => {
        perms[group.id] = []
      })
      
      auths.forEach((auth: any) => {
        if (!perms[auth.resource_group]) {
          perms[auth.resource_group] = []
        }
        perms[auth.resource_group].push(auth.permission)
      })
      
      groupPermissions.value = perms
    }
  } catch (error) {
    console.error('加载组权限失败:', error)
  } finally {
    isGroupLoading.value = false
  }
}

const savePermissions = async () => {
  if (activeTab.value === 'system') {
    const result = await permissionStore.savePermissions()
    if (result.success) {
      ElMessage.success(result.message)
      emit('permission-saved')
    } else {
      ElMessage.warning(result.message)
    }
  } else {
    isGroupLoading.value = true
    try {
      const groups = Object.entries(groupPermissions.value)
        .filter(([_, perms]) => perms.length > 0)
        .map(([groupId, perms]) => ({
          id: parseInt(groupId),
          permission: perms
        }))
      
      const res = await api.permissionApi.setGroupPermission({
        role_id: props.selectedRole?.id,
        groups
      })
      
      if (res.data.code === 200) {
        ElMessage.success('资源组权限保存成功')
        emit('permission-saved')
      } else {
        ElMessage.error(res.data.detail || '保存失败')
      }
    } catch (error) {
      console.error('保存组权限失败:', error)
      ElMessage.error('保存失败')
    } finally {
      isGroupLoading.value = false
    }
  }
}

watch(() => props.selectedRole, (newRole) => {
  permissionStore.setSelectedRole(newRole)
  if (newRole) {
    loadGroupPermissions()
  }
}, { immediate: true })

watch(activeTab, async (newTab) => {
  if (newTab === 'resource') {
    await loadResourceGroups()
    await loadResourcePermissions()
    if (props.selectedRole) {
      await loadGroupPermissions()
    }
  }
})

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

    .permission-tabs {
      :deep(.el-tabs__content) {
        overflow: auto;
      }
    }

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

    .resource-group-section {
      margin-bottom: 16px;

      .group-collapse {
        :deep(.el-collapse-item__header) {
          padding: 0 12px;
        }
        
        :deep(.el-collapse-item__content) {
          padding: 12px;
        }
      }

      .group-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
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
