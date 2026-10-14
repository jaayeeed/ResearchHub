import axios from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const API_ORIGIN = API_URL.replace(/\/api$/, '');
const TOKEN_KEY = 'rh_token';

export const tokenStore = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set: (t) => {
    try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage unavailable */ }
  },
  clear: () => {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
  },
};

/** Turns a server-relative path (e.g. avatar URL) into an absolute URL. */
export const assetUrl = (path) => (path ? (path.startsWith('http') ? path : `${API_ORIGIN}${path}`) : null);

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    if (status === 401 && !url.startsWith('/auth/login') && !url.startsWith('/auth/register')) {
      onUnauthorized(error.response?.data?.message);
    }
    return Promise.reject(error);
  }
);

/** Human-readable message from any API error. */
export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  if (err?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (!err?.response) return 'Cannot reach the server. Check your connection.';
  return err.response.data?.message || fallback;
};

/** Field-level errors -> { field: message } */
export const fieldErrors = (err) =>
  (err?.response?.data?.errors || []).reduce((acc, e) => ({ ...acc, [e.field]: e.message }), {});

// ---------- Endpoints ----------
export const AuthAPI = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  changePassword: (data) => api.patch('/auth/password', data).then((r) => r.data),
};

export const ProfileAPI = {
  get: () => api.get('/profile').then((r) => r.data),
  update: (data) => api.put('/profile', data).then((r) => r.data),
  uploadAvatar: (file, onProgress) => {
    const form = new FormData();
    form.append('avatar', file);
    return api
      .put('/profile/avatar', form, {
        onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
      })
      .then((r) => r.data);
  },
  removeAvatar: () => api.delete('/profile/avatar').then((r) => r.data),
};




export default api;
