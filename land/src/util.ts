import { getAuthHeaders } from "./stores/UserStore";

export default async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, {
    ...init,
    headers: getAuthHeaders(),
  });
  return res.json();
}
