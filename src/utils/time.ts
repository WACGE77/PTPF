function formatISODate(isoString: string | null | undefined): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai', // 确保按东八区显示（即使浏览器时区不同）
  }).format(date)
}

export default {
  formatISODate,
}
