/**
 * Analytics Tracker
 * Phase 10: ユーザー行動追跡用スクリプト
 */

(function() {
    'use strict';
    
    const API_BASE = (window.API_ORIGIN || '') + '/api/analytics';
    
    // Generate or retrieve session ID
    function getSessionId() {
        let sessionId = sessionStorage.getItem('publisher_session_id');
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('publisher_session_id', sessionId);
        }
        return sessionId;
    }
    
    // Get user ID from localStorage if logged in
    function getUserId() {
        const user = localStorage.getItem('user');
        if (user) {
            try {
                return JSON.parse(user).id;
            } catch (e) {
                return null;
            }
        }
        return null;
    }
    
    // Detect page type from URL
    function getPageType() {
        const path = window.location.pathname;
        
        if (path === '/' || path === '/index.html') return 'home';
        if (path.includes('/explore')) return 'explore';
        if (path.includes('/reader')) return 'reader';
        if (path.includes('/work-detail') || path.includes('/works/')) return 'work';
        if (path.includes('/dashboard')) return 'dashboard';
        if (path.includes('/profile')) return 'profile';
        if (path.includes('/admin')) return 'admin';
        if (path.includes('/analytics')) return 'analytics';
        if (path.includes('/settings')) return 'settings';
        if (path.includes('/login') || path.includes('/register')) return 'auth';
        if (path.includes('/support') || path.includes('/faq')) return 'support';
        if (path.includes('/translator')) return 'translator';
        
        return 'other';
    }
    
    // Detect referrer type
    function getReferrerType() {
        const referrer = document.referrer;
        
        if (!referrer) return 'direct';
        
        const referrerUrl = new URL(referrer);
        const currentHost = window.location.host;
        
        if (referrerUrl.host === currentHost) return 'internal';
        
        const searchEngines = ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu'];
        if (searchEngines.some(se => referrerUrl.host.includes(se))) return 'search';
        
        const socialNetworks = ['twitter', 'facebook', 'instagram', 'linkedin', 'reddit', 'tiktok'];
        if (socialNetworks.some(sn => referrerUrl.host.includes(sn))) return 'social';
        
        return 'external';
    }
    
    // Get referrer source
    function getReferrerSource() {
        const referrer = document.referrer;
        if (!referrer) return null;
        
        try {
            const referrerUrl = new URL(referrer);
            return referrerUrl.hostname.replace('www.', '');
        } catch (e) {
            return null;
        }
    }
    
    // Track page view
    async function trackPageView() {
        try {
            await fetch(`${API_BASE}/track/pageview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: getUserId(),
                    session_id: getSessionId(),
                    page_path: window.location.pathname,
                    page_type: getPageType(),
                    referrer: document.referrer || null
                })
            });
        } catch (error) {
            console.debug('Analytics: pageview tracking failed', error);
        }
    }
    
    // Track work view
    async function trackWorkView(workId, viewType = 'page') {
        try {
            await fetch(`${API_BASE}/track/work`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    work_id: workId,
                    user_id: getUserId(),
                    session_id: getSessionId(),
                    view_type: viewType,
                    referrer_type: getReferrerType(),
                    referrer_source: getReferrerSource()
                })
            });
        } catch (error) {
            console.debug('Analytics: work view tracking failed', error);
        }
    }
    
    // Track reading progress
    async function trackReadingProgress(workId, chapterIndex, readingTimeSeconds, scrollPercentage) {
        try {
            await fetch(`${API_BASE}/track/work`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    work_id: workId,
                    user_id: getUserId(),
                    session_id: getSessionId(),
                    view_type: 'read',
                    chapter_index: chapterIndex,
                    reading_time_seconds: readingTimeSeconds,
                    scroll_percentage: scrollPercentage
                })
            });
        } catch (error) {
            console.debug('Analytics: reading progress tracking failed', error);
        }
    }
    
    // Track custom event
    async function trackEvent(eventType, eventCategory, eventTarget, eventValue = null) {
        try {
            await fetch(`${API_BASE}/track/event`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: getUserId(),
                    session_id: getSessionId(),
                    event_type: eventType,
                    event_category: eventCategory,
                    event_target: eventTarget,
                    event_value: eventValue,
                    page_path: window.location.pathname
                })
            });
        } catch (error) {
            console.debug('Analytics: event tracking failed', error);
        }
    }
    
    // Reading time tracker class
    class ReadingTimeTracker {
        constructor(workId) {
            this.workId = workId;
            this.startTime = Date.now();
            this.maxScroll = 0;
            this.isActive = true;
            this.lastSent = Date.now();
            
            this.setupListeners();
        }
        
        setupListeners() {
            // Track scroll
            window.addEventListener('scroll', () => {
                if (!this.isActive) return;
                
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPercent = scrollHeight > 0 ? (window.scrollY / scrollHeight * 100) : 0;
                this.maxScroll = Math.max(this.maxScroll, Math.round(scrollPercent));
            });
            
            // Track visibility
            document.addEventListener('visibilitychange', () => {
                this.isActive = document.visibilityState === 'visible';
                
                if (!this.isActive) {
                    this.sendProgress();
                }
            });
            
            // Send progress periodically (every 30 seconds)
            setInterval(() => {
                if (this.isActive && Date.now() - this.lastSent > 30000) {
                    this.sendProgress();
                }
            }, 30000);
            
            // Send on page unload
            window.addEventListener('beforeunload', () => {
                this.sendProgress(true);
            });
        }
        
        sendProgress(isSync = false) {
            const readingTime = Math.round((Date.now() - this.startTime) / 1000);
            this.lastSent = Date.now();
            
            const data = {
                work_id: this.workId,
                user_id: getUserId(),
                session_id: getSessionId(),
                view_type: 'read',
                reading_time_seconds: readingTime,
                scroll_percentage: this.maxScroll
            };
            
            if (isSync && navigator.sendBeacon) {
                navigator.sendBeacon(`${API_BASE}/track/work`, JSON.stringify(data));
            } else {
                trackReadingProgress(this.workId, null, readingTime, this.maxScroll);
            }
        }
    }
    
    // Auto-track page views on load
    document.addEventListener('DOMContentLoaded', () => {
        trackPageView();
    });
    
    // Export to global scope
    window.PublisherAnalytics = {
        trackPageView,
        trackWorkView,
        trackReadingProgress,
        trackEvent,
        ReadingTimeTracker,
        getSessionId,
        getUserId
    };
})();
