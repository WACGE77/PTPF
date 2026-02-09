<template>
  <div class="confirm-cancel-btn-group" :style="{ justifyContent: align }">
    <el-button
      @click="handleCancel"
      :size="size"
      :type="cancelBtnType"
      :disabled="cancelDisabled"
      class="cancel-btn"
    >
      {{ cancelText }}
    </el-button>

    <el-button
      :size="size"
      :type="confirmBtnType"
      :disabled="confirmDisabled"
      :loading="loading"
      class="confirm-btn"
      @click="handleConfirm"
    >
      {{ confirmText }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'

const props = defineProps({
  align: {
    type: String,
    default: 'flex-end',
  },
  size: {
    type: String,
    default: 'default',
  },
  cancelBtnType: {
    type: String,
    default: 'default',
  },
  cancelDisabled: {
    type: Boolean,
    default: false,
  },
  cancelText: {
    type: String,
    default: '取消',
  },
  confirmBtnType: {
    type: String,
    default: 'primary',
  },
  confirmDisabled: {
    type: Boolean,
    default: false,
  },
  confirmText: {
    type: String,
    default: '确认',
  },
})

// 定义事件
const emit = defineEmits(['submit', 'cancel'])

const loading = ref(false)

// 取消事件
const handleCancel = () => {
  emit('cancel')
}

// 确认事件
const handleConfirm = async () => {
  loading.value = true
  try {
    await ElMessageBox.confirm('是否确认此操作?', '提交确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
    emit('submit')
  } catch (err) {
    ElMessage.info('已取消操作')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.confirm-cancel-btn-group {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  width: 100%;
  box-sizing: border-box;

  :deep(.el-button) {
    min-width: 100px;
    height: 40px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .cancel-btn {
    :deep(.el-button) {
      &:hover {
        border-color: #c0c4cc;
        background-color: #f8f9fa;
        color: #606266;
      }
    }
  }

  .confirm-btn {
    :deep(.el-button) {
      &:hover {
        filter: brightness(1.05);
      }
      &:active {
        filter: brightness(0.95);
      }
    }
  }

  :deep(.el-button.is-disabled) {
    opacity: 0.7;
    cursor: not-allowed;
  }
}
</style>
