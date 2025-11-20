// Language Switcher with 6 languages support
let currentLanguage = localStorage.getItem('preferredLanguage') || 'en';

// Initialize language on page load
document.addEventListener('DOMContentLoaded', function() {
    loadLanguage(currentLanguage);
    updateLanguageDisplay();
    
    // Add event listeners to language options
    document.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            const lang = this.getAttribute('data-lang');
            changeLanguage(lang);
        });
    });
});

function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang);
    loadLanguage(lang);
    updateLanguageDisplay();
}

function updateLanguageDisplay() {
    const langDisplay = document.getElementById('currentLang');
    if (langDisplay) {
        langDisplay.textContent = currentLanguage.toUpperCase();
    }
}

function loadLanguage(lang) {
    if (typeof translations === 'undefined') {
        console.error('Translations not loaded');
        return;
    }
    
    const langData = translations[lang] || translations['en'];
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const keys = key.split('.');
        let value = langData;
        
        for (let k of keys) {
            value = value[k];
            if (!value) break;
        }
        
        if (value) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = value;
            } else {
                element.textContent = value;
            }
        }
    });
    
    // Update document language
    document.documentElement.lang = lang;
}