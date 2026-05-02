// shared-utils.js
// Shared frontend helpers for BizTrack.
// This module reduces repeated page-level utility logic and supports Category 2 scalability work.

import { escapeHTML } from './i18n/utils.js';

export { escapeHTML };

export function debounce(fn, delay = 250) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

export function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.style.display = sidebar.style.display === 'block' ? 'none' : 'block';
}

export function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.style.display = 'none';
}

export function sanitizeCSVField(value) {
    let text = value === null || value === undefined ? '' : String(value);

    // Prevent CSV formula injection when opened in spreadsheet software.
    if (/^[=+\-@]/.test(text)) {
        text = "'" + text;
    }

    // Keep CSV structure valid when fields contain commas, quotes, or line breaks.
    if (text.includes(',') || text.includes('\n') || text.includes('\r') || text.includes('"')) {
        text = '"' + text.replace(/"/g, '""') + '"';
    }

    return text;
}

export function generateCSV(data, headers) {
    const headerRow = Object.values(headers).map(sanitizeCSVField).join(',');
    const rows = data.map(row => Object.values(row).map(sanitizeCSVField).join(','));
    return [headerRow, ...rows].join('\n');
}

export function downloadCSV(csvContent, filename) {
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function sortTableRowsByDataset(tbody, column, numericColumns = []) {
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    const isNumeric = numericColumns.includes(column);

    rows.sort((a, b) => {
        const rawA = a.dataset[column] ?? '';
        const rawB = b.dataset[column] ?? '';

        if (isNumeric) {
            return parseFloat(rawA || 0) - parseFloat(rawB || 0);
        }

        return String(rawA).localeCompare(String(rawB), undefined, {
            numeric: true,
            sensitivity: 'base'
        });
    });

    tbody.replaceChildren(...rows);
}


export function fixEscapedApostrophes() {
    setTimeout(() => {
        document.querySelectorAll('[data-i18n]').forEach((element) => {
            element.textContent = element.textContent.replace(/&#39;/g, "'");
        });
    }, 20);
}

export function bindEscapedApostropheFix() {
    document.addEventListener('DOMContentLoaded', fixEscapedApostrophes);
    window.addEventListener('languageChanged', fixEscapedApostrophes);
}
// Keep compatibility with existing inline onclick handlers in HTML.
if (typeof window !== 'undefined') {
    window.biztrackUtils = {
        debounce,
        openSidebar,
        closeSidebar,
        sanitizeCSVField,
        generateCSV,
        downloadCSV,
        sortTableRowsByDataset,
        fixEscapedApostrophes,
        bindEscapedApostropheFix,
        escapeHTML
    };

    window.openSidebar = openSidebar;
    window.closeSidebar = closeSidebar;
    window.escapeHTML = window.escapeHTML || escapeHTML;
    window.fixEscapedApostrophes = fixEscapedApostrophes;
    window.bindEscapedApostropheFix = bindEscapedApostropheFix;
}