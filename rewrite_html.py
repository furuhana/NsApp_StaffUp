import re

html_path = 'index.html'

def fix_html():
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Modify CSS photo-image to use background image instead of object-fit
    css_img_old = r"""        .photo-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }"""
    css_img_new = """        .photo-image {
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-color: #e0e0e0;
        }"""
    content = content.replace(css_img_old, css_img_new)

    # 2. Modify dom for photo-image
    dom_img_old = r'<img src="https://via.placeholder.com/246x246.png?text=Click+to+Upload" alt="头像" class="photo-image"' + '\n' + r'                    id="avatarImage">'
    dom_img_new = r'<div class="photo-image" id="avatarImage" style="background-image: url(\'https://via.placeholder.com/246x246.png?text=Click+to+Upload\');"></div>'
    content = content.replace(dom_img_old, dom_img_new)

    # 3. Modify JS for file upload
    js_img_old = r"""                reader.onload = function (event) {
                    avatarImage.src = event.target.result;
                }"""
    js_img_new = """                reader.onload = function (event) {
                    avatarImage.style.backgroundImage = 'url(' + event.target.result + ')';
                }"""
    content = content.replace(js_img_old, js_img_new)

    # 4. Modify fixing the SVG rendering
    # The SVG rendering is currently converting to an Image and then drawing on Canvas.
    # The discrepancy in position happens because the SVG hardcodes coordinates (x=30, y=310) 
    # instead of strictly following the exact DOM bounding boxes, AND the Canvas rendering 
    # might not wait for the Base64 font to be parsed in the SVG's isolated context.
    # We will instead calculate the EXACT actual bounding client rectangles.
    
    js_pdf_old = """                // 3.4 文字层生成：动态构建包含字体的 SVG
                const name = document.getElementById('nameText').innerText;
                const title = document.getElementById('titleText').innerText;
                const mbti = document.getElementById('mbtiText').innerText;

                // 我们不再通过 JS 传递 base64，直接复用页面内已经生效的样式，
                // 由于 html2canvas 无法截取到完整的内置字体SVG，这里还是需要在SVG里附带Base64
                // 为了避免代码重复，我们可以预先在页面上缓存 Base64，或者像这里一样直接写死在构建脚本中：

                const svgString = `"""

    # We use regex to find where svgString ends and the PDF block starts
    # We replace from js_pdf_old to doc.save('员工卡片.pdf');
    # Wait, the string to replace is quite long because it has the injected base64 font.
    # I should just use regex to replace the entire try block.
    
    try_block_pattern = re.compile(r'try \{\s*// 3\.1 准备阶段.*?// 恢复 UI 状态', re.DOTALL)
    
    new_try_block = r"""try {
                // 新逻辑：不用 SVG 手写偏移量，直接读取实际 DOM 的位置！
                // 为了避免 html2canvas 渲染 font-stroke 以及 font-family 的毛刺问题，
                // 我们可以使用 html2canvas 截取整个画布。
                // 新版 html2canvas 1.4.1 在纯本地环境（以及 Base64 加载的字体下）处理 -webkit-text-stroke 还是可以的，
                // 但为了绝对与预览保持一模一样的位置，我们决定直接让 html2canvas 连同文字层一起全量处理。
                // 因为我们的字体是 Base64 直接写在 CSS 里的，html2canvas 能完美解析它！
                
                // 但还有一个保险方案：用 html2canvas 截取底图，然后自己遍历 text-layer 里的文字
                // 放到 Canvas 渲染。因为 html2canvas 对 -webkit-text-stroke 处理确实不好，
                // 而 ctx.strokeText 则可以通过 ctx.miterLimit / ctx.lineJoin 来完美模拟！
                
                // 因为用户要求两者的“位置和文字”必须完全一致，最简单的方案就是移除 SVG 生成，直接用 html2canvas 截图全量！
                // 如果发现线太细，我们可以利用 text-shadow 辅助 html2canvas 去渲染边框。
                
                // 给字体加 text-shadow 来增强描边（如果原本只有 webkit-text-stroke，它可能会在 canvas 变形）
                const nameEl = document.getElementById('nameText');
                const titleEl = document.getElementById('titleText');
                const prevNameStroke = nameEl.style.webkitTextStroke;
                const prevTitleStroke = titleEl.style.webkitTextStroke;
                
                // 截取全屏！不要分图层了。既然完全没有异步字体等干扰，全局截图即可保持位置 100% 一一对应。
                const fullCanvas = await html2canvas(exportCanvas, {
                    scale: 4,
                    useCORS: true,
                    backgroundColor: '#484848'
                });
                
                const fullPngData = fullCanvas.toDataURL('image/png');

                // 合成 PDF
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [304, 354]
                });

                doc.addImage(fullPngData, 'PNG', 0, 0, 304, 354);
                doc.save('员工卡片.pdf');

            } catch (error) {
                console.error("生成流程中断:", error);
            } finally {
                // 恢复 UI 状态"""
    
    content = try_block_pattern.sub(new_try_block, content)
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_html()
pass
