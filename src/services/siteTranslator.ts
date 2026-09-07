/**
 * siteTranslator
 * ---------------------------------------------------------------------------
 * DOM-safe, in-app page translator powering the site's language selector.
 *
 * WHY THIS IS SAFE FOR A LIVE REACT APP
 *   React must own its DOM. The previous Google-Translate widget rewrote the
 *   DOM structurally (wrapping text nodes in <font>, moving nodes), so the next
 *   React commit threw "NotFoundError: The object can not be found here" and
 *   the whole UI dead-ended.
 *
 *   This engine NEVER restructures the DOM. It only changes the `.nodeValue` of
 *   existing #text nodes, which React tolerates: on the next re-render React
 *   resets that text back to English, our MutationObserver notices (characterData)
 *   and re-applies the cached translation. No node is created, removed or moved,
 *   so the structural crash class is eliminated entirely.
 *
 *   Numeric/live content (prices, %, timestamps) is never sent for translation,
 *   and <code>/<pre>/[translate=no]/notranslate subtrees are skipped.
 *
 * UX
 *   Choosing a language persists `axi_language` and reloads once (clean English
 *   source -> translate). The stored language is applied automatically on load.
 *   Choosing English reloads back to the pristine English UI.
 */
import { reportFrontendError } from '../utils/reportFrontendError';

export const LANGUAGE_CODES: Record<string, string> = {
  'English (Global)': '',
  'العربية': 'ar',
  '中文': 'zh-CN',
  'Español': 'es',
  'Français': 'fr',
  'Bahasa Indonesia': 'id',
  'Italiano': 'it',
  '日本語': 'ja',
  '한국어': 'ko',
  'Português': 'pt',
  'ภาษาไทย': 'th',
  'Tiếng Việt': 'vi',
};

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'KBD', 'SAMP', 'TEXTAREA', 'SVG', 'MATH', 'SELECT', 'OPTION', 'IFRAME', 'CANVAS']);
const LETTER_RE = /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0600-\u06FF\u0750-\u077F\u0900-\u0DFF\u0E00-\u0E7F\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF\u4E00-\u9FFF]/;

let enabled = false;
let currentCode = '';
let observer: MutationObserver | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let retryCount = 0;
const cache = new Map<string, string>(); // `${code}\u0001${core}` -> translated
const pending = new Set<Text>();

function codeForName(name: string): string {
  return LANGUAGE_CODES[name] || '';
}
function storedName(): string {
  try { return localStorage.getItem('axi_language') || 'English (Global)'; } catch { return 'English (Global)'; }
}
function isEnabled(): boolean { return enabled; }

function looksSkippable(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent || !node.isConnected) return true;
  let cur: HTMLElement | null = parent;
  while (cur && cur !== document.body) {
    if (SKIP_TAGS.has(cur.tagName)) return true;
    if (cur.getAttribute && (cur.getAttribute('translate') === 'no' || cur.hasAttribute('data-no-translate'))) return true;
    if (cur.classList && cur.classList.contains('notranslate')) return true;
    cur = cur.parentElement;
  }
  const core = (node.nodeValue || '').replace(/\s+/g, ' ').trim();
  if (core.length < 2 || core.length > 400) return true;
  if (!LETTER_RE.test(core)) return true; // pure numbers/symbols stay untouched
  return false;
}

function coreOf(node: Text): string { return (node.nodeValue || '').replace(/\s+/g, ' ').trim(); }

function collectCandidates(): Text[] {
  const nodes: Text[] = [];
  if (!document.body) return nodes;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n: Node | null = walker.nextNode();
  while (n) { nodes.push(n as Text); n = walker.nextNode(); }
  return nodes.filter((t) => !looksSkippable(t));
}

function queueFlush(ms = 220) {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    await flush();
  }, ms);
}

async function flush() {
  if (!enabled || !pending.size) return;
  const batch: Text[] = [];
  for (const n of pending) {
    if (batch.length >= 25) break;
    batch.push(n);
  }
  if (!batch.length) return;
  const map = new Map<string, Text[]>();
  for (const n of batch) {
    if (looksSkippable(n)) continue;
    const core = coreOf(n);
    if (map.has(core)) map.get(core)!.push(n);
    else map.set(core, [n]);
  }
  const unique = [...map.keys()];
  const toFetch = unique.filter((u) => !cache.has(`${currentCode}\u0001${u}`));
  let fetched = new Map<string, string>();
  if (toFetch.length) {
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: toFetch, to: currentCode }),
      });
      const data = await res.json();
      if (!res.ok || data?.success !== true || !Array.isArray(data.translated)) {
        throw new Error('translate endpoint rejected');
      }
      retryCount = 0;
      data.translated.forEach((tr: string, i: number) => {
        const src = toFetch[i];
        if (tr && tr.trim() && tr.trim() !== src) {
          const safe = tr.trim();
          fetched.set(src, safe);
          cache.set(`${currentCode}\u0001${src}`, safe);
        }
      });
      // Success: remove the processed nodes from the pending queue.
      for (const n of batch) pending.delete(n);
    } catch (e) {
      console.error('[siteTranslator] batch failed', e);
      reportFrontendError(e instanceof Error ? e : new Error(String(e)));
      retryCount++;
      if (retryCount < 4) queueFlush(1600); // keep nodes queued; retry shortly
      else retryCount = 0;
      return;
    }
  } else {
    // All cached: drop these from the queue now.
    for (const n of batch) pending.delete(n);
  }
  // apply
  for (const core of unique) {
    const tr = cache.get(`${currentCode}\u0001${core}`) || fetched.get(core);
    if (!tr) continue;
    for (const node of map.get(core) || []) {
      if (!node.isConnected) continue;
      const raw = node.nodeValue || '';
      const trimmed = raw.trim();
      if (!trimmed || trimmed === tr) continue;
      const pre = raw.slice(0, raw.length - raw.trimStart().length);
      const post = raw.slice(raw.trimEnd().length);
      try { node.nodeValue = pre + tr + post; } catch { /* detached */ }
    }
  }
  // Drain the queue: translations stream in batches so large views fully translate.
  if (pending.size) queueFlush(240);
}

function startEngine(code: string) {
  enabled = true;
  currentCode = code;
  // translate everything currently on screen
  const candidates = collectCandidates();
  candidates.forEach((n) => pending.add(n));
  queueFlush(60);
  // watch for React adding/updating content
  observer = new MutationObserver((muts) => {
    if (!enabled) return;
    let changed = false;
    for (const m of muts) {
      if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
        const t = m.target as Text;
        if (looksSkippable(t)) continue;
        const core = coreOf(t);
        if (core && core !== cache.get(`${currentCode}\u0001${core}`)) { pending.add(t); changed = true; }
      } else if (m.type === 'childList') {
        for (const added of m.addedNodes) {
          if (added.nodeType === Node.TEXT_NODE) {
            if (!looksSkippable(added as Text)) { pending.add(added as Text); changed = true; }
          } else if (added.nodeType === Node.ELEMENT_NODE) {
            const w = document.createTreeWalker(added, NodeFilter.SHOW_TEXT);
            let n: Node | null = w.nextNode();
            while (n) { if (!looksSkippable(n as Text)) { pending.add(n as Text); changed = true; } n = w.nextNode(); }
          }
        }
      }
    }
    if (changed) queueFlush(180);
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

function stopEngine() {
  enabled = false;
  currentCode = '';
  pending.clear();
  if (observer) { observer.disconnect(); observer = null; }
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
}

/** Apply the persisted language (no reload). Called once after the app mounts. */
export function applyStoredLanguage(): void {
  if (typeof window === 'undefined' || !document.body) return;
  try {
    const code = codeForName(storedName());
    if (code) startEngine(code);
  } catch (e) {
    console.error('[siteTranslator] apply failed', e);
  }
}

/** User picked a language in the selector. Reload is intentional & safest:
 *  fresh English DOM -> translated deterministically. English clears it. */
export function chooseLanguage(name: string): void {
  try { localStorage.setItem('axi_language', name); } catch { /* ignore */ }
  const code = codeForName(name);
  const active = enabled ? currentCode : '';
  if (!code && !active) return;
  if (code === active) return;
  window.location.reload();
}

export function currentLanguage(): string { return enabled ? currentCode : ''; }
export function isTranslationEnabled(): boolean { return enabled; }
