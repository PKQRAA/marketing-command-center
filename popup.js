// Marketing Command Center - Popup Script v5

var data = {
  ctas: [],
  emails: [],
  prices: [],
  seo: {}
};

var currentTab = null;

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  getCurrentTab();
  setupButtons();
}

async function getCurrentTab() {
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
    document.getElementById('currentUrl').textContent = currentTab.url.substring(0, 50);
  } catch(e) {
    document.getElementById('currentUrl').textContent = 'Error getting URL';
  }
}

function setupButtons() {
  document.getElementById('btnScan').onclick = scanAll;
  document.getElementById('btnScanCTA').onclick = scanCTAs;
  document.getElementById('btnScanEmail').onclick = scanEmails;
  document.getElementById('btnScanPrice').onclick = scanPrices;
  document.getElementById('btnAnalyzeSEO').onclick = analyzeSEO;
  document.getElementById('btnExport').onclick = exportData;
  document.getElementById('btnPDF').onclick = generatePDF;
  document.getElementById('btnClear').onclick = clearAll;
}

function showError(msg) {
  var el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(function() { el.style.display = 'none'; }, 3000);
}

function showToast(msg) {
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 2000);
}

async function scanAll() {
  if (!currentTab || !currentTab.id) {
    showError('Cannot scan. Open a website.');
    return;
  }
  if (currentTab.url.indexOf('chrome://') === 0 || currentTab.url.indexOf('about:') === 0) {
    showError('Open a website first, not chrome:// page');
    return;
  }
  
  showToast('Scanning...');
  try {
    var result = await chrome.tabs.sendMessage(currentTab.id, { action: 'fullScan' });
    if (!result) {
      showError('Reload the page and try again');
      return;
    }
    data.ctas = result.ctas || [];
    data.emails = result.emails || [];
    data.prices = result.prices || [];
    data.seo = result.seo || {};
    updateStats();
    renderResults();
    showToast('Found ' + data.ctas.length + ' CTAs');
  } catch(e) {
    showError('Error: Reload the page');
  }
}

async function scanCTAs() {
  if (!currentTab || !currentTab.id || currentTab.url.indexOf('chrome://') === 0) {
    showError('Open a website first');
    return;
  }
  showToast('Scanning CTAs...');
  try {
    var result = await chrome.tabs.sendMessage(currentTab.id, { action: 'scanCTAs' });
    data.ctas = result || [];
    updateStats();
    renderResults();
    showToast('Found ' + data.ctas.length + ' CTAs');
  } catch(e) {
    showError('Reload page and try again');
  }
}

async function scanEmails() {
  if (!currentTab || !currentTab.id || currentTab.url.indexOf('chrome://') === 0) {
    showError('Open a website first');
    return;
  }
  showToast('Scanning emails...');
  try {
    var result = await chrome.tabs.sendMessage(currentTab.id, { action: 'scanEmails' });
    data.emails = result || [];
    updateStats();
    renderResults();
    showToast('Found ' + data.emails.length + ' emails');
  } catch(e) {
    showError('Reload page and try again');
  }
}

async function scanPrices() {
  if (!currentTab || !currentTab.id || currentTab.url.indexOf('chrome://') === 0) {
    showError('Open a website first');
    return;
  }
  showToast('Scanning prices...');
  try {
    var result = await chrome.tabs.sendMessage(currentTab.id, { action: 'scanPrices' });
    data.prices = result || [];
    updateStats();
    renderResults();
    showToast('Found ' + data.prices.length + ' prices');
  } catch(e) {
    showError('Reload page and try again');
  }
}

async function analyzeSEO() {
  if (!currentTab || !currentTab.id || currentTab.url.indexOf('chrome://') === 0) {
    showError('Open a website first');
    return;
  }
  showToast('Analyzing SEO...');
  try {
    var result = await chrome.tabs.sendMessage(currentTab.id, { action: 'analyzeSEO' });
    data.seo = result || {};
    updateStats();
    showToast('SEO Score: ' + calcScore());
  } catch(e) {
    showError('Reload page and try again');
  }
}

function updateStats() {
  document.getElementById('statCtas').textContent = data.ctas.length;
  document.getElementById('statEmails').textContent = data.emails.length;
  document.getElementById('statPrices').textContent = data.prices.length;
  document.getElementById('statSeo').textContent = calcScore();
}

function calcScore() {
  var seo = data.seo;
  if (!seo || !seo.title) return 0;
  var score = 0;
  if (seo.title && seo.title.length >= 30) score += 25;
  if (seo.metaDesc && seo.metaDesc.length >= 120) score += 25;
  if (seo.headings && seo.headings.length > 0) score += 25;
  if (seo.wordCount && seo.wordCount >= 300) score += 25;
  return score;
}

function renderResults() {
  var container = document.getElementById('resultsList');
  var html = '';
  
  // CTAs
  if (data.ctas.length > 0) {
    html += '<div style="color:#6366f1;font-size:11px;margin:8px 0 4px">CTAs (' + data.ctas.length + ')</div>';
    for (var i = 0; i < Math.min(data.ctas.length, 5); i++) {
      var cta = data.ctas[i];
      html += '<div class="result">';
      html += '<span class="result-text">' + escapeHtml(cta.text.substring(0, 40)) + '</span>';
      html += '<button class="copy-btn" onclick="copyText(\'' + escapeAttr(cta.text) + '\')">Copy</button>';
      html += '</div>';
    }
  }
  
  // Emails
  if (data.emails.length > 0) {
    html += '<div style="color:#14b8a6;font-size:11px;margin:8px 0 4px">Emails (' + data.emails.length + ')</div>';
    for (var j = 0; j < Math.min(data.emails.length, 5); j++) {
      var email = data.emails[j];
      html += '<div class="result">';
      html += '<span class="result-text" style="color:#14b8a6">' + email.address + '</span>';
      html += '<button class="copy-btn" onclick="copyText(\'' + escapeAttr(email.address) + '\')">Copy</button>';
      html += '</div>';
    }
  }
  
  // Prices
  if (data.prices.length > 0) {
    html += '<div style="color:#22c55e;font-size:11px;margin:8px 0 4px">Prices (' + data.prices.length + ')</div>';
    for (var k = 0; k < Math.min(data.prices.length, 5); k++) {
      var price = data.prices[k];
      html += '<div class="result">';
      html += '<span class="result-text" style="color:#22c55e;font-weight:bold">$' + price.value.toFixed(2) + '</span>';
      html += '<button class="copy-btn" onclick="copyText(\'' + escapeAttr(price.raw) + '\')">Copy</button>';
      html += '</div>';
    }
  }
  
  if (html === '') {
    html = '<div class="result"><span class="result-text">Click "Full Scan" to start</span></div>';
  }
  
  container.innerHTML = html;
}

function copyText(text) {
  navigator.clipboard.writeText(text);
  showToast('Copied!');
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text) {
  return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function exportData() {
  var report = 'MARKETING REPORT\n';
  report += '================\n\n';
  report += 'URL: ' + (currentTab ? currentTab.url : 'N/A') + '\n';
  report += 'Date: ' + new Date().toLocaleString() + '\n\n';
  report += 'SEO Score: ' + calcScore() + '/100\n\n';
  report += 'CTAs (' + data.ctas.length + '):\n';
  for (var i = 0; i < data.ctas.length; i++) {
    report += '- ' + data.ctas[i].text + '\n';
  }
  report += '\nEmails (' + data.emails.length + '):\n';
  for (var j = 0; j < data.emails.length; j++) {
    report += '- ' + data.emails[j].address + '\n';
  }
  report += '\nPrices (' + data.prices.length + '):\n';
  for (var k = 0; k < data.prices.length; k++) {
    report += '- ' + data.prices[k].raw + '\n';
  }
  
  var blob = new Blob([report], { type: 'text/plain' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'marketing-report.txt';
  a.click();
  showToast('Report exported!');
}

function generatePDF() {
  exportData();
  showToast('PDF exported (as TXT)');
}

function clearAll() {
  if (confirm('Clear all data?')) {
    data = { ctas: [], emails: [], prices: [], seo: {} };
    updateStats();
    renderResults();
    showToast('Cleared!');
  }
}
