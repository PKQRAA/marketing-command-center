// Marketing Command Center - Popup Logic
// Fixed version with proper event handling

const App = {
  data: {
    ctas: [],
    emails: [],
    prices: [],
    seo: {},
    social: [],
    links: [],
    metas: [],
    tracked: [],
    changes: [],
    saved: { ctas: [], emails: [] }
  },
  currentModule: 'dashboard',
  heatmapMode: 'clicks',
  currentTab: null
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await App.init();
});

App.init = async function() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    App.currentTab = tab;
    document.getElementById('currentUrl').textContent = (tab.url || 'New Tab').substring(0, 35) + '...';
    document.getElementById('currentUrl').title = tab.url || '';
  } catch (e) {
    document.getElementById('currentUrl').textContent = 'Unable to get URL';
  }
  
  await App.loadData();
  App.setupEventListeners();
  App.setupTabs();
  App.renderAll();
};

App.loadData = async function() {
  try {
    const result = await chrome.storage.local.get(['mccData']);
    if (result.mccData) {
      App.data = { ...App.data, ...result.mccData };
    }
  } catch (e) {
    console.log('No saved data found');
  }
};

App.saveData = async function() {
  try {
    await chrome.storage.local.set({ mccData: App.data });
  } catch (e) {
    console.error('Error saving data:', e);
  }
};

App.setupEventListeners = function() {
  // Use event delegation for better reliability
  document.addEventListener('click', function(e) {
    const target = e.target.closest('[data-action]');
    if (target) {
      e.preventDefault();
      const action = target.dataset.action;
      const param = target.dataset.param;
      if (App[action]) {
        App[action](param);
      }
    }
  });
  
  // Heatmap sliders
  const opacitySlider = document.getElementById('heatmapOpacitySlider');
  if (opacitySlider) {
    opacitySlider.addEventListener('input', function() {
      document.getElementById('heatmapOpacity').textContent = this.value + '%';
    });
  }
  
  const radiusSlider = document.getElementById('heatmapRadiusSlider');
  if (radiusSlider) {
    radiusSlider.addEventListener('input', function() {
      document.getElementById('heatmapRadius').textContent = this.value + 'px';
    });
  }
};

App.setupTabs = function() {
  document.querySelectorAll('.module-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      App.switchModule(this.dataset.module);
    });
  });
};

App.switchModule = function(module) {
  App.currentModule = module;
  document.querySelectorAll('.module-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.module-tab[data-module="${module}"]`).classList.add('active');
  document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
  document.getElementById('module-' + module).classList.add('active');
};

App.renderAll = function() {
  App.updateStats();
  App.updateDashboard();
  App.renderCTAList();
  App.renderEmailList();
  App.renderPriceList();
  App.renderTrackedPages();
  App.renderChanges();
};

// ========== SCANNING ==========

App.scanAll = async function() {
  if (!App.currentTab || !App.currentTab.id) {
    App.toast('Cannot scan this page');
    return;
  }
  
  App.toast('Scanning page...');
  
  try {
    const results = await App.sendToContent({ action: 'fullScan' });
    
    if (results.error) {
      App.toast('Error: ' + results.error);
      return;
    }
    
    App.data.ctas = results.ctas || [];
    App.data.emails = results.emails || [];
    App.data.prices = results.prices || [];
    App.data.seo = results.seo || {};
    App.data.social = results.social || [];
    App.data.links = results.links || [];
    App.data.metas = results.metas || [];
    
    App.saveData();
    App.renderAll();
    App.toast('Scan complete! Found ' + App.data.ctas.length + ' CTAs');
  } catch (e) {
    App.toast('Scan failed. Try reloading the page.');
    console.error(e);
  }
};

App.scanCTAs = async function() {
  App.toast('Scanning CTAs...');
  try {
    const results = await App.sendToContent({ action: 'scanCTAs' });
    App.data.ctas = results || [];
    App.saveData();
    App.renderCTAList();
    App.updateStats();
    App.toast('Found ' + App.data.ctas.length + ' CTAs');
  } catch (e) {
    App.toast('Scan failed');
  }
};

App.scanEmails = async function() {
  App.toast('Scanning emails...');
  try {
    const results = await App.sendToContent({ action: 'scanEmails' });
    App.data.emails = results || [];
    App.saveData();
    App.renderEmailList();
    App.updateStats();
    App.toast('Found ' + App.data.emails.length + ' emails');
  } catch (e) {
    App.toast('Scan failed');
  }
};

App.analyzeSEO = async function() {
  App.toast('Analyzing SEO...');
  try {
    const results = await App.sendToContent({ action: 'analyzeSEO' });
    App.data.seo = results || {};
    App.saveData();
    App.renderSEOResults();
    App.updateStats();
    App.toast('SEO score: ' + App.calculateSEOScore(App.data.seo));
  } catch (e) {
    App.toast('Analysis failed');
  }
};

App.scanPrices = async function() {
  App.toast('Extracting prices...');
  try {
    const results = await App.sendToContent({ action: 'scanPrices' });
    App.data.prices = results || [];
    App.saveData();
    App.renderPriceList();
    App.updateStats();
    App.toast('Found ' + App.data.prices.length + ' prices');
  } catch (e) {
    App.toast('Scan failed');
  }
};

App.extractSocial = async function() {
  App.toast('Extracting social links...');
  try {
    const results = await App.sendToContent({ action: 'extractSocial' });
    App.data.social = results || [];
    App.saveData();
    App.renderSocialList();
    App.toast('Found ' + App.data.social.length + ' social links');
  } catch (e) {
    App.toast('Extraction failed');
  }
};

App.analyzeLinks = async function() {
  App.toast('Analyzing links...');
  try {
    const results = await App.sendToContent({ action: 'analyzeLinks' });
    App.data.links = results || [];
    App.saveData();
    App.renderLinksList();
    App.toast('Found ' + App.data.links.length + ' links');
  } catch (e) {
    App.toast('Analysis failed');
  }
};

App.getMetas = async function() {
  App.toast('Getting meta tags...');
  try {
    const results = await App.sendToContent({ action: 'getMetas' });
    App.data.metas = results || [];
    App.saveData();
    App.renderMetasList();
    App.toast('Found ' + App.data.metas.length + ' meta tags');
  } catch (e) {
    App.toast('Failed to get metas');
  }
};

// ========== SEND TO CONTENT ==========

App.sendToContent = function(message) {
  return new Promise((resolve, reject) => {
    if (!App.currentTab || !App.currentTab.id) {
      reject(new Error('No tab'));
      return;
    }
    
    chrome.tabs.sendMessage(App.currentTab.id, message, function(response) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
};

// ========== CTA SPY ==========

App.renderCTAList = function() {
  const container = document.getElementById('ctaList');
  if (!container) return;
  
  if (App.data.ctas.length === 0) {
    container.innerHTML = App.emptyState('No CTAs Found', 'Click "Scan CTAs" to find marketing copy');
    return;
  }
  
  container.innerHTML = App.data.ctas.slice(0, 20).map((cta, i) => `
    <div class="list-item" data-action="copyCTA" data-param="${i}">
      <div class="item-content">
        <div class="item-type">${cta.type || 'text'}</div>
        <div class="item-text">${App.escapeHtml(cta.text.substring(0, 80))}</div>
        <div class="item-meta">${cta.tag} • ${cta.chars} chars</div>
      </div>
      <div class="item-actions">
        <button class="item-btn" data-action="saveCTA" data-param="${i}" title="Save">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
        </button>
        <button class="item-btn" data-action="copyCTA" data-param="${i}" title="Copy">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
      </div>
    </div>
  `).join('');
  
  // Render saved CTAs
  const savedSection = document.getElementById('savedCtasSection');
  const savedContainer = document.getElementById('savedCtas');
  if (savedSection && savedContainer) {
    if (App.data.saved.ctas.length > 0) {
      savedSection.style.display = 'block';
      savedContainer.innerHTML = App.data.saved.ctas.map((cta, i) => `
        <div class="list-item">
          <div class="item-content">
            <div class="item-type">${cta.type || 'saved'}</div>
            <div class="item-text">${App.escapeHtml(cta.text.substring(0, 60))}</div>
          </div>
          <button class="item-btn" data-action="removeSavedCTA" data-param="${i}" title="Remove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `).join('');
    } else {
      savedSection.style.display = 'none';
    }
  }
};

App.copyCTA = function(index) {
  const text = App.data.ctas[index]?.text;
  if (text) {
    App.copyToClipboard(text);
    App.toast('CTA copied!');
  }
};

App.saveCTA = function(index) {
  const cta = App.data.ctas[index];
  if (cta && !App.data.saved.ctas.find(c => c.text === cta.text)) {
    App.data.saved.ctas.push(cta);
    App.saveData();
    App.renderCTAList();
    App.toast('CTA saved!');
  } else {
    App.toast('Already saved');
  }
};

App.removeSavedCTA = function(index) {
  App.data.saved.ctas.splice(index, 1);
  App.saveData();
  App.renderCTAList();
  App.toast('Removed');
};

App.copyAllCTAs = function() {
  if (App.data.ctas.length === 0) {
    App.toast('No CTAs to copy');
    return;
  }
  const text = App.data.ctas.map(c => c.text).join('\n');
  App.copyToClipboard(text);
  App.toast('Copied ' + App.data.ctas.length + ' CTAs!');
};

// ========== EMAIL FINDER ==========

App.renderEmailList = function() {
  const container = document.getElementById('emailList');
  if (!container) return;
  
  if (App.data.emails.length === 0) {
    container.innerHTML = App.emptyState('No Emails Found', 'Try an About or Contact page');
    return;
  }
  
  container.innerHTML = App.data.emails.slice(0, 20).map((email, i) => `
    <div class="list-item" data-action="copyEmail" data-param="${i}">
      <div class="item-content">
        <div class="item-type">${email.type || 'email'}</div>
        <div class="item-text" style="color:#14b8a6">${email.address}</div>
        <div class="item-meta">${App.escapeHtml(email.context?.substring(0, 50) || 'Found in page')}</div>
      </div>
      <button class="item-btn" data-action="copyEmail" data-param="${i}" title="Copy">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      </button>
    </div>
  `).join('');
};

App.copyEmail = function(index) {
  const email = App.data.emails[index]?.address;
  if (email) {
    App.copyToClipboard(email);
    App.toast('Email copied!');
  }
};

App.copyAllEmails = function() {
  if (App.data.emails.length === 0) {
    App.toast('No emails to copy');
    return;
  }
  const text = App.data.emails.map(e => e.address).join('\n');
  App.copyToClipboard(text);
  App.toast('Copied ' + App.data.emails.length + ' emails!');
};

// ========== SEO ANALYZER ==========

App.renderSEOResults = function() {
  const seo = App.data.seo;
  const score = App.calculateSEOScore(seo);
  
  const scoreEl = document.getElementById('seoScore');
  if (scoreEl) {
    scoreEl.textContent = score;
    scoreEl.className = 'score-circle ' + (score >= 80 ? 'score-good' : score >= 60 ? 'score-medium' : 'score-bad');
  }
  
  // Title
  const titleLen = seo.title ? seo.title.length : 0;
  App.updateProgress('seoTitle', 'seoTitleBar', titleLen, 60);
  
  // Meta
  const metaLen = seo.metaDesc ? seo.metaDesc.length : 0;
  App.updateProgress('seoMeta', 'seoMetaBar', metaLen, 160);
  
  // Headings
  const headingCount = seo.headings ? seo.headings.length : 0;
  App.updateProgress('seoHeadings', 'seoHeadingsBar', headingCount, 6);
  
  // Images
  const altPercent = seo.images ? (seo.images.filter(i => i.alt).length / Math.max(1, seo.images.length) * 100) : 0;
  const imgEl = document.getElementById('seoImages');
  const imgBar = document.getElementById('seoImagesBar');
  if (imgEl) imgEl.textContent = `${Math.round(altPercent)}% alt text`;
  if (imgBar) imgBar.style.width = altPercent + '%';
  
  // Content
  const wordCount = seo.wordCount || 0;
  const contentScore = Math.min(100, (wordCount / 300) * 100);
  App.updateProgress('seoContent', 'seoContentBar', wordCount / 10, 30);
  
  // Keywords
  const keywordsContainer = document.getElementById('seoKeywords');
  const keywordsCard = document.getElementById('seoKeywordsCard');
  if (keywordsContainer && seo.keywords && seo.keywords.length > 0) {
    keywordsCard.style.display = 'block';
    keywordsContainer.innerHTML = seo.keywords.slice(0, 12).map(k => `
      <span class="keyword-tag">${k.word} <span class="keyword-count">${k.count}x</span></span>
    `).join('');
  }
  
  // Readability
  const readabilityEl = document.getElementById('seoReadability');
  if (readabilityEl && seo.readability) {
    readabilityEl.textContent = `Grade ${seo.readability.grade} • Score ${seo.readability.score}`;
  }
  
  // Stats
  const statsContainer = document.getElementById('seoStats');
  if (statsContainer) {
    statsContainer.innerHTML = `
      <div class="stat-mini">
        <span class="stat-mini-val">${seo.h1Count || 0}</span>
        <span class="stat-mini-label">H1</span>
      </div>
      <div class="stat-mini">
        <span class="stat-mini-val">${seo.h2Count || 0}</span>
        <span class="stat-mini-label">H2</span>
      </div>
      <div class="stat-mini">
        <span class="stat-mini-val">${seo.images?.length || 0}</span>
        <span class="stat-mini-label">Images</span>
      </div>
      <div class="stat-mini">
        <span class="stat-mini-val">${seo.externalLinks || 0}</span>
        <span class="stat-mini-label">Links</span>
      </div>
    `;
  }
};

App.updateProgress = function(labelId, barId, current, max) {
  const labelEl = document.getElementById(labelId);
  const barEl = document.getElementById(barId);
  if (labelEl) labelEl.textContent = `${current}/${max}`;
  if (barEl) barEl.style.width = Math.min(100, (current / max) * 100) + '%';
};

App.calculateSEOScore = function(seo) {
  if (!seo || Object.keys(seo).length === 0) return 0;
  let score = 0;
  if (seo.title && seo.title.length >= 30 && seo.title.length <= 60) score += 20;
  if (seo.metaDesc && seo.metaDesc.length >= 120 && seo.metaDesc.length <= 160) score += 20;
  if (seo.headings && seo.headings.length >= 1) score += 20;
  if (seo.images && seo.images.length > 0 && seo.images.filter(i => i.alt).length / seo.images.length > 0.8) score += 20;
  if (seo.wordCount && seo.wordCount >= 300) score += 20;
  return score;
};

// ========== PRICE EXTRACTOR ==========

App.renderPriceList = function() {
  const prices = App.data.prices;
  const statsContainer = document.getElementById('priceStats');
  
  if (prices.length > 0) {
    const values = prices.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    
    if (document.getElementById('priceMin')) document.getElementById('priceMin').textContent = '$' + min.toFixed(2);
    if (document.getElementById('priceMax')) document.getElementById('priceMax').textContent = '$' + max.toFixed(2);
    if (document.getElementById('priceAvg')) document.getElementById('priceAvg').textContent = '$' + avg.toFixed(2);
  }
  
  const container = document.getElementById('priceList');
  if (!container) return;
  
  if (prices.length === 0) {
    container.innerHTML = App.emptyState('No Prices Found', 'Try a pricing or product page');
    return;
  }
  
  container.innerHTML = prices.slice(0, 20).map((price, i) => `
    <div class="list-item" data-action="copyPrice" data-param="${i}">
      <div class="item-content">
        <div class="item-type">${price.currency || '$'}</div>
        <div class="item-text" style="font-size:18px;font-weight:700;color:#22c55e">$${price.value.toFixed(2)}</div>
        <div class="item-meta">${App.escapeHtml(price.context?.substring(0, 40) || 'Price')}</div>
      </div>
      <button class="item-btn" data-action="copyPrice" data-param="${i}" title="Copy">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      </button>
    </div>
  `).join('');
};

App.copyPrice = function(index) {
  const price = App.data.prices[index];
  if (price) {
    App.copyToClipboard(price.raw);
    App.toast('Price copied!');
  }
};

App.comparePrices = function() {
  if (App.data.prices.length < 2) {
    App.toast('Need at least 2 prices');
    return;
  }
  const values = App.data.prices.map(p => p.value);
  const text = `Price Analysis:\nMin: $${Math.min(...values).toFixed(2)}\nMax: $${Math.max(...values).toFixed(2)}\nAvg: $${(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)}`;
  App.copyToClipboard(text);
  App.toast('Comparison copied!');
};

// ========== SOCIAL EXTRACTOR ==========

App.renderSocialList = function() {
  const container = document.getElementById('socialList');
  if (!container) return;
  
  if (App.data.social.length === 0) {
    container.innerHTML = App.emptyState('No Social Links', 'Social links will appear here');
    return;
  }
  
  container.innerHTML = App.data.social.map((s, i) => `
    <div class="list-item" data-action="openUrl" data-param="${s.url}">
      <div class="item-content">
        <div class="item-type">${s.platform}</div>
        <div class="item-text" style="color:#8b5cf6">${s.handle || s.url}</div>
        <div class="item-meta">${s.url}</div>
      </div>
      <button class="item-btn" data-action="openUrl" data-param="${s.url}" title="Open">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
      </button>
    </div>
  `).join('');
};

App.openUrl = function(url) {
  if (url) chrome.tabs.create({ url: url });
};

// ========== LINKS ANALYZER ==========

App.renderLinksList = function() {
  const container = document.getElementById('linksList');
  if (!container) return;
  
  if (App.data.links.length === 0) {
    container.innerHTML = App.emptyState('No Links', 'Links will appear here');
    return;
  }
  
  // Show summary
  const internal = App.data.links.filter(l => l.type === 'internal').length;
  const external = App.data.links.filter(l => l.type === 'external').length;
  
  const summaryEl = document.getElementById('linksSummary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="stat-mini"><span class="stat-mini-val">${internal}</span><span class="stat-mini-label">Internal</span></div>
      <div class="stat-mini"><span class="stat-mini-val">${external}</span><span class="stat-mini-label">External</span></div>
    `;
  }
  
  container.innerHTML = App.data.links.slice(0, 20).map((link, i) => `
    <div class="list-item" data-action="openUrl" data-param="${link.href}">
      <div class="item-content">
        <div class="item-type">${link.type}</div>
        <div class="item-text">${App.escapeHtml(link.text?.substring(0, 50) || link.href.substring(0, 50))}</div>
        <div class="item-meta">${link.href.substring(0, 40)}...</div>
      </div>
    </div>
  `).join('');
};

// ========== META TAGS ==========

App.renderMetasList = function() {
  const container = document.getElementById('metasList');
  if (!container) return;
  
  if (App.data.metas.length === 0) {
    container.innerHTML = App.emptyState('No Meta Tags', 'Meta tags will appear here');
    return;
  }
  
  container.innerHTML = App.data.metas.slice(0, 15).map((meta, i) => `
    <div class="list-item" data-action="copyMeta" data-param="${i}">
      <div class="item-content">
        <div class="item-type">${meta.property || meta.name || 'meta'}</div>
        <div class="item-text" style="font-size:11px">${App.escapeHtml(meta.content?.substring(0, 80))}</div>
      </div>
      <button class="item-btn" data-action="copyMeta" data-param="${i}" title="Copy">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      </button>
    </div>
  `).join('');
};

App.copyMeta = function(index) {
  const meta = App.data.metas[index];
  if (meta) {
    App.copyToClipboard(`${meta.property || meta.name}: ${meta.content}`);
    App.toast('Meta copied!');
  }
};

// ========== HEATMAP ==========

App.toggleHeatmap = async function(mode) {
  if (event && event.target) {
    document.querySelectorAll('.heatmap-toggle').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
  }
  
  App.heatmapMode = mode;
  
  try {
    const opacity = (document.getElementById('heatmapOpacitySlider')?.value || 50) / 100;
    const radius = parseInt(document.getElementById('heatmapRadiusSlider')?.value || 30);
    
    await App.sendToContent({ action: 'generateHeatmap', mode, opacity, radius });
    App.toast('Heatmap: ' + mode);
  } catch (e) {
    App.toast('Heatmap failed');
  }
};

App.clearHeatmap = async function() {
  try {
    await App.sendToContent({ action: 'clearHeatmap' });
    document.getElementById('clickMapData').innerHTML = 'Click a mode to generate heatmap';
    App.toast('Heatmap cleared');
  } catch (e) {
    App.toast('Clear failed');
  }
};

// ========== TRACKER ==========

App.trackPage = async function() {
  if (!App.currentTab) {
    App.toast('Cannot track this page');
    return;
  }
  
  const existing = App.data.tracked.find(t => t.url === App.currentTab.url);
  if (existing) {
    App.toast('Page already tracked');
    return;
  }
  
  try {
    const snapshot = await App.sendToContent({ action: 'getPageSnapshot' });
    App.data.tracked.push({
      url: App.currentTab.url,
      title: App.currentTab.title || 'Untitled',
      snapshot,
      date: new Date().toISOString()
    });
    App.saveData();
    App.renderTrackedPages();
    App.toast('Page tracked!');
  } catch (e) {
    App.toast('Tracking failed');
  }
};

App.checkChanges = async function() {
  if (App.data.tracked.length === 0) {
    App.toast('No pages tracked');
    return;
  }
  
  const tracked = App.data.tracked.find(t => t.url === App.currentTab?.url);
  if (!tracked) {
    App.toast('Track this page first');
    return;
  }
  
  try {
    const current = await App.sendToContent({ action: 'getPageSnapshot' });
    const changes = App.compareSnapshots(tracked.snapshot, current);
    
    if (changes.length === 0) {
      App.toast('No changes detected');
    } else {
      App.data.changes.unshift({
        url: App.currentTab.url,
        title: App.currentTab.title,
        changes,
        date: new Date().toISOString()
      });
      App.saveData();
      App.toast(changes.length + ' changes found!');
    }
    App.renderChanges();
  } catch (e) {
    App.toast('Check failed');
  }
};

App.compareSnapshots = function(old, current) {
  const changes = [];
  if (!old || !current) return changes;
  if (old.title !== current.title) changes.push('Title changed');
  if (old.prices?.length !== current.prices?.length) changes.push('Prices changed');
  if (old.ctas?.length !== current.ctas?.length) changes.push('CTAs changed');
  if (old.wordCount !== current.wordCount) changes.push('Content changed');
  return changes;
};

App.renderTrackedPages = function() {
  const container = document.getElementById('trackedPages');
  if (!container) return;
  
  if (App.data.tracked.length === 0) {
    container.innerHTML = App.emptyState('No Tracked Pages', 'Track a page to monitor changes');
    return;
  }
  
  container.innerHTML = App.data.tracked.map((page, i) => `
    <div class="list-item">
      <div class="item-content">
        <div class="item-type">${new Date(page.date).toLocaleDateString()}</div>
        <div class="item-text">${App.escapeHtml(page.title.substring(0, 40))}</div>
      </div>
      <button class="item-btn" data-action="removeTracked" data-param="${i}" title="Remove">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `).join('');
};

App.removeTracked = function(index) {
  App.data.tracked.splice(index, 1);
  App.saveData();
  App.renderTrackedPages();
  App.toast('Removed');
};

App.renderChanges = function() {
  const container = document.getElementById('changeHistory');
  if (!container) return;
  
  if (App.data.changes.length === 0) {
    container.innerHTML = App.emptyState('No Changes', 'Check tracked pages for changes');
    return;
  }
  
  container.innerHTML = App.data.changes.map(change => `
    <div class="list-item">
      <div class="item-content">
        <div class="item-type">${new Date(change.date).toLocaleString()}</div>
        <div class="item-text">${App.escapeHtml(change.title?.substring(0, 40) || 'Page')}</div>
        ${change.changes.map(c => `<div class="item-meta">• ${c}</div>`).join('')}
      </div>
    </div>
  `).join('');
};

// ========== DASHBOARD ==========

App.updateDashboard = function() {
  document.getElementById('dashCtas').textContent = App.data.ctas.length;
  document.getElementById('dashCtasBar').style.width = Math.min(100, App.data.ctas.length * 5) + '%';
  
  document.getElementById('dashEmails').textContent = App.data.emails.length;
  document.getElementById('dashEmailsBar').style.width = Math.min(100, App.data.emails.length * 10) + '%';
  
  document.getElementById('dashPrices').textContent = App.data.prices.length;
  document.getElementById('dashPricesBar').style.width = Math.min(100, App.data.prices.length * 10) + '%';
  
  const seoScore = App.calculateSEOScore(App.data.seo);
  document.getElementById('dashSeo').textContent = seoScore + '/100';
  document.getElementById('dashSeoBar').style.width = seoScore + '%';
};

App.updateStats = function() {
  document.getElementById('statCtas').textContent = App.data.ctas.length;
  document.getElementById('statEmails').textContent = App.data.emails.length;
  document.getElementById('statPrices').textContent = App.data.prices.length;
  document.getElementById('statSeo').textContent = App.calculateSEOScore(App.data.seo);
};

// ========== UTILITIES ==========

App.copyToClipboard = function(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  });
};

App.escapeHtml = function(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

App.emptyState = function(title, subtitle) {
  return `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p style="font-weight:600">${title}</p>
      <p style="margin-top:4px;font-size:11px">${subtitle}</p>
    </div>
  `;
};

App.toast = function(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }
};

App.exportData = function() {
  const data = JSON.stringify(App.data, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `marketing-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  App.toast('Data exported!');
};

App.clearAll = function() {
  if (confirm('Clear all collected data?')) {
    App.data = { ctas: [], emails: [], prices: [], seo: {}, social: [], links: [], metas: [], tracked: [], changes: [], saved: { ctas: [], emails: [] } };
    chrome.storage.local.remove(['mccData']);
    App.renderAll();
    App.toast('All data cleared');
  }
};

App.switchModule = function(module) {
  App.switchModule(module);
};

// Add missing functions
App.clearSavedCtas = function() {
  App.data.saved.ctas = [];
  App.saveData();
  App.renderCTAList();
  App.toast('Saved CTAs cleared');
};

App.renderSocialList = function() {
  const container = document.getElementById('socialList');
  if (!container) return;
  
  if (App.data.social.length === 0) {
    container.innerHTML = App.emptyState('No Social Links', 'Extract to find social profiles');
    return;
  }
  
  container.innerHTML = App.data.social.map((s, i) => `
    <div class="list-item" data-action="openUrl" data-param="${s.url}">
      <div class="item-content">
        <div class="item-type">${s.platform}</div>
        <div class="item-text" style="color:#8b5cf6">${s.handle || 'Profile'}</div>
        <div class="item-meta">${s.url}</div>
      </div>
      <button class="item-btn" data-action="openUrl" data-param="${s.url}" title="Open">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
      </button>
    </div>
  `).join('');
};

App.renderLinksList = function() {
  const container = document.getElementById('linksList');
  if (!container) return;
  
  if (App.data.links.length === 0) {
    container.innerHTML = App.emptyState('No Links Found', 'Analyze to find all links');
    return;
  }
  
  const internal = App.data.links.filter(l => l.type === 'internal').length;
  const external = App.data.links.filter(l => l.type === 'external').length;
  
  const summaryCard = document.getElementById('linksSummaryCard');
  const summaryEl = document.getElementById('linksSummary');
  if (summaryCard && summaryEl) {
    summaryCard.style.display = 'block';
    summaryEl.innerHTML = `
      <div class="stat-mini"><span class="stat-mini-val">${internal}</span><span class="stat-mini-label">Internal</span></div>
      <div class="stat-mini"><span class="stat-mini-val">${external}</span><span class="stat-mini-label">External</span></div>
    `;
  }
  
  container.innerHTML = App.data.links.slice(0, 20).map((link, i) => `
    <div class="list-item" data-action="openUrl" data-param="${link.href}">
      <div class="item-content">
        <div class="item-type">${link.type}</div>
        <div class="item-text">${App.escapeHtml(link.text?.substring(0, 50) || link.href.substring(0, 50))}</div>
        <div class="item-meta">${link.href.substring(0, 40)}...</div>
      </div>
    </div>
  `).join('');
};

App.renderMetasList = function() {
  const container = document.getElementById('linksList');
  if (!container) return;
  
  if (App.data.metas.length === 0) {
    container.innerHTML = App.emptyState('No Meta Tags', 'Get meta tags to view them');
    return;
  }
  
  container.innerHTML = App.data.metas.slice(0, 20).map((meta, i) => `
    <div class="list-item" data-action="copyMeta" data-param="${i}">
      <div class="item-content">
        <div class="item-type">${meta.property || meta.name || 'meta'}</div>
        <div class="item-text" style="font-size:10px">${App.escapeHtml(meta.content?.substring(0, 80))}</div>
      </div>
      <button class="item-btn" data-action="copyMeta" data-param="${i}" title="Copy">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      </button>
    </div>
  `).join('');
};

App.copyMeta = function(index) {
  const meta = App.data.metas[index];
  if (meta) {
    App.copyToClipboard(`${meta.property || meta.name}: ${meta.content}`);
    App.toast('Copied!');
  }
};
