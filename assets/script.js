const DEFAULT_NAME = '输入名字';
const DEFAULT_TITLE = '输入员工的职业';

let cardList = [
    {
        id: Date.now(),
        name: DEFAULT_NAME,
        title: DEFAULT_TITLE,
        mbti: '(e人)',
        avatar: '', // Base64 或 Blob URL
        scale: 1,
        x: 0,
        y: 0
    }
];
let activeIndex = 0;
let isComposing = false; // 标记是否正在输入中文（IME）

// ================= DOM 元素引用 =================
const cardListContainer = document.getElementById('cardListContainer');
const addCardBtn = document.getElementById('addCardBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const imageInput = document.getElementById('imageInput');

const nameTextEl = document.getElementById('nameText');
const titleTextEl = document.getElementById('titleText');
const mbtiTextEl = document.getElementById('mbtiText');
const avatarImageEl = document.getElementById('avatarImage');
const mbtiToolbarEl = document.getElementById('mbtiToolbar');
const photoWrap = document.getElementById('photoWrap');

// ================= 初始化 =================
window.onload = () => {
    renderList();
    updatePreview();
};

// ================= 核心操作函数 =================

// 1. 渲染左侧列表
function renderList() {
    cardListContainer.innerHTML = '';
    cardList.forEach((card, index) => {
        const item = document.createElement('div');
        item.className = `card-item ${index === activeIndex ? 'active' : ''}`;
        item.onclick = () => selectCard(index);

        const isI = card.mbti === '(i人)';
        const isE = card.mbti === '(e人)';

        item.innerHTML = `
            <div class="card-item-header">
                <span>卡片 #${index + 1}</span>
                <div class="card-item-actions">
                    <div class="icon-btn btn-download-single" title="下载此卡片" onclick="event.stopPropagation(); downloadSingleCard(${index})">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 0C12.4183 1.93128e-07 16 3.58174 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 -1.93127e-07 12.4182 0 8C3.02947e-07 3.58176 3.58172 3.99984e-05 8 0ZM6.40527 8.30957H3.42871L8 12.5713L12.5713 8.30957H9.59473V4.57129H6.40527V8.30957Z" fill="#838383"/>
                        </svg>
                    </div>
                    <div class="icon-btn btn-delete" title="删除" onclick="event.stopPropagation(); deleteCard(${index})">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M16 8C16 12.4183 12.4183 16 8 16C3.58172 16 -5.5772e-07 12.4182 -3.64592e-07 8C-1.71465e-07 3.58176 3.58172 3.95474e-05 8 -3.49691e-07C12.4183 -1.56563e-07 16 3.58174 16 8ZM9.39976 7.99976L11.5692 5.83005L10.1695 4.43053L8 6.6L5.83053 4.43053L4.43077 5.83005L6.60024 7.99976L4.43077 10.1692L5.83053 11.569L8 9.39952L10.1695 11.569L11.5692 10.1692L9.39976 7.99976Z" fill="#838383"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="card-item-form">
                <input type="text" class="name-input" value="${card.name === DEFAULT_NAME ? '' : card.name}" 
                    onclick="event.stopPropagation()"
                    onfocus="selectCard(${index})"
                    oncompositionstart="isComposing = true"
                    oncompositionend="isComposing = false; syncFromSidebar(${index}, 'name', this.value, true)"
                    oninput="syncFromSidebar(${index}, 'name', this.value, false)"
                    onblur="syncFromSidebar(${index}, 'name', this.value, true); if(this.value.trim()==='') syncFromSidebar(${index}, 'name', DEFAULT_NAME, true)"
                    placeholder="${DEFAULT_NAME}">
                
                <input type="text" class="title-input" value="${card.title === DEFAULT_TITLE ? '' : card.title}" 
                    onclick="event.stopPropagation()"
                    onfocus="selectCard(${index})"
                    oncompositionstart="isComposing = true"
                    oncompositionend="isComposing = false; syncFromSidebar(${index}, 'title', this.value, true)"
                    oninput="syncFromSidebar(${index}, 'title', this.value, false)" 
                    onblur="syncFromSidebar(${index}, 'title', this.value, true); if(this.value.trim()==='') syncFromSidebar(${index}, 'title', DEFAULT_TITLE, true)"
                    placeholder="${DEFAULT_TITLE}">

                <div class="mbti-toggle" onclick="event.stopPropagation(); selectCard(${index})">
                    <div class="mbti-opt i ${isI ? 'active' : ''}" onclick="setMbti('i', ${index})">I</div>
                    <div class="mbti-opt e ${isE ? 'active' : ''}" onclick="setMbti('e', ${index})">E</div>
                </div>
            </div>
        `;
        cardListContainer.appendChild(item);
    });
}

// 2. 选择卡片 (优化：采用局部更新 Class 方式，防止重新渲染导致正在操作的输入框失焦)
function selectCard(index) {
    if (activeIndex === index) return;
    
    // 移除旧的 active 类
    const oldActiveItem = cardListContainer.children[activeIndex];
    if (oldActiveItem) oldActiveItem.classList.remove('active');
    
    // 更新索引
    activeIndex = index;
    
    // 添加新的 active 类
    const newActiveItem = cardListContainer.children[activeIndex];
    if (newActiveItem) newActiveItem.classList.add('active');
    
    updatePreview();
}

// 3. 新增卡片
addCardBtn.onclick = () => {
    const newCard = {
        id: Date.now(),
        name: DEFAULT_NAME,
        title: DEFAULT_TITLE,
        mbti: '(e人)',
        avatar: '',
        scale: 1,
        x: 0,
        y: 0
    };
    cardList.push(newCard);
    activeIndex = cardList.length - 1;
    renderList();
    updatePreview();
    cardListContainer.scrollTop = cardListContainer.scrollHeight;
};

// 4. 删除卡片
function deleteCard(index) {
    if (cardList.length === 1) {
        showToast("至少保留一张卡片");
        return;
    }
    cardList.splice(index, 1);
    if (activeIndex >= cardList.length) {
        activeIndex = cardList.length - 1;
    }
    renderList();
    updatePreview();
}

// 5. 更新右侧预览区
function updatePreview() {
    const card = cardList[activeIndex];
    nameTextEl.innerText = card.name;
    titleTextEl.innerText = card.title;
    mbtiTextEl.innerText = card.mbti;
    
    // 图片设置
    if (card.avatar) {
        avatarImageEl.style.backgroundImage = `url(${card.avatar})`;
    } else {
        avatarImageEl.style.backgroundImage = `url('https://via.placeholder.com/246x246.png?text=Click+to+Upload')`;
    }
    
    // 恢复坐标和缩放
    avatarImageEl.style.transform = `scale(${card.scale}) translate(${card.x}px, ${card.y}px)`;
}

// ================= 双向绑定 logic =================

// A. 左侧输入 ➔ 右侧渲染
// index: 索引, field: 字段名, value: 输入值, forceTruncate: 是否执行硬截断并回填输入框 (通常在 blur 或 compositionend 时为 true)
window.syncFromSidebar = (index, field, value, forceTruncate = false) => {
    const limit = (field === 'name') ? 4 : 9;
    let finalValue = value;

    // 只有在非合成状态下，且需要强制截断或正常输入时才处理超限
    if (!isComposing && finalValue.length > limit) {
        if (forceTruncate) {
            // 硬截断：同步修改输入框的值
            finalValue = finalValue.substring(0, limit);
            const activeItem = cardListContainer.children[index];
            if (activeItem) {
                const inputs = activeItem.querySelectorAll('input');
                const targetInput = (field === 'name') ? inputs[0] : inputs[1];
                if (targetInput) targetInput.value = finalValue;
            }
        } else {
            // 软限制：此时不改写输入框，保持用户输入（如拼音），但更新到预览时可以截断或保持
            // 为了让用户在输入法结束前看到完整拼音，这里不截断 finalValue
        }
    }
    
    // 更新数据模型
    cardList[index][field] = finalValue;
    
    // 同步预览文字（在合成期间显示完整物理输入，非合成期间显示截断后的数据）
    if (index === activeIndex) {
        if (field === 'name') nameTextEl.innerText = finalValue;
        if (field === 'title') titleTextEl.innerText = finalValue;
    }
};

// B. 右侧文字编辑 ➔ 左侧列表数据保存
function saveTextToState(el, limit, forceTruncate = false) {
    let finalValue = el.innerText;
    
    // 强制截断逻辑 (仅在非合成状态且要求强截断时执行)
    if (!isComposing && forceTruncate && finalValue.length > limit) {
        finalValue = finalValue.substring(0, limit);
        el.innerText = finalValue;
        // 恢复光标到末尾
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }
    
    const card = cardList[activeIndex];
    card.name = nameTextEl.innerText;
    card.title = titleTextEl.innerText;
    
    // 同步更新左侧列表输入框显示的文字 (非合成状态才回填，避免打断输入)
    if (!isComposing) {
        const activeItem = cardListContainer.children[activeIndex];
        if (activeItem) {
            const inputs = activeItem.querySelectorAll('input');
            if (inputs[0]) inputs[0].value = card.name === DEFAULT_NAME ? '' : card.name;
            if (inputs[1]) inputs[1].value = card.title === DEFAULT_TITLE ? '' : card.title;
        }
    }
}

// 绑定 IME 事件
nameTextEl.addEventListener('compositionstart', () => { isComposing = true; });
nameTextEl.addEventListener('compositionend', () => { isComposing = false; saveTextToState(nameTextEl, 4, true); });
titleTextEl.addEventListener('compositionstart', () => { isComposing = true; });
titleTextEl.addEventListener('compositionend', () => { isComposing = false; saveTextToState(titleTextEl, 9, true); });

nameTextEl.addEventListener('input', () => { saveTextToState(nameTextEl, 4, false); });
titleTextEl.addEventListener('input', () => { saveTextToState(titleTextEl, 9, false); });

nameTextEl.addEventListener('blur', () => { saveTextToState(nameTextEl, 4, true); });
titleTextEl.addEventListener('blur', () => { saveTextToState(titleTextEl, 9, true); });

// MBTI 弹窗交互
mbtiTextEl.onclick = (e) => {
    e.stopPropagation();
    mbtiToolbarEl.style.display = (mbtiToolbarEl.style.display === 'flex') ? 'none' : 'flex';
};

document.addEventListener('click', () => {
    mbtiToolbarEl.style.display = 'none';
});

window.setMbti = (type, targetIndex = activeIndex) => {
    // 确保选中的卡片被激活
    selectCard(targetIndex);
    
    const card = cardList[targetIndex];
    card.mbti = (type === 'i') ? '(i人)' : '(e人)';
    
    if (targetIndex === activeIndex) {
        mbtiTextEl.innerText = card.mbti;
    }
    
    // 由于 MBTI 这种按钮点击不需要保留焦点，且数量较少，全量渲染比较方便同步两端状态（i/e 按钮的高亮）
    renderList(); 
    mbtiToolbarEl.style.display = 'none';
};

// ================= 图片操作 (缩放/拖拽/上传) =================

// 1. 上传逻辑：排除文字点击，防止干扰编辑
photoWrap.onclick = (e) => {
    if (e.target !== photoWrap && e.target.id !== 'avatarImage') return;
    imageInput.click();
};

imageInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            cardList[activeIndex].avatar = dataUrl;
            cardList[activeIndex].scale = 1;
            cardList[activeIndex].x = 0;
            cardList[activeIndex].y = 0;
            updatePreview();
        };
        reader.readAsDataURL(file);
    }
};

// 2. 缩放
window.zoomImage = (delta) => {
    const card = cardList[activeIndex];
    card.scale += delta;
    if (card.scale < 1) card.scale = 1;
    if (card.scale > 3) card.scale = 3;
    updatePreview();
};

// 3. 拖拽 (带边界限制)
let isDragging = false;
let startX, startY, initX, initY;

photoWrap.onmousedown = (e) => {
    if (e.target.closest('.tool-btn')) return;
    const card = cardList[activeIndex];
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initX = card.x;
    initY = card.y;
    photoWrap.style.cursor = 'grabbing';
};

window.onmousemove = (e) => {
    if (!isDragging) return;
    const card = cardList[activeIndex];
    const dx = (e.clientX - startX) / card.scale;
    const dy = (e.clientY - startY) / card.scale;
    
    // 边界计算 (简易版)
    const limit = 123 * (card.scale - 1) / card.scale;
    card.x = Math.max(-limit, Math.min(limit, initX + dx));
    card.y = Math.max(-limit, Math.min(limit, initY + dy));
    
    updatePreview();
};

window.onmouseup = () => {
    isDragging = false;
    photoWrap.style.cursor = 'pointer';
};

// ================= 单个下载逻辑 =================
async function downloadSingleCard(index) {
    const card = cardList[index];
    if (card.name === DEFAULT_NAME || !card.avatar) {
        showToast("请先完成此卡片的信息（姓名和照片）再下载");
        return;
    }

    // 切换到当前卡片并更新预览
    selectCard(index);
    await nextFrame();

    const { jsPDF } = window.jspdf;
    const exportDiv = document.getElementById('exportCanvas');

    try {
        const canvas = await html2canvas(exportDiv, {
            scale: 4,
            useCORS: true,
            backgroundColor: '#484848'
        });
        const pngData = canvas.toDataURL('image/png');

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [304, 354]
        });
        doc.addImage(pngData, 'PNG', 0, 0, 304, 354);
        
        const filename = `${card.name}_${card.title}.pdf`.replace(/[\\/:*?"<>|]/g, "_");
        doc.save(filename);
    } catch (err) {
        console.error("单个导出失败:", err);
        showToast("导出过程出错，请查看控制台。");
    }
}

// ================= 批量下载逻辑 (核心) =================

async function nextFrame() {
    return new Promise(res => requestAnimationFrame(() => setTimeout(res, 50)));
}

downloadAllBtn.onclick = async () => {
    // 1. 过滤掉未曾修改的默认数据 (名字未改或没传照片)
    const validCards = cardList.filter(c => 
        c.name !== '叫啥名字' && c.avatar !== ''
    );

    if (validCards.length === 0) {
        showToast("没有可导出的有效卡片（需改名且有照片）");
        return;
    }

    downloadAllBtn.innerText = `生成中 (0/${validCards.length})`;
    downloadAllBtn.disabled = true;

    const zip = new JSZip();
    const { jsPDF } = window.jspdf;
    const exportDiv = document.getElementById('exportCanvas');

    try {
        for (let i = 0; i < validCards.length; i++) {
            const card = validCards[i];
            
            // 切换数据渲染 (重要：必须要等待 DOM 渲染完成)
            activeIndex = cardList.indexOf(card);
            updatePreview();
            renderList();
            await nextFrame();

            // 截取 Canvas
            const canvas = await html2canvas(exportDiv, {
                scale: 4,
                useCORS: true,
                backgroundColor: '#484848'
            });
            const pngData = canvas.toDataURL('image/png');

            // 生成 PDF
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [304, 354]
            });
            doc.addImage(pngData, 'PNG', 0, 0, 304, 354);
            const pdfBlob = doc.output('blob');

            // 存入 ZIP 或直接单份下载
            const filename = `${card.name}_${card.title}.pdf`.replace(/[\\/:*?"<>|]/g, "_");
            zip.file(filename, pdfBlob);

            downloadAllBtn.innerText = `生成中 (${i + 1}/${validCards.length})`;
        }

        if (validCards.length === 1) {
            // 只有一张则直接下载 PDF
            const card = validCards[0];
            const filename = `${card.name}_${card.title}.pdf`.replace(/[\\/:*?"<>|]/g, "_");
            const blob = zip.file(filename).async("blob");
            saveAs(await blob, filename);
        } else {
            // 多张则打包 ZIP
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "批量员工卡片.zip");
        }

    } catch (err) {
        console.error("批量导出失败:", err);
        showToast("制作过程中发生错误，请查看控制台。");
    } finally {
        downloadAllBtn.innerText = "下载全部";
        downloadAllBtn.disabled = false;
    }
};

// ================= Excel 导入功能 =================
const importBtn = document.getElementById('importBtn');
const excelInput = document.getElementById('excelInput');

if (importBtn) {
    importBtn.onclick = () => excelInput.click();
}

if (excelInput) {
    excelInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            
            // 1. 解析基础文本数据 (SheetJS)
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // 2. 尝试提取图片 (需利用已引入的 JSZip)
            const images = await extractImagesFromXlsx(data);
            
            // 3. 处理每一行并映射数据
            const newCards = jsonData.map((row, i) => {
                // 表头匹配逻辑
                const name = row['名字'] || row['Name'] || DEFAULT_NAME;
                const title = row['职位'] || row['Title'] || DEFAULT_TITLE;
                const personality = String(row['性格'] || row['Personality'] || '');
                const mbti = (personality.toLowerCase().includes('i')) ? '(i人)' : '(e人)';
                
                // 头像匹配 (图片通常按顺序在 xl/media 中)
                const avatar = images[i] || ''; 

                return {
                    id: Date.now() + i,
                    name,
                    title,
                    mbti,
                    avatar,
                    scale: 1,
                    x: 0,
                    y: 0
                };
            });

            // 4. 更新全局列表
            if (newCards.length > 0) {
                // 如果当前只有初始占位数据，则替换，否则追加
                if (cardList.length === 1 && cardList[0].name === DEFAULT_NAME && !cardList[0].avatar) {
                    cardList = newCards;
                } else {
                    cardList = [...cardList, ...newCards];
                }
                activeIndex = cardList.length - 1; // 默认选中最后一张
                renderList();
                updatePreview();
                showToast(`🎉 成功导入 ${newCards.length} 名成员！`);
            } else {
                showToast("未在 Excel 中发现有效数据，请检查表头名。");
            }

        } catch (err) {
            console.error("Excel 导入失败:", err);
            showToast("导入失败，请检查文件格式。");
        } finally {
            excelInput.value = ''; // 清除以支持重复导入
        }
    };
}

/**
 * 高级：从 XLSX ZIP 结构中顺次解析 xl/media 文件夹下的图片
 */
async function extractImagesFromXlsx(data) {
    try {
        const zip = await JSZip.loadAsync(data);
        const mediaFolder = zip.folder("xl/media");
        if (!mediaFolder) return [];

        const imageFiles = [];
        mediaFolder.forEach((relativePath, file) => {
            if (!file.dir) imageFiles.push(file);
        });

        // 按照 image1, image2... 逻辑排序
        imageFiles.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/) || '0');
            const numB = parseInt(b.name.match(/\d+/) || '0');
            return numA - numB;
        });

        const base64Images = [];
        for (const file of imageFiles) {
            const base64 = await file.async("base64");
            const ext = file.name.split('.').pop().toLowerCase();
            base64Images.push(`data:image/${ext};base64,${base64}`);
        }
        return base64Images;
    } catch (e) {
        console.warn("图片提取失败:", e);
        return [];
    }
}

// 共通提示气泡
function showToast(message) {
    const root = document.getElementById('toast-root');
    if (!root) return;

    const toast = document.createElement('div');
    toast.className = 'toast-bubble';
    toast.textContent = message;

    root.appendChild(toast);

    // 3秒后彻底从 DOM 移除 (CSS 里的动画在 2.5s 后触发 fade-out)
    setTimeout(() => {
        toast.remove();
    }, 3100); 
}

