# Marketing Command Center

**All-in-one Chrome Extension for Digital Marketers** - No external APIs, everything runs locally!

![Version](https://img.shields.io/badge/Version-3.0.0-6366f1?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Chrome-blue?style=for-the-badge)

## Features (8 Powerful Modules)

### 1. Dashboard
- Real-time stats overview
- One-click full scan
- Quick action shortcuts

### 2. CTA Spy
- Instantly detect all CTAs, headlines, and buttons
- Smart categorization by type and importance
- One-click copy to clipboard
- Save favorites for later

### 3. Email Finder
- Find email addresses anywhere on the page
- Detect emails in text content
- Extract mailto links automatically
- Get context for each email found

### 4. SEO Analyzer
- Real-time SEO score (0-100)
- Title and meta description analysis
- Heading structure check
- Image alt text coverage
- Word count and readability score
- Top keywords extraction with frequency

### 5. Price Extractor
- Find all prices on any page
- Display min, max, and average prices
- Price comparison tool
- Extract from data attributes

### 6. Social Media Extractor (NEW)
- Find all social media profiles
- Detect Facebook, Twitter, Instagram, LinkedIn, YouTube, TikTok, Pinterest, GitHub
- Get profile handles

### 7. Link Analyzer (NEW)
- Analyze all links on page
- Separate internal and external links
- Extract meta tags (OG, Twitter cards)
- Copy meta tag values

### 8. Competitor Tracker (NEW)
- Track changes on any page
- Monitor CTA, price, and content changes
- Change history log

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `marketing-command-center` folder
6. Click the extension icon in your toolbar

## Usage

1. Navigate to any website
2. Click the Marketing Command Center icon
3. Use **Full Scan** to analyze everything at once
4. Or use individual modules for specific tasks
5. Click any item to copy it to clipboard
6. Export your data anytime with the Export button

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Full Scan | Click button in popup |

## Privacy First

- **No external APIs** - All analysis runs locally in your browser
- **No data collection** - Your data stays on your device
- **No tracking** - Completely private and secure

## Technical Details

- Built with Chrome Extensions Manifest V3
- Vanilla JavaScript (no dependencies)
- Local storage for persistence
- Real-time page analysis

## File Structure

```
marketing-command-center/
├── manifest.json       # Extension configuration
├── popup.html         # Main UI
├── popup.js          # Application logic
├── content.js        # Page analysis
├── content.css       # Overlay styles
├── background.js     # Service worker
├── icons/            # Extension icons
└── README.md         # Documentation
```

## Permissions Used

- `activeTab` - Access current tab for analysis
- `storage` - Save your data locally
- `tabs` - Query tab information
- `<all_urls>` - Analyze pages on any website

## Supported Pages

Works on any webpage including:
- E-commerce sites (prices, CTAs)
- SaaS landing pages (headlines, CTAs)
- Blog posts (SEO, readability)
- Contact/About pages (emails, social links)
- Pricing pages (price comparison)

## Contributing

Contributions welcome! Please submit issues or pull requests.

## License

MIT License - Free to use and modify.

---

**Built for marketers, by marketers.**
