document.addEventListener('DOMContentLoaded', async () => {

  if (!MunBuddyAPI.requireAuth('organizer', '../organizer-login.html')) return;

  try {
    const { conferences } = await MunBuddyAPI.request('/conferences/me', { auth: true });

    if (!conferences.length) {
      document.getElementById('bannerConferenceName').textContent = 'No conference yet';
      return;
    }

    const conference = conferences[0];
    document.getElementById('bannerConferenceName').textContent = conference.name;
    document.getElementById('bannerRegistrationStatus').textContent =
      conference.registration_status === 'open' ? 'Registration Open' : 'Registration Closed';

    const { stats } = await MunBuddyAPI.request(`/conferences/${conference.id}/stats`, { auth: true });
    document.getElementById('bannerDelegateCount').textContent = stats.totalDelegates;
    document.getElementById('bannerPendingCount').textContent = stats.pendingDelegates;
  } catch (err) {
    console.error('Failed to load dashboard data', err);
    document.getElementById('bannerConferenceName').textContent = 'Unable to load conference';
  }

});
