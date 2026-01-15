# PWA - Progressive Web App

## Tổng quan

AI EmailBox đã được cấu hình như một Progressive Web App (PWA) với khả năng hoạt động offline đầy đủ. Điều này cho phép người dùng:

- ✅ Cài đặt ứng dụng trên thiết bị
- ✅ Xem email đã tải trước khi offline
- ✅ Tự động cache các API requests
- ✅ Trải nghiệm native-like trên mobile

## Cấu trúc PWA

### 1. Service Worker (`public/sw.js`)

Service worker triển khai chiến lược **NetworkFirst** cho API caching:

```
NetworkFirst Strategy:
1. Thử fetch từ network trước
2. Nếu thành công → Cache response mới
3. Nếu thất bại → Dùng cached version
```

#### Các pattern được cache:
- `/api/emails` - Danh sách email
- `/api/kanban` - Kanban board
- `/api/search` - Kết quả tìm kiếm
- `/api/auth/me` - Thông tin user

### 2. Manifest (`public/manifest.json`)

Web App Manifest định nghĩa:
- Tên và mô tả app
- Icons cho các kích thước
- Theme colors
- Display mode (standalone)
- Orientation (portrait)

### 3. Icons

Icons được tạo trong `public/icons/` với các kích thước:
- 16x16, 32x32 (Favicon)
- 72x72, 96x96, 128x128, 144x144, 152x152 (Mobile)
- 192x192, 384x384, 512x512 (PWA)

**Để tạo icons:**
```powershell
cd AiEmailbox-FE
.\scripts\generate-icons.ps1
```

### 4. Components

#### `OfflineIndicator` Component
- Hiển thị banner khi offline
- Thông báo khi kết nối lại
- Tự động reload khi online

#### `useOnlineStatus` Hook
Các custom hooks để theo dõi trạng thái mạng:

```typescript
// Kiểm tra online/offline đơn giản
const isOnline = useOnlineStatus();

// Thông tin chi tiết về network
const { isOnline, effectiveType, downlink, rtt } = useNetworkStatus();

// Cache data locally
const [data, setData] = useCachedData('my-key', initialValue);
```

## Cài đặt và Build

### 1. Install dependencies
```bash
npm install
```

### 2. Generate PWA icons
```powershell
.\scripts\generate-icons.ps1
```

### 3. Development
```bash
npm run dev
```

### 4. Production Build
```bash
npm run build
npm start
```

## Testing PWA

### 1. Test trên Chrome DevTools

1. Mở DevTools (F12)
2. Vào tab **Application**
3. Kiểm tra:
   - **Manifest**: Xem thông tin PWA
   - **Service Workers**: Xem SW đã active
   - **Cache Storage**: Xem dữ liệu đã cache

### 2. Test Offline Mode

**Cách 1: DevTools**
1. Mở DevTools → Network tab
2. Chọn "Offline" trong dropdown throttling
3. Reload trang và test

**Cách 2: Airplane Mode**
1. Bật chế độ máy bay
2. Mở app trong browser
3. Xem các email đã cache

### 3. Test Installation

**Desktop:**
1. Mở app trong Chrome
2. Click icon "Install" trong address bar
3. Hoặc: Menu → More tools → Create shortcut

**Mobile:**
1. Mở app trong Chrome/Safari
2. Menu → Add to Home Screen
3. App sẽ mở như native app

## Lighthouse Score

Chạy Lighthouse audit để kiểm tra PWA score:

1. Chrome DevTools → Lighthouse tab
2. Select "Progressive Web App"
3. Click "Generate report"

**Target scores:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90
- PWA: 100 ✓

## Cache Strategy Chi tiết

### NetworkFirst (API Requests)

```javascript
Try Network First
    ↓
Success? 
    ├─ Yes → Cache new data + Return
    └─ No  → Return cached data
```

**Ưu điểm:**
- Luôn cố gắng lấy dữ liệu mới nhất
- Fallback về cache khi offline
- Tốt cho dynamic content (emails, kanban)

### CacheFirst (Static Assets)

```javascript
Check Cache First
    ↓
Found?
    ├─ Yes → Return cached
    └─ No  → Fetch from network + Cache
```

**Ưu điểm:**
- Load nhanh hơn
- Tiết kiệm bandwidth
- Tốt cho static assets (CSS, JS, images)

## Cấu hình Backend CORS

Backend cần cho phép PWA cache API responses:

```go
// internal/middleware/cors.go
func CORSMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Header("Access-Control-Allow-Origin", "*")
        c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        c.Header("Access-Control-Max-Age", "86400")
        
        // Important for PWA caching
        c.Header("Cache-Control", "public, max-age=300")
        
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        
        c.Next()
    }
}
```

## Troubleshooting

### Service Worker không update

```javascript
// Force update service worker
navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
        registration.update();
    });
});
```

### Clear cache

```javascript
// Clear all caches
caches.keys().then(names => {
    names.forEach(name => {
        caches.delete(name);
    });
});
```

### Unregister Service Worker

```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
        registration.unregister();
    });
});
```

## Best Practices

1. **Versioning**: Update `CACHE_VERSION` khi có breaking changes
2. **Cache Size**: Giới hạn số lượng items trong cache
3. **Stale Data**: Hiển thị indicator khi dùng cached data
4. **Sync**: Implement background sync cho write operations
5. **Storage Quota**: Monitor storage usage

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox](https://developers.google.com/web/tools/workbox)
- [next-pwa](https://github.com/DuCanhGH/next-pwa)

## Changelog

### v1.0.0 (Current)
- ✅ NetworkFirst strategy cho API
- ✅ CacheFirst strategy cho static assets
- ✅ Offline indicator
- ✅ Auto-reload khi online
- ✅ PWA manifest và icons
- ✅ Service worker với custom caching logic

### Planned Features
- 🔄 Background sync cho email drafts
- 🔄 Push notifications
- 🔄 Periodic background sync
- 🔄 Advanced cache management UI
