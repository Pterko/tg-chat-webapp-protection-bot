const API_URL = import.meta.env.VITE_API_URL;

export async function api<
  Response extends object,
  Request extends object = any,
>(
  path: string,
  { verificationId, body }: { verificationId: string; body: Request },
): Promise<Response> {
  const pathSuffix = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`/api/verifications/${verificationId}${pathSuffix}`, API_URL);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return await response.json();
}
