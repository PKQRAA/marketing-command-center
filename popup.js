// Marketing Command Center v6 - Complete with PDF & All Features

var data = {
  ctas: [],
  emails: [],
  prices: [],
  social: [],
  links: [],
  metas: [],
  seo: {},
  tracked: []
};

var currentTab = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  await getCurrentTab();
  setupButtons();
  loadData();
}

async function getCurrentTab() {
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
    document.getElementById('currentUrl').textContent = currentTab.url.substring(0, 60);
  } catch(e) {
    showError('Error getting URL');
  }
}

function loadData() {
  chrome.storage.local.get(['mccData'], function(result) {
    if (result.mccData) {
      data = result.mccData;
      updateStats();
      renderAll();
    }
  });
}

function saveData() {
  chrome.storage.local.set({ mccData: data });
}

// Tab Switching
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  
  document.querySelector('.tab:nth-child(' + (['scan','cta','email','price','social','seo','links'].indexOf(tab) + 1) + ')').classList.add('active');
  document.getElementById('page-' + tab).classList.add('active');
}

// Setup Buttons
function setupButtons() {
  // Main buttons
  document.getElementById('btnScan').onclick = scanAll;
  document.getElementById('btnCTAs').onclick = scanCTAs;
  document.getElementById('btnEmails').onclick = scanEmails;
  document.getElementById('btnPrices').onclick = scanPrices;
  document.getElementById('btnSocial').onclick = scanSocial;
  document.getElementById('btnSEO').onclick = analyzeSEO;
  document.getElementById('btnLinks').onclick = scanLinks;
  document.getElementById('btnMetas').onclick = scanMetas;
  
  // CTA page
  document.getElementById('btnScanCTA').onclick = scanCTAs;
  document.getElementById('btnCopyAllCTA').onclick = copyAllCTAs;
  
  // Email page
  document.getElementById('btnScanEmail').onclick = scanEmails;
  document.getElementById('btnCopyAllEmail').onclick = copyAllEmails;
  
  // Price page
  document.getElementById('btnScanPrice').onclick = scanPrices;
  
  // Social page
  document.getElementById('btnScanSocial').onclick = scanSocial;
  
  // SEO page
  document.getElementById('btnAnalyzeSEO').onclick = analyzeSEO;
  
  // Links page
  document.getElementById('btnScanLinks').onclick = scanLinks;
  document.getElementById('btnScanMetas').onclick = scanMetas;
  
  // Export
  document.getElementById('btnPDF').onclick = generatePDF;
  document.getElementById('btnExport').onclick = exportJSON;
  document.getElementById('btnClear').onclick = clearAll;
  
  // Footer
  document.getElementById('btnScanFooter').onclick = scanAll;
  document.getElementById('btnPDFFooter').onclick = generatePDF;
  document.getElementById('btnExportFooter').onclick = exportJSON;
}

// Send message to content script
function sendMsg(msg) {
  return new Promise(function(resolve, reject) {
    if (!currentTab || !currentTab.id) {
      reject('No tab');
      return;
    }
    if (currentTab.url.indexOf('chrome://') === 0 || currentTab.url.indexOf('about:') === 0) {
      reject('Open a website first');
      return;
    }
    chrome.tabs.sendMessage(currentTab.id, msg, function(response) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else {
        resolve(response);
      }
    });
  });
}

// Scan All
async function scanAll() {
  if (!currentTab || currentTab.url.indexOf('chrome://') === 0) {
    showError('Open a website first');
    return;
  }
  showToast('Scanning...');
  try {
    var result = await sendMsg({ action: 'fullScan' });
    data.ctas = result.ctas || [];
    data.emails = result.emails || [];
    data.prices = result.prices || [];
    data.social = result.social || [];
    data.links = result.links || [];
    data.metas = result.metas || [];
    data.seo = result.seo || {};
    saveData();
    updateStats();
    renderAll();
    showToast('Found ' + data.ctas.length + ' CTAs, ' + data.emails.length + ' emails');
  } catch(e) {
    showError('Reload page and try again');
  }
}

// Scan CTAs
async function scanCTAs() {
  showToast('Scanning CTAs...');
  try {
    var result = await sendMsg({ action: 'scanCTAs' });
    data.ctas = result || [];
    saveData();
    updateStats();
    renderCTAs();
    showToast('Found ' + data.ctas.length + ' CTAs');
  } catch(e) {
    showError('Reload page');
  }
}

// Scan Emails
async function scanEmails() {
  showToast('Finding emails...');
  try {
    var result = await sendMsg({ action: 'scanEmails' });
    data.emails = result || [];
    saveData();
    updateStats();
    renderEmails();
    showToast('Found ' + data.emails.length + ' emails');
  } catch(e) {
    showError('Reload page');
  }
}

// Scan Prices
async function scanPrices() {
  showToast('Extracting prices...');
  try {
    var result = await sendMsg({ action: 'scanPrices' });
    data.prices = result || [];
    saveData();
    updateStats();
    renderPrices();
    showToast('Found ' + data.prices.length + ' prices');
  } catch(e) {
    showError('Reload page');
  }
}

// Scan Social
async function scanSocial() {
  showToast('Finding social links...');
  try {
    var result = await sendMsg({ action: 'scanSocial' });
    data.social = result || [];
    saveData();
    updateStats();
    renderSocial();
    showToast('Found ' + data.social.length + ' social links');
  } catch(e) {
    showError('Reload page');
  }
}

// Analyze SEO
async function analyzeSEO() {
  showToast('Analyzing SEO...');
  try {
    var result = await sendMsg({ action: 'analyzeSEO' });
    data.seo = result || {};
    saveData();
    updateStats();
    renderSEO();
    showToast('SEO Score: ' + calcSEOScore());
  } catch(e) {
    showError('Reload page');
  }
}

// Scan Links
async function scanLinks() {
  showToast('Analyzing links...');
  try {
    var result = await sendMsg({ action: 'scanLinks' });
    data.links = result || [];
    saveData();
    renderLinks();
    showToast('Found ' + data.links.length + ' links');
  } catch(e) {
    showError('Reload page');
  }
}

// Scan Meta Tags
async function scanMetas() {
  showToast('Getting meta tags...');
  try {
    var result = await sendMsg({ action: 'scanMetas' });
    data.metas = result || [];
    saveData();
    renderMetas();
    showToast('Found ' + data.metas.length + ' meta tags');
  } catch(e) {
    showError('Reload page');
  }
}

// Update Stats
function updateStats() {
  document.getElementById('sCtas').textContent = data.ctas.length;
  document.getElementById('sEmails').textContent = data.emails.length;
  document.getElementById('sPrices').textContent = data.prices.length;
  document.getElementById('sSocial').textContent = data.social.length;
  document.getElementById('sSeo').textContent = calcSEOScore();
}

// Render All
function renderAll() {
  renderCTAs();
  renderEmails();
  renderPrices();
  renderSocial();
  renderSEO();
  renderLinks();
}

// Render CTAs
function renderCTAs() {
  var container = document.getElementById('ctaList');
  document.getElementById('ctaCount').textContent = data.ctas.length;
  
  if (data.ctas.length === 0) {
    container.innerHTML = '<div class="empty">No CTAs found. Click "Scan CTAs" to find.</div>';
    return;
  }
  
  var html = '';
  for (var i = 0; i < Math.min(data.ctas.length, 15); i++) {
    var cta = data.ctas[i];
    html += '<div class="result">';
    html += '<span class="result-item badge badge-cta">' + cta.type + '</span>';
    html += '<span class="result-text">' + escapeHtml(cta.text.substring(0, 50)) + '</span>';
    html += '<button class="copy-btn" onclick="copyText(\'' + escapeAttr(cta.text) + '\')">Copy</button>';
    html += '</div>';
  }
  container.innerHTML = html;
}

// Render Emails
function renderEmails() {
  var container = document.getElementById('emailList');
  document.getElementById('emailCount').textContent = data.emails.length;
  
  if (data.emails.length === 0) {
    container.innerHTML = '<div class="empty">No emails found. Try an About page.</div>';
    return;
  }
  
  var html = '';
  for (var i = 0; i < Math.min(data.emails.length, 15); i++) {
    var email = data.emails[i];
    html += '<div class="result">';
    html += '<span class="result-item badge badge-email">@</span>';
    html += '<span class="result-text" style="color:#14b8a6">' + email.address + '</span>';
    html += '<button class="copy-btn" onclick="copyText(\'' + escapeAttr(email.address) + '\')">Copy</button>';
    html += '</div>';
  }
  container.innerHTML = html;
}

// Render Prices
function renderPrices() {
  var container = document.getElementById('priceList');
  document.getElementById('priceCount').textContent = data.prices.length;
  
  // Update stats
  if (data.prices.length > 0) {
    var vals = data.prices.map(function(p) { return p.value; });
    document.getElementById('pMin').textContent = '$' + Math.min.apply(null, vals).toFixed(0);
    document.getElementById('pMax').textContent = '$' + Math.max.apply(null, vals).toFixed(0);
    document.getElementById('pAvg').textContent = '$' + (vals.reduce(function(a,b){return a+b;},0) / vals.length).toFixed(0);
  }
  
  if (data.prices.length === 0) {
    container.innerHTML = '<div class="empty">No prices found. Try a product page.</div>';
    return;
  }
  
  var html = '';
  for (var i = 0; i < Math.min(data.prices.length, 15); i++) {
    var price = data.prices[i];
    html += '<div class="result">';
    html += '<span class="result-item badge badge-price">$</span>';
    html += '<span class="result-text" style="color:#22c55e;font-weight:bold">' + price.raw + '</span>';
    html += '<button class="copy-btn" onclick="copyText(\'' + escapeAttr(price.raw) + '\')">Copy</button>';
    html += '</div>';
  }
  container.innerHTML = html;
}

// Render Social
function renderSocial() {
  var container = document.getElementById('socialList');
  document.getElementById('socialCount').textContent = data.social.length;
  
  if (data.social.length === 0) {
    container.innerHTML = '<div class="empty">No social links found. Click "Find Social Links".</div>';
    return;
  }
  
  var html = '';
  for (var i = 0; i < Math.min(data.social.length, 15); i++) {
    var s = data.social[i];
    html += '<div class="result">';
    html += '<span class="result-item badge badge-social">' + s.platform + '</span>';
    html += '<span class="result-text" style="color:#ec4899">' + (s.handle || s.url.substring(0,30)) + '</span>';
    html += '<button class="copy-btn" onclick="openURL(\'' + escapeAttr(s.url) + '\')">Open</button>';
    html += '</div>';
  }
  container.innerHTML = html;
}

// Render SEO
function renderSEO() {
  var seo = data.seo;
  var score = calcSEOScore();
  
  document.getElementById('seoScoreVal').textContent = score;
  document.getElementById('seoScoreVal').style.color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  
  var html = '';
  html += '<div class="result"><span>Title</span><span>' + (seo.title ? seo.title.length + ' chars' : 'Missing') + '</span></div>';
  html += '<div class="result"><span>Meta Description</span><span>' + (seo.metaDesc ? seo.metaDesc.length + ' chars' : 'Missing') + '</span></div>';
  html += '<div class="result"><span>Headings</span><span>' + (seo.headings ? seo.headings.length : 0) + ' found</span></div>';
  html += '<div class="result"><span>Images</span><span>' + (seo.images ? seo.images.length : 0) + '</span></div>';
  html += '<div class="result"><span>Word Count</span><span>' + (seo.wordCount || 0) + ' words</span></div>';
  html += '<div class="result"><span>External Links</span><span>' + (seo.externalLinks || 0) + '</span></div>';
  
  if (seo.readability) {
    html += '<div class="result"><span>Readability</span><span>Grade ' + seo.readability.grade + '</span></div>';
  }
  
  document.getElementById('seoDetails').innerHTML = html;
  
  // Keywords
  if (seo.keywords && seo.keywords.length > 0) {
    document.getElementById('keywordsSection').style.display = 'block';
    var kwHtml = '';
    for (var i = 0; i < Math.min(seo.keywords.length, 10); i++) {
      var kw = seo.keywords[i];
      kwHtml += '<span style="background:#0f172a;padding:4px 8px;border-radius:12px;margin:2px;display:inline-block;font-size:10px">' + kw.word + ' <span style="color:#6366f1">' + kw.count + 'x</span></span>';
    }
    document.getElementById('keywordsList').innerHTML = kwHtml;
  }
}

// Render Links
function renderLinks() {
  var container = document.getElementById('linksList');
  var items = data.metas.length > 0 ? data.metas : data.links;
  document.getElementById('linksCount').textContent = items.length;
  
  if (items.length === 0) {
    container.innerHTML = '<div class="empty">No links found. Click "All Links" or "Meta Tags".</div>';
    return;
  }
  
  var html = '';
  for (var i = 0; i < Math.min(items.length, 15); i++) {
    var item = items[i];
    var type = item.platform || item.property || item.name || item.type || 'link';
    var content = item.url || item.href || item.content || '';
    
    html += '<div class="result">';
    html += '<span class="result-item badge badge-link">' + type.substring(0, 8) + '</span>';
    html += '<span class="result-text">' + escapeHtml(content.substring(0, 40)) + '</span>';
    html += '<button class="copy-btn" onclick="copyText(\'' + escapeAttr(content) + '\')">Copy</button>';
    html += '</div>';
  }
  container.innerHTML = html;
}

// Render Metas
function renderMetas() {
  renderLinks();
}

// SEO Score Calculator
function calcSEOScore() {
  var seo = data.seo;
  if (!seo || Object.keys(seo).length === 0) return 0;
  var score = 0;
  if (seo.title && seo.title.length >= 30 && seo.title.length <= 60) score += 20;
  if (seo.metaDesc && seo.metaDesc.length >= 120) score += 20;
  if (seo.headings && seo.headings.length > 0) score += 20;
  if (seo.images && seo.images.length > 0) {
    var withAlt = seo.images.filter(function(i) { return i.alt; }).length;
    if (withAlt / seo.images.length > 0.8) score += 20;
  }
  if (seo.wordCount && seo.wordCount >= 300) score += 20;
  return score;
}

// Copy Functions
function copyAllCTAs() {
  if (data.ctas.length === 0) { showToast('No CTAs'); return; }
  var text = data.ctas.map(function(c) { return c.text; }).join('\n');
  copyText(text);
  showToast('Copied ' + data.ctas.length + ' CTAs');
}

function copyAllEmails() {
  if (data.emails.length === 0) { showToast('No emails'); return; }
  var text = data.emails.map(function(e) { return e.address; }).join('\n');
  copyText(text);
  showToast('Copied ' + data.emails.length + ' emails');
}

function copyText(text) {
  navigator.clipboard.writeText(text);
  showToast('Copied!');
}

function openURL(url) {
  chrome.tabs.create({ url: url });
}

// Generate PDF Report
function generatePDF() {
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF();
  
  var y = 10;
  var pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241);
  doc.text('Marketing Command Center', pageWidth/2, y, { align: 'center' });
  y += 10;
  
  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Scan Report - ' + new Date().toLocaleDateString(), pageWidth/2, y, { align: 'center' });
  y += 10;
  
  // URL
  doc.setFontSize(8);
  doc.text('URL: ' + (currentTab ? currentTab.url : 'N/A'), 10, y);
  y += 10;
  
  // Divider
  doc.setDrawColor(200);
  doc.line(10, y, pageWidth-10, y);
  y += 8;
  
  // SEO Score
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('SEO Score: ' + calcSEOScore() + '/100', 10, y);
  y += 8;
  
  // SEO Details
  if (data.seo.title) {
    doc.setFontSize(10);
    doc.text('Title: ' + data.seo.title.substring(0, 60), 10, y);
    y += 5;
  }
  if (data.seo.metaDesc) {
    doc.text('Meta: ' + data.seo.metaDesc.substring(0, 80), 10, y);
    y += 5;
  }
  y += 5;
  
  // Divider
  doc.line(10, y, pageWidth-10, y);
  y += 8;
  
  // CTAs
  doc.setFontSize(14);
  doc.setTextColor(99, 102, 241);
  doc.text('CTAs Found: ' + data.ctas.length, 10, y);
  y += 6;
  
  doc.setFontSize(8);
  doc.setTextColor(0);
  for (var i = 0; i < Math.min(data.ctas.length, 20); i++) {
    if (y > 270) { doc.addPage(); y = 10; }
    doc.text('• ' + data.ctas[i].text.substring(0, 70), 12, y);
    y += 4;
  }
  y += 5;
  
  // Emails
  if (y > 250) { doc.addPage(); y = 10; }
  doc.setFontSize(14);
  doc.setTextColor(20, 184, 166);
  doc.text('Emails Found: ' + data.emails.length, 10, y);
  y += 6;
  
  doc.setFontSize(8);
  doc.setTextColor(0);
  for (var j = 0; j < Math.min(data.emails.length, 15); j++) {
    if (y > 270) { doc.addPage(); y = 10; }
    doc.text('• ' + data.emails[j].address, 12, y);
    y += 4;
  }
  y += 5;
  
  // Prices
  if (y > 250) { doc.addPage(); y = 10; }
  doc.setFontSize(14);
  doc.setTextColor(34, 197, 94);
  doc.text('Prices Found: ' + data.prices.length, 10, y);
  y += 6;
  
  if (data.prices.length > 0) {
    var vals = data.prices.map(function(p) { return p.value; });
    doc.setFontSize(9);
    doc.text('Min: $' + Math.min.apply(null, vals).toFixed(2) + ' | Max: $' + Math.max.apply(null, vals).toFixed(2) + ' | Avg: $' + (vals.reduce(function(a,b){return a+b;},0)/vals.length).toFixed(2), 12, y);
    y += 5;
    
    doc.setFontSize(8);
    for (var k = 0; k < Math.min(data.prices.length, 10); k++) {
      if (y > 270) { doc.addPage(); y = 10; }
      doc.text('• ' + data.prices[k].raw, 12, y);
      y += 4;
    }
  }
  y += 5;
  
  // Social Links
  if (y > 240) { doc.addPage(); y = 10; }
  doc.setFontSize(14);
  doc.setTextColor(236, 72, 153);
  doc.text('Social Links: ' + data.social.length, 10, y);
  y += 6;
  
  doc.setFontSize(8);
  doc.setTextColor(0);
  for (var m = 0; m < Math.min(data.social.length, 10); m++) {
    if (y > 270) { doc.addPage(); y = 10; }
    doc.text('• ' + data.social[m].platform + ': ' + data.social[m].url.substring(0, 50), 12, y);
    y += 4;
  }
  
  // Footer
  var pageCount = doc.internal.getNumberOfPages();
  for (var p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Page ' + p + ' of ' + pageCount + ' | Generated by Marketing Command Center', pageWidth/2, 290, { align: 'center' });
  }
  
  // Save
  doc.save('marketing-report-' + new Date().toISOString().split('T')[0] + '.pdf');
  showToast('PDF Report Downloaded!');
}

// Export JSON
function exportJSON() {
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'marketing-data.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('JSON Exported!');
}

// Clear All
function clearAll() {
  if (confirm('Clear all data?')) {
    data = { ctas: [], emails: [], prices: [], social: [], links: [], metas: [], seo: {}, tracked: [] };
    chrome.storage.local.remove(['mccData']);
    updateStats();
    renderAll();
    showToast('Cleared!');
  }
}

// Toast & Error
function showToast(msg) {
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 2000);
}

function showError(msg) {
  var el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(function() { el.style.display = 'none'; }, 3000);
}

// Utilities
function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text) {
  return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
}
