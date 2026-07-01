const BACKEND_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://tawheedreader.com';

window.BACKEND_URL = BACKEND_URL;

const API_BASE_URL = `${BACKEND_URL}/api`;

// Helper function for API calls
async function fetchApi(endpoint, options = {}) {
  const token = sessionStorage.getItem('token');
  
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type to JSON if it's not FormData (which is used for file uploads)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Unauthorized or forbidden, clear session and go to login
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('currentUser');
        if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
      }
      throw new Error((data && data.error) ? data.error : 'حدث خطأ في الاتصال بالخادم');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// Automatically update messages count badge if element exists
document.addEventListener("DOMContentLoaded", () => {
  const badge = document.getElementById("msgCount");
  if (badge) {
    async function updateMessagesCount() {
      try {
        const submissions = await fetchApi('/submissions');
        const myMessages = submissions.filter(sub => sub.rating && !sub.isRead);
        if (myMessages.length > 0) {
          badge.style.display = "inline-block";
          badge.textContent = myMessages.length;
        } else {
          badge.style.display = "none";
        }
      } catch (error) {}
    }
    
    updateMessagesCount();
    setInterval(updateMessagesCount, 5000);
  }
});
