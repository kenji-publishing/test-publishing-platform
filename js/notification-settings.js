/**
 * Notification Settings Manager
 * Phase 9D: 通知設定ページの強化
 * 
 * account-settings.htmlの通知設定を管理
 */

// API Base URL
const NOTIFICATION_API = 'http://localhost:3000/api/notifications';

// 通知タイプの定義
const NOTIFICATION_TYPES = [
    { type: 'sale', label: '💰 売上通知', description: '作品が購入されたとき' },
    { type: 'translation_complete', label: '🌐 翻訳完了通知', description: '依頼した翻訳が完了したとき' },
    { type: 'comment', label: '💬 コメント通知', description: 'あなたの作品にコメントがあったとき' },
    { type: 'feedback', label: '⭐ フィードバック通知', description: '読者からの評価やフィードバック' },
    { type: 'ticket_reply', label: '🎧 サポート通知', description: '問い合わせへの返信があったとき' },
    { type: 'system', label: '🔔 システム通知', description: 'メンテナンスや重要なお知らせ' }
];

// 設定の状態を保持
let notificationPreferences = {};

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
                    <h3 style="color: white; margin-bottom: 0.5rem;"><i class="fas fa-bell"></i> 通知センター</h3>
                    <p style="margin: 0; opacity: 0.9;">未読の通知を確認・管理できます</p>
                </div>
                <a href="notifications.html" class="btn btn-light">
                    <i class="fas fa-external-link-alt me-1"></i> 開く
                </a>
            </div>
        </div>

        <!-- In-App Notifications -->
        <div class="settings-card">
            <h3><i class="fas fa-mobile-alt"></i> アプリ内通知</h3>
            <p class="text-muted mb-3">通知センターに表示される通知の設定です</p>
            <div id="inAppNotificationsList"></div>
        </div>
        
        <!-- Email Notifications -->
        <div class="settings-card">
            <h3><i class="fas fa-envelope"></i> メール通知</h3>
            <p class="text-muted mb-3">メールで受け取る通知の設定です</p>
            <div id="emailNotificationsList"></div>
        </div>
        
        <!-- Quick Actions -->
        <div class="settings-card">
            <h3><i class="fas fa-sliders-h"></i> 一括設定</h3>
            <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-outline-secondary btn-sm" onclick="setAllNotifications(true, 'in_app')">
                    <i class="fas fa-check-double me-1"></i> アプリ内すべてON
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="setAllNotifications(false, 'in_app')">
                    <i class="fas fa-times me-1"></i> アプリ内すべてOFF
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="setAllNotifications(true, 'email')">
                    <i class="fas fa-envelope me-1"></i> メールすべてON
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="setAllNotifications(false, 'email')">
                    <i class="fas fa-envelope-open me-1"></i> メールすべてOFF
                </button>
            </div>
        </div>
        
        <button class="btn btn-primary-custom" onclick="saveAllNotificationSettings()">
            <i class="fas fa-save me-1"></i> 設定を保存
        </button>
        
        <p class="text-muted mt-3 small">
            <i class="fas fa-info-circle me-1"></i>
            通知設定は保存後に反映されます。重要なシステム通知は設定に関わらず送信される場合があります。
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
                <h4>${notif.label}</h4>
                <p>${notif.description}</p>
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
                <h4>${notif.label}</h4>
                <p>${notif.description}</p>
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
                <h4>📣 マーケティングメール</h4>
                <p>新機能やキャンペーンのお知らせ</p>
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
