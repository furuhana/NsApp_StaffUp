
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

                // 3.2 底层生成：截取包含底图和照片的区域
                const canvas = await html2canvas(exportCanvas, {
                    scale: 4,
                    useCORS: true,
                    backgroundColor: '#484848'
                });
                const basePngData = canvas.toDataURL('image/png');

                // 恢复文字层显示
                layer3.style.display = 'block';

                // 3.3 (Removed font loading)
                // 3.4 文字层生成：动态构建包含字体的 SVG
                const name = document.getElementById('nameText').innerText;
                const title = document.getElementById('titleText').innerText;
                const mbti = document.getElementById('mbtiText').innerText;

                // 我们不再通过 JS 传递 base64，直接复用页面内已经生效的样式，
                // 由于 html2canvas 无法截取到完整的内置字体SVG，这里还是需要在SVG里附带Base64
                // 为了避免代码重复，我们可以预先在页面上缓存 Base64，或者像这里一样直接写死在构建脚本中：

                const svgString = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="304" height="354" viewBox="0 0 304 354">
                        <defs>
                            <style>
                                /* 将 Base64 字体直接嵌入 SVG 内 */
                                @font-face {
                                    font-family: 'HKPianPian';
                                    src: url('data:font/truetype;charset=utf-8;base64,...') format('truetype');
                                }
                                .svg-name { font-family: 'HKPianPian', cursive; font-size: 60px; fill: #2A4FAC; stroke: #FFFFFF; stroke-width: 2.6px; paint-order: stroke fill; }
                                .svg-title { font-family: 'HKPianPian', cursive; font-size: 30px; fill: #2A4FAC; stroke: #FFFFFF; stroke-width: 2.6px; paint-order: stroke fill; letter-spacing: -1px; }
                                .svg-mbti { font-family: sans-serif; font-size: 18px; font-weight: bold; fill: #2A4FAC; }
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
            } finally {
                // 恢复 UI 状态
                downloadBtn.innerText = '下载高精度 PDF';
                downloadBtn.disabled = false;
            }
        });
    