/**
 * Simple markdown-to-HTML converter for help articles.
 * Handles: headings, bold, italic, links, lists (ul/ol), code, blockquotes, paragraphs, horizontal rules.
 */
export function markdownToHtml(md: string): string {
  if (!md) return '';

  // Previously returned raw HTML as-is — removed for XSS safety.
  // All content now goes through the markdown parser.

  let html = md;

  // Escape HTML entities (but preserve existing HTML if mixed)
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Process lists and paragraphs
  const lines = html.split('\n');
  const result: string[] = [];
  let inUl = false;
  let inOl = false;
  let inIndentedUl = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ulMatch = line.match(/^- (.+)$/);
    const indentedUlMatch = line.match(/^  - (.+)$/);
    const olMatch = line.match(/^(\d+)\. (.+)$/);

    if (indentedUlMatch) {
      if (!inIndentedUl) {
        inIndentedUl = true;
        result.push('<ul class="ml-4">');
      }
      result.push(`<li>${indentedUlMatch[1]}</li>`);
    } else if (ulMatch) {
      if (inIndentedUl) {
        inIndentedUl = false;
        result.push('</ul>');
      }
      if (!inUl) {
        if (inOl) { inOl = false; result.push('</ol>'); }
        inUl = true;
        result.push('<ul>');
      }
      result.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (inIndentedUl) {
        inIndentedUl = false;
        result.push('</ul>');
      }
      if (!inOl) {
        if (inUl) { inUl = false; result.push('</ul>'); }
        inOl = true;
        result.push('<ol>');
      }
      result.push(`<li>${olMatch[2]}</li>`);
    } else {
      if (inIndentedUl) { inIndentedUl = false; result.push('</ul>'); }
      if (inUl) { inUl = false; result.push('</ul>'); }
      if (inOl) { inOl = false; result.push('</ol>'); }

      const trimmed = line.trim();
      // Skip empty lines, or lines that are already block-level HTML
      if (trimmed === '') {
        result.push('');
      } else if (/^<(h[1-6]|ul|ol|li|pre|blockquote|hr|div|table)/.test(trimmed)) {
        result.push(line);
      } else {
        result.push(`<p>${trimmed}</p>`);
      }
    }
  }

  if (inIndentedUl) result.push('</ul>');
  if (inUl) result.push('</ul>');
  if (inOl) result.push('</ol>');

  // Clean up consecutive empty paragraphs
  return result
    .join('\n')
    .replace(/<p><\/p>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
