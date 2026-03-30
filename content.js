// Marketing Command Center - Content Script
// All page analysis happens here - no external APIs

// CTA Patterns
const CTA_PATTERNS = [
  /buy\s*(now|today)?|get\s*(started|quote)|sign\s*up|register|subscribe/i,
  /learn\s*more|find\s*out|discover|explore|try\s*(free|it)|demo/i,
  /start\s*(free|today)|free\s*trial|download|get\s*free/i,
  /book\s*now|reserve|schedule|order\s*now|shop\s*now/i,
  /contact\s*(us)?|request\s*(quote|info)|apply\s*now/i,
  /save\s*(now|up)?|discount|offer|deal\b|promo/i,
  /limited\s*(time|offer)|expires?\s*(soon|today)|ending\s*soon/i,
  /get\s*(your|started)|join\s*(us|today)|create\s*(account|free)/i,
  /\bnew\b|\breleased?\b|\blaunched?\b|just\s*added/i
];

// Price Patterns
const PRICE_PATTERNS = [
  /\$\s*\d+(?:,\d{3})*(?:\.\d{2})?/g,
  /(?:USD|EUR|GBP)\s*[\d,]+(?:\.\d{2})?/gi,
  /\d+\s*(?:dollars?|euros?|pounds?)/gi,
  /(?:from|starting|just)\s*\$?\d+/gi
];

// Email Pattern
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Message Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'fullScan':
      sendResponse(runFullScan());
      break;
    case 'scanCTAs':
      sendResponse(scanCTAs());
      break;
    case 'scanEmails':
      sendResponse(scanEmails());
      break;
    case 'scanPrices':
      sendResponse(scanPrices());
      break;
    case 'analyzeSEO':
      sendResponse(analyzeSEO());
      break;
    case 'generateHeatmap':
      sendResponse(generateHeatmap(message.mode, message.opacity, message.radius));
      break;
    case 'getPageSnapshot':
      sendResponse(getPageSnapshot());
      break;
  }
  return true;
});

// Full Scan
function runFullScan() {
  return {
    ctas: scanCTAs(),
    emails: scanEmails(),
    prices: scanPrices(),
    seo: analyzeSEO()
  };
}

// CTA Scanner
function scanCTAs() {
  const elements = [];
  const seen = new Set();
  
  document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, button, a, li, div, label').forEach(el => {
    const text = el.textContent.trim();
    const rect = el.getBoundingClientRect();
    
    if (rect.width < 20 || rect.height < 10 || rect.top < 0) return;
    if (text.length < 3 || text.length > 300) return;
    
    const key = text.substring(0, 50).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    
    const tagName = el.tagName.toLowerCase();
    const className = (el.className || '').toLowerCase();
    const id = (el.id || '').toLowerCase();
    
    let type = null;
    let score = 0;
    
    // Check if it's a button or link
    if (['button', 'a'].includes(tagName) || className.match(/btn|button|cta|link/i)) {
      type = 'button';
      score = 10;
      if (isCTA(text)) score += 20;
    }
    // Check if it's a heading
    else if (['h1', 'h2', 'h3'].includes(tagName)) {
      type = 'headline';
      score = 5;
      if (isCTA(text)) score += 15;
    }
    // Check if it matches CTA patterns
    else if (isCTA(text)) {
      type = 'cta';
      score = 20;
    }
    // Check marketing classes
    else if (className.match(/hero|banner|promo|offer|cta|marketing/i)) {
      type = 'cta';
      score = 15;
    }
    
    // Check parent for context
    const parent = el.parentElement;
    if (parent && parent.className && parent.className.toLowerCase().match(/hero|banner|promo/i)) {
      type = type || 'cta';
      score += 10;
    }
    
    if (type && score >= 15) {
      elements.push({
        type,
        tag: tagName,
        text: text.substring(0, 200),
        chars: text.length,
        score,
        selector: getSelector(el)
      });
    }
  });
  
  // Sort by score
  elements.sort((a, b) => b.score - a.score);
  return elements.slice(0, 50);
}

function isCTA(text) {
  const lower = text.toLowerCase();
  return CTA_PATTERNS.some(pattern => pattern.test(lower));
}

function getSelector(el) {
  if (el.id) return `#${el.id}`;
  let selector = el.tagName.toLowerCase();
  if (el.className) {
    const classes = el.className.split(' ').filter(c => c.length > 0).slice(0, 2);
    if (classes.length) selector += '.' + classes.join('.');
  }
  return selector;
}

// Email Scanner
function scanEmails() {
  const emails = [];
  const seen = new Set();
  
  // Scan page text
  const bodyText = document.body.innerText;
  const matches = bodyText.match(EMAIL_PATTERN) || [];
  
  matches.forEach(email => {
    const lower = email.toLowerCase();
    if (!seen.has(lower) && isValidEmail(email)) {
      seen.add(lower);
      emails.push({
        address: email,
        type: 'text',
        context: extractEmailContext(email)
      });
    }
  });
  
  // Scan mailto links
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
    const email = link.href.replace('mailto:', '').split('?')[0];
    if (!seen.has(email.toLowerCase())) {
      seen.add(email.toLowerCase());
      emails.push({
        address: email,
        type: 'mailto',
        context: link.textContent.trim() || 'Email link'
      });
    }
  });
  
  return emails.slice(0, 30);
}

function isValidEmail(email) {
  const [local, domain] = email.split('@');
  return local.length > 0 && domain && domain.includes('.') && domain.length > 2;
}

function extractEmailContext(email) {
  const regex = new RegExp(`[^.!?]*${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.!?]*[.!?]`, 'i');
  const match = document.body.innerText.match(regex);
  return match ? match[0].trim().substring(0, 80) : 'Found in page';
}

// Price Scanner
function scanPrices() {
  const prices = [];
  const seen = new Set();
  
  // Scan all text nodes
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  while (walker.nextNode()) {
    const text = walker.currentNode.textContent;
    const matches = text.match(/\$\s*\d[\d,]*(?:\.\d{2})?/g);
    
    if (matches) {
      matches.forEach(match => {
        const clean = match.replace(/[$,\s]/g, '');
        const value = parseFloat(clean.replace('$', ''));
        
        if (value > 0 && value < 1000000 && !seen.has(clean)) {
          seen.add(clean);
          prices.push({
            raw: match,
            value,
            currency: '$',
            context: walker.currentNode.parentElement?.textContent?.trim().substring(0, 50) || 'Price'
          });
        }
      });
    }
  }
  
  // Also scan data attributes
  document.querySelectorAll('[data-price], [data-amount], [data-cost]').forEach(el => {
    const value = parseFloat(el.dataset.price || el.dataset.amount || el.dataset.cost);
    if (value > 0) {
      prices.push({
        raw: `$${value.toFixed(2)}`,
        value,
        currency: '$',
        context: el.className || el.id || 'Data attribute'
      });
    }
  });
  
  // Sort by value
  prices.sort((a, b) => a.value - b.value);
  return prices.slice(0, 30);
}

// SEO Analyzer
function analyzeSEO() {
  const title = document.querySelector('title')?.textContent || '';
  const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
  
  // Headings
  const headings = [];
  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
    const text = h.textContent.trim();
    if (text) headings.push({ tag: h.tagName, text: text.substring(0, 100) });
  });
  
  // Images
  const images = [];
  document.querySelectorAll('img').forEach(img => {
    images.push({
      src: img.src.substring(0, 50),
      alt: img.alt || '',
      hasAlt: !!img.alt
    });
  });
  
  // Content analysis
  const bodyText = document.body.innerText;
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 2).length;
  const sentences = bodyText.split(/[.!?]+/).length;
  
  // Keyword extraction
  const keywords = extractKeywords(bodyText, 15);
  
  // Readability
  const readability = calculateReadability(bodyText);
  
  return {
    title,
    metaDesc,
    headings,
    images,
    wordCount,
    sentences,
    keywords,
    readability,
    h1Count: document.querySelectorAll('h1').length,
    h2Count: document.querySelectorAll('h2').length,
    links: document.querySelectorAll('a').length,
    externalLinks: document.querySelectorAll('a[href^="http"]').length
  };
}

function extractKeywords(text, limit) {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'our', 'you', 'your', 'i', 'my', 'me']);
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
  
  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  
  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function calculateReadability(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  
  if (words.length === 0 || sentences.length === 0) return { score: 0, grade: 'N/A' };
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  const grade = Math.round(0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59);
  
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    grade: Math.max(0, Math.min(18, grade))
  };
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

// Heatmap Generator
function generateHeatmap(mode, opacity = 0.5, radius = 30) {
  const clickData = [];
  
  // Get interactive elements
  const elements = document.querySelectorAll('button, a, input, [onclick], [role="button"]');
  const grid = new Map();
  
  elements.forEach(el => {
    const rect = el.getBoundingClientRect();
    const x = Math.round((rect.left + rect.width / 2) / window.innerWidth * 100);
    const y = Math.round((rect.top + rect.height / 2) / window.innerHeight * 100);
    const key = `${x},${y}`;
    
    grid.set(key, (grid.get(key) || 0) + 1);
  });
  
  grid.forEach((count, pos) => {
    const [x, y] = pos.split(',').map(Number);
    clickData.push({ x, y, count });
  });
  
  // Create visual overlay
  if (mode === 'clicks') {
    const existing = document.getElementById('mcc-heatmap-overlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'mcc-heatmap-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 999999;
    `;
    
    grid.forEach((count, pos) => {
      const [x, y] = pos.split(',').map(Number);
      const intensity = Math.min(1, count / 10);
      const size = radius * (1 + intensity);
      
      const dot = document.createElement('div');
      dot.style.cssText = `
        position: absolute;
        left: ${x}%;
        top: ${y}%;
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, rgba(239,68,68,${opacity * intensity}) 0%, rgba(239,68,68,0) 70%);
        border-radius: 50%;
        transform: translate(-50%, -50%);
      `;
      overlay.appendChild(dot);
    });
    
    document.body.appendChild(overlay);
  }
  
  return clickData.sort((a, b) => b.count - a.count).slice(0, 20);
}

// Page Snapshot for Tracker
function getPageSnapshot() {
  return {
    title: document.title,
    url: window.location.href,
    ctas: scanCTAs().map(c => c.text),
    prices: scanPrices().map(p => p.raw),
    wordCount: document.body.innerText.split(/\s+/).length,
    h1Count: document.querySelectorAll('h1').length,
    h2Count: document.querySelectorAll('h2').length,
    imageCount: document.querySelectorAll('img').length,
    linkCount: document.querySelectorAll('a').length
  };
}

// Keyboard shortcut
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'M') {
    chrome.runtime.sendMessage({ action: 'openCommandCenter' });
  }
});
