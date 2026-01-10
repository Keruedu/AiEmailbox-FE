# 🚀 PWA Setup Guide - AI EmailBox

## Quick Start

Đã thêm PWA (Progressive Web App) với Offline Caching vào AI EmailBox!

### ✨ Tính năng mới

- 📱 **Installable**: Cài đặt như native app trên desktop/mobile
- 🔌 **Offline Support**: Xem email khi mất mạng
- ⚡ **Fast Loading**: Cache tự động cho tốc độ cao
- 🔄 **Network First**: Luôn cố lấy dữ liệu mới nhất
- 💾 **Smart Caching**: Tự động cache API responses

## Cách chạy

### 1. Generate PWA Icons (bắt buộc lần đầu)

```powershell
cd AiEmailbox-FE
.\scripts\generate-icons.ps1
```

**Nếu chưa cài Sharp CLI hoặc ImageMagick:**

**Option A - Sharp CLI (Khuyến nghị):**
```bash
npm install -g sharp-cli
```

**Option B - ImageMagick:**
- Download: https://imagemagick.org/script/download.php

**Option C - Manual (Nhanh nhất):**
1. Mở file `public/icons/icon.svg` trong browser
2. Dùng https://svgtopng.com/ để convert
3. Tạo PNG với sizes: 16, 32, 72, 96, 128, 144, 152, 192, 384, 512
4. Save vào `public/icons/` với tên `icon-[SIZE]x[SIZE].png`

### 2. Install dependencies (nếu chưa có)

```bash
npm install
```

### 3. Run Development

```bash
npm run dev
```

### 4. Build Production

```bash
npm run build
npm start
```

## Test PWA

### Chrome DevTools
1. F12 → Application tab
2. Xem Service Workers (phải active)
3. Xem Cache Storage (có data sau khi browse)

### Test Offline
1. DevTools → Network → Offline
2. Reload page → Vẫn hoạt động!
3. Xem emails đã tải trước đó

### Install PWA
- **Desktop**: Click icon "Install" trong address bar
- **Mobile**: Menu → Add to Home Screen

## Kiến trúc

```
public/
├── manifest.json          # PWA manifest
├── sw.js                  # Service worker (custom)
└── icons/                 # PWA icons (tất cả sizes)

src/
├── components/
│   └── OfflineIndicator   # Hiển thị trạng thái offline
├── hooks/
│   └── useOnlineStatus    # Hooks để check network
└── app/
    ├── layout.tsx         # Thêm PWA meta tags
    └── offline/           # Trang offline fallback
```

## Chiến lược Cache

### NetworkFirst (API)
```
Network → Success? → Cache mới
       → Fail? → Dùng cache cũ
```

Áp dụng cho:
- `/api/emails` - Danh sách email
- `/api/kanban` - Kanban board  
- `/api/search` - Tìm kiếm
- `/api/auth/me` - User info

### CacheFirst (Static)
```
Cache → Found? → Return
      → Not found? → Network → Cache
```

Áp dụng cho:
- HTML, CSS, JS files
- Images, fonts
- Static assets

## Usage trong Code

### Check Online Status

```typescript
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

function MyComponent() {
  const isOnline = useOnlineStatus();
  
  return (
    <div>
      {isOnline ? 'Online' : 'Offline - Using cached data'}
    </div>
  );
}
```

### Cache Data Manually

```typescript
import { useCachedData } from '@/hooks/useOnlineStatus';

function EmailList() {
  const [emails, setEmails] = useCachedData('emails', []);
  
  // Data tự động cache và restore khi offline
}
```

## Files đã tạo/sửa

### ✅ Đã tạo:
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Custom service worker
- `public/icons/icon.svg` - Icon template
- `scripts/generate-icons.ps1` - Icon generator
- `src/components/OfflineIndicator.tsx` - Offline indicator
- `src/hooks/useOnlineStatus.ts` - Network hooks
- `src/app/offline/page.tsx` - Offline fallback page
- `docs/PWA.md` - Chi tiết documentation

### ✅ Đã sửa:
- `next.config.ts` - Thêm PWA config với next-pwa
- `src/app/layout.tsx` - Thêm PWA meta tags & OfflineIndicator
- `.gitignore` - Ignore generated PWA files

## Next Steps

1. ✅ Generate icons: `.\scripts\generate-icons.ps1`
2. ✅ Run dev: `npm run dev`
3. ✅ Test offline: DevTools → Network → Offline
4. ✅ Test install: Chrome install button
5. ✅ Run Lighthouse audit (PWA score = 100)

## Troubleshooting

### Service Worker không hoạt động?
```javascript
// Console
navigator.serviceWorker.getRegistrations().then(r => console.log(r))
```

### Clear cache
```javascript
// Console - Clear tất cả cache
caches.keys().then(n => n.forEach(k => caches.delete(k)))
```

### Icons không hiển thị?
- Kiểm tra file icons có tồn tại trong `public/icons/`
- Run `.\scripts\generate-icons.ps1`
- Hoặc tạo manual theo hướng dẫn trên

## Documentation

📖 Xem [docs/PWA.md](./docs/PWA.md) để biết chi tiết về:
- Service Worker strategies
- Cache management
- Testing procedures
- Backend CORS config
- Troubleshooting

## Support

Gặp vấn đề? Check:
1. Console có errors?
2. Service Worker có active? (DevTools → Application)
3. Icons đã generate chưa?
4. Network request có được cache? (DevTools → Network)

---

**Made with ❤️ for offline email experience**
