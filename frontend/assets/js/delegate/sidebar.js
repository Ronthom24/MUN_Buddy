const sidebar = document.querySelector('.sidebar-nav');
const sections = document.querySelectorAll('.content-section');
const navLinks = document.querySelectorAll('.sidebar-nav a');

if (sidebar && navLinks.length > 0 && sections.length > 0) {
  const updateActiveLink = () => {
    let currentSection = '';

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 180;
      if (window.scrollY >= sectionTop) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + currentSection) {
        link.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', updateActiveLink);
  window.addEventListener('load', updateActiveLink);
}
