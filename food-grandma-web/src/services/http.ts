export async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`連線失敗（${res.status}），請稍後重試。`);
  }
  return res.json();
}

export function apiGet<T>(
  path: string,
  accessToken?: string | null,
): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (accessToken) url.searchParams.set("access_token", accessToken);
  return fetch(url.toString()).then((res) => unwrap<T>(res));
}

function sendForm<T>(
  method: "POST" | "PUT" | "PATCH",
  path: string,
  data: Record<string, string>,
): Promise<T> {
  const form = new FormData();
  for (const [key, value] of Object.entries(data)) form.append(key, value);
  return fetch(path, { method, body: form }).then((res) => unwrap<T>(res));
}

export function apiPostForm<T>(
  path: string,
  data: Record<string, string>,
): Promise<T> {
  return sendForm("POST", path, data);
}

export function apiPutForm<T>(
  path: string,
  data: Record<string, string>,
): Promise<T> {
  return sendForm("PUT", path, data);
}

export function apiPatchForm<T>(
  path: string,
  data: Record<string, string>,
): Promise<T> {
  return sendForm("PATCH", path, data);
}
