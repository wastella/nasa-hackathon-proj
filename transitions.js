let isTransitioning = false;

document.addEventListener('DOMContentLoaded', () => {
    const content = document.querySelector('.page-transition');
    
    // Fade in the content when the page loads
    setTimeout(() => {
        content.classList.add('visible');
    }, 50);

    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && !link.href.startsWith('http') && !link.href.startsWith('#') && !isTransitioning) {
            e.preventDefault();
            isTransitioning = true;
            content.classList.remove('visible');
            setTimeout(() => {
                window.location = link.href;
            }, 300); // Match this to your transition duration
        }
    });
});

// Handle browser back/forward navigation
window.addEventListener('pageshow', (event) => {
    const content = document.querySelector('.page-transition');
    if (event.persisted) {
        content.classList.remove('visible');
        setTimeout(() => {
            content.classList.add('visible');
        }, 50);
    } else {
        // For fresh page loads
        content.classList.remove('visible');
        setTimeout(() => {
            content.classList.add('visible');
        }, 50);
    }
    isTransitioning = false;
});