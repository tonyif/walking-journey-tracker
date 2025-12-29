# 📸 Screenshots Guide

This folder contains screenshots for the README documentation.

## 📋 Required Screenshots

Please capture the following screenshots and save them in this directory:

### 1. **dashboard.png** (Main Dashboard)
**Size:** 1920x1080 or 1600x900
**What to Show:**
- Full application view with map displayed
- A route with some progress (e.g., 50-200 km covered)
- Green line showing completed portion
- Blue dashed line showing remaining route
- Pulsing red marker at current position
- Stats cards showing:
  - Total Distance Covered
  - Remaining Distance
  - Current Location
  - Progress Percentage
- Walk history on the right side

**How to Capture:**
1. Open the app in your browser
2. Set a route (e.g., Kanyakumari to Leh)
3. Add a few walks (5-10 entries)
4. Zoom map to show the route clearly
5. Take screenshot (F12 → Ctrl+Shift+P → "Capture full size screenshot" in Chrome)

---

### 2. **route-setup.png** (Route Configuration)
**Size:** 1920x1080 or 1600x900
**What to Show:**
- The route setup modal/screen
- Input fields for:
  - Starting Location (e.g., "Paris, France")
  - Ending Location (e.g., "Rome, Italy")
- Quick route buttons visible
- "Start My Journey" button highlighted

**How to Capture:**
1. Click "Change Route" button
2. Show the route setup interface
3. Fill in sample locations
4. Take screenshot before submitting

---

### 3. **walk-history.png** (Walk History)
**Size:** 1600x900 or 1920x1080
**What to Show:**
- Multiple walk entries (5-10 entries)
- Each entry showing:
  - Date (e.g., "Dec 25, 2024")
  - Distance (e.g., "5.5 km")
  - Notes (e.g., "Morning jog, felt great!")
  - Edit and Delete buttons
- "Add New Walk" form visible above
- "Import Data" and "Export Data" buttons

**How to Capture:**
1. Scroll to the walk history section
2. Ensure multiple entries are visible
3. Take screenshot showing the full section

---

### 4. **mobile-view.png** (Mobile PWA)
**Size:** 390x844 (iPhone) or 412x915 (Android)
**What to Show:**
- Mobile responsive view
- Stacked layout (map on top, stats below)
- Touch-friendly buttons
- PWA install banner (if visible)

**How to Capture:**
1. Open browser DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Select "iPhone 12 Pro" or "Pixel 5"
4. Navigate through the app
5. Take screenshot (DevTools screenshot feature)

**Alternative - Real Mobile:**
1. Install the app on your phone
2. Take actual screenshot
3. Transfer to computer

---

### 5. **cloud-sync.png** (Firebase Sync)
**Size:** 1600x900 or 1920x1080
**What to Show:**
- "Sign in to Sync" button OR
- User signed in with profile picture
- Sync status indicator ("Synced ✓")
- Google Sign-In interface (if showing login)

**How to Capture:**
1. Click "☁️ Sign In to Sync" button
2. Show the Google Sign-In popup OR
3. If already signed in, show the signed-in state with sync status
4. Take screenshot

---

## 🎨 Screenshot Best Practices

### Image Quality
- ✅ Use high resolution (1920x1080 recommended)
- ✅ PNG format for better quality
- ✅ Compress images to keep file size reasonable (<500 KB each)
- ✅ Use clear, readable fonts
- ✅ Good contrast and visibility

### Content
- ✅ Use realistic data (not "Test User" or "Lorem Ipsum")
- ✅ Show meaningful routes (real cities)
- ✅ Include varied distances (5 km, 6.2 km, not all 5 km)
- ✅ Use varied dates (not all same day)
- ✅ Add descriptive notes ("Morning walk", "Evening jog")

### Styling
- ✅ Clean browser window (no bookmarks bar clutter)
- ✅ Remove personal information
- ✅ Hide browser extensions
- ✅ Use consistent zoom level

---

## 🛠️ Tools for Taking Screenshots

### Windows
- **Snipping Tool** (Win+Shift+S)
- **Greenshot** (Free tool)
- **ShareX** (Advanced, free)
- **Chrome DevTools** (Built-in, F12)

### Mac
- **Command+Shift+3** (Full screen)
- **Command+Shift+4** (Selection)
- **Command+Shift+5** (Advanced)

### Browser Tools
- **Chrome DevTools**:
  - F12 → Ctrl+Shift+P → "Capture full size screenshot"
  - F12 → Ctrl+Shift+M (Mobile view)
- **Firefox**: F12 → Take screenshot icon

---

## 📐 Recommended Sizes

| Screenshot | Desktop (px) | Mobile (px) |
|-----------|-------------|------------|
| dashboard.png | 1920x1080 | N/A |
| route-setup.png | 1600x900 | N/A |
| walk-history.png | 1600x900 | N/A |
| mobile-view.png | N/A | 390x844 |
| cloud-sync.png | 1600x900 | N/A |

---

## 🗜️ Image Optimization

After capturing, optimize images:

```bash
# Using ImageMagick
convert dashboard.png -quality 85 -resize 1920x1080 dashboard.png

# Using TinyPNG (online)
# https://tinypng.com/

# Using Squoosh (web app)
# https://squoosh.app/
```

---

## ✅ Checklist

Before committing screenshots:

- [ ] All 5 screenshots captured
- [ ] Images are high quality (not blurry)
- [ ] File sizes are reasonable (<500 KB each)
- [ ] PNG format used
- [ ] Realistic data shown
- [ ] No personal information visible
- [ ] Clean browser interface
- [ ] Images display correctly in README.md

---

## 📝 File Naming Convention

Use exactly these names:
```
screenshots/
├── dashboard.png          ← Main view
├── route-setup.png        ← Route configuration
├── walk-history.png       ← Walk list
├── mobile-view.png        ← Mobile/PWA
└── cloud-sync.png         ← Firebase sync
```

---

## 🎯 Example Screenshot

**Good Example:**
```
✅ Clear, high-resolution
✅ Realistic data
✅ Good contrast
✅ No clutter
✅ Proper framing
```

**Bad Example:**
```
❌ Blurry/low resolution
❌ Test data (foo, bar, test)
❌ Personal info visible
❌ Browser clutter
❌ Poor framing
```

---

## 📞 Need Help?

If you need assistance with screenshots:
- Contact: tony.issac@gmail.com
- Check README.md for current app URL
- Use browser DevTools for consistent results

---

**Happy Screenshot Taking! 📸**

*Last Updated: 2025-12-29*

