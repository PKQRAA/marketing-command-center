// Marketing Command Center - Main Application Logic

let appData = {
  ctas: [],
  emails: [],
  prices: [],
  seo: {},
  tracked: [],
  changes: [],
  saved: { ctas: [], emails: [] }
};

let currentModule = 'dashboard';
let heatmapMode = 'clicks';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSavedData();
  await getCurrentTab();
  setupModuleTabs();
});

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  document.getElementById('currentUrl').textContent = tab.url.substring(0, 40) + '...';
  return tab;
}

function setupModuleTabs() {
  document.querySelectorAll('.module-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchModule(tab.dataset.module);
    });
  });
}

function switchModule(module) {
  currentModule = module;
  document.querySelectorAll('.module-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.module-tab[data-module="${module}"]`).classList.add('active');
  document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
  document.getElementById(`module-${module}`).classList.add('active');
}

// Full Scan
async function scanAll() {
  const tab = await getCurrentTab();
  try {
    const results = await chrome.tabs.sendMessage(tab.id, { action: 'fullScan' });
    appData.ctas = results.ctas || [];
    appData.emails = results.emails || [];
    appData.prices = results.prices || [];
    appData.seo = results.seo || {};
    
    updateDashboard();
    updateStats();
    showToast('Full scan complete!');
  } catch (e) {
    showToast('Error scanning page');
  }
}

// CTA Spy
async function scanCTAs() {
  const tab = await getCurrentTab();
  try {
    const results = await chrome.tabs.sendMessage(tab.id, { action: 'scanCTAs' });
    appData.ctas = results;
    renderCTAList();
    showToast(`Found ${appData.ctas.length} CTAs`);
  } catch (e) {
    showToast('Error scanning CTAs');
  }
}

function renderCTAList() {
  const container = document.getElementById('ctaList');
  if (appData.ctas.length === 0) {
    container.innerHTML = renderEmptyState('No CTAs found', 'Click "Scan CTAs" to find marketing copy');
    return;
  }
  
  container.innerHTML = appData.ctas.map((cta, i) => `
    <div class="list-item">
      <div class="item-content">
        <div class="item-type">${cta.type}</div>
        <div class="item-text">${escapeHtml(cta.text)}</div>
        <div class="item-meta">${cta.tag} • ${cta.chars} chars</div>
      </div>
      <div class="item-actions">
        <button class="item-btn" onclick="event.stopPropagation(); saveCTA(${i})" title="Save">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
        </button>
        <button class="item-btn" onclick="event.stopPropagation(); copyText('${escapeForAttr(cta.text)}')" title="Copy">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
      </div>
    </div>
  `).join('');
  
  if (appData.saved.ctas.length > 0) {
    document.getElementById('savedCtasSection').style.display = 'block';
    document.getElementById('savedCtas').innerHTML = appData.saved.ctas.map((cta, i) => `
      <div class="list-item">
        <div class="item-content">
          <div class="item-type">${cta.type}</div>
          <div class="item-text">${escapeHtml(cta.text)}</div>
        </div>
        <button class="item-btn" onclick="removeSavedCTA(${i})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `).join('');
  }
}

function saveCTA(index) {
  const cta = appData.ctas[index];
  if (!appData.saved.ctas.find(c => c.text === cta.text)) {
    appData.saved.ctas.push(cta);
    saveToStorage();
    renderCTAList();
    showToast('CTA saved!');
  }
}

function removeSavedCTA(index) {
  appData.saved.ctas.splice(index, 1);
  saveToStorage();
  renderCTAList();
}

function copyAllCTAs() {
  const text = appData.ctas.map(c => c.text).join('\n');
  navigator.clipboard.writeText(text);
  showToast(`Copied ${appData.ctas.length} CTAs!`);
}

// Email Finder
async function scanEmails() {
  const tab = await getCurrentTab();
  try {
    const results = await chrome.tabs.sendMessage(tab.id, { action: 'scanEmails' });
    appData.emails = results;
    renderEmailList();
    showToast(`Found ${appData.emails.length} emails`);
  } catch (e) {
    showToast('Error scanning emails');
  }
}

function renderEmailList() {
  const container = document.getElementById('emailList');
  if (appData.emails.length === 0) {
    container.innerHTML = renderEmptyState('No emails found', 'Try scanning a contact or about page');
    return;
  }
  
  container.innerHTML = appData.emails.map((email, i) => `
    <div class="list-item">
      <div class="item-content">
        <div class="item-type">${email.type}</div>
        <div class="item-text">${email.address}</div>
        <div class="item-meta">${email.context || 'Page content'}</div>
      </div>
      <button class="item-btn" onclick="copyText('${email.address}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      </button>
    </div>
  `).join('');
}

function copyAllEmails() {
  const text = appData.emails.map(e => e.address).join('\n');
  navigator.clipboard.writeText(text);
  showToast(`Copied ${appData.emails.length} emails!`);
}

// SEO Analyzer
async function analyzeSEO() {
  const tab = await getCurrentTab();
  try {
    const results = await chrome.tabs.sendMessage(tab.id, { action: 'analyzeSEO' });
    appData.seo = results;
    renderSEOResults();
    showToast('SEO analysis complete!');
  } catch (e) {
    showToast('Error analyzing SEO');
  }
}

function renderSEOResults() {
  const seo = appData.seo;
  const score = calculateSEOScore(seo);
  
  const scoreEl = document.getElementById('seoScore');
  scoreEl.textContent = score;
  scoreEl.className = 'score-circle ' + (score >= 80 ? 'score-good' : score >= 60 ? 'score-medium' : 'score-bad');
  
  // Title
  const titleLen = seo.title ? seo.title.length : 0;
  document.getElementById('seoTitle').textContent = `${titleLen}/60 chars`;
  document.getElementById('seoTitleBar').style.width = Math.min(100, (titleLen / 60) * 100) + '%';
  
  // Meta description
  const metaLen = seo.metaDesc ? seo.metaDesc.length : 0;
  document.getElementById('seoMeta').textContent = `${metaLen}/160 chars`;
  document.getElementById('seoMetaBar').style.width = Math.min(100, (metaLen / 160) * 100) + '%';
  
  // Headings
  const headingCount = seo.headings ? seo.headings.length : 0;
  document.getElementById('seoHeadings').textContent = `${headingCount} found`;
  document.getElementById('seoHeadingsBar').style.width = Math.min(100, (headingCount / 6) * 100) + '%';
  
  // Images
  const altPercent = seo.images ? seo.images.filter(i => i.alt).length / (seo.images.length || 1) * 100 : 0;
  document.getElementById('seoImages').textContent = `${Math.round(altPercent)}% have alt`;
  document.getElementById('seoImagesBar').style.width = altPercent + '%';
  
  // Content
  const wordCount = seo.wordCount || 0;
  const contentScore = Math.min(100, (wordCount / 300) * 100);
  document.getElementById('seoContent').textContent = `${wordCount} words`;
  document.getElementById('seoContentBar').style.width = contentScore + '%';
  
  // Keywords
  if (seo.keywords && seo.keywords.length > 0) {
    document.getElementById('seoKeywordsCard').style.display = 'block';
    document.getElementById('seoKeywords').innerHTML = seo.keywords.slice(0, 10).map(k => `
      <div style="display:inline-block;background:var(--bg-secondary);padding:4px 10px;border-radius:12px;margin:2px;font-size:11px">
        ${k.word} <span style="color:var(--accent-1)">${k.count}x</span>
      </div>
    `).join('');
  }
}

function calculateSEOScore(seo) {
  let score = 0;
  if (seo.title && seo.title.length >= 30 && seo.title.length <= 60) score += 20;
  if (seo.metaDesc && seo.metaDesc.length >= 120 && seo.metaDesc.length <= 160) score += 20;
  if (seo.headings && seo.headings.length >= 1) score += 20;
  if (seo.images && seo.images.filter(i => i.alt).length / seo.images.length > 0.8) score += 20;
  if (seo.wordCount && seo.wordCount >= 300) score += 20;
  return score;
}

// Price Extractor
async function scanPrices() {
  const tab = await getCurrentTab();
  try {
    const results = await chrome.tabs.sendMessage(tab.id, { action: 'scanPrices' });
    appData.prices = results;
    renderPriceList();
    showToast(`Found ${appData.prices.length} prices`);
  } catch (e) {
    showToast('Error scanning prices');
  }
}

function renderPriceList() {
  const prices = appData.prices;
  
  if (prices.length > 0) {
    const values = prices.map(p => p.value);
    document.getElementById('priceMin').textContent = formatPrice(Math.min(...values));
    document.getElementById('priceMax').textContent = formatPrice(Math.max(...values));
    document.getElementById('priceAvg').textContent = formatPrice(values.reduce((a, b) => a + b, 0) / values.length);
  }
  
  const container = document.getElementById('priceList');
  if (prices.length === 0) {
    container.innerHTML = renderEmptyState('No prices found', 'Try scanning a pricing or product page');
    return;
  }
  
  container.innerHTML = prices.map((price, i) => `
    <div class="list-item">
      <div class="item-content">
        <div class="item-type">${price.currency}</div>
        <div class="item-text" style="font-size:16px;font-weight:600;color:#22c55e">${formatPrice(price.value)}</div>
        <div class="item-meta">${price.context || 'Price element'}</div>
      </div>
      <button class="item-btn" onclick="copyText('${price.raw}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      </button>
    </div>
  `).join('');
}

function comparePrices() {
  const prices = appData.prices.map(p => p.value);
  if (prices.length < 2) {
    showToast('Need at least 2 prices to compare');
    return;
  }
  const text = `Price Analysis:\nMin: ${formatPrice(Math.min(...prices))}\nMax: ${formatPrice(Math.max(...prices))}\nAvg: ${formatPrice(prices.reduce((a, b) => a + b, 0) / prices.length)}`;
  navigator.clipboard.writeText(text);
  showToast('Price comparison copied!');
}

function formatPrice(val) {
  return '$' + val.toFixed(2);
}

// Heatmap
async function toggleHeatmap(mode) {
  heatmapMode = mode;
  document.querySelectorAll('.heatmap-toggle').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  const tab = await getCurrentTab();
  const opacity = document.getElementById('heatmapOpacitySlider').value / 100;
  const radius = parseInt(document.getElementById('heatmapRadiusSlider').value);
  
  try {
    const clickData = await chrome.tabs.sendMessage(tab.id, { 
      action: 'generateHeatmap',
      mode,
      opacity,
      radius
    });
    document.getElementById('clickMapData').innerHTML = clickData.map(c => `
      <div style="padding:4px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--accent-1)">${c.count}</span> clicks at ${c.x}%, ${c.y}%
      </div>
    `).join('');
    showToast(`${mode} heatmap activated`);
  } catch (e) {
    showToast('Error generating heatmap');
  }
}

function clearHeatmap() {
  document.getElementById('clickMapData').textContent = 'Click "Scan" to generate heatmap';
  showToast('Heatmap cleared');
}

document.getElementById('heatmapOpacitySlider')?.addEventListener('input', function() {
  document.getElementById('heatmapOpacity').textContent = this.value + '%';
});

document.getElementById('heatmapRadiusSlider')?.addEventListener('input', function() {
  document.getElementById('heatmapRadius').textContent = this.value + 'px';
});

// Competitor Tracker
async function trackPage() {
  const tab = await getCurrentTab();
  const existing = appData.tracked.find(t => t.url === tab.url);
  
  if (existing) {
    showToast('Page already tracked');
    return;
  }
  
  try {
    const snapshot = await chrome.tabs.sendMessage(tab.id, { action: 'getPageSnapshot' });
    appData.tracked.push({
      url: tab.url,
      title: tab.title,
      snapshot,
      date: new Date().toISOString()
    });
    saveToStorage();
    renderTrackedPages();
    showToast('Page tracked!');
  } catch (e) {
    showToast('Error tracking page');
  }
}

async function checkChanges() {
  if (appData.tracked.length === 0) {
    showToast('No pages tracked yet');
    return;
  }
  
  const tab = await getCurrentTab();
  const tracked = appData.tracked.find(t => t.url === tab.url);
  
  if (!tracked) {
    showToast('Track this page first');
    return;
  }
  
  try {
    const current = await chrome.tabs.sendMessage(tab.id, { action: 'getPageSnapshot' });
    const changes = compareSnapshots(tracked.snapshot, current);
    
    if (changes.length === 0) {
      showToast('No changes detected');
    } else {
      appData.changes.unshift({
        url: tab.url,
        changes,
        date: new Date().toISOString()
      });
      saveToStorage();
      showToast(`${changes.length} changes detected!`);
    }
    renderChanges();
  } catch (e) {
    showToast('Error checking changes');
  }
}

function compareSnapshots(old, current) {
  const changes = [];
  if (old.title !== current.title) changes.push(`Title: "${old.title}" → "${current.title}"`);
  if (old.prices.length !== current.prices.length) changes.push(`Prices: ${old.prices.length} → ${current.prices.length}`);
  if (old.ctas.length !== current.ctas.length) changes.push(`CTAs: ${old.ctas.length} → ${current.ctas.length}`);
  if (old.wordCount !== current.wordCount) changes.push(`Content: ${old.wordCount} → ${current.wordCount} words`);
  return changes;
}

function renderTrackedPages() {
  const container = document.getElementById('trackedPages');
  if (appData.tracked.length === 0) {
    container.innerHTML = renderEmptyState('No tracked pages', 'Track a page to monitor changes');
    return;
  }
  
  container.innerHTML = appData.tracked.map((page, i) => `
    <div class="list-item">
      <div class="item-content">
        <div class="item-type">${new Date(page.date).toLocaleDateString()}</div>
        <div class="item-text">${page.title.substring(0, 40)}</div>
        <div class="item-meta">${page.url.substring(0, 30)}...</div>
      </div>
      <button class="item-btn" onclick="removeTracked(${i})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `).join('');
}

function removeTracked(index) {
  appData.tracked.splice(index, 1);
  saveToStorage();
  renderTrackedPages();
}

function renderChanges() {
  const container = document.getElementById('changeHistory');
  if (appData.changes.length === 0) {
    container.innerHTML = renderEmptyState('No changes', 'Check for changes on tracked pages');
    return;
  }
  
  container.innerHTML = appData.changes.map(change => `
    <div class="list-item">
      <div class="item-content">
        <div class="item-type">${new Date(change.date).toLocaleString()}</div>
        <div class="item-text">${change.url.substring(0, 30)}...</div>
        ${change.changes.map(c => `<div class="item-meta">${c}</div>`).join('')}
      </div>
    </div>
  `).join('');
}

// Dashboard
function updateDashboard() {
  document.getElementById('dashCtas').textContent = appData.ctas.length;
  document.getElementById('dashCtasBar').style.width = Math.min(100, appData.ctas.length * 5) + '%';
  
  document.getElementById('dashEmails').textContent = appData.emails.length;
  document.getElementById('dashEmailsBar').style.width = Math.min(100, appData.emails.length * 10) + '%';
  
  document.getElementById('dashPrices').textContent = appData.prices.length;
  document.getElementById('dashPricesBar').style.width = Math.min(100, appData.prices.length * 10) + '%';
  
  const seoScore = calculateSEOScore(appData.seo);
  document.getElementById('dashSeo').textContent = seoScore + '/100';
  document.getElementById('dashSeoBar').style.width = seoScore + '%';
}

function updateStats() {
  document.getElementById('statCtas').textContent = appData.ctas.length;
  document.getElementById('statEmails').textContent = appData.emails.length;
  document.getElementById('statPrices').textContent = appData.prices.length;
  document.getElementById('statSeo').textContent = calculateSEOScore(appData.seo);
}

// Storage
async function saveToStorage() {
  await chrome.storage.local.set({ appData });
  showToast('Data saved!');
}

async function loadSavedData() {
  const result = await chrome.storage.local.get(['appData']);
  if (result.appData) {
    appData = { ...appData, ...result.appData };
    updateDashboard();
    updateStats();
    renderCTAList();
    renderEmailList();
    renderPriceList();
    renderTrackedPages();
    renderChanges();
  }
}

function clearAll() {
  if (confirm('Clear all collected data?')) {
    appData = { ctas: [], emails: [], prices: [], seo: {}, tracked: [], changes: [], saved: { ctas: [], emails: [] } };
    chrome.storage.local.remove(['appData']);
    updateDashboard();
    updateStats();
    showToast('All data cleared');
  }
}

// Export
function exportData() {
  const data = JSON.stringify(appData, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `marketing-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported!');
}

// Utilities
function copyText(text) {
  navigator.clipboard.writeText(text);
  showToast('Copied!');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeForAttr(text) {
  return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function renderEmptyState(title, subtitle) {
  return `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p style="font-weight:600">${title}</p>
      <p style="margin-top:4px">${subtitle}</p>
    </div>
  `;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}
