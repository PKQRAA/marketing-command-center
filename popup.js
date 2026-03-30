// Marketing Command Center - Popup Logic v4
// Completely rebuilt with direct onclick handlers

// Global state
var scanData = {
  ctas: [],
  emails: [],
  prices: [],
  seo: {},
  social: [],
  links: [],
  metas: [],
  tracked: [],
  changes: [],
  saved: { ctas: [] }
};

var currentTab = null;
var currentModule = 'dashboard';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

function init() {
  getCurrentTab();
  loadData();
  setupTabs();
  setupSliders();
  renderAll();
}

// Get current tab
async function getCurrentTab() {
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
    document.getElementById('currentUrl').textContent = (currentTab.url || 'New Tab').substring(0, 35) + '...';
    document.getElementById('currentUrl').title = currentTab.url || '';
  } catch(e) {
    document.getElementById('currentUrl').textContent = 'Unable to get URL';
  }
}

// Load saved data
async function loadData() {
  try {
    var result = await chrome.storage.local.get(['mccData']);
    if (result.mccData) {
      scanData = result.mccData;
    }
  } catch(e) {}
}

// Save data
async function saveData() {
  try {
    await chrome.storage.local.set({ mccData: scanData });
  } catch(e) {}
}

// Tab switching
function setupTabs() {
  var tabs = document.querySelectorAll('.module-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].onclick = function() {
      switchModule(this.getAttribute('data-module'));
    };
  }
}

// Slider setup
function setupSliders() {
  var opacitySlider = document.getElementById('heatmapOpacitySlider');
  var radiusSlider = document.getElementById('heatmapRadiusSlider');
  
  if (opacitySlider) {
    opacitySlider.oninput = function() {
      document.getElementById('heatmapOpacity').textContent = this.value + '%';
    };
  }
  
  if (radiusSlider) {
    radiusSlider.oninput = function() {
      document.getElementById('heatmapRadius').textContent = this.value + 'px';
    };
  }
}

// Switch module
function switchModule(module) {
  currentModule = module;
  var tabs = document.querySelectorAll('.module-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove('active');
    if (tabs[i].getAttribute('data-module') === module) {
      tabs[i].classList.add('active');
    }
  }
  
  var modules = document.querySelectorAll('.module');
  for (var i = 0; i < modules.length; i++) {
    modules[i].classList.remove('active');
  }
  document.getElementById('module-' + module).classList.add('active');
}

// Render all
function renderAll() {
  updateStats();
  renderCTAList();
  renderEmailList();
  renderPriceList();
  renderSocialList();
  renderLinksList();
  renderTrackedPages();
  renderChanges();
  renderSEO();
}

// ========== SCANNING FUNCTIONS ==========

async function scanAll() {
  // Refresh current tab
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
  } catch(e) {}
  
  if (!currentTab || !currentTab.id) {
    showToast('Cannot scan this page');
    return;
  }
  
  // Check if URL is valid
  if (!currentTab.url || currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('about:') || currentTab.url.startsWith('file://')) {
    showToast('Open a website first (not chrome://)');
    return;
  }
  
  showToast('Scanning...');
  try {
    var results = await sendMessage({ action: 'fullScan' });
    if (!results || results.error) {
      showToast('Reload the page and try again');
      return;
    }
    scanData.ctas = results.ctas || [];
    scanData.emails = results.emails || [];
    scanData.prices = results.prices || [];
    scanData.seo = results.seo || {};
    scanData.social = results.social || [];
    scanData.links = results.links || [];
    await saveData();
    renderAll();
    showToast('Done! ' + scanData.ctas.length + ' CTAs, ' + scanData.emails.length + ' emails');
  } catch(e) {
    showToast('Error: ' + (e.message || 'Reload page'));
  }
}

async function scanCTAs() {
  // Refresh tab
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
  } catch(e) {}
  
  if (!currentTab || !currentTab.url || currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('about:')) {
    showToast('Open a website first');
    return;
  }
  
  showToast('Scanning CTAs...');
  try {
    var results = await sendMessage({ action: 'scanCTAs' });
    scanData.ctas = results || [];
    await saveData();
    renderCTAList();
    updateStats();
    showToast('Found ' + scanData.ctas.length + ' CTAs');
  } catch(e) {
    showToast('Reload page and try again');
  }
}

async function scanEmails() {
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
  } catch(e) {}
  
  if (!currentTab || !currentTab.url || currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('about:')) {
    showToast('Open a website first');
    return;
  }
  
  showToast('Finding emails...');
  try {
    var results = await sendMessage({ action: 'scanEmails' });
    scanData.emails = results || [];
    await saveData();
    renderEmailList();
    updateStats();
    showToast('Found ' + scanData.emails.length + ' emails');
  } catch(e) {
    showToast('Reload page and try again');
  }
}

async function scanPrices() {
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
  } catch(e) {}
  
  if (!currentTab || !currentTab.url || currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('about:')) {
    showToast('Open a website first');
    return;
  }
  
  showToast('Extracting prices...');
  try {
    var results = await sendMessage({ action: 'scanPrices' });
    scanData.prices = results || [];
    await saveData();
    renderPriceList();
    updateStats();
    showToast('Found ' + scanData.prices.length + ' prices');
  } catch(e) {
    showToast('Reload page and try again');
  }
}

async function analyzeSEO() {
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
  } catch(e) {}
  
  if (!currentTab || !currentTab.url || currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('about:')) {
    showToast('Open a website first');
    return;
  }
  
  showToast('Analyzing SEO...');
  try {
    var results = await sendMessage({ action: 'analyzeSEO' });
    scanData.seo = results || {};
    await saveData();
    renderSEO();
    updateStats();
    showToast('SEO Score: ' + calcSEOScore(scanData.seo));
  } catch(e) {
    showToast('Reload page and try again');
  }
}

async function extractSocial() {
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
  } catch(e) {}
  
  if (!currentTab || !currentTab.url || currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('about:')) {
    showToast('Open a website first');
    return;
  }
  
  showToast('Extracting social links...');
  try {
    var results = await sendMessage({ action: 'extractSocial' });
    scanData.social = results || [];
    await saveData();
    renderSocialList();
    showToast('Found ' + scanData.social.length + ' social links');
  } catch(e) {
    showToast('Reload page and try again');
  }
}

async function analyzeLinks() {
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
  } catch(e) {}
  
  if (!currentTab || !currentTab.url || currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('about:')) {
    showToast('Open a website first');
    return;
  }
  
  showToast('Analyzing links...');
  try {
    var results = await sendMessage({ action: 'analyzeLinks' });
    scanData.links = results || [];
    await saveData();
    renderLinksList();
    showToast('Found ' + scanData.links.length + ' links');
  } catch(e) {
    showToast('Reload page and try again');
  }
}

async function getMetas() {
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
  } catch(e) {}
  
  if (!currentTab || !currentTab.url || currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('about:')) {
    showToast('Open a website first');
    return;
  }
  
  showToast('Getting meta tags...');
  try {
    var results = await sendMessage({ action: 'getMetas' });
    scanData.metas = results || [];
    await saveData();
    renderLinksList();
    showToast('Found ' + scanData.metas.length + ' meta tags');
  } catch(e) {
    showToast('Reload page and try again');
  }
}

// Send message to content script
function sendMessage(msg) {
  return new Promise(function(resolve, reject) {
    if (!currentTab || !currentTab.id) {
      reject(new Error('No tab'));
      return;
    }
    
    // Check if URL is accessible
    if (!currentTab.url || currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('about:')) {
      reject(new Error('Cannot scan this page. Try a website like amazon.com'));
      return;
    }
    
    chrome.tabs.sendMessage(currentTab.id, msg, function(response) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

// ========== CTA SPY ==========

function renderCTAList() {
  var container = document.getElementById('ctaList');
  if (!container) return;
  
  if (scanData.ctas.length === 0) {
    container.innerHTML = emptyState('No CTAs Found', 'Click Scan to find CTAs');
    return;
  }
  
  var html = '';
  for (var i = 0; i < Math.min(scanData.ctas.length, 20); i++) {
    var cta = scanData.ctas[i];
    html += '<div class="list-item">';
    html += '<div class="item-content">';
    html += '<div class="item-type">' + (cta.type || 'text') + '</div>';
    html += '<div class="item-text">' + escapeHtml(cta.text.substring(0, 60)) + '</div>';
    html += '<div class="item-meta">' + cta.tag + ' • ' + cta.chars + ' chars</div>';
    html += '</div>';
    html += '<div class="item-actions">';
    html += '<button class="item-btn" onclick="saveCTA(' + i + ')" title="Save">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>';
    html += '</button>';
    html += '<button class="item-btn" onclick="copyCTA(' + i + ')" title="Copy">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
    html += '</button>';
    html += '</div></div>';
  }
  container.innerHTML = html;
  
  // Render saved
  var savedSection = document.getElementById('savedCtasSection');
  var savedContainer = document.getElementById('savedCtas');
  if (savedSection && savedContainer) {
    if (scanData.saved.ctas.length > 0) {
      savedSection.style.display = 'block';
      var savedHtml = '';
      for (var j = 0; j < scanData.saved.ctas.length; j++) {
        var saved = scanData.saved.ctas[j];
        savedHtml += '<div class="list-item">';
        savedHtml += '<div class="item-content">';
        savedHtml += '<div class="item-type">Saved</div>';
        savedHtml += '<div class="item-text">' + escapeHtml(saved.text.substring(0, 50)) + '</div>';
        savedHtml += '</div>';
        savedHtml += '<button class="item-btn" onclick="removeSavedCTA(' + j + ')">';
        savedHtml += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        savedHtml += '</button></div>';
      }
      savedContainer.innerHTML = savedHtml;
    } else {
      savedSection.style.display = 'none';
    }
  }
}

function copyCTA(index) {
  var text = scanData.ctas[index] ? scanData.ctas[index].text : '';
  if (text) {
    copyToClipboard(text);
    showToast('CTA copied!');
  }
}

function saveCTA(index) {
  var cta = scanData.ctas[index];
  if (cta) {
    var exists = false;
    for (var i = 0; i < scanData.saved.ctas.length; i++) {
      if (scanData.saved.ctas[i].text === cta.text) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      scanData.saved.ctas.push(cta);
      saveData();
      renderCTAList();
      showToast('CTA saved!');
    } else {
      showToast('Already saved');
    }
  }
}

function removeSavedCTA(index) {
  scanData.saved.ctas.splice(index, 1);
  saveData();
  renderCTAList();
  showToast('Removed');
}

function copyAllCTAs() {
  if (scanData.ctas.length === 0) {
    showToast('No CTAs to copy');
    return;
  }
  var text = '';
  for (var i = 0; i < scanData.ctas.length; i++) {
    text += scanData.ctas[i].text + '\n';
  }
  copyToClipboard(text);
  showToast('Copied ' + scanData.ctas.length + ' CTAs!');
}

function clearSavedCtas() {
  scanData.saved.ctas = [];
  saveData();
  renderCTAList();
  showToast('Saved CTAs cleared');
}

// ========== EMAIL FINDER ==========

function renderEmailList() {
  var container = document.getElementById('emailList');
  if (!container) return;
  
  if (scanData.emails.length === 0) {
    container.innerHTML = emptyState('No Emails Found', 'Try an About page');
    return;
  }
  
  var html = '';
  for (var i = 0; i < Math.min(scanData.emails.length, 20); i++) {
    var email = scanData.emails[i];
    html += '<div class="list-item">';
    html += '<div class="item-content">';
    html += '<div class="item-type">' + (email.type || 'email') + '</div>';
    html += '<div class="item-text" style="color:#14b8a6">' + email.address + '</div>';
    html += '<div class="item-meta">' + escapeHtml((email.context || 'Found').substring(0, 40)) + '</div>';
    html += '</div>';
    html += '<button class="item-btn" onclick="copyEmail(' + i + ')">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
    html += '</button></div>';
  }
  container.innerHTML = html;
}

function copyEmail(index) {
  var email = scanData.emails[index] ? scanData.emails[index].address : '';
  if (email) {
    copyToClipboard(email);
    showToast('Email copied!');
  }
}

function copyAllEmails() {
  if (scanData.emails.length === 0) {
    showToast('No emails');
    return;
  }
  var text = '';
  for (var i = 0; i < scanData.emails.length; i++) {
    text += scanData.emails[i].address + '\n';
  }
  copyToClipboard(text);
  showToast('Copied ' + scanData.emails.length + ' emails!');
}

// ========== PRICE EXTRACTOR ==========

function renderPriceList() {
  var prices = scanData.prices;
  
  // Update stats
  if (prices.length > 0) {
    var values = [];
    for (var i = 0; i < prices.length; i++) {
      values.push(prices[i].value);
    }
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var avg = values.reduce(function(a, b) { return a + b; }, 0) / values.length;
    
    var minEl = document.getElementById('priceMin');
    var maxEl = document.getElementById('priceMax');
    var avgEl = document.getElementById('priceAvg');
    if (minEl) minEl.textContent = '$' + min.toFixed(2);
    if (maxEl) maxEl.textContent = '$' + max.toFixed(2);
    if (avgEl) avgEl.textContent = '$' + avg.toFixed(2);
  }
  
  var container = document.getElementById('priceList');
  if (!container) return;
  
  if (prices.length === 0) {
    container.innerHTML = emptyState('No Prices Found', 'Try a product page');
    return;
  }
  
  var html = '';
  for (var i = 0; i < Math.min(prices.length, 20); i++) {
    var price = prices[i];
    html += '<div class="list-item">';
    html += '<div class="item-content">';
    html += '<div class="item-type">$' + price.value.toFixed(2) + '</div>';
    html += '<div class="item-text" style="font-size:16px;font-weight:700;color:#22c55e">$' + price.value.toFixed(2) + '</div>';
    html += '<div class="item-meta">' + escapeHtml((price.context || 'Price').substring(0, 35)) + '</div>';
    html += '</div>';
    html += '<button class="item-btn" onclick="copyPrice(' + i + ')">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
    html += '</button></div>';
  }
  container.innerHTML = html;
}

function copyPrice(index) {
  var price = scanData.prices[index] ? scanData.prices[index].raw : '';
  if (price) {
    copyToClipboard(price);
    showToast('Price copied!');
  }
}

function comparePrices() {
  if (scanData.prices.length < 2) {
    showToast('Need 2+ prices');
    return;
  }
  var values = [];
  for (var i = 0; i < scanData.prices.length; i++) {
    values.push(scanData.prices[i].value);
  }
  var text = 'Price Analysis\nMin: $' + Math.min.apply(null, values).toFixed(2) + 
             '\nMax: $' + Math.max.apply(null, values).toFixed(2) + 
             '\nAvg: $' + (values.reduce(function(a, b) { return a + b; }, 0) / values.length).toFixed(2);
  copyToClipboard(text);
  showToast('Comparison copied!');
}

// ========== SEO ANALYZER ==========

function renderSEO() {
  var seo = scanData.seo;
  var score = calcSEOScore(seo);
  
  var scoreEl = document.getElementById('seoScore');
  if (scoreEl) {
    scoreEl.textContent = score;
    scoreEl.className = 'score-circle ' + (score >= 80 ? 'score-good' : score >= 60 ? 'score-medium' : 'score-bad');
  }
  
  // Stats
  var statsEl = document.getElementById('seoStats');
  if (statsEl) {
    statsEl.innerHTML = '<div class="stat-mini"><span class="stat-mini-val">' + (seo.h1Count || 0) + '</span><span class="stat-mini-label">H1</span></div>' +
                        '<div class="stat-mini"><span class="stat-mini-val">' + (seo.h2Count || 0) + '</span><span class="stat-mini-label">H2</span></div>' +
                        '<div class="stat-mini"><span class="stat-mini-val">' + (seo.images ? seo.images.length : 0) + '</span><span class="stat-mini-label">Images</span></div>' +
                        '<div class="stat-mini"><span class="stat-mini-val">' + (seo.externalLinks || 0) + '</span><span class="stat-mini-label">Links</span></div>';
  }
  
  // Title
  updateProgress('seoTitle', 'seoTitleBar', seo.title ? seo.title.length : 0, 60);
  // Meta
  updateProgress('seoMeta', 'seoMetaBar', seo.metaDesc ? seo.metaDesc.length : 0, 160);
  // Headings
  updateProgress('seoHeadings', 'seoHeadingsBar', seo.headings ? seo.headings.length : 0, 6);
  
  // Images
  var imgPercent = 0;
  if (seo.images && seo.images.length > 0) {
    var withAlt = 0;
    for (var i = 0; i < seo.images.length; i++) {
      if (seo.images[i].alt) withAlt++;
    }
    imgPercent = (withAlt / seo.images.length) * 100;
  }
  updateProgress('seoImages', 'seoImagesBar', imgPercent, 100, true);
  
  // Content
  var wordCount = seo.wordCount || 0;
  updateProgress('seoContent', 'seoContentBar', wordCount / 10, 30);
  
  // Readability
  var readEl = document.getElementById('seoReadability');
  if (readEl && seo.readability) {
    readEl.textContent = 'Grade ' + seo.readability.grade + ' • Score ' + seo.readability.score;
  }
  
  // Keywords
  var keywordsCard = document.getElementById('seoKeywordsCard');
  var keywordsEl = document.getElementById('seoKeywords');
  if (keywordsCard && keywordsEl && seo.keywords && seo.keywords.length > 0) {
    keywordsCard.style.display = 'block';
    var kwHtml = '';
    for (var j = 0; j < Math.min(seo.keywords.length, 12); j++) {
      var kw = seo.keywords[j];
      kwHtml += '<span class="keyword-tag">' + kw.word + ' <span class="keyword-count">' + kw.count + 'x</span></span>';
    }
    keywordsEl.innerHTML = kwHtml;
  }
}

function updateProgress(labelId, barId, current, max, isPercent) {
  var labelEl = document.getElementById(labelId);
  var barEl = document.getElementById(barId);
  if (labelEl) {
    labelEl.textContent = isPercent ? Math.round(current) + '%' : current + '/' + max;
  }
  if (barEl) {
    barEl.style.width = Math.min(100, (current / max) * 100) + '%';
  }
}

function calcSEOScore(seo) {
  if (!seo || Object.keys(seo).length === 0) return 0;
  var score = 0;
  if (seo.title && seo.title.length >= 30 && seo.title.length <= 60) score += 20;
  if (seo.metaDesc && seo.metaDesc.length >= 120 && seo.metaDesc.length <= 160) score += 20;
  if (seo.headings && seo.headings.length >= 1) score += 20;
  if (seo.images && seo.images.length > 0) {
    var withAlt = 0;
    for (var i = 0; i < seo.images.length; i++) {
      if (seo.images[i].alt) withAlt++;
    }
    if (withAlt / seo.images.length > 0.8) score += 20;
  }
  if (seo.wordCount && seo.wordCount >= 300) score += 20;
  return score;
}

// ========== SOCIAL LINKS ==========

function renderSocialList() {
  var container = document.getElementById('socialList');
  if (!container) return;
  
  if (scanData.social.length === 0) {
    container.innerHTML = emptyState('No Social Links', 'Extract to find social profiles');
    return;
  }
  
  var html = '';
  for (var i = 0; i < Math.min(scanData.social.length, 15); i++) {
    var s = scanData.social[i];
    html += '<div class="list-item" onclick="openUrl(\'' + escapeAttr(s.url) + '\')">';
    html += '<div class="item-content">';
    html += '<div class="item-type">' + s.platform + '</div>';
    html += '<div class="item-text" style="color:#8b5cf6">' + (s.handle || 'Profile') + '</div>';
    html += '<div class="item-meta">' + s.url.substring(0, 50) + '</div>';
    html += '</div>';
    html += '<button class="item-btn" onclick="event.stopPropagation();openUrl(\'' + escapeAttr(s.url) + '\')">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>';
    html += '</button></div>';
  }
  container.innerHTML = html;
}

function openUrl(url) {
  if (url) chrome.tabs.create({ url: url });
}

// ========== LINKS / METAS ==========

function renderLinksList() {
  var container = document.getElementById('linksList');
  if (!container) return;
  
  var items = scanData.metas.length > 0 ? scanData.metas : scanData.links;
  
  if (items.length === 0) {
    container.innerHTML = emptyState('Nothing Found', 'Analyze links or metas');
    return;
  }
  
  // Summary
  var summaryCard = document.getElementById('linksSummaryCard');
  var summaryEl = document.getElementById('linksSummary');
  if (scanData.links.length > 0 && summaryCard && summaryEl) {
    var internal = 0, external = 0;
    for (var i = 0; i < scanData.links.length; i++) {
      if (scanData.links[i].type === 'internal') internal++;
      else external++;
    }
    summaryCard.style.display = 'block';
    summaryEl.innerHTML = '<div class="stat-mini"><span class="stat-mini-val">' + internal + '</span><span class="stat-mini-label">Internal</span></div>' +
                          '<div class="stat-mini"><span class="stat-mini-val">' + external + '</span><span class="stat-mini-label">External</span></div>';
  }
  
  var html = '';
  for (var i = 0; i < Math.min(items.length, 20); i++) {
    var item = items[i];
    var type = item.property || item.name || item.type || 'link';
    var content = item.content || item.href || item.text || '';
    
    html += '<div class="list-item">';
    html += '<div class="item-content">';
    html += '<div class="item-type">' + type + '</div>';
    html += '<div class="item-text" style="font-size:10px">' + escapeHtml(content.substring(0, 60)) + '</div>';
    html += '</div>';
    html += '<button class="item-btn" onclick="copyItem(\'' + escapeAttr(content) + '\')">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
    html += '</button></div>';
  }
  container.innerHTML = html;
}

function copyItem(text) {
  copyToClipboard(text);
  showToast('Copied!');
}

// ========== TRACKER ==========

async function trackPage() {
  if (!currentTab) {
    showToast('Cannot track');
    return;
  }
  
  // Check if already tracked
  for (var i = 0; i < scanData.tracked.length; i++) {
    if (scanData.tracked[i].url === currentTab.url) {
      showToast('Already tracked');
      return;
    }
  }
  
  showToast('Tracking page...');
  try {
    var snapshot = await sendMessage({ action: 'getPageSnapshot' });
    scanData.tracked.push({
      url: currentTab.url,
      title: currentTab.title || 'Untitled',
      snapshot: snapshot,
      date: new Date().toISOString()
    });
    await saveData();
    renderTrackedPages();
    showToast('Page tracked!');
  } catch(e) {
    showToast('Tracking failed');
  }
}

async function checkChanges() {
  if (scanData.tracked.length === 0) {
    showToast('No tracked pages');
    return;
  }
  
  var tracked = null;
  for (var i = 0; i < scanData.tracked.length; i++) {
    if (scanData.tracked[i].url === currentTab.url) {
      tracked = scanData.tracked[i];
      break;
    }
  }
  
  if (!tracked) {
    showToast('Track this page first');
    return;
  }
  
  showToast('Checking changes...');
  try {
    var current = await sendMessage({ action: 'getPageSnapshot' });
    var changes = [];
    
    if (tracked.snapshot.title !== current.title) changes.push('Title changed');
    if (tracked.snapshot.prices.length !== current.prices.length) changes.push('Prices changed');
    if (tracked.snapshot.ctas.length !== current.ctas.length) changes.push('CTAs changed');
    if (tracked.snapshot.wordCount !== current.wordCount) changes.push('Content changed');
    
    if (changes.length === 0) {
      showToast('No changes detected');
    } else {
      scanData.changes.unshift({
        url: currentTab.url,
        title: currentTab.title,
        changes: changes,
        date: new Date().toISOString()
      });
      await saveData();
      showToast(changes.length + ' changes found!');
    }
    renderChanges();
  } catch(e) {
    showToast('Check failed');
  }
}

function renderTrackedPages() {
  var container = document.getElementById('trackedPages');
  if (!container) return;
  
  if (scanData.tracked.length === 0) {
    container.innerHTML = emptyState('No Tracked Pages', 'Track a page to monitor');
    return;
  }
  
  var html = '';
  for (var i = 0; i < scanData.tracked.length; i++) {
    var page = scanData.tracked[i];
    html += '<div class="list-item">';
    html += '<div class="item-content">';
    html += '<div class="item-type">' + new Date(page.date).toLocaleDateString() + '</div>';
    html += '<div class="item-text">' + escapeHtml(page.title.substring(0, 40)) + '</div>';
    html += '</div>';
    html += '<button class="item-btn" onclick="removeTracked(' + i + ')">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    html += '</button></div>';
  }
  container.innerHTML = html;
}

function removeTracked(index) {
  scanData.tracked.splice(index, 1);
  saveData();
  renderTrackedPages();
  showToast('Removed');
}

function renderChanges() {
  var container = document.getElementById('changeHistory');
  if (!container) return;
  
  if (scanData.changes.length === 0) {
    container.innerHTML = emptyState('No Changes', 'Check tracked pages');
    return;
  }
  
  var html = '';
  for (var i = 0; i < Math.min(scanData.changes.length, 10); i++) {
    var change = scanData.changes[i];
    html += '<div class="list-item">';
    html += '<div class="item-content">';
    html += '<div class="item-type">' + new Date(change.date).toLocaleString() + '</div>';
    html += '<div class="item-text">' + escapeHtml((change.title || 'Page').substring(0, 40)) + '</div>';
    for (var j = 0; j < change.changes.length; j++) {
      html += '<div class="item-meta">• ' + change.changes[j] + '</div>';
    }
    html += '</div></div>';
  }
  container.innerHTML = html;
}

// ========== HEATMAP ==========

async function toggleHeatmap(mode) {
  var toggles = document.querySelectorAll('.heatmap-toggle');
  for (var i = 0; i < toggles.length; i++) {
    toggles[i].classList.remove('active');
  }
  event.target.classList.add('active');
  
  var opacity = (document.getElementById('heatmapOpacitySlider').value || 50) / 100;
  var radius = parseInt(document.getElementById('heatmapRadiusSlider').value || 30);
  
  try {
    await sendMessage({ action: 'generateHeatmap', mode: mode, opacity: opacity, radius: radius });
    showToast('Heatmap: ' + mode);
  } catch(e) {
    showToast('Heatmap failed');
  }
}

async function clearHeatmap() {
  try {
    await sendMessage({ action: 'clearHeatmap' });
    showToast('Heatmap cleared');
  } catch(e) {}
}

// ========== PDF REPORT ==========

function generatePDF() {
  var report = 'MARKETING COMMAND CENTER - SCAN REPORT\n';
  report += '==========================================\n\n';
  report += 'Generated: ' + new Date().toLocaleString() + '\n\n';
  
  if (currentTab) {
    report += 'URL: ' + currentTab.url + '\n';
    report += 'Title: ' + currentTab.title + '\n\n';
  }
  
  // SEO Score
  var seoScore = calcSEOScore(scanData.seo);
  report += 'SEO SCORE: ' + seoScore + '/100\n';
  report += '-'.repeat(40) + '\n';
  if (scanData.seo.title) report += 'Title: ' + scanData.seo.title + '\n';
  if (scanData.seo.metaDesc) report += 'Meta: ' + scanData.seo.metaDesc.substring(0, 100) + '...\n';
  report += 'H1 Tags: ' + (scanData.seo.h1Count || 0) + '\n';
  report += 'H2 Tags: ' + (scanData.seo.h2Count || 0) + '\n';
  report += 'Images: ' + (scanData.seo.images ? scanData.seo.images.length : 0) + '\n';
  report += 'Word Count: ' + (scanData.seo.wordCount || 0) + '\n';
  report += '\n';
  
  // CTAs
  report += 'CTAs FOUND: ' + scanData.ctas.length + '\n';
  report += '-'.repeat(40) + '\n';
  for (var i = 0; i < Math.min(scanData.ctas.length, 10); i++) {
    report += '[' + scanData.ctas[i].type + '] ' + scanData.ctas[i].text.substring(0, 60) + '\n';
  }
  report += '\n';
  
  // Emails
  report += 'EMAILS FOUND: ' + scanData.emails.length + '\n';
  report += '-'.repeat(40) + '\n';
  for (var j = 0; j < Math.min(scanData.emails.length, 10); j++) {
    report += scanData.emails[j].address + '\n';
  }
  report += '\n';
  
  // Prices
  report += 'PRICES FOUND: ' + scanData.prices.length + '\n';
  report += '-'.repeat(40) + '\n';
  if (scanData.prices.length > 0) {
    var values = scanData.prices.map(function(p) { return p.value; });
    report += 'Min: $' + Math.min.apply(null, values).toFixed(2) + '\n';
    report += 'Max: $' + Math.max.apply(null, values).toFixed(2) + '\n';
    report += 'Avg: $' + (values.reduce(function(a, b) { return a + b; }, 0) / values.length).toFixed(2) + '\n';
  }
  report += '\n';
  
  // Social
  report += 'SOCIAL LINKS: ' + scanData.social.length + '\n';
  report += '-'.repeat(40) + '\n';
  for (var k = 0; k < Math.min(scanData.social.length, 10); k++) {
    report += scanData.social[k].platform + ': ' + scanData.social[k].url + '\n';
  }
  report += '\n';
  
  // Keywords
  if (scanData.seo.keywords && scanData.seo.keywords.length > 0) {
    report += 'TOP KEYWORDS:\n';
    report += '-'.repeat(40) + '\n';
    for (var m = 0; m < Math.min(scanData.seo.keywords.length, 15); m++) {
      report += scanData.seo.keywords[m].word + ': ' + scanData.seo.keywords[m].count + '\n';
    }
  }
  
  // Download as text file (PDF requires library)
  var blob = new Blob([report], { type: 'text/plain' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'marketing-report-' + new Date().toISOString().split('T')[0] + '.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Report downloaded!');
}

// ========== UTILITIES ==========

function updateStats() {
  document.getElementById('statCtas').textContent = scanData.ctas.length;
  document.getElementById('statEmails').textContent = scanData.emails.length;
  document.getElementById('statPrices').textContent = scanData.prices.length;
  document.getElementById('statSeo').textContent = calcSEOScore(scanData.seo);
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text) {
  if (!text) return '';
  return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function emptyState(title, subtitle) {
  return '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p style="font-weight:600">' + title + '</p><p style="font-size:10px;margin-top:4px">' + subtitle + '</p></div>';
}

function showToast(message) {
  var toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(function() {
      toast.classList.remove('show');
    }, 2000);
  }
}

function exportData() {
  var data = JSON.stringify(scanData, null, 2);
  var blob = new Blob([data], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'marketing-data-' + new Date().toISOString().split('T')[0] + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Data exported!');
}

function clearAll() {
  if (confirm('Clear all collected data?')) {
    scanData = { ctas: [], emails: [], prices: [], seo: {}, social: [], links: [], metas: [], tracked: [], changes: [], saved: { ctas: [] } };
    chrome.storage.local.remove(['mccData']);
    renderAll();
    showToast('All data cleared');
  }
}
