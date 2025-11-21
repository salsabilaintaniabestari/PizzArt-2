# PizzArt - Pizza Ordering System

Website aplikasi pemesanan pizza dengan fitur admin dashboard, payment QRIS, dan inventory management menggunakan Firebase + Firestore.

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Firebase (Authentication + Firestore) + Supabase Edge Functions
- **Payment**: Midtrans QRIS
- **Database**: Firestore for data storage

## 📋 Prerequisites

- Node.js 16+ installed
- Firebase project already created
- Firestore database setup
- Supabase project for Edge Functions
- Midtrans account for payment processing (Sandbox or Production)

## 🚀 Setup Instructions

### 1. Clone & Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env` file in project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Supabase Configuration (for Edge Functions)
VITE_SUPABASE_URL=https://your_project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Midtrans Configuration (Frontend)
VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
```

### 2.1. Supabase Edge Functions Secrets

Configure the following secrets in Supabase Dashboard (Settings > Edge Functions > Secrets):

```env
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_IS_PRODUCTION=false
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_SERVICE_ACCOUNT_KEY=your_firebase_service_account_json
```

**To get Firebase Service Account:**
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Use the entire JSON content as the value for FIREBASE_SERVICE_ACCOUNT_KEY
5. Alternative: Use Firebase Admin SDK initialization string

**Important:** The service account is needed for the webhook to write to Firestore from the Edge Function.

### 3. Firestore Collections Setup

Create the following collections in Firestore:

#### Collection: `users`
```
- uid (string) - User's Firebase UID
- email (string)
- username (string)
- full_name (string)
- phone (string)
- address (string)
- created_at (timestamp)
```

#### Collection: `orders`
```json
{
  "user_id": "string - Firebase Auth UID",
  "user_name": "string - Customer name",
  "user_email": "string - Customer email",
  "total_price": "number - Total order price in IDR",
  "status": "string - 'pending' | 'processing' | 'completed' | 'shipped' | 'cancelled'",
  "created_at": "timestamp - When order was created",
  "updated_at": "timestamp - Last update time"
}
```

#### Collection: `order_items`
```json
{
  "order_id": "string - Reference to orders document ID",
  "pizza_name": "string - Name of the pizza",
  "size": "string - 'small' | 'medium' | 'large'",
  "crust": "string - 'thin' | 'thick' | 'stuffed'",
  "sauce": "string - Selected sauce type",
  "toppings": "array - Array of selected toppings with details",
  "quantity": "number - Number of this pizza in order",
  "price": "number - Total price for this item",
  "created_at": "timestamp"
}
```

#### Collection: `payments`
```json
{
  "order_id": "string - Reference to orders collection document ID",
  "user_id": "string - User email or Firebase UID",
  "total_amount": "number - Total payment amount in IDR",
  "payment_status": "string - 'pending' | 'success' | 'failed' | 'expired'",
  "payment_method": "string - 'qris' | 'bank_transfer' | 'credit_card'",
  "qris_reference": "string - QR code URL from Midtrans",
  "transaction_id": "string - Midtrans transaction ID",
  "midtrans_order_id": "string - Unique order ID sent to Midtrans",
  "expiry_time": "timestamp - Payment expiration time (usually 15 minutes)",
  "paid_at": "timestamp - Actual payment completion time (nullable)",
  "created_at": "timestamp - When payment record was created",
  "updated_at": "timestamp - Last update time",
  "metadata": {
    "customer_name": "string",
    "customer_email": "string"
  }
}
```

**Important Notes:**
- `payment_status` will be updated by Midtrans webhook
- `qris_reference` contains the QR code string that can be displayed or scanned
- `midtrans_order_id` must be unique for each payment attempt
- Webhook will update status from 'pending' to 'success' or 'failed'

#### Collection: `inventory`
```
- name (string)
- category (string) - 'ingredient' | 'crust' | 'sauce' | 'cheese'
- stock_quantity (number)
- low_stock_threshold (number)
- unit (string) - 'pcs' | 'kg' | etc
- price (number)
- is_available (boolean)
- created_at (timestamp)
```

#### Collection: `admin_users`
```
- uid (string) - Firebase Auth UID
- email (string)
- username (string)
- full_name (string)
- role (string) - 'admin' | 'manager'
- created_at (timestamp)
```

#### Collection: `contests`
```json
{
  "id": "string - Auto-generated document ID",
  "name": "string - Contest title/name",
  "description": "string - Contest description and details",
  "rules": "string - Contest rules and requirements",
  "prize": "string - Prize information (e.g., 'Rp 500,000 + Pizza Gratis')",
  "status": "string - 'active' | 'upcoming' | 'finished'",
  "start_date": "string - ISO 8601 date format (e.g., '2025-01-01T00:00:00.000Z')",
  "end_date": "string - ISO 8601 date format (e.g., '2025-02-28T23:59:59.000Z')",
  "cover_image_url": "string - Optional URL to contest cover image",
  "created_at": "string - ISO 8601 timestamp when contest was created",
  "updated_at": "string - ISO 8601 timestamp of last update",
  "winner_post_id": "string - Optional reference to winning community_posts document ID"
}
```

**Important Notes:**
- Contest `status` determines visibility on Contest page (active/upcoming/finished tabs)
- `start_date` and `end_date` are used to calculate time remaining for active contests
- `winner_post_id` links to the winning submission in `community_posts` collection
- Only active contests accept new submissions
- Admin can update status and select winners through Admin Contest Page

#### Collection: `community_posts`
```json
{
  "id": "string - Auto-generated document ID",
  "image_url": "string - URL to pizza image (Google Drive or other storage)",
  "user_id": "string - Firebase Auth UID of the user who created the post",
  "user_name": "string - Username of the creator",
  "user_email": "string - Email of the creator",
  "caption": "string - Post caption/description",
  "toppings_used": "array - Array of topping names used in the pizza",
  "pizza_template_json": "object - Complete Pizza object with all details",
  "likes_count": "number - Total number of likes (denormalized for performance)",
  "comments_count": "number - Total number of comments (denormalized for performance)",
  "created_at": "string - ISO 8601 timestamp when post was created",
  "is_for_contest": "boolean - Whether this post is a contest submission",
  "contest_name": "string | null - Contest name if is_for_contest is true, null otherwise"
}
```

**Pizza Template JSON Structure:**
```json
{
  "id": "string",
  "name": "string - Pizza name",
  "size": "string - 'small' | 'medium' | 'large'",
  "crust": "string - 'thin' | 'thick' | 'stuffed'",
  "sauce": "string - Sauce type",
  "toppings": "array - Array of Topping objects",
  "price": "number - Total pizza price in IDR",
  "likes": "number - Initially 0",
  "isTemplate": "boolean - true for community templates"
}
```

**Important Notes:**
- `image_url` contains public URL from Google Drive (format: `https://drive.google.com/uc?export=view&id={FILE_ID}`)
- `gdrive_file_id` stores the Google Drive file ID for management and deletion purposes
- Images are uploaded using Google Drive API with public permissions set to "Anyone with the link"
- `pizza_template_json` stores complete pizza configuration for "Order Template" functionality
- `likes_count` and `comments_count` are denormalized counters updated when likes/comments change
- `toppings_used` array enables filtering posts by specific toppings
- Contest submissions have `is_for_contest: true` and reference the contest name

#### Collection: `community_likes`
```json
{
  "id": "string - Auto-generated document ID",
  "post_id": "string - Reference to community_posts document ID",
  "user_id": "string - Firebase Auth UID of user who liked",
  "created_at": "string - ISO 8601 timestamp when like was created"
}
```

**Important Notes:**
- Composite unique constraint: One user can only like a post once
- When a like is added, increment `likes_count` in the corresponding `community_posts` document
- When a like is removed, decrement `likes_count` in the corresponding `community_posts` document
- Query pattern: Check if like exists using `where('post_id', '==', postId).where('user_id', '==', userId)`

#### Collection: `community_comments`
```json
{
  "id": "string - Auto-generated document ID",
  "post_id": "string - Reference to community_posts document ID",
  "user_id": "string - Firebase Auth UID of commenter",
  "user_name": "string - Username of commenter",
  "comment_text": "string - Comment content",
  "created_at": "string - ISO 8601 timestamp when comment was created"
}
```

**Important Notes:**
- When a comment is added, increment `comments_count` in the corresponding `community_posts` document
- When a comment is deleted, decrement `comments_count` in the corresponding `community_posts` document
- Comments are displayed in chronological order (oldest first)
- Query pattern: `where('post_id', '==', postId).orderBy('created_at', 'asc')`

### 4. Create Admin User

Add a document to `admin_users` collection:

```json
{
  "email": "admin@pizzart.com",
  "username": "admin",
  "full_name": "Administrator",
  "role": "admin",
  "created_at": "2025-01-01T00:00:00Z"
}
```

Also create corresponding user in Firebase Authentication with same email.

### 4.1. Setup Sample Contest Data (Optional)

To test the Contest features, add sample contests to the `contests` collection:

**Active Contest Example:**
```json
{
  "name": "Summer Pizza Challenge",
  "description": "Buat pizza dengan tema musim panas yang segar dan menyegarkan!",
  "rules": "1. Gunakan minimal 3 topping\n2. Pizza harus original kreasi sendiri\n3. Upload foto pizza yang jelas\n4. Sertakan caption menarik",
  "prize": "Rp 500,000 + Pizza Gratis Selama Sebulan",
  "status": "active",
  "start_date": "2025-01-01T00:00:00.000Z",
  "end_date": "2025-02-28T23:59:59.000Z",
  "cover_image_url": "",
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z"
}
```

**Upcoming Contest Example:**
```json
{
  "name": "Spicy Pizza Showdown",
  "description": "Tantangan untuk pencinta pedas! Ciptakan pizza dengan level kepedasan tertinggi.",
  "rules": "1. Wajib menggunakan topping pedas\n2. Tambahkan sauce spicy\n3. Kreativitas dalam kombinasi bahan pedas dinilai",
  "prize": "Rp 300,000 + Voucher Makan",
  "status": "upcoming",
  "start_date": "2025-03-01T00:00:00.000Z",
  "end_date": "2025-03-31T23:59:59.000Z",
  "cover_image_url": "",
  "created_at": "2025-01-15T00:00:00.000Z",
  "updated_at": "2025-01-15T00:00:00.000Z"
}
```

### 4.2. Setup Sample Community Posts (Optional)

Add sample posts to `community_posts` collection for testing:

```json
{
  "image_url": "https://example.com/pizza1.jpg",
  "user_id": "sample_user_uid",
  "user_name": "pizza_lover",
  "user_email": "user@example.com",
  "caption": "My amazing pepperoni pizza creation!",
  "toppings_used": ["Pepperoni", "Mozzarella", "Bell Peppers"],
  "pizza_template_json": {
    "id": "sample1",
    "name": "Pepperoni Delight",
    "size": "large",
    "crust": "thin",
    "sauce": "tomato",
    "toppings": [],
    "price": 85000,
    "likes": 0,
    "isTemplate": true
  },
  "likes_count": 0,
  "comments_count": 0,
  "created_at": "2025-01-20T10:00:00.000Z",
  "is_for_contest": false,
  "contest_name": null
}
```

### 5. Deploy Supabase Edge Functions

Deploy the payment-related Edge Functions to your Supabase project:

```bash
# Deploy create-qris-payment function
supabase functions deploy create-qris-payment

# Deploy midtrans-webhook function
supabase functions deploy midtrans-webhook
```

**Important:** Make sure you've configured the Midtrans secrets in Supabase Dashboard first (see step 2.1).

### 6. Configure Midtrans Webhook

In your Midtrans Dashboard:

1. Go to Settings > Configuration > Payment Notification URL
2. Set the webhook URL to: `https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/midtrans-webhook`
3. Enable HTTP notification
4. Save configuration

### 7. Run Development Server

```bash
npm run dev
```

Access at `http://localhost:5173`

## 🎯 Features

### User Features
- Browse & customize pizza
- Add to cart
- Checkout dengan QRIS payment
- Track order status
- Share creation to community
- Community gallery with like, comment, and order template features
- Pizza contest participation and voting
- Filter community posts by toppings and popularity

### Admin Features
- Dashboard dengan real-time revenue stats
- Order management (view, update status)
- Inventory management (add, edit stock)
- Admin profile management
- Contest management (create, edit, delete contests)
- View contest submissions and select winners

## 📱 Pages

### Public Pages
- `/` - Home
- `/order` - Order Pizza (Create Pizza)
- `/community` - Community Pizza Gallery
- `/contests` - Pizza Contest
- `/cart` - Shopping Cart
- `/order-tracking` - Track Order

### Auth Pages
- `/login` - User Login
- `/register` - User Registration

### Admin Pages (Protected)
- `/admin/login` - Admin Login
- `/admin/dashboard` - Dashboard
- `/admin/orders` - Order Management
- `/admin/inventory` - Inventory Management
- `/admin/contests` - Contest Management
- `/admin/profile` - Admin Profile

## 🔐 Authentication

### User Authentication
- Firebase Email/Password auth
- Protected routes via `ProtectedRoute` component
- Session persistence

### Admin Authentication
- Separate admin table in Firestore
- Verification via `admin_users` collection
- Protected routes via `AdminProtectedRoute` component

## 💳 Payment Flow (Midtrans QRIS)

### Complete Payment Flow

```
1. User adds pizza to cart
   └─> CartPage.tsx

2. User clicks "Checkout Sekarang"
   └─> Creates order in Firestore (status: 'pending')
   └─> Order items saved to 'order_items' collection
   └─> Opens QRISPayment component

3. QRISPayment Component
   └─> Calls Supabase Edge Function: create-qris-payment
       └─> Edge Function calls Midtrans API
       └─> Midtrans generates QRIS code
       └─> Returns QR string and transaction_id
   └─> Saves payment record to Firestore 'payments' collection
       - payment_status: 'pending'
       - qris_reference: QR code URL
       - transaction_id: from Midtrans
       - expiry_time: 15 minutes from now

4. User scans QR Code with e-wallet app
   └─> User completes payment in e-wallet

5. Midtrans sends webhook notification
   └─> Webhook URL: https://YOUR_PROJECT.supabase.co/functions/v1/midtrans-webhook
   └─> Edge Function receives notification
       └─> Validates signature (security)
       └─> Updates payment status in Firestore
           - payment_status: 'success' | 'failed' | 'expired'
           - paid_at: timestamp
       └─> Updates order status to 'processing' if payment success

6. Frontend polling (every 5 seconds)
   └─> QRISPayment checks payment status in Firestore
   └─> If status = 'success':
       - Shows success message
       - Calls onSuccess callback
       - Redirects to order tracking
```

### Payment Status Flow

```
pending → (user pays) → success → order status: processing
        → (expires)   → expired → order status: pending
        → (fails)     → failed  → order status: pending
```

### Key Components

1. **Frontend (React)**
   - `QRISPayment.tsx`: Displays QR code, handles status polling
   - `CartPage.tsx`: Creates order and initiates payment

2. **Edge Functions (Supabase)**
   - `create-qris-payment`: Calls Midtrans API to generate QRIS
   - `midtrans-webhook`: Receives payment notifications from Midtrans

3. **Database (Firestore)**
   - `orders`: Order information
   - `order_items`: Pizza details for each order
   - `payments`: Payment transaction records

### Security Features

- Server-side Midtrans API calls (Edge Functions)
- Webhook signature validation
- HTTPS-only communication
- Separation of client and server keys

## 🛠️ Development

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Type Check
```bash
npm run typecheck
```

## 📁 Project Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminLayout.tsx
│   │   ├── AdminProtectedRoute.tsx
│   │   └── RealtimeRevenue.tsx
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── ProtectedRoute.tsx
│   ├── payment/
│   │   └── QRISPayment.tsx
│   └── pizza/
│       ├── PizzaBuilder.tsx
│       └── PizzaPreview.tsx
├── context/
│   ├── AdminContext.tsx
│   ├── AppContext.tsx
│   └── UserAuthContext.tsx
├── lib/
│   └── firebase.ts
├── pages/
│   ├── admin/
│   │   ├── AdminDashboardPage.tsx
│   │   ├── AdminOrdersPage.tsx
│   │   ├── AdminInventoryPage.tsx
│   │   ├── AdminContestPage.tsx (NEW - Contest Management)
│   │   ├── AdminLoginPage.tsx
│   │   └── AdminProfilePage.tsx
│   ├── CartPage.tsx
│   ├── CommunityPage.tsx (UPDATED - Full Firestore Integration)
│   ├── ContestPage.tsx (UPDATED - Contest Viewing & Submissions)
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── OrderPage.tsx
│   └── ...
├── types/
│   └── index.ts (UPDATED - Added Contest, CommunityPost, etc.)
└── App.tsx
```

## 🎨 Community & Contest Features

### Community Page Features

**Post Display & Filtering:**
- Grid layout with 15 posts per page (pagination)
- Filter by topping ingredients
- Sort by: All, Popular (most likes), Latest, Contest Submissions
- Search posts by caption text
- Real-time likes and comments count

**Post Interactions:**
- Like/Unlike posts (one like per user per post)
- Add comments to posts
- View all comments in modal
- Order pizza template directly from community post

**Upload New Post:**
- Image upload via Google Drive integration
- Caption and topping selection
- Option to submit for active contest
- Automatic user attribution

### Contest Page Features

**Three Contest Tabs:**
1. **Active Contests**: Currently running contests with submission capability
2. **Upcoming Contests**: Future contests with countdown
3. **Past Contests**: Finished contests with winners displayed

**Contest Details:**
- Contest name, description, rules, and prize information
- Start and end dates with time remaining calculation
- View all submissions for each contest
- Contest-specific submission gallery

**User Participation:**
- Submit pizza designs from Community page
- View own submissions
- Vote through likes on contest submissions

### Admin Contest Management

**Contest CRUD Operations:**
- Create new contests with all details
- Edit existing contest information
- Delete contests
- Update contest status (active/upcoming/finished)

**Submission Management:**
- View all submissions for each contest
- Filter submissions by likes count
- Select contest winner
- Winner's post is marked and displayed on Contest page

**Contest Fields:**
- Name and description
- Contest rules
- Prize details
- Start and end dates
- Optional cover image URL
- Status management

### Database Query Patterns

**Community Posts - Popular Sort:**
```javascript
query(
  collection(db, 'community_posts'),
  orderBy('likes_count', 'desc'),
  limit(15)
)
```

**Community Posts - Contest Filter:**
```javascript
query(
  collection(db, 'community_posts'),
  where('is_for_contest', '==', true),
  where('contest_name', '==', contestName)
)
```

**User's Likes - Check if liked:**
```javascript
query(
  collection(db, 'community_likes'),
  where('post_id', '==', postId),
  where('user_id', '==', userId)
)
```

**Contest Submissions Count:**
```javascript
query(
  collection(db, 'community_posts'),
  where('is_for_contest', '==', true),
  where('contest_name', '==', contestName)
).size
```

### Implementation Notes

1. **Denormalized Counters**: `likes_count` and `comments_count` are stored in posts for performance
2. **Pagination**: Client-side pagination using array slicing (15 posts per page)
3. **Image Storage**: Uses Google Drive shared links (implementation pending)
4. **Contest Validation**: Only active contests accept new submissions
5. **Winner Selection**: Admin selects winner, stores `winner_post_id` in contest document

## 🐛 Troubleshooting

### BUG FIX #1: Topping tidak muncul di Create Pizza
**Root Cause:** Variable `inventoryMap` tidak terdefinisi dan shadowing variable `availableToppings`

**Solution:**
1. Rename import: `availableToppings as defaultToppings`
2. Create `inventoryMap` variable: `new Map(inventory.map(item => [item.name.toLowerCase(), item]))`
3. Use `defaultToppings` when referencing hardcoded toppings
4. Fallback to `defaultToppings` if no inventory matches

**Status:** FIXED

### BUG FIX #2: Payment tidak dapat diakses
**Root Cause:** Invalid Midtrans API URL dan tidak ada proper integration

**Solution:**
1. Created Supabase Edge Function: `create-qris-payment`
2. Edge Function calls real Midtrans API
3. Created webhook handler: `midtrans-webhook`
4. Updated QRISPayment component to use Edge Function
5. Proper QRIS generation with valid QR code

**Status:** FIXED

### Admin Dashboard Blank Page
- Verify admin user document exists in Firestore
- Check browser console for errors
- Ensure Firebase auth is initialized
- Document ID in `admin_users` must match Firebase Auth UID

### Payment Issues

**QR Code tidak muncul:**
- Check Supabase Edge Functions are deployed
- Verify MIDTRANS_SERVER_KEY secret is configured in Supabase
- Check browser console and Network tab for errors
- Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct

**Payment status tidak update:**
- Verify Midtrans webhook URL is configured correctly
- Check webhook logs in Supabase Dashboard
- Test webhook manually using Midtrans simulator
- Ensure Firestore security rules allow webhook to write

**QRIS expired immediately:**
- Check system time is synchronized
- Verify expiry_time calculation (should be 15 minutes)
- Check Midtrans API response for expiry_time

### Inventory Not Loading
- Verify inventory items exist in Firestore collection `inventory`
- Check `is_available` field is set to `true`
- Ensure item names match with toppings in `src/data/toppings.ts`
- Check browser console for Firestore errors
- Verify Firestore security rules allow read access

### Topping Matching Issues
The system matches inventory items with toppings using flexible name matching:
- Checks exact match: "Pepperoni" === "Pepperoni"
- Checks partial match: "Pepperoni" includes "pepp"
- Checks lowercase: "pepperoni" === "pepperoni"

If toppings don't appear, check inventory item names are similar to:
- Pepperoni, Italian Sausage, Bacon, Chicken, Ham (meat)
- Mushrooms, Bell Peppers, Onions, Tomatoes, Olives (vegetables)
- Mozzarella, Cheddar, Parmesan (cheese)

## 🔒 Important Notes

### Database Architecture
This project uses a hybrid approach:
- **Firestore (Firebase)**: Main database for user data, orders, payments, inventory
- **Supabase Edge Functions**: Serverless functions for secure Midtrans integration
- **Why both?**: Firestore provides excellent real-time capabilities and offline support for the frontend, while Supabase Edge Functions provide secure server-side payment processing

### Webhook Security
The Midtrans webhook does NOT write directly to Firestore. Instead:
1. Midtrans sends notification to Supabase Edge Function
2. Edge Function validates the signature
3. Edge Function uses Firestore Admin SDK (via service account) to update payment status
4. This ensures webhook requests are secure and validated

### Data Flow
```
Frontend (React) ←→ Firestore ←→ Firebase Auth
                ↓
        Supabase Edge Functions
                ↓
        Midtrans API
                ↓
        Webhook ←→ Edge Function ←→ Firestore
```

## 📞 Support

For issues or questions, please check:
1. Browser console for error messages
2. Firestore Firebase console for data
3. Network tab for API calls

## 📄 License

Private Project
