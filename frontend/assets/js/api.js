const MUN_BUDDY_API_BASE = 'http://localhost:5000/api';

const MunBuddyAPI = {
  getToken() {
    return localStorage.getItem('mb_token');
  },

  setSession({ token, role }) {
    localStorage.setItem('mb_token', token);
    localStorage.setItem('mb_role', role);
  },

  clearSession() {
    localStorage.removeItem('mb_token');
    localStorage.removeItem('mb_role');
  },

  async request(path, { method = 'GET', body, auth = false } = {}) {
    const headers = { 'Content-Type': 'application/json' };

    if (auth) {
      const token = this.getToken();
      if (!token) throw new Error('Not authenticated');
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${MUN_BUDDY_API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new Error((data && data.message) || `Request failed (${res.status})`);
      error.details = data && data.details;
      throw error;
    }

    return data;
  },

  requireAuth(role, loginUrl) {
    const token = this.getToken();
    const storedRole = localStorage.getItem('mb_role');

    if (!token || storedRole !== role) {
      window.location.href = loginUrl;
      return false;
    }

    return true;
  }
};
