const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.log('====================================');
    console.log('Error data:', data);
    console.log('====================================');
    const message =
      (data && (data.message || data.error)) ||
      `Request failed with status ${res.status}`;

      if(data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0].message);
      } 
        throw new Error(message);

  }

  return data as T;
}

