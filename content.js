/**
 * content.js
 * 注入到网页中，实现：
 * 1. 半透明遮罩 + 十字指针框选
 * 2. Canvas 裁剪选区图像
 * 3. 将裁剪后的图片发送到本地 VLM 进行 OCR + 翻译
 * 4. 翻译结果通过页内浮动弹窗展示
 */

// NOTE: 防止重复注入，已存在遮罩层时直接退出
if (document.getElementById('screenshot-overlay')) {
    console.log('[截图翻译] 覆盖层已存在，跳过注入');
} else {
    (function () {
        'use strict';

        console.log('[截图翻译] 开始注入截图覆盖层...');

        // ========== 常量 ==========
        const API_URL = 'http://localhost:8081/v1/chat/completions';
        const MODEL_NAME = 'qwen2-vl';
        const THEME_COLOR = '#4CAF50';
        const MIN_SELECTION_SIZE = 30;

        // ========== 工具函数 ==========

        /**
         * 创建一个带有 !important 样式的 DOM 元素
         * @param {string} tag 标签名
         * @param {string} css 内联样式字符串
         * @returns {HTMLElement}
         */
        function createStyledElement(tag, css) {
            const el = document.createElement(tag);
            el.style.cssText = css;
            return el;
        }

        /**
         * 带超时的 fetch 封装，防止模型服务无响应时用户永久等待
         * @param {string} url 请求地址
         * @param {object} options fetch 选项
         * @param {number} timeoutMs 超时毫秒数，默认 120 秒
         * @returns {Promise<Response>}
         */
        async function fetchWithTimeout(url, options, timeoutMs = 120000) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                return await fetch(url, { ...options, signal: controller.signal });
            } catch (error) {
                if (error.name === 'AbortError') {
                    throw new Error(`请求超时（${timeoutMs / 1000}秒），请检查本地模型服务是否正常运行`);
                }
                throw error;
            } finally {
                clearTimeout(timer);
            }
        }

        // ========== 遮罩层 UI ==========

        const overlay = createStyledElement('div', `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.5) !important;
            z-index: 2147483640 !important;
            cursor: crosshair !important;
            user-select: none !important;
        `);
        overlay.id = 'screenshot-overlay';

        // 提示文字（更不显眼）
        const hint = createStyledElement('div', `
            position: fixed !important;
            bottom: 30px !important;
            right: 30px !important;
            background: rgba(0, 0, 0, 0.7) !important;
            color: white !important;
            padding: 8px 16px !important;
            border-radius: 6px !important;
            font-size: 13px !important;
            z-index: 2147483647 !important;
            font-family: 'Microsoft YaHei', sans-serif !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
            pointer-events: none !important;
            transition: opacity 0.2s ease !important;
        `);
        hint.textContent = '拖拽选择区域 | ESC 取消';

        // 选择框（虚线）
        const selection = createStyledElement('div', `
            position: fixed !important;
            border: 2px dashed ${THEME_COLOR} !important;
            background: rgba(76, 175, 80, 0.2) !important;
            display: none !important;
            pointer-events: none !important;
            z-index: 2147483645 !important;
        `);
        selection.id = 'screenshot-selection';

        overlay.appendChild(hint);
        overlay.appendChild(selection);
        document.body.appendChild(overlay);

        console.log('[截图翻译] 覆盖层已创建');

        // ========== 框选交互逻辑 ==========

        let isSelecting = false;
        let startX = 0;
        let startY = 0;

        overlay.addEventListener('mousedown', (e) => {
            isSelecting = true;
            startX = e.clientX;
            startY = e.clientY;
            selection.style.left = startX + 'px';
            selection.style.top = startY + 'px';
            selection.style.width = '0';
            selection.style.height = '0';
            selection.style.display = 'block';
            hint.style.opacity = '0'; // 拖拽时隐藏提示
            e.preventDefault();
            e.stopPropagation();
        });

        overlay.addEventListener('mousemove', (e) => {
            if (!isSelecting) return;
            const left = Math.min(startX, e.clientX);
            const top = Math.min(startY, e.clientY);
            const width = Math.abs(e.clientX - startX);
            const height = Math.abs(e.clientY - startY);
            selection.style.left = left + 'px';
            selection.style.top = top + 'px';
            selection.style.width = width + 'px';
            selection.style.height = height + 'px';
        });

        overlay.addEventListener('mouseup', async (e) => {
            if (!isSelecting) return;
            isSelecting = false;

            const left = Math.min(startX, e.clientX);
            const top = Math.min(startY, e.clientY);
            const width = Math.abs(e.clientX - startX);
            const height = Math.abs(e.clientY - startY);

            // 选区太小则取消
            if (width < MIN_SELECTION_SIZE || height < MIN_SELECTION_SIZE) {
                cleanup();
                return;
            }

            // 移除遮罩层
            cleanup();

            // 开始处理截图和任务（分流）
            await captureAndProcess(left, top, width, height);
        });

        // ESC 取消
        function onKeyDown(e) {
            if (e.key === 'Escape') {
                cleanup();
            }
        }
        document.addEventListener('keydown', onKeyDown);

        /**
         * 清理遮罩层和事件监听
         */
        function cleanup() {
            const el = document.getElementById('screenshot-overlay');
            if (el) el.remove();
            document.removeEventListener('keydown', onKeyDown);
        }

        // ========== 截图、裁剪、翻译核心流程 ==========

        /**
         * 截取整个可见区域 → 用 Canvas 裁剪选区 → 发送给 VLM 处理 → 展示或导出
         * @param {number} left  选区 CSS 像素 left
         * @param {number} top   选区 CSS 像素 top
         * @param {number} width  选区 CSS 像素宽度
         * @param {number} height 选区 CSS 像素高度
         */
        async function captureAndProcess(left, top, width, height) {
            try {
                // 获取从 popup 带入的模式，默认 translate
                const mode = window.__CAPTURE_MODE || 'translate';

                // NOTE: 截图时序至关重要！必须先等待遮罩层从 DOM 中完全移除并渲染完毕
                await new Promise(resolve => setTimeout(resolve, 150));

                // 1. 先截图
                const response = await chrome.runtime.sendMessage({ action: 'capture-tab' });
                if (!response || response.error || !response.imageData) {
                    throw new Error('截图失败：' + (response?.error || '图像数据为空'));
                }

                // 2. 截图完成后才显示加载提示
                showLoading();

                // 3. 用 Canvas 裁剪用户选中的区域
                const dpr = window.devicePixelRatio || 1;
                const croppedDataUrl = await cropImage(response.imageData, left*dpr, top*dpr, width*dpr, height*dpr);

                // 4. 按模式分流处理
                if (mode === 'translate') {
                    // OCR → Translate → Modal
                    updateLoadingText('🔍 正在识别文字...');
                    const extractedText = await ocrFromImage(croppedDataUrl);
                    
                    const NO_TEXT_MARKER = '图片中没有可识别的文字';
                    if (!extractedText || extractedText.trim() === NO_TEXT_MARKER || extractedText.trim().length === 0) {
                        removeLoading();
                        showResultModal(extractedText || NO_TEXT_MARKER);
                        return;
                    }

                    updateLoadingText('🌐 正在翻译...');
                    const translationResult = await translateText(extractedText);
                    removeLoading();
                    showResultModal(translationResult);

                } else if (mode === 'table') {
                    // Table Extract (视觉直接输出 CSV) → XLSX 生成并下载
                    updateLoadingText('📊 正在由 AI 视觉抽取表格...');
                    const csvData = await extractTableFromImage(croppedDataUrl);
                    
                    updateLoadingText('💾 正在生成标准化 Excel 文件...');
                    await exportToExcel(csvData);
                    
                    removeLoading();
                    showResultModal('✅ 成功提取表格！\\n真正的 Excel（.xlsx）格式文件已自动下载至您的默认下载目录中去。');
                }

            } catch (error) {
                console.error('[截图翻译/提表] 错误:', error);
                removeLoading();
                showErrorModal('处理失败：' + error.message);
            }
        }

        /**
         * 使用 Canvas 裁剪图片的指定区域
         * @param {string} dataUrl 原始图片 Data URL
         * @param {number} sx 裁剪起点 X（物理像素）
         * @param {number} sy 裁剪起点 Y（物理像素）
         * @param {number} sw 裁剪宽度（物理像素）
         * @param {number} sh 裁剪高度（物理像素）
         * @returns {Promise<string>} 裁剪后的 Data URL
         */
        function cropImage(dataUrl, sx, sy, sw, sh) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    // 边界安全检查
                    const safeX = Math.max(0, Math.round(sx));
                    const safeY = Math.max(0, Math.round(sy));
                    const safeW = Math.max(1, Math.min(Math.round(sw), img.width - safeX));
                    const safeH = Math.max(1, Math.min(Math.round(sh), img.height - safeY));

                    const canvas = document.createElement('canvas');
                    canvas.width = safeW;
                    canvas.height = safeH;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, safeX, safeY, safeW, safeH, 0, 0, safeW, safeH);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = () => reject(new Error('加载截图图像失败'));
                img.src = dataUrl;
            });
        }

        /**
         * 第一步：OCR — 让 VLM 专注于从图片中精确提取所有文字
         * NOTE: 只做文字识别，不做翻译，避免多任务导致幻觉
         * @param {string} imageDataUrl 图片的 Base64 Data URL
         * @returns {Promise<string>} 提取到的原始文字
         */
        async function ocrFromImage(imageDataUrl) {
            const apiResponse = await fetchWithTimeout(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    messages: [{
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: '请仔细识别这张图片中的所有文字内容，完整、准确地输出原文。要求：\n1. 逐行输出图片中的文字，保持原文的段落和换行格式\n2. 不要翻译，不要修改，不要省略任何内容\n3. 不要添加任何解释说明\n4. 如果图片中没有文字，回复"图片中没有可识别的文字"'
                            },
                            {
                                type: 'image_url',
                                image_url: { url: imageDataUrl }
                            }
                        ]
                    }],
                    max_tokens: 32768,
                    temperature: 0.05
                })
            });

            if (!apiResponse.ok) {
                throw new Error(`OCR 请求失败 (HTTP ${apiResponse.status})`);
            }

            const data = await apiResponse.json();
            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content;
            }
            throw new Error('OCR 返回数据为空');
        }

        /**
         * 第二步：翻译 — 纯文本翻译，不涉及图像
         * @param {string} sourceText OCR 提取到的原始文字
         * @returns {Promise<string>} 中文翻译结果
         */
        async function translateText(sourceText) {
            const apiResponse = await fetchWithTimeout(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    messages: [
                        {
                            role: 'user',
                            content: `请严格忠实于原文，逐字逐句将以下内容翻译为通顺的【中文】。
【核心要求】：
1. 绝对不允许自行添加、脑补原文没有的内容！
2. 绝对不允许删除、省略、跳过任何一句话！
3. 不要总结，不要解释，全程只输出中文翻译结果，绝不能输出英文原文。

待翻译原文：
${sourceText}`
                        }
                    ],
                    max_tokens: 32768,
                    temperature: 0.3,
                    repeat_penalty: 1.1,
                    frequency_penalty: 0.2
                })
            });

            if (!apiResponse.ok) {
                throw new Error(`翻译请求失败 (HTTP ${apiResponse.status})`);
            }

            const data = await apiResponse.json();
            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content.trim();
            }
            throw new Error('翻译返回数据为空');
        }

        /**
         * 纯视觉表格提取：利用 Qwen2-VL 视觉能力，要求严格输出无格式 CSV 内容
         */
        async function extractTableFromImage(imageDataUrl) {
            const apiResponse = await fetchWithTimeout(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: `You are a professional table data extraction expert. Extract the entire table from the image in CSV format.

STRICT REQUIREMENTS:
1. Extract EVERY SINGLE ROW from the table - NO ROWS LEFT BEHIND!
2. Preserve the header row(s)!
3. NO EXPLANATIONS - ONLY CSV!
4. NO MARKDOWN WRAPPING - JUST PLAIN TEXT!
5. DO NOT STOP MID-WAY! OUTPUT THE COMPLETE TABLE!
6. OUTPUT EVERYTHING EVEN IF IT'S LONG! COMPLETENESS IS CRITICAL!

(This instruction works for tables in ANY language: Chinese, English, Japanese, Korean, etc.)`
                                },
                                {
                                    type: 'image_url',
                                    image_url: { url: imageDataUrl }
                                }
                            ]
                        }
                    ],
                    max_tokens: 65536,
                    temperature: 0.0001
                })
            });

            if (!apiResponse.ok) throw new Error(`表格视觉读取失败 (HTTP ${apiResponse.status})`);
            
            const data = await apiResponse.json();
            if (data.choices && data.choices.length > 0) {
                let content = data.choices[0].message.content.trim();
                
                // 清除可能的 markdown 边界
                content = content.replace(/^```(csv|text)?\\n/i, '').replace(/\\n```$/i, '');
                
                // 调试信息：检测输出长度
                const lineCount = content.split('\\n').length;
                console.log('[表格识别] 识别到 ' + lineCount + ' 行数据');
                console.log('[表格识别] 完整输出：', content);
                
                return content;
            }
            throw new Error('API 返回表格数据为空');
        }

        /**
         * 调用本插件内嵌的 SheetJS 库 (XLSX) 真正实现 CSV 转 .xlsx 并唤起下载
         */
        async function exportToExcel(csvString) {
            // 校验在 popup.js 中 injected 的资源是否存在
            if (typeof XLSX === 'undefined') {
                throw new Error('找不到 XLSX 处理库，库脚本未能正确注入当前网页');
            }
            
            try {
                // SheetJS 完全支持将标准的 CSV 字符串读取为工作簿（Workbook）对象
                const workbook = XLSX.read(csvString, { type: 'string' });
                
                // 根据当地事件生成带有格式化后缀的文件名
                const now = new Date();
                const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
                const filename = `AI提取报表_${ts}.xlsx`;
                
                // 原生浏览器生成 .xlsx 格式下载事件！完美无需后端交互。
                XLSX.writeFile(workbook, filename);
            } catch (e) {
                throw new Error('将数据组装为原生 Excel 文件过程中崩溃了：' + e.message);
            }
        }

        // ========== 页内浮动弹窗 UI ==========

        /**
         * 显示"正在翻译"的加载弹窗
         */
        function showLoading() {
            // 背景遮罩
            const backdrop = createStyledElement('div', `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: rgba(0, 0, 0, 0.4) !important;
                z-index: 2147483640 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            `);
            backdrop.id = 'screenshot-loading-backdrop';

            const box = createStyledElement('div', `
                background: rgba(30, 30, 30, 0.95) !important;
                color: white !important;
                padding: 32px 48px !important;
                border-radius: 12px !important;
                font-size: 17px !important;
                font-family: 'Microsoft YaHei', sans-serif !important;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
                text-align: center !important;
                backdrop-filter: blur(10px) !important;
            `);

            // 简单的旋转动画
            const spinner = createStyledElement('div', `
                width: 36px !important;
                height: 36px !important;
                border: 3px solid rgba(255,255,255,0.2) !important;
                border-top-color: ${THEME_COLOR} !important;
                border-radius: 50% !important;
                margin: 0 auto 16px auto !important;
                animation: screenshot-spin 0.8s linear infinite !important;
            `);

            // 注入 keyframes 动画
            if (!document.getElementById('screenshot-keyframes')) {
                const styleTag = document.createElement('style');
                styleTag.id = 'screenshot-keyframes';
                styleTag.textContent = `
                    @keyframes screenshot-spin {
                        to { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(styleTag);
            }

            const label = createStyledElement('div', '');
            label.id = 'screenshot-loading-label';
            label.textContent = '🤖 正在处理...';

            box.appendChild(spinner);
            box.appendChild(label);
            backdrop.appendChild(box);
            document.body.appendChild(backdrop);
        }

        /**
         * 移除加载弹窗
         */
        function removeLoading() {
            const el = document.getElementById('screenshot-loading-backdrop');
            if (el) el.remove();
        }

        /**
         * 动态更新加载弹窗的提示文字（用于显示 OCR / 翻译 进度）
         * @param {string} text 新的提示文字
         */
        function updateLoadingText(text) {
            const label = document.getElementById('screenshot-loading-label');
            if (label) label.textContent = text;
        }

        /**
         * 显示翻译结果的浮动弹窗
         * @param {string} text 翻译结果文本
         */
        function showResultModal(text) {
            // 背景遮罩
            const backdrop = createStyledElement('div', `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: rgba(0, 0, 0, 0.5) !important;
                z-index: 2147483640 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-family: 'Microsoft YaHei', 'SimHei', sans-serif !important;
            `);
            backdrop.id = 'screenshot-result-backdrop';

            // 点击遮罩外部关闭
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    closeModal();
                }
            });

            // 弹窗主体
            const modal = createStyledElement('div', `
                background: #ffffff !important;
                border-radius: 14px !important;
                box-shadow: 0 12px 48px rgba(0,0,0,0.25) !important;
                max-width: 640px !important;
                width: 90vw !important;
                max-height: 80vh !important;
                display: flex !important;
                flex-direction: column !important;
                overflow: hidden !important;
                animation: screenshot-fade-in 0.25s ease-out !important;
            `);

            // 注入弹窗动画
            if (!document.getElementById('screenshot-modal-keyframes')) {
                const styleTag = document.createElement('style');
                styleTag.id = 'screenshot-modal-keyframes';
                styleTag.textContent = `
                    @keyframes screenshot-fade-in {
                        from { opacity: 0; transform: scale(0.95) translateY(10px); }
                        to   { opacity: 1; transform: scale(1) translateY(0); }
                    }
                `;
                document.head.appendChild(styleTag);
            }

            // 标题栏（同时作为拖拽把手）
            const header = createStyledElement('div', `
                padding: 18px 24px !important;
                border-bottom: 1px solid #eee !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                flex-shrink: 0 !important;
                cursor: move !important;
                user-select: none !important;
            `);

            const title = createStyledElement('div', `
                font-size: 17px !important;
                font-weight: 600 !important;
                color: ${THEME_COLOR} !important;
                pointer-events: none !important;
            `);
            title.textContent = '✅ 翻译结果';

            const closeBtn = createStyledElement('button', `
                background: none !important;
                border: none !important;
                font-size: 22px !important;
                cursor: pointer !important;
                color: #999 !important;
                padding: 0 4px !important;
                line-height: 1 !important;
                transition: color 0.2s !important;
            `);
            closeBtn.textContent = '✕';
            closeBtn.title = '关闭';
            closeBtn.addEventListener('mouseenter', () => { closeBtn.style.color = '#333'; });
            closeBtn.addEventListener('mouseleave', () => { closeBtn.style.color = '#999'; });
            closeBtn.addEventListener('click', () => { closeModal(); });

            header.appendChild(title);
            header.appendChild(closeBtn);

            // ===== 拖拽移动弹窗逻辑 =====
            let isDragging = false;
            let dragOffsetX = 0;
            let dragOffsetY = 0;

            header.addEventListener('mousedown', (e) => {
                // NOTE: 忽略关闭按钮上的点击
                if (e.target === closeBtn) return;
                isDragging = true;
                const rect = modal.getBoundingClientRect();
                dragOffsetX = e.clientX - rect.left;
                dragOffsetY = e.clientY - rect.top;

                // 首次拖拽时，将弹窗从 flex 居中切换为绝对定位
                if (!modal.dataset.positioned) {
                    modal.dataset.positioned = 'true';
                    modal.style.position = 'fixed';
                    modal.style.left = rect.left + 'px';
                    modal.style.top = rect.top + 'px';
                    modal.style.margin = '0';
                    // 让 backdrop 不再参与弹窗定位
                    backdrop.style.alignItems = 'flex-start';
                    backdrop.style.justifyContent = 'flex-start';
                }

                e.preventDefault();
            });

            // NOTE: 使用命名函数注册全局事件，以便弹窗关闭时正确移除，防止内存泄漏
            function onDragMove(e) {
                if (!isDragging) return;
                const newLeft = e.clientX - dragOffsetX;
                const newTop = e.clientY - dragOffsetY;
                modal.style.left = newLeft + 'px';
                modal.style.top = newTop + 'px';
            }

            function onDragEnd() {
                isDragging = false;
            }

            document.addEventListener('mousemove', onDragMove);
            document.addEventListener('mouseup', onDragEnd);

            // ESC 关闭弹窗
            function onEsc(e) {
                if (e.key === 'Escape') {
                    closeModal();
                }
            }
            document.addEventListener('keydown', onEsc);

            /**
             * 统一的弹窗关闭函数，负责移除 DOM 和清理所有全局事件监听器
             */
            function closeModal() {
                backdrop.remove();
                document.removeEventListener('mousemove', onDragMove);
                document.removeEventListener('mouseup', onDragEnd);
                document.removeEventListener('keydown', onEsc);
            }

            // 内容区域（可滚动）
            const body = createStyledElement('div', `
                padding: 20px 24px !important;
                overflow-y: auto !important;
                flex: 1 !important;
                font-size: 15px !important;
                line-height: 1.8 !important;
                color: #333 !important;
                white-space: pre-wrap !important;
                word-wrap: break-word !important;
            `);
            body.id = 'screenshot-result-text';
            body.textContent = text;

            // 底部操作栏
            const footer = createStyledElement('div', `
                padding: 14px 24px !important;
                border-top: 1px solid #eee !important;
                display: flex !important;
                gap: 12px !important;
                justify-content: flex-end !important;
                flex-shrink: 0 !important;
            `);

            const copyBtn = createStyledElement('button', `
                background: ${THEME_COLOR} !important;
                color: white !important;
                border: none !important;
                padding: 9px 22px !important;
                border-radius: 6px !important;
                font-size: 14px !important;
                cursor: pointer !important;
                transition: background 0.2s !important;
                font-family: 'Microsoft YaHei', sans-serif !important;
            `);
            copyBtn.textContent = '📋 复制';
            copyBtn.addEventListener('mouseenter', () => { copyBtn.style.background = '#45a049'; });
            copyBtn.addEventListener('mouseleave', () => { copyBtn.style.background = THEME_COLOR; });
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(text).then(() => {
                    copyBtn.textContent = '✅ 已复制';
                    setTimeout(() => { copyBtn.textContent = '📋 复制'; }, 2000);
                }).catch(() => {
                    // HACK: 回退方案，部分页面剪贴板 API 受限
                    const textarea = document.createElement('textarea');
                    textarea.value = text;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    textarea.remove();
                    copyBtn.textContent = '✅ 已复制';
                    setTimeout(() => { copyBtn.textContent = '📋 复制'; }, 2000);
                });
            });

            const dismissBtn = createStyledElement('button', `
                background: #f5f5f5 !important;
                color: #666 !important;
                border: 1px solid #ddd !important;
                padding: 9px 22px !important;
                border-radius: 6px !important;
                font-size: 14px !important;
                cursor: pointer !important;
                transition: background 0.2s !important;
                font-family: 'Microsoft YaHei', sans-serif !important;
            `);
            dismissBtn.textContent = '关闭';
            dismissBtn.addEventListener('mouseenter', () => { dismissBtn.style.background = '#e8e8e8'; });
            dismissBtn.addEventListener('mouseleave', () => { dismissBtn.style.background = '#f5f5f5'; });
            dismissBtn.addEventListener('click', () => { closeModal(); });

            footer.appendChild(copyBtn);
            footer.appendChild(dismissBtn);

            modal.appendChild(header);
            modal.appendChild(body);
            modal.appendChild(footer);
            backdrop.appendChild(modal);
            document.body.appendChild(backdrop);


        }

        /**
         * 显示错误信息弹窗
         * @param {string} message 错误描述
         */
        function showErrorModal(message) {
            const backdrop = createStyledElement('div', `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: rgba(0, 0, 0, 0.5) !important;
                z-index: 2147483640 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-family: 'Microsoft YaHei', sans-serif !important;
            `);
            backdrop.id = 'screenshot-error-backdrop';

            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) backdrop.remove();
            });

            const box = createStyledElement('div', `
                background: #fff !important;
                border-radius: 12px !important;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
                padding: 28px 32px !important;
                max-width: 480px !important;
                width: 85vw !important;
                text-align: center !important;
                animation: screenshot-fade-in 0.25s ease-out !important;
            `);

            const icon = createStyledElement('div', `
                font-size: 36px !important;
                margin-bottom: 12px !important;
            `);
            icon.textContent = '❌';

            const msg = createStyledElement('div', `
                font-size: 14px !important;
                color: #555 !important;
                line-height: 1.6 !important;
                margin-bottom: 20px !important;
                white-space: pre-wrap !important;
                word-wrap: break-word !important;
            `);
            msg.textContent = message;

            const okBtn = createStyledElement('button', `
                background: #f44336 !important;
                color: white !important;
                border: none !important;
                padding: 9px 28px !important;
                border-radius: 6px !important;
                font-size: 14px !important;
                cursor: pointer !important;
                font-family: 'Microsoft YaHei', sans-serif !important;
            `);
            okBtn.textContent = '确定';
            okBtn.addEventListener('click', () => { backdrop.remove(); });

            box.appendChild(icon);
            box.appendChild(msg);
            box.appendChild(okBtn);
            backdrop.appendChild(box);
            document.body.appendChild(backdrop);
        }

        console.log('[截图翻译] content.js 注入完成');
    })();
}