import { apiUrl } from "./api";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  return document.cookie.split("; ").find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

export function withCsrfHeader(headers: Headers, method?: string) {
  if (!method || !unsafeMethods.has(method.toUpperCase())) return headers;
  const token = readCookie("school_csrf");
  if (token) headers.set("x-csrf-token", token);
  return headers;
}

export { apiUrl };
