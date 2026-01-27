<script setup lang="ts">
defineProps<{
  flag:boolean
}>()
</script>

<template>
<div><h1 v-if="flag">请链接服务器</h1></div>
</template>

<style scoped>

</style>
