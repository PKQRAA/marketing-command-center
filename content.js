// Marketing Command Center - Content Script v5

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  try {
    switch(message.action) {
      case 'fullScan':
        sendResponse({
          ctas: scanCTAs(),
          emails: scanEmails(),
          prices: scanPrices(),
          seo: analyzeSEO()
        });
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
      default:
        sendResponse({ error: 'Unknown action' });
    }
  } catch(e) {
    sendResponse({ error: e.message });
  }
  return true;
});

function scanCTAs() {
  var ctas = [];
  var seen = {};
  
  var elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, button, a, li');
  
  elements.forEach(function(el) {
    var text = el.textContent.trim();
    var rect = el.getBoundingClientRect();
    
    if (rect.width < 20 || rect.height < 10) return;
    if (text.length < 3 || text.length > 200) return;
    
    var key = text.substring(0, 30).toLowerCase();
    if (seen[key]) return;
    seen[key] = true;
    
    var tag = el.tagName.toLowerCase();
    var type = 'text';
    
    if (tag === 'button' || tag === 'a') type = 'button';
    else if (tag === 'h1' || tag === 'h2' || tag === 'h3') type = 'headline';
    
    ctas.push({
      type: type,
      tag: tag,
      text: text.substring(0, 150),
      chars: text.length
    });
  });
  
  return ctas.slice(0, 30);
}

function scanEmails() {
  var emails = [];
  var seen = {};
  
  var text = document.body.innerText;
  var matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  
  if (matches) {
    matches.forEach(function(email) {
      var lower = email.toLowerCase();
      if (!seen[lower] && email.indexOf('@') > 0) {
        seen[lower] = true;
        emails.push({
          address: email,
          type: 'text'
        });
      }
    });
  }
  
  document.querySelectorAll('a[href^="mailto:"]').forEach(function(link) {
    var email = link.href.replace('mailto:', '').split('?')[0];
    var lower = email.toLowerCase();
    if (!seen[lower]) {
      seen[lower] = true;
      emails.push({
        address: email,
        type: 'mailto'
      });
    }
  });
  
  return emails.slice(0, 20);
}

function scanPrices() {
  var prices = [];
  var seen = {};
  
  var walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  while (walker.nextNode()) {
    var node = walker.currentNode;
    var text = node.textContent;
    var matches = text.match(/\$\s*[\d,]+\.?\d*/g);
    
    if (matches) {
      matches.forEach(function(match) {
        var value = parseFloat(match.replace(/[$,\s]/g, ''));
        if (value > 0 && value < 100000 && !seen[match]) {
          seen[match] = true;
          prices.push({
            raw: match,
            value: value
          });
        }
      });
    }
  }
  
  return prices.sort(function(a, b) { return a.value - b.value; }).slice(0, 20);
}

function analyzeSEO() {
  var title = document.querySelector('title');
  var metaDesc = document.querySelector('meta[name="description"]');
  var headings = document.querySelectorAll('h1, h2, h3');
  
  var wordCount = document.body.innerText.split(/\s+/).length;
  
  return {
    title: title ? title.textContent : '',
    metaDesc: metaDesc ? metaDesc.content : '',
    headings: Array.prototype.slice.call(headings).map(function(h) { return h.textContent; }),
    wordCount: wordCount
  };
}
