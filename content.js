// Marketing Command Center v6 - Content Script

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  try {
    switch(message.action) {
      case 'fullScan':
        sendResponse({
          ctas: scanCTAs(),
          emails: scanEmails(),
          prices: scanPrices(),
          social: scanSocial(),
          links: scanLinks(),
          metas: scanMetas(),
          seo: analyzeSEO()
        });
        break;
      case 'scanCTAs': sendResponse(scanCTAs()); break;
      case 'scanEmails': sendResponse(scanEmails()); break;
      case 'scanPrices': sendResponse(scanPrices()); break;
      case 'scanSocial': sendResponse(scanSocial()); break;
      case 'scanLinks': sendResponse(scanLinks()); break;
      case 'scanMetas': sendResponse(scanMetas()); break;
      case 'analyzeSEO': sendResponse(analyzeSEO()); break;
      default: sendResponse({ error: 'Unknown' });
    }
  } catch(e) {
    sendResponse({ error: e.message });
  }
  return true;
});

// CTA Scanner
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
    else if (isCTA(text)) type = 'cta';
    
    ctas.push({ type: type, tag: tag, text: text.substring(0, 150), chars: text.length });
  });
  
  return ctas.slice(0, 30);
}

function isCTA(text) {
  var patterns = /buy|get|sign|register|subscribe|learn|discover|try|start|book|contact|save|offer|limited|new|join|create|download|free/i;
  return patterns.test(text);
}

// Email Scanner
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
        emails.push({ address: email, type: 'text' });
      }
    });
  }
  
  document.querySelectorAll('a[href^="mailto:"]').forEach(function(link) {
    var email = link.href.replace('mailto:', '').split('?')[0];
    var lower = email.toLowerCase();
    if (!seen[lower]) {
      seen[lower] = true;
      emails.push({ address: email, type: 'mailto' });
    }
  });
  
  return emails.slice(0, 20);
}

// Price Scanner
function scanPrices() {
  var prices = [];
  var seen = {};
  
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  
  while (walker.nextNode()) {
    var text = walker.currentNode.textContent;
    var matches = text.match(/\$\s*[\d,]+\.?\d*/g);
    
    if (matches) {
      matches.forEach(function(match) {
        var value = parseFloat(match.replace(/[$,\s]/g, ''));
        if (value > 0 && value < 100000 && !seen[match]) {
          seen[match] = true;
          prices.push({ raw: match, value: value });
        }
      });
    }
  }
  
  return prices.sort(function(a, b) { return a.value - b.value; }).slice(0, 20);
}

// Social Media Scanner
function scanSocial() {
  var social = [];
  var seen = {};
  
  var patterns = {
    'Facebook': /facebook\.com\/[a-zA-Z0-9._-]+/gi,
    'Twitter': /twitter\.com\/[a-zA-Z0-9._-]+|x\.com\/[a-zA-Z0-9._-]+/gi,
    'Instagram': /instagram\.com\/[a-zA-Z0-9._-]+/gi,
    'LinkedIn': /linkedin\.com\/in\/[a-zA-Z0-9._-]+/gi,
    'YouTube': /youtube\.com\/@[a-zA-Z0-9._-]+|youtube\.com\/channel\/[a-zA-Z0-9._-]+/gi,
    'TikTok': /tiktok\.com\/@[a-zA-Z0-9._-]+/gi,
    'Pinterest': /pinterest\.com\/[a-zA-Z0-9._-]+/gi,
    'GitHub': /github\.com\/[a-zA-Z0-9._-]+/gi
  };
  
  document.querySelectorAll('a[href]').forEach(function(link) {
    var href = link.href;
    
    for (var platform in patterns) {
      var matches = href.match(patterns[platform]);
      if (matches && !seen[href]) {
        seen[href] = true;
        var handle = href.split('/').pop().split('?')[0];
        social.push({ platform: platform, url: href, handle: handle });
      }
    }
  });
  
  return social.slice(0, 20);
}

// Link Analyzer
function scanLinks() {
  var links = [];
  var seen = {};
  var domain = window.location.hostname;
  
  document.querySelectorAll('a[href]').forEach(function(link) {
    var href = link.href;
    if (!href || seen[href] || href.startsWith('javascript:') || href.startsWith('#')) return;
    seen[href] = true;
    
    var type = 'relative';
    try {
      var linkDomain = new URL(href).hostname;
      type = linkDomain === domain || linkDomain.includes(domain) ? 'internal' : 'external';
    } catch(e) {}
    
    links.push({ href: href, text: link.textContent.trim().substring(0, 50), type: type });
  });
  
  return links.slice(0, 50);
}

// Meta Tags Scanner
function scanMetas() {
  var metas = [];
  
  document.querySelectorAll('meta[name], meta[property]').forEach(function(meta) {
    var name = meta.getAttribute('name') || meta.getAttribute('property');
    var content = meta.getAttribute('content') || '';
    if (name && content) {
      metas.push({ name: name, content: content.substring(0, 200) });
    }
  });
  
  return metas.slice(0, 30);
}

// SEO Analyzer
function analyzeSEO() {
  var title = document.querySelector('title');
  var metaDesc = document.querySelector('meta[name="description"]');
  var headings = document.querySelectorAll('h1, h2, h3');
  var images = document.querySelectorAll('img');
  
  var bodyText = document.body.innerText;
  var words = bodyText.split(/\s+/).filter(function(w) { return w.length > 2; });
  
  // Keywords
  var stopWords = ['the','a','an','and','or','but','in','on','at','to','for','of','with','by','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','this','that','these','those','it','its','we','our','you','your','i','my','me'];
  var wordFreq = {};
  words.forEach(function(w) {
    w = w.toLowerCase().replace(/[^\w]/g, '');
    if (w.length > 3 && stopWords.indexOf(w) === -1) {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
  });
  
  var keywords = Object.keys(wordFreq).map(function(w) { return { word: w, count: wordFreq[w] }; })
    .sort(function(a, b) { return b.count - a.count; })
    .slice(0, 15);
  
  // Readability
  var sentences = bodyText.split(/[.!?]+/).filter(function(s) { return s.trim().length > 0; });
  var syllables = words.reduce(function(sum, w) { return sum + countSyllables(w); }, 0);
  var avgWordsPerSentence = words.length / Math.max(1, sentences.length);
  var avgSyllablesPerWord = syllables / Math.max(1, words.length);
  var readabilityScore = Math.max(0, Math.min(100, Math.round(206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord))));
  var readabilityGrade = Math.round(0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59);
  
  return {
    title: title ? title.textContent : '',
    metaDesc: metaDesc ? metaDesc.content : '',
    headings: Array.prototype.slice.call(headings).map(function(h) { return h.textContent; }),
    images: Array.prototype.slice.call(images).map(function(img) { return { alt: img.alt || '' }; }),
    wordCount: words.length,
    externalLinks: document.querySelectorAll('a[href^="http"]').length,
    keywords: keywords,
    readability: { score: readabilityScore, grade: Math.max(0, readabilityGrade) }
  };
}

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  var matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}
