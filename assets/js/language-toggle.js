
// Function to toggle the language manually
function toggleLanguage() {
    const currentLang = document.documentElement.lang;
    const newLang = currentLang === 'en' ? 'pt' : 'en';
    document.documentElement.lang = newLang;
    updateContent();
}

// Function to update the content based on the current language
function updateContent() {
    const currentLang = document.documentElement.lang;
    const elements = document.querySelectorAll('[data-' + currentLang + ']');
    elements.forEach(element => {
        if (element.hasAttribute('placeholder')) {
            element.placeholder = element.getAttribute('data-' + currentLang);
        } else {
            element.textContent = element.getAttribute('data-' + currentLang);
        }
    });
}

// Automatically set the language based on the user's browser settings
document.addEventListener("DOMContentLoaded", function() {
    const userLang = navigator.language || navigator.userLanguage;
    let lang;
    if (userLang.startsWith('en')) {
        lang = 'en';
    } else if (userLang.startsWith('pt')) {
        lang = 'pt';
    } else {
        lang = 'pt'; // default language
    }
    document.documentElement.lang = lang;
    updateContent();
});