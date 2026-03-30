        // ================= 交互功能 (JavaScript) =================

        // ================= MBTI 切换 =================
        const mbtiTextElClick = document.getElementById('mbtiText');
        const mbtiToolbarEl = document.getElementById('mbtiToolbar');

        mbtiTextElClick.addEventListener('click', function (e) {
            e.stopPropagation();
            if (mbtiToolbarEl.style.display === 'flex') {
                mbtiToolbarEl.style.display = 'none';
            } else {
                mbtiToolbarEl.style.display = 'flex';
            }
        });

        document.addEventListener('click', function () {
            mbtiToolbarEl.style.display = 'none';
        });

        function setMbti(type) {
            const mbtiEl = document.getElementById('mbtiText');
            if (type === 'i') {
                mbtiEl.innerText = '(i人)';
            } else {
                mbtiEl.innerText = '(e人)';
            }
            mbtiToolbarEl.style.display = 'none';
        }

        // 1. 图片替换功能
        const imageInput = document.getElementById('imageInput');
        const avatarImage = document.getElementById('avatarImage');

        imageInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    avatarImage.style.backgroundImage = 'url(' + event.target.result + ')';
                }
                reader.readAsDataURL(file);
            }
        });
        // ================= 照片操作逻辑 =================
        let currentScale = 1;
        let currentX = 0;
        let currentY = 0;

        function zoomImage(delta) {
            currentScale += delta;
            if (currentScale < 1) currentScale = 1; // 最小不能超过容器自身（即1.0倍拉伸）
            if (currentScale > 3) currentScale = 3; // 限制最大放大倍数

            // 缩小时重新限制拖拽边界
            const maxVal = 123 * (currentScale - 1) / currentScale;
            currentX = Math.max(-maxVal, Math.min(maxVal, currentX));
            currentY = Math.max(-maxVal, Math.min(maxVal, currentY));

            updateImageTransform();
        }

        function updateImageTransform() {
            const img = document.getElementById('avatarImage');
            img.style.transform = `scale(${currentScale}) translate(${currentX}px, ${currentY}px)`;
        }

        // ==== 图片拖拽逻辑 ====
        let isDragging = false;
        let hasMoved = false;
        let startClientX = 0;
        let startClientY = 0;
        let initialX = 0;
        let initialY = 0;

        const photoWrap = document.getElementById('photoWrap');

        photoWrap.addEventListener('mousedown', function (e) {
            if (e.target.closest('.tool-btn')) return;
            isDragging = true;
            hasMoved = false;
            startClientX = e.clientX;
            startClientY = e.clientY;
            initialX = currentX;
            initialY = currentY;
            photoWrap.style.cursor = 'grabbing';
            e.preventDefault(); // 防止默认的选中文本等行为
        });

        window.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            const dx = e.clientX - startClientX;
            const dy = e.clientY - startClientY;

            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                hasMoved = true;
            }

            // 计算新的位移（注意要除以 currentScale，因为 translate 是在 scale 之后的未缩放坐标系里）
            const newX = initialX + dx / currentScale;
            const newY = initialY + dy / currentScale;

            // 计算最大允许的拖拽范围，保证图片边缘不暴露出背景
            const maxVal = 123 * (currentScale - 1) / currentScale;

            currentX = Math.max(-maxVal, Math.min(maxVal, newX));
            currentY = Math.max(-maxVal, Math.min(maxVal, newY));

            updateImageTransform();
        });

        window.addEventListener('mouseup', function (e) {
            if (!isDragging) return;
            isDragging = false;
            photoWrap.style.cursor = 'pointer';

            if (!hasMoved) {
                // 如果没有发生明显拖拽，则视为点击，触发上传
                document.getElementById('imageInput').click();
            }
        });


        // ==== 适配移动端触摸拖拽 ====
        photoWrap.addEventListener('touchstart', function (e) {
            if (e.target.closest('.tool-btn')) return;
            if (e.touches.length !== 1) return;
            isDragging = true;
            hasMoved = false;
            startClientX = e.touches[0].clientX;
            startClientY = e.touches[0].clientY;
            initialX = currentX;
            initialY = currentY;
            // e.preventDefault(); 不要在此 preventDefault，否则可能会导致页面无法滚动或无法点击
        }, { passive: false });

        window.addEventListener('touchmove', function (e) {
            if (!isDragging) return;
            const dx = e.touches[0].clientX - startClientX;
            const dy = e.touches[0].clientY - startClientY;

            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                hasMoved = true;
                e.preventDefault(); // 当确认是拖拽图片时，阻止页面滚动
            }

            const newX = initialX + dx / currentScale;
            const newY = initialY + dy / currentScale;

            const maxVal = 123 * (currentScale - 1) / currentScale;

            currentX = Math.max(-maxVal, Math.min(maxVal, newX));
            currentY = Math.max(-maxVal, Math.min(maxVal, newY));

            updateImageTransform();
        }, { passive: false });

        window.addEventListener('touchend', function (e) {
            if (!isDragging) return;
            isDragging = false;

            if (!hasMoved) {
                // 如果没有发生明显拖拽，则视为点击，触发上传
                document.getElementById('imageInput').click();
            }
        });

        // 当上传新照片时，重置所有缩放和拖拽状态
        imageInput.addEventListener('change', function (e) {
            currentScale = 1;
            currentX = 0;
            currentY = 0;
            updateImageTransform();
        });



        // ================= 限制内容 =================
        const nameTextEl = document.getElementById('nameText');
        const titleTextEl = document.getElementById('titleText');
        let isComposingName = false;
        let isComposingTitle = false;

        // 处理 nameText
        nameTextEl.addEventListener('compositionstart', () => isComposingName = true);
        nameTextEl.addEventListener('compositionend', function () {
            isComposingName = false;
            enforceLengthLimit(this, 4);
        });
        nameTextEl.addEventListener('input', function () {
            if (this.innerHTML === '<br>') this.innerHTML = '';
            if (!isComposingName) enforceLengthLimit(this, 4);
        });

        // 处理 titleText
        titleTextEl.addEventListener('compositionstart', () => isComposingTitle = true);
        titleTextEl.addEventListener('compositionend', function () {
            isComposingTitle = false;
            enforceLengthLimit(this, 9);
        });
        titleTextEl.addEventListener('input', function () {
            if (this.innerHTML === '<br>') this.innerHTML = '';
            if (!isComposingTitle) enforceLengthLimit(this, 9);
        });

        function enforceLengthLimit(el, limit) {
            if (el.innerText.length > limit) {
                // 超过字符数，自动截断
                el.innerText = el.innerText.substring(0, limit);

                // 将光标恢复到末尾
                const sel = window.getSelection();
                const newRange = document.createRange();
                newRange.selectNodeContents(el);
                newRange.collapse(false);
                sel.removeAllRanges();
                sel.addRange(newRange);
            }
        }
        // ============================================

        // 3. 核心导出逻辑 (PDF 生成)
        const downloadBtn = document.getElementById('downloadBtn');
        const exportCanvas = document.getElementById('exportCanvas');
        const layer3 = document.getElementById('layer3');

        downloadBtn.addEventListener('click', async () => {
            // 状态：正在处理
            downloadBtn.innerText = '正在生成(处理字体中)...';
            downloadBtn.disabled = true;

            try {
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
                // 恢复 UI 状态
                downloadBtn.innerText = '下载高精度 PDF';
                downloadBtn.disabled = false;
            }
        });
