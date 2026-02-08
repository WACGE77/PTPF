<template>
  <div class="role-assign-container">
    <!-- 角色搜索区域 -->
    <div class="role-search">
      <el-input
        placeholder="请输入角色名称/编码搜索"
        prefix="Search"
        clearable
        size="large"
      />
    </div>

    <div class="role-content">
      <!-- 已选角色区域 -->
      <div class="selected-roles">
        <div class="section-title">已选角色</div>
        <div class="selected-tags">
          <el-tag
            v-for="role in selectedRoleList"
            :key="role.id"
            closable
            type="primary"
            effect="dark"
            size="large"
          >
            {{ role.name }}
          </el-tag>
          <div v-if="selectedRoleList.length === 0" class="empty-tip">
            暂无选中角色
          </div>
        </div>
      </div>

      <!-- 角色列表区域 -->
      <div class="role-list">
        <div class="section-title">角色列表</div>
        <el-checkbox-group class="role-checkbox-group">
          <el-checkbox
            v-for="role in roles"
            :key="role.id"
            :label="role.id"
            :disabled="role.protected && !isRoleSelected(role.id)"
            class="role-item"
            size="large"
          >
            <!-- 修正类名，匹配样式 -->
            <div class="role-info-row">
              <div class="role-name-col">{{ role.name }}</div>
              <div class="role-code-col">{{ role.code }}</div>
              <div class="role-desc-col">{{ role.description }}</div>
            </div>
          </el-checkbox>
        </el-checkbox-group>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Role } from '@/struct/rbac.ts'

const props = defineProps<{
  userRoles: Array<number>,
  roles: Array<Role>,
}>()
const roles = [
  {
      id: 1,
      name: "管理员",
      code: "Administrator",
      description: "超级管理员",
      status: true,
      protected: true,
      create_date: "2025-01-01T08:00:00+08:00",
      update_date: "2025-01-01T08:00:00+08:00"
  },
  {
      id: 2,
      name: "用户",
      code: "Client",
      description: "普通用户",
      status: true,
      protected: true,
      create_date: "2025-01-01T08:00:00+08:00",
      update_date: "2025-01-01T08:00:00+08:00"
  },
  {
      id: 3,
      name: "审计员",
      code: "Audit",
      description: "审计",
      status: true,
      protected: true,
      create_date: "2025-01-01T08:00:00+08:00",
      update_date: "2025-01-01T08:00:00+08:00"
  }
]
const selectedRoleList = []
const isRoleSelected = (roleId: number) => {
  return true
}
</script>

<style scoped lang="scss">
.role-assign-container {
  padding: 16px;  // 增加容器内边距
  width: 100%;
  box-sizing: border-box; // 防止padding撑大容器

  // 搜索框样式
  .role-search {
    margin-bottom: 24px;  // 增加底部间距

    :deep(.el-input) {
      width: 100%;
      max-width: none;
      height: 48px;  // 加高搜索框
      font-size: 14px; // 放大字体
    }
    // 搜索框图标放大
    :deep(.el-input__prefix) {
      font-size: 16px;
      margin-right: 8px;
    }
  }

  // 内容区域
  .role-content {
    display: flex;
    flex-direction: column;
    gap: 28px;  // 大幅增加区域间距
    width: 100%;
  }

  // 通用标题样式
  .section-title {
    font-size: 16px;  // 放大标题字体
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;  // 增加标题底部间距
    padding-bottom: 8px;  // 增加下划线间距
    border-bottom: 1px solid #e6e6e6;
  }

  // 已选角色区域
  .selected-roles {
    .selected-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;  // 增加标签间距
      padding: 12px 8px;  // 增加内边距
      background-color: #f8f9fa;  // 增加背景色，区分区域
      border-radius: 6px;

      :deep(.el-tag) {
        margin: 0;
        height: 40px;  // 加高标签
        line-height: 40px;  // 垂直居中
        padding: 0 16px;  // 增加标签内边距
        font-size: 14px;
      }

      .empty-tip {
        color: #909399;
        font-size: 14px;
        line-height: 40px;
        padding: 0 8px;
      }
    }
  }

  // 角色列表区域（核心加宽+松驰调整）
  .role-list {
    .role-checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 16px;  // 大幅增加角色项间距
      max-height: 350px;  // 加高滚动区域
      overflow-y: auto;
      padding: 8px;  // 增加内边距
      background-color: #f8f9fa;  // 增加背景色
      border-radius: 6px;
      width: 100%;
    }

    .role-item {
      width: 100%;

      :deep(.el-checkbox) {
        width: 100%;
      }

      :deep(.el-checkbox__label) {
        padding: 16px 20px;  // 大幅增加内边距
        width: 100%;
        border: 1px solid #e6e6e6;
        border-radius: 8px;  // 加大圆角
        cursor: pointer;
        font-size: 14px;  // 放大字体
        background-color: #fff;  // 白色背景，突出选项

        &:hover {
          background-color: #f5f7fa;
          border-color: #dcdfe6;  //  hover时加深边框
        }
      }

      :deep(.el-checkbox.is-disabled .el-checkbox__label) {
        color: #c0c4cc;
        cursor: not-allowed;
        background-color: #fafafa;
        border-color: #eef0f3;
      }

      // 横向布局，充分利用宽度+松驰间距
      .role-info-row {
        display: flex;
        align-items: center;
        gap: 30px;  // 大幅增加列间距
        width: 100%;

        .role-name-col {
          font-weight: 600;
          color: #303133;
          min-width: 150px;  // 加宽名称列
          font-size: 15px;  // 放大名称字体
        }

        .role-code-col {
          font-size: 14px;
          color: #606266;
          min-width: 180px;  // 加宽编码列
          font-family: "Consolas", monospace;  // 编码用等宽字体，更易读
        }

        .role-desc-col {
          font-size: 14px;
          color: #909399;
          line-height: 1.6;  // 加大行高
          flex: 1;
          padding-right: 10px;
        }
      }
    }
  }

  // 滚动条样式优化（加宽+圆润）
  :deep(.el-scrollbar__bar) {
    &.is-vertical {
      width: 8px;  // 加宽滚动条
      right: 4px;
      top: 4px;
      bottom: 4px;

      .el-scrollbar__thumb {
        background-color: #c0c4cc;
        border-radius: 4px;  // 圆润滚动条
        width: 8px;

        &:hover {
          background-color: #909399;
        }
      }
    }
  }
}
</style>
