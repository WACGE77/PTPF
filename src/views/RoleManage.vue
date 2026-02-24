<template>
  <div class="role-manage-page">
    <div class="page-header">
      <h2 class="title">角色管理</h2>
      <el-button type="primary" @click="openAddDialog">
        <component :is="getIconComponent('Plus')" />
        <span class="btn-text">新增角色</span>
      </el-button>
    </div>

    <div class="search-bar">
      <div class="search-item">
        <label class="search-label">角色名称：</label>
        <el-input
          v-model="searchForm.name"
          placeholder="请输入角色名称"
          clearable
          style="width: 180px;"
        />
      </div>
      <el-button type="primary" @click="searchRole">搜索</el-button>
      <el-button type="default" @click="resetSearch">重置</el-button>
    </div>

    <el-table :data="roleList" border stripe>
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="name" label="角色名称" min-width="120" />
      <el-table-column prop="code" label="角色编码" min-width="150" />
      <el-table-column prop="description" label="描述" min-width="200" />
      <el-table-column label="操作" width="140" align="center">
        <template #default="scope">
          <el-dropdown v-if="!scope.row.protected" trigger="click">
            <el-button size="small">
              操作 <i class="el-icon-arrow-down el-icon--right" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="openEditDialog(scope.row)">
                  编辑
                </el-dropdown-item>
                <el-dropdown-item @click="deleteRole(scope.row)" divided style="color:#F56C6C">
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </div>

    <el-dialog
      v-model="formDialogShow"
      width="600px"
      @close="closeFormDialog"
    >
      <div class="form-header">
        <h3 class="form-title">
          {{ currentRole.id === 0 ? '添加角色' : '编辑角色' }}
        </h3>
      </div>

      <el-form ref="formRef" :model="currentRole" :rules="formRules" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="currentRole.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="currentRole.code" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="currentRole.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
      </el-form>

      <template #footer>
        <ConfirmCancelBtnGroup
          :quit="closeFormDialog"
          :submit="formSubmit"
          :destruct="formDestruct"
        />
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getIconComponent } from '@/utils/iconMap.ts'
import ConfirmCancelBtnGroup from '@/components/common/ConfirmCancelButton.vue'
import { type Role } from '@/struct/rbac.ts'
import { request_error } from '@/requests'
import api from '@/api'

const searchForm = ref({
  name: '',
})

const roleList = ref<Role[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const currentRole = ref<Role>({
  id: 0,
  name: '',
  code: '',
  description: '',
  status: true,
})

const formDialogShow = ref(false)
const formRef = ref()

const emptyCurrentRole = () => {
  currentRole.value = {
    id: 0,
    name: '',
    code: '',
    description: '',
    status: true,
  }
}

const formRules = ref({
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
  ],
})

const openAddDialog = async () => {
  emptyCurrentRole()
  formDialogShow.value = true
}

const openEditDialog = async (row: Role) => {
  emptyCurrentRole()
  Object.assign(currentRole.value, row)
  formDialogShow.value = true
}

const closeFormDialog = async () => {
  emptyCurrentRole()
  formDialogShow.value = false
}

const formSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch (error) {
    ElMessage.error('表单填写有误，请检查必填项！')
    return
  }

  try {
    let res = null
    if (currentRole.value.id === 0) {
      res = await api.roleApi.addRole(currentRole.value)
      ElMessage.success('添加成功')
    } else {
      res = await api.roleApi.updateRole(currentRole.value)
      ElMessage.success('修改成功')
    }
    if (res.data.code === 200) {
      await closeFormDialog()
      await init()
    } else {
      ElMessage.error(res.data.detail)
    }
  } catch (err) {
    request_error(err)
  }
}

const formDestruct = async () => {
  await init()
  await closeFormDialog()
}

const deleteRole = async (row: Role) => {
  try {
    await ElMessageBox.confirm('是否确认删除该角色?', '删除确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch(err){
    return
  }
  const data = {
    id_list: [row.id]
  }
  try{
    const res = await api.roleApi.deleteRole(data)
    if (res.data.code === 200){
      ElMessage.success('删除成功')
      init()
    } else {
      ElMessage.error(res.data.detail || '删除失败')
    }
  }catch (err){
    request_error(err)
  }
}

const searchRole = async () => {
  currentPage.value = 1
  const searchParams: Record<string, any> = {
    page: currentPage.value,
    size: pageSize.value
  }
  if (searchForm.value.name) {
    searchParams.name = searchForm.value.name
  }
  try {
    const res = await api.roleApi.getRole(searchParams)
    if (res.data.code === 200) {
      roleList.value = res.data.detail
      total.value = res.data.total
    } else {
      ElMessage.error(res.data.detail)
    }
  } catch (error) {
    request_error(error)
  }
}

const resetSearch = () => {
  searchForm.value.name = ''
  currentPage.value = 1
  init()
}

const init = async () => {
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      size: pageSize.value
    }
    if (searchForm.value.name) {
      params.name = searchForm.value.name
    }
    const res = await api.roleApi.getRole(params)
    if (res.data.code === 200) {
      roleList.value = res.data.detail
      total.value = res.data.total
    } else {
      ElMessage.error(res.data.detail)
    }
  } catch(error) {
    request_error(error)
  }
}

onMounted(() => {
  init()
})
</script>

<style scoped lang="scss">
$primary-color: #409eff;
$text-primary: #303133;
$text-regular: #606266;
$border-color: #e6e6e6;
$bg-light: #f8f9fa;

.role-manage-page {
  padding: 20px;
  background-color: #ffffff;
  min-height: calc(100vh - 60px);
  box-sizing: border-box;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .title {
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
      margin: 0;
    }

    :deep(.el-button) {
      --el-button-border-radius: 6px;
      height: 40px;
      padding: 0 16px;
      font-size: 14px;
      font-weight: 500;

      .btn-text {
        margin-left: 6px;
      }
    }
  }

  .search-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px 20px;
    background-color: $bg-light;
    border-radius: 6px;
    margin-bottom: 16px;

    .search-item {
      display: flex;
      align-items: center;

      .search-label {
        font-size: 14px;
        color: $text-regular;
        margin-right: 8px;
        white-space: nowrap;
      }
    }

    :deep(.el-input) {
      .el-input__inner {
        height: 36px;
        border-radius: 4px;
      }
    }

    :deep(.el-button) {
      height: 36px;
      padding: 0 16px;
      margin-left: 8px;
    }
  }

  :deep(.el-table) {
    --el-table-header-text-color: $text-primary;
    --el-table-row-hover-bg-color: #f5f7fa;

    .el-switch {
      --el-switch-on-color: #409eff !important;
      --el-switch-off-color: #f56c6c !important;
      --el-switch-on-text-color: #ffffff !important;
      --el-switch-off-text-color: #ffffff !important;
    }
  }

  .pagination {
    margin-top: 20px;
    text-align: right;
  }

  :deep(.el-dialog) {
    .el-dialog__header {
      padding: 16px 20px;
      border-bottom: 1px solid $border-color;
    }

    .el-dialog__body {
      padding: 20px;
    }
  }

  .form-header {
    margin-bottom: 20px;
    border-bottom: 1px solid $border-color;
    padding-bottom: 10px;

    .form-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: $text-primary;
    }
  }
}
</style>
