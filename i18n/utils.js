/**
 * HTML转义
 * utils.js
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, 
    tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag)
  );
}

/**
 * 占位符替换 {field}
 */
export function replaceParams(text, params) {
  if (!params || typeof text !== 'string') return text;
  Object.keys(params).forEach(param => {
    text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
  });
  return text;
}

// 【新增】挂载到window，供非模块化脚本使用
if (typeof window !== 'undefined') {
  window.escapeHTML = escapeHTML;
  window.replaceParams = replaceParams;
}