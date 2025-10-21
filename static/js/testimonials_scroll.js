
document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('.scroll-container');
    containers.forEach(container => {
        container.addEventListener('mouseenter', () => {
            container.querySelector('.testimonial-row').style.animationPlayState = 'paused';
        });
        container.addEventListener('mouseleave', () => {
            container.querySelector('.testimonial-row').style.animationPlayState = 'running';
        });
    });
});
