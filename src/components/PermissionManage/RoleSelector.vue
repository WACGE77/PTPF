<template>
  <el-card class="role-card">
    <template #header>
      <div class="card-header">
        <span class="card-title">角色列表</span>
      </div>
    </template>
    <el-skeleton v-if="props.isLoading" :rows="5" animated class="loading-skeleton" />
    <el-tree
      v-else-if="props.roles && props.roles.length > 0"
      ref="roleTreeRef"
      :data="props.roles"
      :props="roleTreeProps"
      node-key="id"
      :expand-on-click-node="false"
      :default-expand-all="true"
      @node-click="handleRoleNodeClick"
    >
      <template #default="{ node, data }">
        <div class="custom-tree-node">
          <el-icon class="node-icon">
            <component :is="getIconComponent('UserFilled')" />
          </el-icon>
          <span class="node-label">{{ node.label }}</span>
        </div>
      </template>
    </el-tree>
    <el-empty v-else description="暂无角色数据" class="empty-state" />
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getIconComponent } from '@/utils/iconMap.ts'
import type { Role } from '@/struct/rbac.ts'

const props = defineProps<{
  roles: Role[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'role-select', role: Role): void
}>()

const roleTreeRef = ref()

const roleTreeProps = {
  children: 'children',
  label: 'name'
}

const handleRoleNodeClick = (data: Role) => {
  emit('role-select', data)
}
</script>

<style scoped lang="scss">
$primary-color: #409eff;
$text-primary: #303133;

.role-card {
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

  :deep(.el-tree) {
    flex: 1;
    overflow: auto;

    .custom-tree-node {
      display: flex;
      align-items: center;
      gap: 8px;

      .node-icon {
        font-size: 14px;
        color: $primary-color;
      }

      .node-label {
        font-size: 13px;
        color: $text-primary;
      }
    }

    .el-tree-node__content {
      height: 32px;
    }
  }
}
.empty-state {
  padding: 40px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>