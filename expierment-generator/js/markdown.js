/**
 * markdown.js — Thin wrapper around marked.js (loaded via CDN script tag).
 */

/**
 * Convert a markdown string to HTML.
 * @param {string} text
 * @returns {string}
 */
export function parseMarkdown(text) {
  if (!text) return '';
  return window.marked.parse(text, { breaks: true });
}
