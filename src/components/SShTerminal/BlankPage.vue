<script setup lang="ts">
import { Monitor } from '@element-plus/icons-vue'

defineProps<{
  flag: boolean
}>()
</script>

<template>
  <div class="blank-page">
    <div class="blank-content" v-if="flag">
      <div class="icon-container">
        <el-icon class="blank-icon"><Monitor /></el-icon>
      </div>
      <h2 class="blank-title">请链接服务器</h2>
      <p class="blank-desc">从左侧资源列表中选择服务器并连接</p>
      <div class="decorative-elements">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$primary-color: #409eff;
$text-primary: #303133;
$text-regular: #606266;
$border-color: #e6e6e6;
$bg-light: #f8f9fa;

.blank-page {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $bg-light;
  position: relative;
  overflow: hidden;
  
  .blank-content {
    text-align: center;
    padding: 60px;
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.1);
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    animation: fadeInUp 0.8s ease-out forwards;
    transform: translateY(20px);
    opacity: 0;
    
    .icon-container {
      margin-bottom: 24px;
      animation: bounce 2s ease-in-out infinite;
      
      .blank-icon {
        font-size: 72px;
        color: $primary-color;
        transition: all 0.3s ease;
        
        &:hover {
          transform: scale(1.1);
          color: lighten($primary-color, 10%);
        }
      }
    }
    
    .blank-title {
      font-size: 24px;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 20px;
      animation: fadeIn 1s ease-out 0.2s forwards;
      opacity: 0;
    }
    
    .blank-desc {
      font-size: 16px;
      color: $text-regular;
      line-height: 1.6;
      margin-bottom: 40px;
      animation: fadeIn 1s ease-out 0.4s forwards;
      opacity: 0;
    }
    
    .decorative-elements {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      
      .circle {
        position: absolute;
        border-radius: 50%;
        background-color: rgba($primary-color, 0.05);
        animation: float 6s ease-in-out infinite;
        
        &.circle-1 {
          width: 120px;
          height: 120px;
          top: -60px;
          right: -60px;
          animation-delay: 0s;
        }
        
        &.circle-2 {
          width: 80px;
          height: 80px;
          bottom: -40px;
          left: -40px;
          animation-delay: 2s;
        }
        
        &.circle-3 {
          width: 40px;
          height: 40px;
          top: 40px;
          left: 40px;
          animation-delay: 4s;
        }
      }
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(180deg);
  }
}

@media (max-width: 768px) {
  .blank-content {
    padding: 40px 30px !important;
    max-width: 90% !important;
    
    .icon-container .blank-icon {
      font-size: 48px !important;
    }
    
    .blank-title {
      font-size: 18px !important;
    }
  }
}
</style>
