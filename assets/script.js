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
                <span class="btn-delete" onclick="event.stopPropagation(); deleteCard(${index})">删除</span>
            </div>
            <div class="card-item-form">
                <input type="text" class="name-input" value="${card.name === DEFAULT_NAME ? '' : card.name}" 
                    onclick="event.stopPropagation()"
                    oncompositionstart="isComposing = true"
                    oncompositionend="isComposing = false; syncFromSidebar(${index}, 'name', this.value, true)"
                    oninput="syncFromSidebar(${index}, 'name', this.value, false)"
                    onblur="syncFromSidebar(${index}, 'name', this.value, true); if(this.value.trim()==='') syncFromSidebar(${index}, 'name', DEFAULT_NAME, true)"
                    placeholder="${DEFAULT_NAME}">
                
                <input type="text" class="title-input" value="${card.title === DEFAULT_TITLE ? '' : card.title}" 
                    onclick="event.stopPropagation()"
                    oncompositionstart="isComposing = true"
                    oncompositionend="isComposing = false; syncFromSidebar(${index}, 'title', this.value, true)"
                    oninput="syncFromSidebar(${index}, 'title', this.value, false)" 
                    onblur="syncFromSidebar(${index}, 'title', this.value, true); if(this.value.trim()==='') syncFromSidebar(${index}, 'title', DEFAULT_TITLE, true)"
                    placeholder="${DEFAULT_TITLE}">

                <div class="mbti-toggle" onclick="event.stopPropagation()">
                    <div class="mbti-opt i ${isI ? 'active' : ''}" onclick="setMbti('i', ${index})">I</div>
                    <div class="mbti-opt e ${isE ? 'active' : ''}" onclick="setMbti('e', ${index})">E</div>
                </div>
            </div>
        `;
        cardListContainer.appendChild(item);
    });
}

// 2. 选择卡片
function selectCard(index) {
    if (activeIndex === index) return;
    activeIndex = index;
    renderList();
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
        alert("至少保留一张卡片");
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
    const card = cardList[targetIndex];
    card.mbti = (type === 'i') ? '(i人)' : '(e人)';
    
    if (targetIndex === activeIndex) {
        mbtiTextEl.innerText = card.mbti;
    }
    
    // 更新侧边栏 UI (局部更新或全量更新，由于有多个项，全量渲染最稳但可能失焦)
    // 只有在操作侧边栏时才可能由于点击按钮导致此处执行
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
        alert("没有可导出的有效卡片（请确保名字已修改且已上传照片）");
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
        alert("制作过程中发生错误，请查看控制台。");
    } finally {
        downloadAllBtn.innerText = "下载全部";
        downloadAllBtn.disabled = false;
    }
};
