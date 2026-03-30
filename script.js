// ================= 交互功能 (JavaScript) =================

// 1. 图片替换功能
const imageInput = document.getElementById('imageInput');
const avatarImage = document.getElementById('avatarImage');

imageInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            avatarImage.src = event.target.result;
        }
        reader.readAsDataURL(file);
    }
});

// 2. MBTI 弹窗切换逻辑
const mbtiText = document.getElementById('mbtiText');
const mbtiToolbar = document.getElementById('mbtiToolbar');

// 点击文字唤出/隐藏弹窗
mbtiText.addEventListener('click', function (e) {
    e.stopPropagation(); // 阻止点击穿透
    mbtiToolbar.style.display = (mbtiToolbar.style.display === 'flex') ? 'none' : 'flex';
});

// 点击网页空白处自动隐藏弹窗
document.addEventListener('click', function (e) {
    if (!mbtiToolbar.contains(e.target) && e.target !== mbtiText) {
        mbtiToolbar.style.display = 'none';
    }
});

// HTML 里的 onclick 绑定的函数（使用 window. 挂载保证全局能调用）
window.setMbti = function (type) {
    if (type === 'i') {
        mbtiText.innerText = '(i人)';
    } else if (type === 'e') {
        mbtiText.innerText = '(e人)';
    }
    // 选完后自动关掉弹窗
    mbtiToolbar.style.display = 'none';
}


// 3. 核心导出逻辑 (PDF 生成)
const downloadBtn = document.getElementById('downloadBtn');
const exportCanvas = document.getElementById('exportCanvas');
const layer3 = document.getElementById('layer3');

downloadBtn.addEventListener('click', async () => {
    // 状态：正在处理
    downloadBtn.innerText = '正在生成(处理字体中)...';
    downloadBtn.disabled = true;

    try {
        // 3.1 准备阶段：隐藏文字层 (图层3) 
        layer3.style.display = 'none';

        // 截图前必须强制隐藏 mbti 工具栏面板，防止它被印在底图上！
        mbtiToolbar.style.display = 'none';

        // 3.2 底层生成：截取包含底图和照片的区域
        const canvas = await html2canvas(exportCanvas, {
            scale: 4,
            useCORS: true,
            backgroundColor: '#484848'
        });
        const basePngData = canvas.toDataURL('image/png');

        // 恢复文字层显示
        layer3.style.display = 'block';

        // 3.4 文字层生成：动态构建包含字体的 SVG
        const name = document.getElementById('nameText').innerText;
        const title = document.getElementById('titleText').innerText;
        const mbti = document.getElementById('mbtiText').innerText;

        const svgString = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="304" height="354" viewBox="0 0 304 354">
                        <defs>
                            <style>
                                /* 将 Base64 字体直接嵌入 SVG 内 (请确保这里写的是你打包后的真实超长 base64 字符串) */
                                @font-face {
                                    font-family: 'HKPianPian';
                                    src: url('data:font/truetype;charset=utf-8;base64,...') format('truetype');
                                }
                                .svg-name { font-family: 'HKPianPian', cursive; font-size: 60px; fill: #2A4FAC; stroke: #FFFFFF; stroke-width: 2.6px; paint-order: stroke fill; }
                                .svg-title { font-family: 'HKPianPian', cursive; font-size: 30px; fill: #2A4FAC; stroke: #FFFFFF; stroke-width: 2.6px; paint-order: stroke fill; letter-spacing: -1px; }
                                /* 这里已经修改为使用手写体 */
                                .svg-mbti { font-family: 'HKPianPian', cursive; font-size: 18px; fill: #2A4FAC; }
                            </style>
                        </defs>
                        <text x="30" y="310" class="svg-name" transform="rotate(-12, 30, 310)">${name}</text>
                        <text x="110" y="310" class="svg-title" transform="rotate(-12, 110, 310)">${title}</text>
                        <text x="212" y="325" class="svg-mbti">${mbti}</text>
                    </svg>
                `;

        // 将 SVG 转换为 Data URL
        const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

        // 3.4.5 因为 jsPDF addImage 不支持直接塞 SVG，这里我们将 SVG 绘制到 Canvas 上再转 PNG
        const svgImage = new Image();
        svgImage.src = svgDataUrl;

        await new Promise((resolve, reject) => {
            svgImage.onload = resolve;
            svgImage.onerror = reject;
        });

        const tempCanvas = document.createElement('canvas');
        // 使用更高的分辨率 (按 scale=4 渲染)
        tempCanvas.width = 304 * 4;
        tempCanvas.height = 354 * 4;
        const ctx = tempCanvas.getContext('2d');
        ctx.scale(4, 4);
        ctx.drawImage(svgImage, 0, 0);

        const svgPngData = tempCanvas.toDataURL('image/png');

        // 3.5 合成 PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [304, 354]
        });

        doc.addImage(basePngData, 'PNG', 0, 0, 304, 354);
        doc.addImage(svgPngData, 'PNG', 0, 0, 304, 354);
        doc.save('员工卡片.pdf');

    } catch (error) {
        console.error("生成流程中断:", error);
        alert("生成失败，请检查控制台报错。");
    } finally {
        // 恢复 UI 状态
        downloadBtn.innerText = '下载高精度 PDF';
        downloadBtn.disabled = false;
    }
});