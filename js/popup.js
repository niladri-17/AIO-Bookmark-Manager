document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');

    if (themeToggle) {
        const themes = {
            light: '☀️', // ☀️
            dark: '🌙',  // 🌙
        };

        // Load theme from localStorage
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.body.classList.add(currentTheme + '-mode');
        themeToggle.innerHTML = themes[currentTheme];

        // Theme toggle button
        themeToggle.addEventListener('click', function() {
            const currentMode = document.body.classList.contains('light-mode') ? 'light' : 'dark';
            const newTheme = currentMode === 'light' ? 'dark' : 'light';
            document.body.classList.toggle('light-mode', newTheme === 'light');
            document.body.classList.toggle('dark-mode', newTheme === 'dark');
            themeToggle.innerHTML = themes[newTheme];
            localStorage.setItem('theme', newTheme);
        });
    }
});
