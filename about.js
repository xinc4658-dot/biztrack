// about.js
function openSidebar() {
    var side = document.getElementById('sidebar');
    side.style.display = (side.style.display === "block") ? "none" : "block";
}

function closeSidebar() {
    document.getElementById('sidebar').style.display = 'none';
}

// 🔥 终极修复：解决单引号 &#39; 显示异常（标题+文本全部正常）
function fixAboutQuotes() {
  setTimeout(() => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      // 把转义字符强制还原为正常单引号
      el.textContent = el.textContent.replace(/&#39;/g, "'");
    });
  }, 20);
}

// 页面刚加载就修复
document.addEventListener('DOMContentLoaded', fixAboutQuotes);

// 切换语言时再次修复
window.addEventListener('languageChanged', fixAboutQuotes);