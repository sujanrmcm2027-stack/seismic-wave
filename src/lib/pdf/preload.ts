/**
 * Warms the jsPDF chunk ahead of time. Some browsers (notably Safari) only
 * allow a file download to proceed if it happens close to the originating
 * click; if the click handler has to `await import("jspdf")` cold, the
 * download can silently get blocked as no longer "user-initiated". Calling
 * this on mount means the chunk is already cached by the time the user clicks.
 */
export function preloadJsPdf() {
  void import("jspdf");
}
