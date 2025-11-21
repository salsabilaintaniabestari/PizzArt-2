# PizzArt Architecture & Clean Code Guide

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                 React Frontend (Vite)                    │
│         ┌──────────────────────────────────────┐        │
│         │      Components & Pages              │        │
│         │  (Modular, Reusable, Typed)         │        │
│         └──────────────┬───────────────────────┘        │
│                        │                                 │
│         ┌──────────────▼───────────────────────┐        │
│         │  Context Providers                   │        │
│         │  (Auth, Admin, App State)            │        │
│         └──────────────┬───────────────────────┘        │
│                        │                                 │
├─────────────────────────┼─────────────────────────────────┤
│                    Firebase SDK                          │
│  ┌──────────────────────┬──────────────────────┐        │
│  │   Auth              │  Firestore (DB)       │        │
│  │ (Email/Password)    │  (Collections, Docs)  │        │
│  └──────────────────────┴──────────────────────┘        │
└─────────────────────────────────────────────────────────┘
         │
         │  (via Firestore SDK)
         │
┌────────▼──────────────────────────────────────────────┐
│           Firestore Database                          │
│  ┌─────────┬────────────┬─────────┬─────────────┐   │
│  │ users   │ orders     │ payments│ inventory   │   │
│  ├─────────┼────────────┼─────────┼─────────────┤   │
│  │ uid     │ user_id    │ user_id │ name        │   │
│  │ email   │ items      │ total   │ stock_qty   │   │
│  │ ...     │ status     │ status  │ ...         │   │
│  └─────────┴────────────┴─────────┴─────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 📐 Design Principles Applied

### 1. Single Responsibility Principle (SRP)
Setiap file/component memiliki satu tanggung jawab:

```typescript
// ✅ GOOD: Setiap component punya satu purpose
components/admin/
  ├── AdminLayout.tsx        // Navigation & layout only
  ├── AdminProtectedRoute.tsx // Route protection only
  └── RealtimeRevenue.tsx     // Revenue stats only

pages/admin/
  ├── AdminDashboardPage.tsx  // Dashboard logic
  ├── AdminOrdersPage.tsx     // Order management
  ├── AdminInventoryPage.tsx  // Inventory management
  └── AdminProfilePage.tsx    // Profile management

// ❌ BAD: Multiple responsibilities
// AdminPanel.tsx dengan dashboard + orders + inventory
```

### 2. Don't Repeat Yourself (DRY)
Reusable logic dalam services dan utils:

```typescript
// services/firestoreService.ts
// Centralized Firestore operations
export const loadOrders = async () => { ... }
export const updateOrderStatus = async () => { ... }

// Reused across multiple pages
```

### 3. Clean Code Practices

#### Naming Conventions
```typescript
// ✅ Clear, descriptive names
const [isLoading, setIsLoading] = useState(false);
const handleStatusChange = async () => { };
const getStatusColor = (status) => { };

// ❌ Vague names
const [loading, setLoading] = useState(false);
const handle = () => { };
const getColor = () => { };
```

#### Type Safety
```typescript
// ✅ Full TypeScript types
interface Order {
  id: string;
  status: 'pending' | 'processing' | 'completed';
  created_at: Timestamp;
}

const orders: Order[] = [];

// ❌ No types
const orders: any[] = [];
```

#### Error Handling
```typescript
// ✅ Proper error handling
try {
  const data = await loadData();
  setData(data);
} catch (error) {
  console.error('Error loading data:', error);
  setError(error.message);
} finally {
  setIsLoading(false);
}

// ❌ No error handling
const data = await loadData();
setData(data);
```

### 4. Component Composition

**Smart vs Dumb Components:**

```typescript
// ✅ SMART: Page component (containers)
// Handles state, data fetching, logic
const AdminOrdersPage = () => {
  const [orders, setOrders] = useState();

  useEffect(() => {
    loadOrders(); // Data fetching
  }, []);

  return <OrdersTable orders={orders} />;
};

// ✅ DUMB: Presentational component
// Only receives props, renders UI
const OrdersTable = ({ orders }) => {
  return (
    <table>
      {orders.map(order => (
        <OrderRow key={order.id} order={order} />
      ))}
    </table>
  );
};
```

### 5. Context for Global State

```typescript
// ✅ Use Context for auth/admin state
<AdminProvider>
  <UserAuthProvider>
    <AppContextProvider>
      <App />
    </AppContextProvider>
  </UserAuthProvider>
</AdminProvider>

// ❌ Prop drilling (avoid)
<Component prop1={} prop2={} prop3={} prop4={} />
```

### 6. Firestore Best Practices

```typescript
// ✅ Type-safe queries
const loadOrders = async () => {
  const q = query(
    collection(db, 'orders'),
    orderBy('created_at', 'desc'),
    where('status', '==', 'pending')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Order[];
};

// ✅ Use serverTimestamp() for timestamps
const docRef = await addDoc(collection(db, 'orders'), {
  ...data,
  created_at: serverTimestamp(),
});

// ❌ Manual timestamp
{
  created_at: new Date() // Wrong! Use serverTimestamp()
}
```

## 🎯 Code Organization

### File Structure by Feature

```
src/
├── components/
│   ├── admin/
│   │   └── [admin-specific components]
│   ├── payment/
│   │   └── [payment components]
│   └── common/
│       └── [shared components]
│
├── context/
│   └── [global state providers]
│
├── pages/
│   ├── admin/
│   │   └── [admin pages]
│   └── [user pages]
│
├── lib/
│   └── firebase.ts [Firebase config]
│
└── types/
    └── index.ts [TypeScript types]
```

### Each File Responsibilities

```typescript
// components/admin/AdminOrdersPage.tsx
// ✅ Single file per feature/page
// ✅ ~250 lines (readable, manageable)
// ✅ Clear imports at top
// ✅ Interface definitions
// ✅ Component logic
// ✅ Handlers
// ✅ JSX rendering

// AVOID:
// ❌ Multiple components in one file
// ❌ 1000+ lines in single file
// ❌ Mixed business logic and UI
// ❌ No types
```

## 🔄 Data Flow

### Admin Orders Page Flow

```
[AdminOrdersPage] Load
    ↓
[useEffect] → loadOrders()
    ↓
[Firestore] Query orders collection
    ↓
[setState] setOrders(data)
    ↓
[JSX Render] Display orders table
    ↓
[User Action] Select status from dropdown
    ↓
[Handler] handleStatusChange()
    ↓
[Firestore] updateDoc()
    ↓
[setState] Update local state
    ↓
[JSX Re-render] Updated UI
```

## 🧪 Testing Points

### What to Test

```typescript
// ✅ Data loading
- Orders load correctly
- Inventory items display
- Payment status updates

// ✅ User interactions
- Status dropdown change
- Form submission
- Search functionality

// ✅ Error states
- Network errors handled
- Invalid data shown
- Loading states visible

// ✅ Auth protection
- Non-admin redirected
- Session persists
- Logout works
```

## 📊 Performance Considerations

### Optimization Applied

```typescript
// ✅ Polling instead of real-time for payments
// (Every 5 seconds instead of listener)
const interval = setInterval(() => {
  checkPaymentStatus();
}, 5000);

// ✅ Filtering on client-side for small datasets
const filteredOrders = orders.filter(o =>
  o.user_name.includes(searchTerm) &&
  (filterStatus === 'all' || o.status === filterStatus)
);

// ✅ Reuse Firestore queries
const loadInventory = async () => {
  const q = query(
    collection(db, 'inventory'),
    orderBy('name')
  );
  // Single query, multiple uses
};
```

## 🔐 Security

### Authentication Flow

```
User enters email/password
    ↓
Firebase Auth validates
    ↓
Auth user created (if new user)
    ↓
Create user doc in Firestore
    ↓
Session persisted
    ↓
ProtectedRoute verifies auth
    ↓
Access granted/denied

For Admin:
    ↓
Check admin_users collection
    ↓
Verify admin role
    ↓
AdminProtectedRoute grants access
```

### Firestore Security Rules

```javascript
// Only users can read/write own orders
match /orders/{orderId} {
  allow read, write: if request.auth.uid == resource.data.user_id
}

// Only admins can read/write all orders
match /admin/{adminId} {
  allow read, write: if exists(/databases/$(database)/documents/admin_users/$(request.auth.uid))
}
```

## 📝 Code Review Checklist

```
Before committing:

□ All functions have clear names
□ All functions have TypeScript types
□ Error handling present
□ No console.error without handling
□ No prop drilling (use Context)
□ No repeated code (DRY)
□ Comments only for "why", not "what"
□ Single responsibility per file
□ No magic numbers (use constants)
□ Tests pass (when applicable)
□ Build passes: npm run build
```

## 🚀 Deployment Ready

```
✅ Clean code structure
✅ Type-safe throughout
✅ Proper error handling
✅ Performance optimized
✅ Security best practices
✅ Scalable architecture
✅ Build: ~800KB (optimized)
✅ All features working
✅ Firebase integrated
✅ Midtrans QRIS integrated
```
