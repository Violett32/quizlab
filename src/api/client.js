// Обёртка над fetch: подкладывает токен, сериализует JSON, парсит ответ,
// кидает ошибку при не-2xx статусе.

const TOKEN_KEY = 'quizlab_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) };

  // Если в опциях передали body как объект — сериализуем в JSON.
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  // Подкладываем токен, если он есть.
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers, body });

  // Пытаемся прочитать тело — оно может быть JSON-ом с ошибкой или с данными.
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.error || `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}
