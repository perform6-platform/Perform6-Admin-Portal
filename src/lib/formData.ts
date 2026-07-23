/** Build a FormData body from a plain object, skipping null/undefined values. */
export function toFormData(fields: Record<string, string | number | boolean | File | undefined | null>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    if (value instanceof File) {
      form.append(key, value);
    } else {
      form.append(key, String(value));
    }
  }
  return form;
}

export const MULTIPART_HEADERS = { 'Content-Type': 'multipart/form-data' } as const;
