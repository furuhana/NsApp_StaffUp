import os

filepath = 'fontData.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read().strip()

# Change const to var if present
if content.startswith('const '):
    content = 'var ' + content[6:]

# Ensure it ends with ";
if not content.endswith('";'):
    if content.endswith(';'):
        content = content[:-1] + '";'
    else:
        content = content + '";'

# Add IIFE for auto-injection
injection_code = """

// 自动注入字体样式到页面
(function() {
    if (typeof document !== 'undefined' && !document.getElementById('injected-font-style')) {
        var fontStyle = document.createElement('style');
        fontStyle.id = 'injected-font-style';
        fontStyle.innerHTML = `
            @font-face {
                font-family: 'HKPianPian';
                src: url('${myFontBase64}') format('truetype');
                font-weight: normal;
                font-style: normal;
            }
        `;
        document.head.appendChild(fontStyle);
        console.log('Font "HKPianPian" has been dynamically injected.');
    }
})();
"""
if 'injected-font-style' not in content:
    content += injection_code

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done fixing fontData.js")
