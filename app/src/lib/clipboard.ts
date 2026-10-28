/**
 * Resolves false instead of throwing when the clipboard is unavailable — an
 * insecure origin (a phone hitting the dev server over wifi), a denied
 * permission, or a document without focus — so callers can fall back.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
