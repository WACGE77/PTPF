<template>
  <div class="bind-voucher-container">
    <div class="voucher-content">
      <div class="selected-vouchers">
        <div class="section-title">已绑定凭证</div>
        <transition-group name="tag-fade" tag="div" class="selected-tags">
          <el-tag
            v-for="voucher in selectedVoucherList"
            :key="voucher.id"
            closable
            type="primary"
            effect="light"
            size="default"
            class="voucher-tag"
            @close="removeVoucher(voucher)"
          >
            {{ voucher.name }}
          </el-tag>
          <div v-if="selectedVoucherList.length === 0" class="empty-tip">暂无绑定凭证</div>
        </transition-group>
      </div>

      <div class="voucher-list">
        <div class="section-title">可选凭证</div>
        <div class="voucher-list-container">
          <div
            v-for="voucher in voucherItems"
            :key="voucher.id"
            class="voucher-item"
            :class="{
              'is-selected': voucher.isSelected,
            }"
            @click="handleVoucherClick(voucher)"
          >
            <div class="voucher-info-row">
              <div class="voucher-name-col">{{ voucher.name }}</div>
              <div class="voucher-username-col">{{ voucher.username }}</div>
            </div>
          </div>
          <div v-if="voucherItems.length === 0" class="empty-tip">当前资源组下没有可绑定的凭证</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Ref, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { resourceStore } from '@/stores/resource'
import { request_error } from '@/requests'
import type { Voucher, Resource } from '@/struct/resource.ts'

const store = resourceStore()

interface VoucherItem extends Voucher {
  isSelected?: boolean
}

const props = defineProps<{
  resource: Resource | null
  allVouchers: Voucher[]
}>()

const emit = defineEmits<{
  success: []
}>()

const voucherItems: Ref<VoucherItem[]> = ref([])
const selectedVoucherList: Ref<VoucherItem[]> = ref([])

const init = () => {
  if (!props.resource) {
    voucherItems.value = []
    selectedVoucherList.value = []
    return
  }

  const boundVouchers = props.resource.vouchers || []
  
  selectedVoucherList.value = boundVouchers.map(v => ({
    ...v,
    isSelected: true
  }))

  const allGroupVouchers = props.allVouchers.filter(v => 
    v.group === props.resource!.group
  )

  voucherItems.value = allGroupVouchers.map(v => ({
    ...v,
    isSelected: boundVouchers.some(bv => bv.id === v.id)
  }))
}

const handleVoucherClick = (voucher: VoucherItem) => {
  voucher.isSelected = !voucher.isSelected
  if (voucher.isSelected) {
    const exists = selectedVoucherList.value.find(v => v.id === voucher.id)
    if (!exists) {
      selectedVoucherList.value.push({ ...voucher, isSelected: true })
    }
  } else {
    selectedVoucherList.value = selectedVoucherList.value.filter(v => v.id !== voucher.id)
  }
}

const removeVoucher = (voucher: VoucherItem) => {
  const item = voucherItems.value.find(v => v.id === voucher.id)
  if (item) {
    item.isSelected = false
  }
  selectedVoucherList.value = selectedVoucherList.value.filter(v => v.id !== voucher.id)
}

const submit = async () => {
  if (!props.resource) return
  
  const voucherIds = selectedVoucherList.value.map(v => v.id)
  
  try {
    await store.updateResource({
      id: props.resource.id,
      voucher_ids: voucherIds
    })
    await store.getResources(true)
    ElMessage.success('操作成功')
    emit('success')
  } catch (err) {
    request_error(err)
  }
}

const destruct = async () => {}

watch(
  () => props.resource,
  () => init(),
  { immediate: true }
)

defineExpose({
  submit,
  destruct,
  selectedVoucherList,
  voucherItems
})
</script>

<style scoped lang="scss">
.bind-voucher-container {
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;

  .voucher-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
  }

  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
    padding-bottom: 4px;
    border-bottom: 1px solid #f0f0f0;
  }

  .selected-vouchers {
    .selected-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      min-height: 36px;

      .voucher-tag {
        margin: 0;
        height: 32px;
        line-height: 32px;
        padding: 0 12px;
        font-size: 13px;
        border-radius: 4px;
        background-color: #e8f4ff;
        border-color: #409eff;
        color: #409eff;
        transition: all 0.2s ease;

        &:hover {
          background-color: #d7eafc;
          transform: none;
        }
      }

      .empty-tip {
        color: #909399;
        font-size: 13px;
        line-height: 32px;
        padding: 0 4px;
      }
    }
  }

  .voucher-list {
    .voucher-list-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 350px;
      overflow-y: auto;
      overflow-x: hidden;
      width: 100%;
      box-sizing: border-box;
    }

    .voucher-item {
      width: 100%;
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      background-color: #fff;
      transition: all 0.2s ease;
      position: relative;
      box-sizing: border-box;
      border: 1px solid transparent;

      &.is-selected {
        background-color: #e8f4ff;
        border-color: #409eff;
        color: #303133;

        .voucher-name-col {
          color: #409eff;
          font-weight: 600;
        }
      }

      &:not(.is-selected):hover {
        background-color: #f5f7fa;
        border-color: #e6e6e6;
      }

      .voucher-info-row {
        display: flex;
        align-items: center;
        gap: 16px;
        width: 100%;

        .voucher-name-col {
          font-weight: 500;
          color: #303133;
          min-width: 100px;
          font-size: 14px;
        }

        .voucher-username-col {
          font-size: 12px;
          color: #606266;
        }
      }
    }

    .empty-tip {
      color: #909399;
      font-size: 13px;
      padding: 12px 0;
    }
  }

  :deep(.el-scrollbar__bar) {
    &.is-vertical {
      width: 6px;
      right: 2px;
      top: 2px;
      bottom: 2px;

      .el-scrollbar__thumb {
        background-color: #e0e0e0;
        border-radius: 3px;
        width: 6px;

        &:hover {
          background-color: #c0c4cc;
        }
      }
    }
    &.is-horizontal {
      display: none !important;
    }
  }

  .tag-fade-enter-from,
  .tag-fade-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }
  .tag-fade-enter-active,
  .tag-fade-leave-active {
    transition: all 0.15s ease;
  }
  .tag-fade-move {
    transition: transform 0.2s ease;
  }
}
</style>
