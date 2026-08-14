/** True when the web bundle runs inside a Chrome extension page (side panel, popup, etc.). */
export function isChromeExtension(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.location.protocol === 'chrome-extension:'
  );
}
