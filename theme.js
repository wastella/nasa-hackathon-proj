document.addEventListener('DOMContentLoaded', (event) => {
    const toggleButton = document.querySelector('#theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';

    document.documentElement.setAttribute('data-theme', currentTheme);

    function switchTheme() {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        
        document.body.classList.add('theme-transition');
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 300);
    }

    toggleButton.addEventListener('click', switchTheme);
});