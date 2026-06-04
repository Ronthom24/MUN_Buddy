document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-url]').forEach((item) => {
    item.addEventListener('click', () => {
      const url = item.dataset.url;
      if (url) {
        window.location.href = url;
      }
    });
  });

  document.querySelectorAll('form[data-auth-redirect]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const redirect = form.dataset.authRedirect;
      if (redirect) {
        window.location.href = redirect;
      }
    });
  });
});

document.querySelectorAll('.role-card').forEach(card => {

  card.addEventListener('click', () => {

    const url = card.dataset.url;

    if(url){

      window.location.href = url;

    }

  });

});