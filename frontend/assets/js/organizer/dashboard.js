document.addEventListener('DOMContentLoaded', () => {

  console.log('MUN Buddy Organizer Dashboard Loaded');

  const statCards = document.querySelectorAll('.stat-card');

  statCards.forEach(card => {

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-4px)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
    });

  });

});