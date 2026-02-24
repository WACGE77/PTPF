<template>
  <div class="resource-detail">
    <template v-if="node">
      <template v-if="node.type === 'group'">
        <div class="detail-header">
          <h3>资源组详情</h3>
        </div>
        <div class="detail-content">
          <div class="detail-item">
            <span class="label">名称：</span>
            <span class="value">{{ (node.data as ResourceGroup).name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">描述：</span>
            <span class="value">{{ (node.data as ResourceGroup).description || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">创建时间：</span>
            <span class="value">{{ (node.data as ResourceGroup).create_date }}</span>
          </div>
          <div class="detail-item">
            <span class="label">更新时间：</span>
            <span class="value">{{ (node.data as ResourceGroup).update_date }}</span>
          </div>
        </div>
      </template>
      <template v-if="node.type === 'resource'">
        <div class="detail-header">
          <h3>资源详情</h3>
          <div class="header-actions">
            <el-button size="small" @click="emit('bind-voucher', node.data as Resource)">绑定凭证</el-button>
            <el-button size="small" type="primary" @click="emit('edit', 'resource', node.data as Resource)">编辑</el-button>
            <el-button size="small" type="danger" @click="emit('delete', 'resource', node.data as Resource)">删除</el-button>
          </div>
        </div>
        <div class="detail-content">
          <div class="detail-item">
            <span class="label">名称：</span>
            <span class="value">{{ (node.data as Resource).name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">IP地址：</span>
            <span class="value">{{ (node.data as Resource).ipv4_address }}</span>
          </div>
          <div class="detail-item">
            <span class="label">端口：</span>
            <span class="value">{{ (node.data as Resource).port }}</span>
          </div>
          <div class="detail-item">
            <span class="label">状态：</span>
            <el-tag :type="(node.data as Resource).status ? 'success' : 'danger'">
              {{ (node.data as Resource).status ? '在线' : '离线' }}
            </el-tag>
          </div>
          <div class="detail-item">
            <span class="label">描述：</span>
            <span class="value">{{ (node.data as Resource).description || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">关联凭证：</span>
            <span class="value">
              <el-tag
                v-for="v in (node.data as Resource).vouchers"
                :key="v.id"
                size="small"
                class="voucher-tag"
              >
                {{ v.name }}
              </el-tag>
              <span v-if="!(node.data as Resource).vouchers?.length">-</span>
            </span>
          </div>
        </div>
      </template>
      <template v-if="node.type === 'voucher'">
        <div class="detail-header">
          <h3>凭证详情</h3>
          <div class="header-actions">
            <el-button size="small" type="primary" @click="emit('edit', 'voucher', node.data as Voucher)">编辑</el-button>
            <el-button size="small" type="danger" @click="emit('delete', 'voucher', node.data as Voucher)">删除</el-button>
          </div>
        </div>
        <div class="detail-content">
          <div class="detail-item">
            <span class="label">名称：</span>
            <span class="value">{{ (node.data as Voucher).name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">用户名：</span>
            <span class="value">{{ (node.data as Voucher).username }}</span>
          </div>
          <div class="detail-item">
            <span class="label">描述：</span>
            <span class="value">{{ (node.data as Voucher).description || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">创建时间：</span>
            <span class="value">{{ (node.data as Voucher).create_date }}</span>
          </div>
        </div>
      </template>
    </template>
    <div v-else class="empty-detail">
      <el-empty description="请选择一个资源或凭证查看详情" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ResourceGroup, Resource, Voucher, TreeNode } from '@/struct/resource.ts'

defineProps<{
  node: TreeNode | null
}>()

const emit = defineEmits<{
  'bind-voucher': [data: Resource]
  edit: [type: 'resource' | 'voucher', data: any]
  delete: [type: 'resource' | 'voucher', data: any]
}>()
</script>

<style scoped lang="scss">
$text-primary: #303133;
$text-regular: #606266;
$border-color: #e6e6e6;

.resource-detail {
  padding: 20px;
  
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid $border-color;

    h3 {
      margin: 0;
      font-size: 16px;
      color: $text-primary;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .detail-content {
    .detail-item {
      display: flex;
      margin-bottom: 16px;
      font-size: 14px;
      line-height: 1.6;

      .label {
        color: $text-regular;
        min-width: 80px;
      }

      .value {
        color: $text-primary;
        flex: 1;
        word-break: break-all;

        .voucher-tag {
          margin-right: 6px;
          margin-bottom: 4px;
        }
      }
    }
  }

  .empty-detail {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 300px;
  }
}
</style>
