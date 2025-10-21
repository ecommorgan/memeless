
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const response = document.getElementById('contactResponse');
  const fadeIns = document.querySelectorAll('.fade-in');

  // Contact form behavior
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.reset();
    response.textContent = 'Thank you for contacting us. We will get back to you soon!';
    response.style.opacity = '1';
    setTimeout(() => { response.style.opacity = '0'; }, 4000);
  });

  // Scroll animation
  const revealOnScroll = () => {
    fadeIns.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 100) {
        el.classList.add('visible');
      }
    });
  };
  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll();
});
