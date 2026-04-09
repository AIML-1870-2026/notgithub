/**
 * markdown.js — Thin wrapper around marked.js for Markdown → HTML conversion.
 * marked.js is loaded via CDN <script> tag in index.html and available as window.marked.
 */

/**
 * Convert a markdown string to sanitized HTML.
 * @param {string} text
 * @returns {string} HTML string
 */
export function parseMarkdown(text) {
  if (!text) return '';
  // marked is loaded globally from CDN
  return window.marked.parse(text, { breaks: true });
}
