import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Pattern to find the large @font-face block for HKPianPian
# The regex uses negative lookaheads/behinds or just matches the opening and closing braces
pattern = r"(\s+/\*\s*1\.\s*引入本地华康翩翩体\s*\*/\s*)@font-face\s*\{[^\}]*font-family:\s*'HKPianPian';[^\}]*\}"

replacement = r"""\1
        /* 字体已被移至 fontData.js，并由下方 JS 动态注入 */
"""

html = re.sub(pattern, replacement, html, flags=re.DOTALL)

# Add the script tag to head
head_closing_pattern = r"(</head>)"
script_injection = r"""
    <!-- 引入提取出的 Base64 字体数据 -->
    <script src="fontData.js"></script>
    <script>
        // 动态将字体注入到页面中，避免 index.html 大量冗余代码
        const fontStyle = document.createElement('style');
        fontStyle.innerHTML = `
            @font-face {
                font-family: 'HKPianPian';
                src: url('${myFontBase64}') format('truetype');
                font-weight: normal;
                font-style: normal;
            }
        `;
        document.head.appendChild(fontStyle);
    </script>
\1"""

# Ensure we don't inject multiple times
if "fontData.js" not in html:
    html = re.sub(head_closing_pattern, script_injection, html, count=1, flags=re.IGNORECASE)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Rewrite finished.")
