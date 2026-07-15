const PORTFOLIO_TYPE_LABELS = {
  country: 'Country Delegate',
  position: 'Named Position',
  observer: 'Observer'
};

document.addEventListener('DOMContentLoaded', async () => {

  if (!MunBuddyAPI.requireAuth('delegate', '../delegate-login.html')) return;

  try {
    const profile = await MunBuddyAPI.request('/delegates/me', { auth: true });

    document.getElementById('bannerConferenceName').textContent =
      profile.conference ? profile.conference.name : 'Not linked to a conference';

    if (profile.assignment && profile.assignment.published) {
      document.getElementById('pendingNotice').style.display = 'none';
      document.getElementById('bannerCommittee').textContent = profile.assignment.committee || '—';
      document.getElementById('bannerCountry').textContent = profile.assignment.portfolio || '—';
      document.getElementById('bannerPortfolio').textContent =
        PORTFOLIO_TYPE_LABELS[profile.assignment.portfolioType] || '—';
    } else {
      document.getElementById('pendingNotice').style.display = 'block';
      document.getElementById('bannerCommittee').textContent = 'Pending';
      document.getElementById('bannerCountry').textContent = 'Pending';
      document.getElementById('bannerPortfolio').textContent = 'Pending';
    }
  } catch (err) {
    console.error('Failed to load delegate profile', err);
    document.getElementById('bannerConferenceName').textContent = 'Unable to load profile';
  }

});
