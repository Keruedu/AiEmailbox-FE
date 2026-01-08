# AI Email Box - Frontend

A modern, secure email dashboard built with Next.js, React, TypeScript, and Ant Design.

## 🚀 Features

- ✅ **Email/Password Authentication** - Secure login with validation
- ✅ **Google OAuth Sign-In** - One-click Google authentication
- ✅ **JWT Token Management** - Access & refresh token handling with automatic refresh
- ✅ **3-Column Email Dashboard** - Mailboxes, Email List, Email Detail
- ✅ **Responsive Design** - Mobile-friendly with collapsible columns
- ✅ **Protected Routes** - Authentication-based route guards
- ✅ **Ant Design UI** - Modern, polished interface with icons
- ✅ **Mock Email API Integration** - Realistic email data

## 🛠 Tech Stack

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Ant Design** - UI component library
- **Axios** - HTTP client with interceptors
- **React OAuth Google** - Google Sign-In
- **Context API** - State management

## 📁 Project Structure

```
aiemailbox-fe/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout with providers
│   │   ├── page.tsx          # Home page (redirects)
│   │   ├── login/
│   │   │   └── page.tsx      # Login/Signup page
│   │   └── inbox/
│   │       ├── page.tsx      # Email dashboard
│   │       └── inbox.css     # Dashboard styles
│   ├── components/
│   │   └── ProtectedRoute.tsx # Route guard component
│   ├── contexts/
│   │   └── AuthContext.tsx   # Authentication context
│   ├── services/
│   │   ├── api.ts            # Axios client with interceptors
│   │   ├── auth.ts           # Auth API calls
│   │   └── email.ts          # Email API calls
│   ├── types/
│   │   ├── auth.ts           # Auth types
│   │   └── email.ts          # Email types
│   └── utils/                # Utility functions
├── public/                   # Static assets
├── .env.local                # Environment variables
├── package.json
└── tsconfig.json
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:8080`

### 1. Install Dependencies

```bash
cd aiemailbox-fe
npm install
```

### 2. Configure Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

**Getting Google OAuth Client ID:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins: `http://localhost:3000`
6. Copy Client ID to `.env.local`

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

```bash
npm run build
npm start
```

## Docker Setup (Recommended)

### Prerequisites

- Docker
- Docker Compose

### Quick Start with Docker Compose

The easiest way to run the frontend is using the included `docker-compose.yml`:

```bash
# 1. Navigate to the frontend directory
cd AiEmailbox-FE

# 2. Configure environment variables
# Edit the .env file with your settings
cp .env.example .env

# 3. Start the frontend
docker-compose up -d

# 4. Check logs
docker-compose logs -f

# 5. The frontend will be available at http://localhost:3000
```

### Docker Compose Service

The `docker-compose.yml` includes:

- **Frontend Application** (`aiemailbox-frontend-next`)
  - Port: 3000
  - Built with Next.js standalone output
  - Auto-restart enabled
  - Environment variables from `.env` file

### Useful Commands

```bash
# Start service in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop service
docker-compose down

# Rebuild image and restart (after code changes)
docker-compose up -d --build

# Check service status
docker-compose ps

# View container info
docker inspect aiemailbox-frontend-next

# Access container shell
docker exec -it aiemailbox-frontend-next sh
```

### Environment Variables for Docker

Configure the `.env` file in the AiEmailbox-FE directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id
NODE_ENV=production
PORT=3000
```

## �🔐 Authentication Flow

### Login Process

1. User enters email/password or clicks "Sign in with Google"
2. Frontend sends credentials to backend API
3. Backend validates and returns:
   - `accessToken` (15min lifetime)
   - `refreshToken` (7 days lifetime)
   - User profile
4. Frontend stores tokens:
   - Access token → In-memory variable
   - Refresh token → localStorage
5. User redirected to `/inbox`

### Token Management

#### Access Token (In-Memory)
```typescript
// Stored in JavaScript variable
let accessToken: string | null = null;

// Attached to every API request
config.headers.Authorization = `Bearer ${accessToken}`;
```

**Why in-memory?**
- ✅ Protected from XSS attacks
- ✅ Automatically cleared on page refresh
- ❌ Requires refresh token to restore session

#### Refresh Token (LocalStorage)
```typescript
// Stored in localStorage
localStorage.setItem('refreshToken', token);

// Used to get new access token
const newAccessToken = await refreshToken(refreshToken);
```

**Why localStorage?**
- ✅ Persists across page refreshes
- ✅ Enables "remember me" functionality
- ⚠️ Vulnerable to XSS (mitigated by short access token lifetime)

### Automatic Token Refresh

The API client automatically refreshes expired access tokens:

```typescript
// axios interceptor handles 401 responses
if (error.response?.status === 401) {
  // Prevent multiple simultaneous refresh requests
  if (!isRefreshing) {
    isRefreshing = true;
    
    // Request new access token
    const { accessToken, refreshToken } = await refresh();
    
    // Retry original request with new token
    return apiClient(originalRequest);
  }
}
```

**Features:**
- ✅ Concurrent request handling (queues requests during refresh)
- ✅ Token rotation (new refresh token on each refresh)
- ✅ Automatic logout on refresh failure
- ✅ Seamless user experience (no interruption)

### Security Considerations

**Token Storage Trade-offs:**

| Storage | Security | Persistence | XSS Risk | CSRF Risk |
|---------|----------|-------------|----------|-----------|
| In-Memory | ✅ High | ❌ Low | ✅ Protected | N/A |
| localStorage | ⚠️ Medium | ✅ High | ❌ Vulnerable | N/A |
| HttpOnly Cookie | ✅ High | ✅ High | ✅ Protected | ⚠️ Needs CSRF |

**Why Our Approach:**
1. Short-lived access tokens (15min) minimize XSS impact
2. Refresh tokens enable persistent sessions
3. Token rotation prevents replay attacks
4. Automatic logout on refresh failure
5. Production requires HTTPS

**Production Recommendations:**
- Use HTTPS only (prevents MITM attacks)
- Implement Content Security Policy (CSP)
- Add rate limiting on auth endpoints
- Consider HttpOnly cookies for refresh tokens
- Implement token revocation/blacklist
- Use secure headers (Helmet.js)

## 📧 Email Dashboard

### Three-Column Layout

#### Column 1: Mailboxes (Left, ~20%)
- Inbox (with unread count badge)
- Starred
- Sent
- Drafts
- Archive
- Trash
- Custom folders

#### Column 2: Email List (Center, ~40%)
- Email sender with avatar
- Subject line
- Preview text (truncated)
- Timestamp (smart formatting)
- Star indicator
- Attachment indicator
- Unread styling

#### Column 3: Email Detail (Right, ~40%)
- Full email headers (from, to, cc, date)
- Email body (HTML rendering)
- Attachments with download buttons
- Action buttons: Reply, Reply All, Forward, Star, Delete
- Empty state when no email selected

### Responsive Behavior

**Desktop (>992px):**
- Three columns side-by-side
- Persistent mailbox sidebar
- Email list and detail visible

**Mobile (<992px):**
- Single column view
- Mailbox → Email List → Email Detail
- Back button navigation
- Collapsible sidebar

## 🎨 UI Components (Ant Design)

### Key Components Used

- `Layout` - Overall page structure
- `Menu` - Mailbox navigation
- `List` - Email list
- `Card` - Email items and detail container
- `Button` - Actions and navigation
- `Badge` - Unread counts
- `Avatar` - User/sender avatars
- `Spin` - Loading indicators
- `Empty` - Empty states
- `Form` - Authentication forms
- `Input` - Text fields
- `Typography` - Text elements

### Icons (@ant-design/icons)

- `InboxOutlined`, `StarOutlined`, `SendOutlined`
- `MailOutlined`, `LockOutlined`, `UserOutlined`
- `PaperClipOutlined`, `DeleteOutlined`
- `ReloadOutlined`, `LogoutOutlined`

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
   ```
4. Deploy automatically on push

**Vercel CLI:**
```bash
npm i -g vercel
vercel login
vercel
```

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Email signup with validation
- [ ] Email login
- [ ] Google Sign-In
- [ ] Token refresh on expiration
- [ ] Logout clears tokens
- [ ] Protected routes redirect to login
- [ ] Invalid credentials show error

**Email Dashboard:**
- [ ] Load mailboxes on login
- [ ] Click mailbox loads emails
- [ ] Click email shows detail
- [ ] Refresh button updates list
- [ ] Responsive layout on mobile
- [ ] Back button on mobile
- [ ] Empty states display correctly

## 🐛 Troubleshooting

### Issue: "Failed to load mailboxes"
- **Solution:** Check backend is running on correct port
- **Check:** API_URL in `.env.local` matches backend

### Issue: Google Sign-In not working
- **Solution:** Verify Google Client ID is correct
- **Check:** Authorized origins include your domain
- **Check:** Google+ API is enabled

### Issue: Token refresh fails
- **Solution:** Clear localStorage and re-login
- **Check:** Refresh token hasn't expired (7 days)

### Issue: CORS errors
- **Solution:** Update backend CORS to allow frontend origin
- **Check:** `FRONTEND_URL` in backend `.env`

## 📄 License

MIT

---

**Built with ❤️ for the Web Development Course**
