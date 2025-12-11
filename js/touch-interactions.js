/**
 * Publisher Platform - Touch Interactions
 * Phase 11B-3: Swipe actions and touch gestures
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        swipeThreshold: 80,      // Minimum distance to trigger action (px)
        swipeVelocity: 0.3,      // Minimum velocity (px/ms)
        maxSwipeDistance: 120,   // Maximum visual swipe distance
        animationDuration: 200,  // Animation duration (ms)
        pullRefreshThreshold: 80 // Pull-to-refresh trigger distance
    };

    /**
     * SwipeHandler - Handles swipe gestures on elements
     */
    class SwipeHandler {
        constructor(element, options = {}) {
            this.element = element;
            this.options = {
                onSwipeLeft: options.onSwipeLeft || null,
                onSwipeRight: options.onSwipeRight || null,
                leftAction: options.leftAction || 'delete',
                rightAction: options.rightAction || 'archive',
                threshold: options.threshold || CONFIG.swipeThreshold
            };

            this.startX = 0;
            this.startY = 0;
            this.currentX = 0;
            this.startTime = 0;
            this.isSwiping = false;
            this.isHorizontalSwipe = null;

            this.init();
        }

        init() {
            // Add swipeable class
            this.element.classList.add('swipeable');

            // Create action backgrounds
            this.createActionBackgrounds();

            // Bind events
            this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
            this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
            this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: true });
        }

        createActionBackgrounds() {
            // Left action (swipe right reveals)
            if (this.options.onSwipeRight) {
                const leftAction = document.createElement('div');
                leftAction.className = 'swipe-action-left';
                leftAction.innerHTML = this.getActionIcon(this.options.rightAction);
                this.element.appendChild(leftAction);
            }

            // Right action (swipe left reveals)
            if (this.options.onSwipeLeft) {
                const rightAction = document.createElement('div');
                rightAction.className = 'swipe-action-right';
                rightAction.innerHTML = this.getActionIcon(this.options.leftAction);
                this.element.appendChild(rightAction);
            }
        }

        getActionIcon(action) {
            const icons = {
                delete: '<i class="bi bi-trash"></i>',
                archive: '<i class="bi bi-archive"></i>',
                read: '<i class="bi bi-check-circle"></i>',
                unread: '<i class="bi bi-circle"></i>',
                star: '<i class="bi bi-star"></i>',
                edit: '<i class="bi bi-pencil"></i>'
            };
            return icons[action] || icons.delete;
        }

        handleTouchStart(e) {
            if (e.touches.length !== 1) return;

            const touch = e.touches[0];
            this.startX = touch.clientX;
            this.startY = touch.clientY;
            this.currentX = 0;
            this.startTime = Date.now();
            this.isSwiping = false;
            this.isHorizontalSwipe = null;

            this.element.classList.add('swiping');
        }

        handleTouchMove(e) {
            if (e.touches.length !== 1) return;

            const touch = e.touches[0];
            const diffX = touch.clientX - this.startX;
            const diffY = touch.clientY - this.startY;

            // Determine swipe direction on first significant movement
            if (this.isHorizontalSwipe === null) {
                if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
                    this.isHorizontalSwipe = Math.abs(diffX) > Math.abs(diffY);
                }
            }

            // Only handle horizontal swipes
            if (!this.isHorizontalSwipe) return;

            e.preventDefault();
            this.isSwiping = true;

            // Calculate constrained swipe distance
            const maxDist = CONFIG.maxSwipeDistance;
            this.currentX = Math.max(-maxDist, Math.min(maxDist, diffX));

            // Apply transform
            this.element.style.transform = `translateX(${this.currentX}px)`;

            // Add visual feedback
            if (this.currentX < -CONFIG.swipeThreshold / 2) {
                this.element.classList.add('swiping-left');
                this.element.classList.remove('swiping-right');
            } else if (this.currentX > CONFIG.swipeThreshold / 2) {
                this.element.classList.add('swiping-right');
                this.element.classList.remove('swiping-left');
            } else {
                this.element.classList.remove('swiping-left', 'swiping-right');
            }
        }

        handleTouchEnd(e) {
            this.element.classList.remove('swiping');

            if (!this.isSwiping) {
                this.resetPosition();
                return;
            }

            const duration = Date.now() - this.startTime;
            const velocity = Math.abs(this.currentX) / duration;
            const triggered = Math.abs(this.currentX) >= this.options.threshold || velocity >= CONFIG.swipeVelocity;

            if (triggered) {
                if (this.currentX < 0 && this.options.onSwipeLeft) {
                    this.completeSwipe('left');
                } else if (this.currentX > 0 && this.options.onSwipeRight) {
                    this.completeSwipe('right');
                } else {
                    this.resetPosition();
                }
            } else {
                this.resetPosition();
            }
        }

        handleTouchCancel() {
            this.resetPosition();
        }

        completeSwipe(direction) {
            const targetX = direction === 'left' ? -this.element.offsetWidth : this.element.offsetWidth;
            
            this.element.style.transition = `transform ${CONFIG.animationDuration}ms ease-out`;
            this.element.style.transform = `translateX(${targetX}px)`;

            setTimeout(() => {
                if (direction === 'left' && this.options.onSwipeLeft) {
                    this.options.onSwipeLeft(this.element);
                } else if (direction === 'right' && this.options.onSwipeRight) {
                    this.options.onSwipeRight(this.element);
                }
                this.resetPosition(true);
            }, CONFIG.animationDuration);
        }

        resetPosition(immediate = false) {
            if (immediate) {
                this.element.style.transition = 'none';
                this.element.style.transform = '';
                // Force reflow
                this.element.offsetHeight;
                this.element.style.transition = '';
            } else {
                this.element.style.transition = `transform ${CONFIG.animationDuration}ms ease-out`;
                this.element.style.transform = '';
            }

            this.element.classList.remove('swiping', 'swiping-left', 'swiping-right');
            this.currentX = 0;
            this.isHorizontalSwipe = null;
        }

        destroy() {
            this.element.classList.remove('swipeable', 'swiping', 'swiping-left', 'swiping-right');
            this.element.style.transform = '';
            
            const actions = this.element.querySelectorAll('.swipe-action-left, .swipe-action-right');
            actions.forEach(action => action.remove());
        }
    }

    /**
     * PullToRefresh - Handles pull-to-refresh gesture
     */
    class PullToRefresh {
        constructor(options = {}) {
            this.options = {
                container: options.container || document.body,
                onRefresh: options.onRefresh || (() => Promise.resolve()),
                threshold: options.threshold || CONFIG.pullRefreshThreshold
            };

            this.startY = 0;
            this.currentY = 0;
            this.isPulling = false;
            this.isRefreshing = false;
            this.indicator = null;

            this.init();
        }

        init() {
            this.createIndicator();
            this.bindEvents();
        }

        createIndicator() {
            this.indicator = document.createElement('div');
            this.indicator.className = 'pull-refresh-indicator';
            this.indicator.innerHTML = '<i class="bi bi-arrow-clockwise"></i>';
            document.body.appendChild(this.indicator);
        }

        bindEvents() {
            document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
            document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        }

        handleTouchStart(e) {
            if (this.isRefreshing) return;
            if (window.scrollY !== 0) return;

            this.startY = e.touches[0].clientY;
            this.isPulling = false;
        }

        handleTouchMove(e) {
            if (this.isRefreshing) return;
            if (window.scrollY !== 0) return;

            const touch = e.touches[0];
            const diffY = touch.clientY - this.startY;

            if (diffY > 0) {
                e.preventDefault();
                this.isPulling = true;
                this.currentY = Math.min(diffY * 0.5, this.options.threshold * 1.5);

                // Show indicator
                if (this.currentY > 20) {
                    this.indicator.classList.add('visible');
                    this.indicator.style.transform = `translateX(-50%) translateY(${Math.min(this.currentY, 60)}px)`;
                    
                    // Rotate arrow based on progress
                    const progress = Math.min(this.currentY / this.options.threshold, 1);
                    this.indicator.querySelector('i').style.transform = `rotate(${progress * 180}deg)`;
                }
            }
        }

        handleTouchEnd() {
            if (!this.isPulling) return;

            if (this.currentY >= this.options.threshold) {
                this.refresh();
            } else {
                this.reset();
            }
        }

        async refresh() {
            this.isRefreshing = true;
            this.indicator.classList.add('refreshing');

            try {
                await this.options.onRefresh();
            } finally {
                this.isRefreshing = false;
                this.reset();
            }
        }

        reset() {
            this.indicator.classList.remove('visible', 'refreshing');
            this.indicator.style.transform = '';
            this.currentY = 0;
            this.isPulling = false;
        }

        destroy() {
            if (this.indicator) {
                this.indicator.remove();
            }
        }
    }

    /**
     * TouchInteractions - Main module
     */
    const TouchInteractions = {
        swipeHandlers: new Map(),
        pullToRefresh: null,

        /**
         * Initialize swipe actions on notification items
         */
        initNotificationSwipes() {
            // Check if mobile
            if (!this.isMobile()) return;

            const notifications = document.querySelectorAll('.notification-item');
            notifications.forEach(item => {
                if (this.swipeHandlers.has(item)) return;

                const notificationId = item.dataset.notificationId;
                if (!notificationId) return;

                const handler = new SwipeHandler(item, {
                    leftAction: 'delete',
                    rightAction: 'read',
                    onSwipeLeft: (el) => this.deleteNotification(el, notificationId),
                    onSwipeRight: (el) => this.markAsRead(el, notificationId)
                });

                this.swipeHandlers.set(item, handler);
            });
        },

        /**
         * Initialize swipe actions on list items
         */
        initListSwipes(selector, options = {}) {
            if (!this.isMobile()) return;

            const items = document.querySelectorAll(selector);
            items.forEach(item => {
                if (this.swipeHandlers.has(item)) return;

                const handler = new SwipeHandler(item, options);
                this.swipeHandlers.set(item, handler);
            });
        },

        /**
         * Initialize pull-to-refresh
         */
        initPullToRefresh(onRefresh) {
            if (!this.isMobile()) return;
            if (this.pullToRefresh) return;

            this.pullToRefresh = new PullToRefresh({
                onRefresh: async () => {
                    if (typeof onRefresh === 'function') {
                        await onRefresh();
                    } else {
                        // Default: reload page
                        window.location.reload();
                    }
                }
            });
        },

        /**
         * Delete notification via swipe
         */
        async deleteNotification(element, notificationId) {
            try {
                // Get token
                const token = localStorage.getItem('authToken');
                if (!token) return;

                // API call
                const response = await fetch(`http://localhost:3000/api/notifications/${notificationId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    // Animate removal
                    element.style.height = element.offsetHeight + 'px';
                    element.style.transition = 'height 0.2s ease, opacity 0.2s ease, margin 0.2s ease, padding 0.2s ease';
                    
                    requestAnimationFrame(() => {
                        element.style.height = '0';
                        element.style.opacity = '0';
                        element.style.margin = '0';
                        element.style.padding = '0';
                        element.style.overflow = 'hidden';
                    });

                    setTimeout(() => {
                        element.remove();
                        this.swipeHandlers.delete(element);
                        
                        // Update badge
                        if (typeof updateNotificationBadge === 'function') {
                            updateNotificationBadge();
                        }
                    }, 200);

                    this.showToast('通知を削除しました', 'success');
                }
            } catch (error) {
                console.error('Delete notification error:', error);
                this.showToast('削除に失敗しました', 'error');
            }
        },

        /**
         * Mark notification as read via swipe
         */
        async markAsRead(element, notificationId) {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) return;

                const response = await fetch(`http://localhost:3000/api/notifications/${notificationId}/read`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    element.classList.remove('unread');
                    element.classList.add('read');

                    // Update badge
                    if (typeof updateNotificationBadge === 'function') {
                        updateNotificationBadge();
                    }

                    this.showToast('既読にしました', 'success');
                }
            } catch (error) {
                console.error('Mark as read error:', error);
            }
        },

        /**
         * Show toast notification
         */
        showToast(message, type = 'info') {
            // Check if toast container exists
            let container = document.querySelector('.toast-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
                container.style.zIndex = '1100';
                document.body.appendChild(container);
            }

            // Create toast
            const toast = document.createElement('div');
            toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'} border-0`;
            toast.setAttribute('role', 'alert');
            toast.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            `;

            container.appendChild(toast);

            // Show toast
            const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
            bsToast.show();

            // Remove after hidden
            toast.addEventListener('hidden.bs.toast', () => toast.remove());
        },

        /**
         * Check if device is mobile
         */
        isMobile() {
            return window.matchMedia('(max-width: 768px)').matches || 
                   ('ontouchstart' in window) ||
                   (navigator.maxTouchPoints > 0);
        },

        /**
         * Initialize all touch interactions
         */
        init() {
            // Wait for DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        },

        setup() {
            // Only on mobile
            if (!this.isMobile()) return;

            // Init notification swipes on notification page
            if (document.querySelector('.notification-item')) {
                this.initNotificationSwipes();
            }

            // Init pull to refresh on main pages
            const refreshablePages = [
                '/pages/notifications.html',
                '/pages/dashboard.html'
            ];

            if (refreshablePages.some(page => window.location.pathname.includes(page))) {
                this.initPullToRefresh(() => {
                    return new Promise(resolve => {
                        window.location.reload();
                        resolve();
                    });
                });
            }

            // Add swipe hint to first notification
            const firstNotification = document.querySelector('.notification-item');
            if (firstNotification && !localStorage.getItem('swipeHintShown')) {
                firstNotification.classList.add('swipe-hint');
                setTimeout(() => {
                    firstNotification.classList.remove('swipe-hint');
                    localStorage.setItem('swipeHintShown', 'true');
                }, 3000);
            }

            console.log('Touch interactions initialized');
        },

        /**
         * Reinitialize for dynamically added content
         */
        reinit() {
            this.initNotificationSwipes();
        },

        /**
         * Cleanup
         */
        destroy() {
            this.swipeHandlers.forEach(handler => handler.destroy());
            this.swipeHandlers.clear();

            if (this.pullToRefresh) {
                this.pullToRefresh.destroy();
                this.pullToRefresh = null;
            }
        }
    };

    // Auto-initialize
    TouchInteractions.init();

    // Expose globally
    window.TouchInteractions = TouchInteractions;
})();
