document.addEventListener('DOMContentLoaded', () => {

  const currentPage =
    window.location.pathname.split('/').pop();

  const sidebarLinks =
    document.querySelectorAll('.organizer-sidebar a');

  sidebarLinks.forEach(link => {

    const href = link.getAttribute('href');

    if (href === currentPage) {
      link.classList.add('active');
    }

  });

});