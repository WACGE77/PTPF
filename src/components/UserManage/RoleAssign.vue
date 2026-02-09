<template>
  <div class="role-assign-container">
    <!-- 角色搜索区域 -->
    <div class="role-search">
      <el-input placeholder="请输入角色名称/编码搜索" prefix="Search" clearable size="large" />
    </div>

    <div class="role-content">
      <!-- 已选角色区域（简约风，去掉大方框） -->
      <div class="selected-roles">
        <div class="section-title">已选角色</div>
        <!-- 移除背景框，仅保留标签行 -->
        <transition-group name="tag-fade" tag="div" class="selected-tags">
          <el-tag
            v-for="role in selectedRoleList"
            :key="role.id"
            closable
            type="primary"
            effect="light"
            size="default"
            class="role-tag"
            @close="RemoveTag(role)"
          >
            {{ role.name }}
          </el-tag>
          <div v-if="selectedRoleList.length === 0" class="empty-tip">暂无选中角色</div>
        </transition-group>
      </div>

      <!-- 角色列表区域（点击整体div变色） -->
      <div class="role-list">
        <div class="section-title">角色列表</div>
        <div class="role-list-container">
          <!-- 角色项（点击整体变色，无额外标识） -->
          <div
            v-for="role in roles"
            :key="role.id"
            class="role-item"
            :class="{
              'is-selected': role.isSelected,
              'is-disabled': !role.isSelected,
            }"
            @click="handleRoleClick(role)"
          >
            <!-- 仅保留角色信息，移除选中标识 -->
            <div class="role-info-row">
              <div class="role-name-col">{{ role.name }}</div>
              <div class="role-code-col">{{ role.code }}</div>
              <div class="role-desc-col">{{ role.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {type Role} from '@/struct/rbac.ts'
import { type Ref, ref } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'
import { request_error } from '@/requests'
interface RoleItem extends Role{
  isSelected?:boolean|0
}
const props = defineProps({
  user:{
    type:Number,
  },
  roles:{
    type:Array<RoleItem>,
    default:[]
  },
  userRoles:{
    type:Array<number>,
    default : []
  }
})
const selectedRoleList:Ref<RoleItem[]> = ref([])

const submit = async () =>{
  if(!props.user)return
  const assign = []
  selectedRoleList.value.forEach((ele:RoleItem) => {
    assign.push(ele.id)
  })
  const data = {
    id:props.user,
    roles : assign
  }
  try {
    const res = await api.userApi.updateUser(data)
    if (res.data.code == 200){
      ElMessage.success('绑定成功')
    }else{
      ElMessage.error(res.data.detail)
    }
  }catch (err){
    request_error(err)
  }
}

const handleRoleClick = (role) => {
  role.isSelected = !role.isSelected
  if ( role.isSelected ){
    selectedRoleList.value.push(role)
  }else{
    RemoveTag(role)
  }
}
const RemoveTag = (role:RoleItem) =>{
  role.isSelected = false
  selectedRoleList.value = selectedRoleList.value.filter((ele) => ele.id!=role.id)
}
const init = async ()=>{
  const validRoles = Array.isArray(props.roles) ? props.roles : []
  const validUserRoles = Array.isArray(props.userRoles) ? props.userRoles : []
  selectedRoleList.value = []
  validRoles.forEach((ele:RoleItem) => {
    const isSelected = ele.id && validUserRoles.includes(ele.id)
    ele.isSelected = isSelected
    if (isSelected) {
      selectedRoleList.value.push(ele)
    }
  })
}
init()
</script>

<style scoped lang="scss">
.role-assign-container {
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;

  // 搜索框样式（微调）
  .role-search {
    margin-bottom: 20px;

    :deep(.el-input) {
      width: 100%;
      max-width: none;
      height: 44px;
      font-size: 14px;
      border-radius: 6px;
    }
    :deep(.el-input__prefix) {
      font-size: 16px;
      margin-right: 8px;
    }
  }

  // 内容区域
  .role-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
  }

  // 通用标题样式（简约化）
  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
    padding-bottom: 4px;
    border-bottom: 1px solid #f0f0f0;
  }

  // 已选角色区域（核心简约化）
  .selected-roles {
    .selected-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      min-height: 36px;

      .role-tag {
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

  // 角色列表区域
  .role-list {
    .role-list-container {
      display: flex;
      flex-direction: column;
      gap: 8px; // 缩小角色项间距
      max-height: 350px;
      overflow-y: auto;
      overflow-x: hidden;
      width: 100%;
      box-sizing: border-box;
    }

    // 角色项（核心：点击整体变色）
    .role-item {
      width: 100%;
      display: flex;
      align-items: center;
      padding: 12px 16px; // 缩小内边距
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      background-color: #fff;
      transition: all 0.2s ease;
      position: relative;
      box-sizing: border-box;
      border: 1px solid transparent; // 透明边框避免位移

      // 选中状态：整体变色
      &.is-selected {
        background-color: #e8f4ff; // 淡蓝色背景
        border-color: #409eff; // 蓝色边框
        color: #303133;

        // 选中时文字高亮
        .role-name-col {
          color: #409eff;
          font-weight: 600;
        }
      }

      // 禁用状态样式
      &.is-disabled {
        opacity: 0.6;
        background-color: #fafafa;
        color: #c0c4cc;
      }

      // hover效果（非禁用）
      &:not(.is-disabled):hover {
        background-color: #f5f7fa;
        border-color: #e6e6e6;
      }

      // 角色信息布局（简约化）
      .role-info-row {
        display: flex;
        align-items: center;
        gap: 16px;
        width: 100%;
        flex-wrap: wrap;

        .role-name-col {
          font-weight: 500;
          color: #303133;
          min-width: 100px;
          font-size: 14px;
        }

        .role-code-col {
          font-size: 12px;
          color: #606266;
          min-width: 120px;
          font-family: 'Consolas', monospace;
          opacity: 0.8;
        }

        .role-desc-col {
          font-size: 12px;
          color: #909399;
          line-height: 1.4;
          flex: 1;
          min-width: 180px;
          padding-right: 4px;
        }
      }
    }
  }

  // 滚动条样式（简约化）
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

  // 标签动画（简约化）
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
