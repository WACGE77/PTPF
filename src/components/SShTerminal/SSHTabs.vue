<template>
<div>
  <BlankPage :flag="!tabs.length"></BlankPage>
<el-tabs
  v-model="activeTab"
  @tab-remove="tab_remove"
  @tab-change="tab_change"
  closable
>
  <el-tab-pane
    v-for="tab in tabs"
    :key="tab.name"
    :name="tab.name"
    :label="tab.name"
  >
    <div
      v-show="tab.name === activeTab"
      :ref="(el) => {
        tab.ele = el as Dom
      }"
    >
    </div>
  </el-tab-pane>
</el-tabs>
</div>
</template>
<script lang="ts" setup>
import { nextTick, onBeforeUnmount, ref } from 'vue'
import type { Dom, terminalTab } from '@/struct/terminal.ts'
import Shell from '@/utils/terminal.ts'
import BlankPage from '@/components/SShTerminal/BlankPage.vue'

const tabs = ref<terminalTab[]>([])
const activeTab = ref<string>()
const find_ele = (key:string)=> {
  return tabs.value.find(tab => tab.name === key)
}
const session_add = async (resource:number,voucher:number,token:string) => {
  const key = String(resource)
  if ( find_ele(key) ){
    await tab_change(key)
    return true
  }
  const instance:terminalTab = {
    name: key,
    shell: new Shell(),
    ele:null
  }
  tabs.value.push(instance)
  activeTab.value = instance.name
  await nextTick()
  if (!instance.ele)return false
  instance.shell.mount(instance.ele)
  await instance.shell.connect(resource,voucher,token)
}
const tab_remove = async (name:string) => {
  const tab = find_ele(name)
  if (!tab) return
  tab.shell.close()
  tabs.value.splice(tabs.value.indexOf(tab), 1)
}
const tab_change = async (name:string) => {
  const tab = find_ele(name)
  if (!tab) return
  activeTab.value = tab.name
}
defineExpose({
  session_add
})
onBeforeUnmount(() => {
  tabs.value.forEach(tab => tab.shell.close())
  tabs.value.length = 0
})
session_add(1,1,"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzg2NzExMjA3LCJpYXQiOjE3Njk0MzEyMDcsImp0aSI6ImI5ZDc1ODdmM2EyZDRkYzdiYzI3OGVhNmM0OGRlM2I3IiwidXNlcl9pZCI6IjEifQ.ST8ZdChpXpyXX1WUfIr0OJhSxAbI-rE32suJoa4ngwE")
</script>
<style scoped>
</style>
