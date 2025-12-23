/**
 * Publisher Platform - Lazy Loader
 * Phase 11C-1: 画像の遅延読み込み（Lazy Loading）
 * 
 * Intersection Observer APIを使用して、画面に表示される直前に
 * 画像を読み込むことで、初期表示を高速化します。
 * 
 * 使用方法:
 * 1. <img>タグに data-src 属性で実際の画像URLを指定
 * 2. src属性にはプレースホルダー画像を指定
 * 3. lazy-image クラスを追加
 * 
 * 例:
 * <img class="lazy-image" 
 *      src="placeholder.jpg" 
 *      data-src="actual-image.jpg" 
 *      alt="説明">
 */

(function() {
    'use strict';

    const LazyLoader = {
        // 設定
        config: {
            rootMargin: '50px 0px',  // 画面の50px手前で読み込み開始
            threshold: 0.01,          // 1%見えたら読み込み開始
            loadedClass: 'lazy-loaded',
            loadingClass: 'lazy-loading',
            errorClass: 'lazy-error'
        },

        // Observer インスタンス
        observer: null,

        /**
         * 初期化
         */
        init: function(customConfig = {}) {
            // カスタム設定をマージ
            this.config = { ...this.config, ...customConfig };

            // Intersection Observer がサポートされているか確認
            if (!('IntersectionObserver' in window)) {
                // サポートされていない場合は即座に全画像を読み込む
                console.warn('Intersection Observer not supported. Loading all images immediately.');
                this.loadAllImages();
                return;
            }

            // Observer を作成
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                {
                    rootMargin: this.config.rootMargin,
                    threshold: this.config.threshold
                }
            );

            // 既存の lazy-image を監視開始
            this.observe();

            console.log('LazyLoader initialized');
        },

        /**
         * すべての lazy-image 要素を監視
         */
        observe: function() {
            const images = document.querySelectorAll('.lazy-image:not(.lazy-loaded)');
            images.forEach(img => {
                this.observer.observe(img);
            });
        },

        /**
         * 新しい要素を監視に追加（動的に追加された画像用）
         */
        observeNew: function(container = document) {
            const images = container.querySelectorAll('.lazy-image:not(.lazy-loaded)');
            images.forEach(img => {
                this.observer.observe(img);
            });
        },

        /**
         * Intersection Observer のコールバック
         */
        handleIntersection: function(entries, observer) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        },

        /**
         * 画像を読み込む
         */
        loadImage: function(img) {
            const src = img.dataset.src;
            const srcset = img.dataset.srcset;

            if (!src) return;

            // 読み込み中クラスを追加
            img.classList.add(this.config.loadingClass);

            // 画像を事前読み込み
            const tempImage = new Image();

            tempImage.onload = () => {
                // 実際の src を設定
                img.src = src;
                if (srcset) {
                    img.srcset = srcset;
                }

                // クラスを更新
                img.classList.remove(this.config.loadingClass);
                img.classList.add(this.config.loadedClass);

                // data-src を削除（再読み込み防止）
                delete img.dataset.src;
                if (srcset) delete img.dataset.srcset;

                // カスタムイベントを発火
                img.dispatchEvent(new CustomEvent('lazyloaded'));
            };

            tempImage.onerror = () => {
                img.classList.remove(this.config.loadingClass);
                img.classList.add(this.config.errorClass);
                console.error('Failed to load image:', src);

                // カスタムイベントを発火
                img.dispatchEvent(new CustomEvent('lazyerror'));
            };

            tempImage.src = src;
        },

        /**
         * すべての画像を即座に読み込む（フォールバック用）
         */
        loadAllImages: function() {
            const images = document.querySelectorAll('.lazy-image:not(.lazy-loaded)');
            images.forEach(img => this.loadImage(img));
        },

        /**
         * 特定のコンテナ内の画像を即座に読み込む
         */
        loadImagesInContainer: function(container) {
            const images = container.querySelectorAll('.lazy-image:not(.lazy-loaded)');
            images.forEach(img => this.loadImage(img));
        },

        /**
         * 監視を停止
         */
        destroy: function() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
        }
    };

    // ===================================================
    // 漫画ビューワー専用の拡張機能
    // ===================================================
    const MangaLazyLoader = {
        // 先読みするページ数
        preloadCount: 3,

        /**
         * 漫画ページの遅延読み込みを初期化
         * @param {Array} pages - ページURLの配列
         * @param {HTMLElement} container - 画像を表示するコンテナ
         */
        init: function(pages, container) {
            this.pages = pages;
            this.container = container;
            this.loadedPages = new Set();

            // 最初のページと先読みページを読み込む
            this.preloadAround(0);
        },

        /**
         * 指定ページの周辺を先読み
         * @param {number} currentIndex - 現在のページインデックス
         */
        preloadAround: function(currentIndex) {
            // 現在のページ + 前後のページを先読み
            const start = Math.max(0, currentIndex - 1);
            const end = Math.min(this.pages.length - 1, currentIndex + this.preloadCount);

            for (let i = start; i <= end; i++) {
                this.preloadPage(i);
            }
        },

        /**
         * 特定のページを先読み
         * @param {number} index - ページインデックス
         */
        preloadPage: function(index) {
            if (this.loadedPages.has(index)) return;
            if (index < 0 || index >= this.pages.length) return;

            const img = new Image();
            img.src = this.pages[index];

            img.onload = () => {
                this.loadedPages.add(index);
            };
        },

        /**
         * ページ変更時に呼び出す
         * @param {number} newIndex - 新しいページインデックス
         */
        onPageChange: function(newIndex) {
            this.preloadAround(newIndex);
        }
    };

    // ===================================================
    // サムネイル用の遅延読み込み
    // ===================================================
    const ThumbnailLazyLoader = {
        /**
         * サムネイルストリップの遅延読み込みを初期化
         * @param {HTMLElement} container - サムネイルコンテナ
         */
        init: function(container) {
            this.container = container;

            // 水平スクロール用の Observer を作成
            this.observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target.querySelector('img[data-src]');
                            if (img) {
                                img.src = img.dataset.src;
                                delete img.dataset.src;
                            }
                            this.observer.unobserve(entry.target);
                        }
                    });
                },
                {
                    root: container,
                    rootMargin: '0px 100px', // 左右100px先を先読み
                    threshold: 0.01
                }
            );

            // サムネイルを監視
            const thumbnails = container.querySelectorAll('.thumbnail');
            thumbnails.forEach(thumb => this.observer.observe(thumb));
        },

        /**
         * 新しいサムネイルを監視に追加
         */
        observeNew: function(thumbnail) {
            if (this.observer) {
                this.observer.observe(thumbnail);
            }
        },

        /**
         * 監視を停止
         */
        destroy: function() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
        }
    };

    // ===================================================
    // 自動初期化
    // ===================================================
    function autoInit() {
        // DOMContentLoaded後に初期化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                LazyLoader.init();
            });
        } else {
            LazyLoader.init();
        }
    }

    autoInit();

    // グローバルに公開
    window.LazyLoader = LazyLoader;
    window.MangaLazyLoader = MangaLazyLoader;
    window.ThumbnailLazyLoader = ThumbnailLazyLoader;

})();
