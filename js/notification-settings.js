/**
 * Notification Settings Manager
 * Phase 9D: 通知設定ページの強化
 * Phase 12-8d: 多言語対応
 * 
 * account-settings.htmlの通知設定を管理
 */

// API Base URL
const NOTIFICATION_API = 'http://localhost:3000/api/notifications';

// 通知タイプの定義（翻訳キー対応）
const NOTIFICATION_TYPES = [
    { type: 'sale', labelKey: 'notificationManager.sale', descKey: 'notificationManager.saleDesc', icon: '💰' },
    { type: 'translation_complete', labelKey: 'notificationManager.translationComplete', descKey: 'notificationManager.translationCompleteDesc', icon: '🌐' },
    { type: 'comment', labelKey: 'notificationManager.comment', descKey: 'notificationManager.commentDesc', icon: '💬' },
    { type: 'feedback', labelKey: 'notificationManager.feedback', descKey: 'notificationManager.feedbackDesc', icon: '⭐' },
    { type: 'ticket_reply', labelKey: 'notificationManager.ticketReply', descKey: 'notificationManager.ticketReplyDesc', icon: '🎧' },
    { type: 'system', labelKey: 'notificationManager.system', descKey: 'notificationManager.systemDesc', icon: '🔔' }
];

// 設定の状態を保持
let notificationPreferences = {};

/**
 * 翻訳取得ヘルパー
 */
function getNotifTranslation(key) {
    if (typeof t === 'function') {
        const result = t(key);
        if (result && result !== key) return result;
    }
    // フォールバック用のデフォルト値
    const fallbacks = {
        'notificationManager.sale': 'Sales Notifications',
        'notificationManager.saleDesc': 'When your work is purchased',
        'notificationManager.translationComplete': 'Translation Complete',
        'notificationManager.translationCompleteDesc': 'When requested translation is complete',
        'notificationManager.comment': 'Comment Notifications',
        'notificationManager.commentDesc': 'When your works receive comments',
        'notificationManager.feedback': 'Feedback Notifications',
        'notificationManager.feedbackDesc': 'Ratings and feedback from readers',
        'notificationManager.ticketReply': 'Support Notifications',
        'notificationManager.ticketReplyDesc': 'When there is a reply to your inquiry',
        'notificationManager.system': 'System Notifications',
        'notificationManager.systemDesc': 'Maintenance and important announcements',
        'notificationManager.notificationCenter': 'Notification Center',
        'notificationManager.notificationCenterDesc': 'View and manage unread notifications',
        'notificationManager.open': 'Open',
        'notificationManager.inAppNotifications': 'In-App Notifications',
        'notificationManager.inAppNotificationsDesc': 'Notifications displayed in notification center',
        'notificationManager.emailNotifications': 'Email Notifications',
        'notificationManager.emailNotificationsDesc': 'Notifications received via email',
        'notificationManager.bulkSettings': 'Bulk Settings',
        'notificationManager.allInAppOn': 'All In-App ON',
        'notificationManager.allInAppOff': 'All In-App OFF',
        'notificationManager.allEmailOn': 'All Email ON',
        'notificationManager.allEmailOff': 'All Email OFF',
        'notificationManager.saveSettings': 'Save Settings',
        'notificationManager.settingsNote': 'Settings take effect after saving. Important system notifications may be sent regardless of settings.',
        'notificationManager.marketing': 'Marketing Emails',
        'notificationManager.marketingDesc': 'News about features and campaigns',
        'notificationManager.saved': 'Notification settings saved',
        'notificationManager.allOnMessage': 'All notifications turned ON',
        'notificationManager.allOffMessage': 'All notifications turned OFF'
    };
    return fallbacks[key] || key;
}

/**
 * 通知設定パネルを動的に生成
 */
function initNotificationSettingsPanel() {
    const panel = document.getElementById('panel-notifications');
    if (!panel) return;

    panel.innerHTML = `
        <!-- Notification Center Link -->
        <div class="settings-card" style="background: linear-gradient(135deg, #8b7355 0%, #a08060 100%); color: white;">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                    <h3 style="color: white; margin-bottom: 0.5rem;"><i class="fas fa-bell"></i> ${getNotifTranslation('notificationManager.notificationCenter')}</h3>
                    <p style="margin: 0; opacity: 0.9;">${getNotifTranslation('notificationManager.notificationCenterDesc')}</p>
                </div>
                <a href="notifications.html" class="btn btn-light">
                    <i class="fas fa-external-link-alt me-1"></i> ${getNotifTranslation('notificationManager.open')}
                </a>
            </div>
        </div>

        <!-- In-App Notifications -->
        <div class="settings-card">
            <h3><i class="fas fa-mobile-alt"></i> ${getNotifTranslation('notificationManager.inAppNotifications')}</h3>
            <p class="text-muted mb-3">${getNotifTranslation('notificationManager.inAppNotificationsDesc')}</p>
            <div id="inAppNotificationsList"></div>
        </div>
        
        <!-- Email Notifications -->
        <div class="settings-card">
            <h3><i class="fas fa-envelope"></i> ${getNotifTranslation('notificationManager.emailNotifications')}</h3>
            <p class="text-muted mb-3">${getNotifTranslation('notificationManager.emailNotificationsDesc')}</p>
            <div id="emailNotificationsList"></div>
        </div>
        
        <!-- Quick Actions -->
        <div class="settings-card">
            <h3><i class="fas fa-sliders-h"></i> ${getNotifTranslation('notificationManager.bulkSettings')}</h3>
            <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-outline-secondary btn-sm" onclick="setAllNotifications(true, 'in_app')">
                    <i class="fas fa-check-double me-1"></i> ${getNotifTranslation('notificationManager.allInAppOn')}
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="setAllNotifications(false, 'in_app')">
                    <i class="fas fa-times me-1"></i> ${getNotifTranslation('notificationManager.allInAppOff')}
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="setAllNotifications(true, 'email')">
                    <i class="fas fa-envelope me-1"></i> ${getNotifTranslation('notificationManager.allEmailOn')}
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="setAllNotifications(false, 'email')">
                    <i class="fas fa-envelope-open me-1"></i> ${getNotifTranslation('notificationManager.allEmailOff')}
                </button>
            </div>
        </div>
        
        <button class="btn btn-primary-custom" onclick="saveAllNotificationSettings()">
            <i class="fas fa-save me-1"></i> ${getNotifTranslation('notificationManager.saveSettings')}
        </button>
        
        <p class="text-muted mt-3 small">
            <i class="fas fa-info-circle me-1"></i>
            ${getNotifTranslation('notificationManager.settingsNote')}
        </p>
    `;

    // 通知項目を生成
    renderNotificationItems();
}

/**
 * 通知項目をレンダリング
 */
function renderNotificationItems() {
    const inAppList = document.getElementById('inAppNotificationsList');
    const emailList = document.getElementById('emailNotificationsList');
    
    if (!inAppList || !emailList) return;

    // アプリ内通知
    inAppList.innerHTML = NOTIFICATION_TYPES.map(notif => `
        <div class="notification-item">
            <div class="notification-info">
                <h4>${notif.icon} ${getNotifTranslation(notif.labelKey)}</h4>
                <p>${getNotifTranslation(notif.descKey)}</p>
            </div>
            <div class="form-check form-switch">
                <input class="form-check-input notification-pref" type="checkbox" 
                       data-type="${notif.type}" data-channel="in_app" 
                       id="inApp_${notif.type}" checked>
            </div>
        </div>
    `).join('');

    // メール通知
    emailList.innerHTML = NOTIFICATION_TYPES.map(notif => `
        <div class="notification-item">
            <div class="notification-info">
                <h4>${notif.icon} ${getNotifTranslation(notif.labelKey)}</h4>
                <p>${getNotifTranslation(notif.descKey)}</p>
            </div>
            <div class="form-check form-switch">
                <input class="form-check-input notification-pref" type="checkbox" 
                       data-type="${notif.type}" data-channel="email" 
                       id="email_${notif.type}">
            </div>
        </div>
    `).join('');

    // マーケティングメールを追加（メールのみ）
    emailList.innerHTML += `
        <div class="notification-item">
            <div class="notification-info">
                <h4>📣 ${getNotifTranslation('notificationManager.marketing')}</h4>
                <p>${getNotifTranslation('notificationManager.marketingDesc')}</p>
            </div>
            <div class="form-check form-switch">
                <input class="form-check-input notification-pref" type="checkbox" 
                       data-type="marketing" data-channel="email" 
                       id="email_marketing">
            </div>
        </div>
    `;
}

/**
 * 通知設定を読み込む
 */
async function loadNotificationPreferences() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Not logged in, using default preferences');
        return;
    }

    try {
        const response = await fetch(`${NOTIFICATION_API}/preferences`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error('Failed to load preferences:', response.status);
            return;
        }

        const data = await response.json();
        
        if (data.success && data.preferences) {
            // 設定をUIに反映
            data.preferences.forEach(pref => {
                notificationPreferences[pref.notification_type] = {
                    in_app: pref.in_app_enabled,
                    email: pref.email_enabled
                };

                // チェックボックスを更新
                const inAppCheckbox = document.getElementById(`inApp_${pref.notification_type}`);
                const emailCheckbox = document.getElementById(`email_${pref.notification_type}`);
                
                if (inAppCheckbox) {
                    inAppCheckbox.checked = pref.in_app_enabled;
                }
                if (emailCheckbox) {
                    emailCheckbox.checked = pref.email_enabled;
                }
            });

            console.log('Notification preferences loaded:', notificationPreferences);
        }
    } catch (error) {
        console.error('Error loading notification preferences:', error);
    }
}

/**
 * 一括設定
 */
function setAllNotifications(enabled, channel) {
    const checkboxes = document.querySelectorAll(`.notification-pref[data-channel="${channel}"]`);
    checkboxes.forEach(checkbox => {
        checkbox.checked = enabled;
    });
    
    showNotificationToast(enabled ? `${channel === 'in_app' ? 'アプリ内' : 'メール'}通知をすべてONにしました` : 
                                    `${channel === 'in_app' ? 'アプリ内' : 'メール'}通知をすべてOFFにしました`);
}

/**
 * すべての通知設定を保存
 */
async function saveAllNotificationSettings() {
    const token = localStorage.getItem('token');
    
    // デモモードチェック
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') {
        showNotificationToast('デモモードのため保存されません', 'info');
        return;
    }
    
    if (!token) {
        showNotificationToast('ログインが必要です', 'warning');
        return;
    }

    // すべてのチェックボックスの状態を収集
    const settings = {};
    document.querySelectorAll('.notification-pref').forEach(checkbox => {
        const type = checkbox.dataset.type;
        const channel = checkbox.dataset.channel;
        
        if (!settings[type]) {
            settings[type] = { in_app: true, email: false };
        }
        
        if (channel === 'in_app') {
            settings[type].in_app = checkbox.checked;
        } else if (channel === 'email') {
            settings[type].email = checkbox.checked;
        }
    });

    // 各タイプごとにAPIを呼び出し
    let successCount = 0;
    let errorCount = 0;

    for (const [type, prefs] of Object.entries(settings)) {
        if (type === 'marketing') continue; // マーケティングは別処理
        
        try {
            const response = await fetch(`${NOTIFICATION_API}/preferences`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    notification_type: type,
                    in_app_enabled: prefs.in_app,
                    email_enabled: prefs.email
                })
            });

            if (response.ok) {
                successCount++;
            } else {
                errorCount++;
            }
        } catch (error) {
            console.error(`Failed to save ${type} preferences:`, error);
            errorCount++;
        }
    }

    if (errorCount === 0) {
        showNotificationToast('通知設定を保存しました', 'success');
    } else if (successCount > 0) {
        showNotificationToast(`一部の設定を保存しました（${errorCount}件エラー）`, 'warning');
    } else {
        showNotificationToast('設定の保存に失敗しました', 'danger');
    }
}

/**
 * トースト通知を表示
 */
function showNotificationToast(message, type = 'success') {
    // 既存のアラートを削除
    document.querySelectorAll('.notification-toast-alert').forEach(el => el.remove());
    
    const iconMap = {
        success: 'check-circle',
        danger: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show notification-toast-alert`;
    alert.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 9999; min-width: 300px; animation: slideIn 0.3s ease;';
    alert.innerHTML = `
        <i class="fas fa-${iconMap[type] || 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alert);
    
    setTimeout(() => alert.remove(), 4000);
}

/**
 * 既存のsaveNotificationSettings関数を上書き
 * （account-settings.htmlの古い関数と互換性を保つ）
 */
window.saveNotificationSettings = saveAllNotificationSettings;

/**
 * 初期化
 */
document.addEventListener('DOMContentLoaded', function() {
    // 通知タブがクリックされた時に初期化
    const notificationsTab = document.querySelector('[data-tab="notifications"]');
    
    if (notificationsTab) {
        notificationsTab.addEventListener('click', function() {
            // 少し遅延させてパネルが表示されてから初期化
            setTimeout(() => {
                initNotificationSettingsPanel();
                loadNotificationPreferences();
            }, 100);
        });
    }
    
    // URLに#notificationsがある場合は自動で通知タブを開く
    if (window.location.hash === '#notifications') {
        setTimeout(() => {
            if (notificationsTab) {
                notificationsTab.click();
            }
        }, 500);
    }
});

// グローバル関数として公開
window.setAllNotifications = setAllNotifications;
window.saveAllNotificationSettings = saveAllNotificationSettings;
window.loadNotificationPreferences = loadNotificationPreferences;
