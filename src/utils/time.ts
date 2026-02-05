/**
 * 将 ISO 格式时间字符串转换为人类可读的时间
 * @param isoTime - ISO格式时间字符串（如：2026-02-05T20:35:47.416479+08:00）
 * @param format - 输出格式（可选，默认 'YYYY-MM-DD HH:mm:ss'）
 *                 支持的占位符：YYYY(年)、MM(月)、DD(日)、HH(时)、mm(分)、ss(秒)、SSS(毫秒)
 * @returns 人类可读的时间字符串，解析失败返回 '-'
 */
function formatIsoTimeToReadable(
  isoTime: string | null | undefined,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  // 处理空值/非法输入
  if (!isoTime) return '-';

  try {
    // 创建 Date 对象（自动解析带时区的 ISO 字符串）
    const date = new Date(isoTime);

    // 检查 Date 对象是否有效
    if (isNaN(date.getTime())) {
      return '时间格式错误';
    }

    // 提取时间各部分（补零确保两位数）
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需+1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    // 替换格式占位符
    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
      .replace('SSS', milliseconds);
  } catch (error) {
    console.error('时间解析失败：', error);
    return '解析失败';
  }
}
export {
  formatIsoTimeToReadable,
}
