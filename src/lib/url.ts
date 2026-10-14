/** Ensures a user-entered website value is an absolute URL the browser will
 * navigate to externally, instead of treating it as a relative path (e.g.
 * "www.sirket.com" without a scheme would otherwise resolve under the
 * current page's own origin). */
export function withHttpProtocol(url: string): string {
  if (!url) return url;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
