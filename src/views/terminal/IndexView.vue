<template>
  <div ref="terminalRef" style="width: 100%; height: 700px"></div>
</template>
<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { Shell } from '@/utils/terminal'
const terminalRef = ref(null)
const shell = new Shell()
onMounted(() => {
  const auth = {
    type: 0,
    data: {
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzgzNTg1NjQxLCJpYXQiOjE3NjYzMDU2NDEsImp0aSI6IjIyNmM2MmFjYjIxNjRkMGRhZDBjNmFiYzdiYzc0MTU4IiwidXNlcl9pZCI6IjEifQ.2OYWb8JhZ0K8C7w8Q5cl62GJLo0nBWXMEDBYVMbXB9M',
      resource_id: 1,
      voucher_id: 1,
    },
  }
  shell.mount(terminalRef)
  shell.connect(auth)
})
</script>
<style scoped></style>
