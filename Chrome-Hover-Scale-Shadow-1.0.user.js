// ==UserScript==
// @name         Chrome-Hover-Scale-Shadow
// @version      1.0
// @description  全Webサイトの主要なインタラクティブUI要素に対し、均一な視覚的拡大（合計4px）を行います。
// @author       Gemini and OGIZARU
// @match        *://*/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // --- 詳細パラメータ (V1.9/V2.0 共通) ---
    /** 拡大ピクセル数（片側） -> 合計4px */
    const PIXEL_EXPANSION_PER_SIDE = 2;
    /** 拡大率リミッター (最小) */
    const MIN_SCALE = 1.02;
    /** 拡大率リミッター (最大) */
    const MAX_SCALE = 2.5;
    /** フォールバック拡大率 (CSS側でも定義) */
    const FALLBACK_SCALE = 1.08;

    // --- 対象セレクタ (V2.0 修正) ---
    const globalSelectors = [
        // ボタン類
        'button', 'a[role="button"]', 'div[role="button"]',
        'input[type="button"]', 'input[type="submit"]',
        '.btn', '.button', '[class*="btn-"]', '[class*="button-"]',
        // カード・コンテナ類
        '.card', '.Card', '[class*="card"]',
        '.panel', '.Panel', '.widget', '.Widget',
        // 'article', // V2.0: X (Twitter) のツイート全体を除外するためコメントアウト
        // ナビゲーション・リスト類
        'nav a',
        'div[role="tab"]', 'a[role="tab"]',
        '[role="menuitem"]', '[role="gridcell"]',
        // ARIAロール（適用範囲強化）
        'a[role="link"]',
        'div[role="link"]',
        'li[role="listitem"]', 'div[role="listitem"]',
        'div[role="menuitem"]',
        'svg[role="img"]',
        // その他（X.com由来）
        'div[data-testid$="-like"]', 'div[data-testid$="-retweet"]', 'div[data-testid$="-reply"]',
        'div[data-testid$="-bookmark"]', 'div[data-testid$="-share"]'
    ];

    /** 適用対象を示すクラス名 */
    const TARGET_CLASS = 'gm-global-hover-effect';
    const combinedSelector = globalSelectors.join(',');

    // --- 視覚効果 (CSS) ---
    GM_addStyle(`
        .${TARGET_CLASS} {
            transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
            --hover-scale: scale(${FALLBACK_SCALE});
        }
        .${TARGET_CLASS}:hover {
            transform: var(--hover-scale);
            position: relative;
            z-index: 9999 !important;
            box-shadow: 0px 10px 25px rgba(0, 0, 0, 0.3);
        }
    `);

    /**
     * 要素をスキャンし、エフェクトを適用する
     */
    function scanAndApply() {
        const elements = document.querySelectorAll(combinedSelector);
        // V1.9/V2.0: 合計20px
        const totalExpansion = PIXEL_EXPANSION_PER_SIDE * 2;

        elements.forEach(el => {
            if (el.classList.contains(TARGET_CLASS)) {
                return;
            }
            el.classList.add(TARGET_CLASS);

            try {
                const rect = el.getBoundingClientRect();
                const width = rect.width;
                const height = rect.height;

                if (width > 0 && height > 0) {
                    const scaleW = (width + totalExpansion) / width;
                    const scaleH = (height + totalExpansion) / height;
                    const baseScale = Math.min(scaleW, scaleH);
                    const clampedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, baseScale));

                    el.style.setProperty('--hover-scale', `scale(${clampedScale})`);
                }
            } catch (e) {
                console.warn(`[Hover Effect V2.0] Failed to calculate scale for element:`, el, e);
            }
        });
    }

    // --- 実行トリガー： 動的監視 ---
    const observer = new MutationObserver(scanAndApply);

    function initialize() {
        if (!document.body) {
            // body がまだない場合は待機
            window.addEventListener('DOMContentLoaded', initialize, { once: true });
            return;
        }
        scanAndApply(); // 初期スキャン
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize(); // すでに DOMContentLoaded 後
    }

})();