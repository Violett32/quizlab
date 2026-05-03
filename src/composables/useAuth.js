import { ref, computed } from 'vue';
import { apiFetch, setToken, clearToken, getToken } from '@/api/client.js';

// Состояние на уровне модуля — оно одно на всё приложение.
// Все компоненты, которые вызовут useAuth(), увидят один и тот же user.
const user = ref(null);

export function useAuth() {
  const isAuthenticated = computed(() => user.value !== null);

  async function register(payload) {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: payload,
    });
    setToken(data.token);
    user.value = data.user;
    return data.user;
  }

  async function login({ email, password }) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setToken(data.token);
    user.value = data.user;
    return data.user;
  }

  function logout() {
    clearToken();
    user.value = null;
  }

  // FileReader → base64 без префикса "data:...;base64,".
  function readAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const str = reader.result || '';
        const comma = str.indexOf(',');
        resolve(comma >= 0 ? str.slice(comma + 1) : str);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  // Загружает фото профиля. Бэк отвечает готовым data URL — кладём прямо в user.avatar.
  async function uploadAvatar(file) {
    const base64 = await readAsBase64(file);
    const data = await apiFetch('/api/auth/avatar', {
      method: 'POST',
      body: { base64, mime: file.type || 'application/octet-stream' },
    });
    if (user.value) user.value = { ...user.value, avatar: data.avatar };
    return data.avatar;
  }

  // Восстановление сессии при перезагрузке страницы.
  // Если user уже загружен — ничего не делаем.
  // Если токен в localStorage есть — спрашиваем у бэка, кто мы.
  async function loadCurrentUser() {
    if (user.value) return user.value;
    if (!getToken()) return null;
    try {
      const data = await apiFetch('/api/auth/me');
      user.value = data.user;
      return data.user;
    } catch (err) {
      // токен протух или невалидный — чистим и продолжаем как гость
      clearToken();
      user.value = null;
      return null;
    }
  }

  return { user, isAuthenticated, register, login, logout, loadCurrentUser, uploadAvatar };
}
