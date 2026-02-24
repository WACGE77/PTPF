<template>
  <div class="confirm-cancel-btn-group" :style="{ justifyContent: align }">
    <!-- 取消按钮 -->
    <el-button @click="props.quit" :size="size" :type="cancelBtnType" :disabled="cancelDisabled" class="cancel-btn">
      {{ cancelText }}
    </el-button>

    <!-- 确认按钮 -->
    <el-button
      :size="size"
      :type="confirmBtnType"
      :disabled="confirmDisabled"
      :loading="loading"
      class="confirm-btn"
      @click="click_event"
    >
      {{ confirmText }}
    </el-button>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'

const props = defineProps({
  // 按钮组对齐方式
  align: {
    type: String,
    default: 'flex-end', // 默认右对齐
  },
  // 按钮尺寸（Element Plus 支持：large / default / small）
  size: {
    type: String,
    default: 'default', // 默认中等尺寸
  },
  // 取消按钮类型
  cancelBtnType: {
    type: String,
    default: 'default', // 默认普通按钮
  },
  // 取消按钮禁用状态
  cancelDisabled: {
    type: Boolean,
    default: false, // 默认不禁用
  },
  // 取消按钮文字
  cancelText: {
    type: String,
    default: '取消', // 默认文字“取消”
  },
  // 确认按钮类型
  confirmBtnType: {
    type: String,
    default: 'primary', // 默认主色调按钮（蓝色）
  },
  // 确认按钮禁用状态
  confirmDisabled: {
    type: Boolean,
    default: false, // 默认不禁用
  },
  // 确认按钮文字
  confirmText: {
    type: String,
    default: '确认', // 默认文字“确认”
  },
  //提交执行
  submit: {
    type: Function,
    default: async () => {},
  },
  quit:{
    type:Function,
    default: async () => {},
  },
  destruct:{
    type:Function,
    default: async () => {},
  },
})
const loading = ref(false)
const click_event = async () => {
  loading.value = true
  try {
    await ElMessageBox.confirm('是否确认此操作?', '提交确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await props.submit()
  } catch {}
  try {
    await props.destruct()
  } catch {}
  loading.value = false
}
</script>
<style scoped lang="scss">
.confirm-cancel-btn-group {
  display: flex;
  gap: 12px; // 按钮间距
  padding: 8px 0;
  width: 100%;
  box-sizing: border-box;

  // 按钮通用样式
  :deep(.el-button) {
    min-width: 100px; // 最小宽度，保证按钮不挤
    height: 40px; // 统一高度
    border-radius: 6px; // 圆角优化
    font-size: 14px; // 字体大小
    font-weight: 500;
    transition: all 0.2s ease;
  }

  // 取消按钮样式
  .cancel-btn {
    :deep(.el-button) {
      &:hover {
        border-color: #c0c4cc;
        background-color: #f8f9fa;
        color: #606266;
      }
    }
  }

  // 确认按钮样式
  .confirm-btn {
    :deep(.el-button) {
      &:hover {
        filter: brightness(1.05); // hover 轻微提亮
      }
      &:active {
        filter: brightness(0.95); // 点击轻微变暗
      }
    }
  }

  // 禁用状态样式优化
  :deep(.el-button.is-disabled) {
    opacity: 0.7;
    cursor: not-allowed;
  }
}
</style>
