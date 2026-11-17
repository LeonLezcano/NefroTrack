/**
 * Sanitizer.js — Blindaje estricto contra Cross-Site Scripting (XSS) y Sanitización de Sinks
 * AiAppFactory Security Guardian Standard (Engine #255 / #305)
 * Zero-Sink DOM Armor using native DOMParser and replaceChildren.
 */

export class Sanitizer {
  /**
   * Escapa caracteres especiales HTML para prevenir inyección en contenido textual
   * @param {unknown} str
   * @returns {string}
   */
  static escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Sanitiza URLs para evitar esquemas peligrosos como javascript:, data:, vbscript:
   * @param {string} url
   * @returns {string}
   */
  static sanitizeURL(url) {
    if (!url || typeof url !== 'string') return '#';
    const trimmed = url.trim().toLowerCase();
    if (
      trimmed.startsWith('javascript:') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('vbscript:') ||
      trimmed.startsWith('file:')
    ) {
      return '#blocked-dangerous-scheme';
    }
    return url;
  }

  /**
   * Sanitiza un número asegurando que sea un valor finito
   * @param {*} val
   * @param {number} fallback
   * @returns {number}
   */
  static sanitizeNumber(val, fallback = 0) {
    const num = Number(val);
    return Number.isFinite(num) ? num : fallback;
  }

  /**
   * Sanitiza código HTML hacia un DocumentFragment seguro mediante DOMParser
   * @param {string} dirtyHtml
   * @returns {DocumentFragment|null}
   */
  static sanitizeToFragment(dirtyHtml) {
    if (typeof DOMParser === 'undefined' || typeof document === 'undefined') {
      return null;
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(dirtyHtml, 'text/html');
    const fragment = document.createDocumentFragment();

    const allowedTags = new Set([
      'DIV', 'SPAN', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
      'UL', 'OL', 'LI', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
      'STRONG', 'B', 'EM', 'I', 'U', 'SMALL', 'BADGE', 'BUTTON', 'A', 'IMG',
      'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'NAV', 'MAIN',
      'LABEL', 'INPUT', 'SELECT', 'OPTION', 'TEXTAREA', 'FORM',
      'SVG', 'PATH', 'CIRCLE', 'RECT', 'LINE', 'POLYLINE', 'POLYGON', 'G'
    ]);

    const allowedAttrs = new Set([
      'class', 'id', 'name', 'type', 'value', 'placeholder', 'data-id',
      'data-action', 'data-tab', 'data-qr', 'data-code', 'data-patient', 'data-session',
      'disabled', 'checked', 'selected', 'rows', 'cols', 'href', 'title',
      'aria-label', 'aria-hidden', 'aria-selected', 'aria-controls', 'aria-disabled', 'aria-labelledby',
      'role', 'tabindex', 'for', 'd', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
      'viewbox', 'xmlns', 'width', 'height', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'points',
      'src', 'alt', 'target', 'rel', 'step', 'max', 'min', 'style'
    ]);

    function cleanNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return document.createTextNode(node.textContent || '');
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
      }

      const tagName = node.tagName.toUpperCase();
      if (!allowedTags.has(tagName)) {
        return null;
      }

      const cleanEl = document.createElement(tagName.toLowerCase());

      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        const attrName = attr.name.toLowerCase();

        if (attrName.startsWith('on') || attrName === 'formaction') continue;
        if ((attrName === 'href' || attrName === 'src') && attr.value.trim().toLowerCase().startsWith('javascript:')) continue;

        if (allowedAttrs.has(attrName) || attrName.startsWith('data-')) {
          cleanEl.setAttribute(attrName, attr.value);
        }
      }

      let child = node.firstChild;
      while (child) {
        const cleanedChild = cleanNode(child);
        if (cleanedChild) {
          cleanEl.appendChild(cleanedChild);
        }
        child = child.nextSibling;
      }

      return cleanEl;
    }

    let rootChild = doc.body.firstChild;
    while (rootChild) {
      const cleaned = cleanNode(rootChild);
      if (cleaned) {
        fragment.appendChild(cleaned);
      }
      rootChild = rootChild.nextSibling;
    }

    return fragment;
  }

  /**
   * Sanitiza fragmento a string seguro
   * @param {string} html
   * @returns {string}
   */
  static sanitizeFragment(html) {
    const raw = String(html || '');
    return raw
      .replace(/<\s*\/?\s*(script|iframe|object|embed|applet|meta|base|link|style)\b[^>]*>/gi, '')
      .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\s+(href|src)\s*=\s*(?:"\s*(?:javascript|vbscript):[^"]*"|'\s*(?:javascript|vbscript):[^']*')/gi, ' $1="#"');
  }

  /**
   * Asignación segura a elemento DOM sin exponer innerHTML (Zero-Sink)
   * @param {HTMLElement|object} target
   * @param {string} html
   */
  static safeSetInnerHTML(target, html) {
    if (!target) return;
    const fragment = Sanitizer.sanitizeToFragment(html);
    if (fragment && typeof target.replaceChildren === 'function') {
      target.replaceChildren(fragment);
      return;
    }
    const text = Sanitizer.escapeHTML(html);
    if (typeof document !== 'undefined' && typeof target.replaceChildren === 'function') {
      const textNode = document.createTextNode(text);
      target.replaceChildren(textNode);
      return;
    }
    if (typeof target.replaceChildren === 'function') {
      target.replaceChildren(text);
      return;
    }
    if (typeof target === 'object') {
      target.textContent = text;
    }
  }
}
