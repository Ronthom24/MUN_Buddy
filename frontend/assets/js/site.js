// Homepage behavior: smooth anchor scrolling, navbar shrink, newsletter subscribe feedback

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (!navbar) {
    return;
  }
  navbar.style.padding = window.scrollY > 60 ? '.4rem 0' : '.75rem 0';
});

const subscribeButton = document.querySelector('.btn-subscribe');
if (subscribeButton) {
  subscribeButton.addEventListener('click', function () {
    const input = this.previousElementSibling;
    if (input && input.value && input.value.includes('@')) {
      this.textContent = '✓ Subscribed!';
      this.style.background = '#27ae60';
      input.value = '';
      setTimeout(() => {
        this.textContent = 'Subscribe';
        this.style.background = '';
      }, 3000);
    } else if (input) {
      input.style.borderColor = 'var(--accent-red)';
      setTimeout(() => {
        input.style.borderColor = '';
      }, 1500);
    }
  });
}
