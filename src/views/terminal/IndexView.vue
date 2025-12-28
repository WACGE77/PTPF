<template>
  <div ref="terminalRef" style="width: 100%; height: 500px"></div>
  <button>reset</button>
</template>
<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import requests from '@/requests'
const terminalRef = ref(null)
const shell = new WebSocket(requests.getWsBaseUrl() + '/terminal/ssh/')
const status = ref(false)
onMounted(() => {
  const term = new Terminal({ fontSize: 14 })
  const fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  fitAddon.fit()
  const auth = {
    token: localStorage.getItem('token'),
    resource_id: 1,
    voucher_id: 1,
  }
  shell.onopen = () => {
    status.value = true
    shell.send(JSON.stringify(auth))
  }
  shell.onmessage = (event: MessageEvent) => {
    term.write(event.data)
  }
  shell.onclose = () => {
    status.value = false
  }
  term.open(terminalRef.value!)
  term.onData((data) => {
    if (status.value) {
      const tmp = { message: data }
      shell.send(JSON.stringify(tmp))
    }
  })

  onUnmounted(() => {
    term.dispose()
    shell.close()
  })
})
</script>
<style scoped></style>
