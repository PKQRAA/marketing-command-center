# Marketing Command Center

A powerful all-in-one Chrome extension for digital marketers. No external APIs - everything runs locally in your browser.

![Marketing Command Center](https://img.shields.io/badge/Version-2.0.0-6366f1?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Chrome-blue?style=for-the-badge)

## Features

### 1. CTA Spy
- Instantly detect all CTAs, headlines, and buttons on any page
- One-click copy to clipboard
- Save favorites for later
- Smart categorization by type and importance

### 2. Email Finder
- Find email addresses anywhere on the page
- Detect emails in text content
- Extract mailto links automatically
- Get context for each email found

### 3. SEO Analyzer
- Real-time SEO score (0-100)
- Title and meta description analysis
- Heading structure check
- Image alt text coverage
- Word count and content quality
- Top keywords extraction with frequency

### 4. Price Extractor
- Find all prices on any page
- Display min, max, and average prices
- Multiple currency support
- Price comparison tool

### 5. Heatmap Generator
- Visual click density map
- Scroll depth tracking
- Customizable opacity and radius
- Color-coded intensity zones

### 6. Competitor Tracker
- Track changes on any page
- Monitor CTA, price, and content changes
- Get notified of updates
- Change history log

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `marketing-command-center` folder

## Usage

1. Click the extension icon in your Chrome toolbar
2. Use the **Full Scan** button to analyze everything at once
3. Or use individual modules for specific tasks
4. Click any item to copy it to clipboard
5. Export your data anytime with the export button

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+M` | Open Marketing Command Center |

## Technical Details

### No External APIs
All analysis is performed locally in the browser:
- Pattern matching using regex
- DOM parsing and traversal
- Local storage for persistence
- No data sent to any server

### Manifest V3
Built with the latest Chrome Extensions Manifest V3 specification for better security and performance.

### Permissions
- `activeTab`: Access current tab for analysis
- `storage`: Save your data locally
- `tabs`: Query tab information
- `host_permissions`: Analyze pages on any website

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
└── README.md         # This file
```

## Privacy

Your data never leaves your browser. All scanning and analysis happens locally, and data is stored in Chrome's local storage only.

## License

MIT License - feel free to modify and distribute.

## Contributing

Contributions welcome! Please submit a pull request or open an issue.

---

**Built for marketers, by marketers. No API keys required.**
