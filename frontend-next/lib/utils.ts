import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Opens a blob in a new tab. Pass the return value of `window.open("", "_blank")`
 * called *synchronously* inside the click handler, before any `await` -- calling
 * `window.open` after an await is no longer tied to the user gesture, so most
 * browsers' popup blockers silently kill it (no error, nothing happens). If no
 * target is passed, falls back to opening fresh (fine for a non-async caller).
 */
export function openBlob(blob: Blob, target?: Window | null) {
  const url = URL.createObjectURL(blob)
  if (target) {
    target.location.href = url
  } else {
    window.open(url, "_blank", "noopener,noreferrer")
  }
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}
