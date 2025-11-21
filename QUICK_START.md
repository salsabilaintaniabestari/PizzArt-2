# PizzArt - Quick Start Guide

Panduan cepat untuk menjalankan aplikasi PizzArt setelah bug fixes.

---

## Status Project: ✅ READY

**Bug Fixes Completed:**
- ✅ Topping tidak muncul - FIXED
- ✅ Payment tidak dapat diakses - FIXED
- ✅ Midtrans QRIS integration - IMPLEMENTED
- ✅ Webhook handler - IMPLEMENTED

---

## Prerequisites

- Node.js 16+
- Firebase Project (with Firestore)
- Supabase Project (for Edge Functions)
- Midtrans Account (Sandbox or Production)

---

## Setup Steps (15 Minutes)

### 1. Install Dependencies (2 min)
```bash
npm install
```

### 2. Configure Firebase (3 min)
Create `.env` file:
```env
VITE_FIREBASE_API_KEY=AIzaSyCCfwMekxBh4Kd3-4F8aaLl3SQ1CQY_dKc
VITE_FIREBASE_AUTH_DOMAIN=pizzart-1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pizzart-1
VITE_FIREBASE_STORAGE_BUCKET=pizzart-1.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=168059122581
VITE_FIREBASE_APP_ID=1:168059122581:web:07a6a80fc43d22a1267c9c
```

### 3. Configure Supabase (2 min)
Add to `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Configure Midtrans (2 min)
Add to `.env`:
```env
VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
```

Configure Supabase Secrets (Dashboard > Edge Functions > Secrets):
```env
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_IS_PRODUCTION=false
FIREBASE_PROJECT_ID=pizzart-1
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### 5. Deploy Edge Functions (3 min)
```bash
supabase functions deploy create-qris-payment
supabase functions deploy midtrans-webhook
```

### 6. Setup Firestore Collections (3 min)

Import data dari `firestore-data/` folder:
- `inventory.json` - Bahan pizza (22 items)
- `admin_users.json` - Admin user (sesuaikan UID)
- `community_pizzas.json` - Contoh pizza
- `contests.json` - Kontes aktif

Or manually create collections:
- `users` - User profiles
- `orders` - Order records
- `order_items` - Pizza items
- `payments` - Payment records
- `inventory` - Stock management
- `admin_users` - Admin accounts

### 7. Create Admin User
1. Create user in Firebase Auth: `admin@pizzart.com`
2. Copy the UID
3. Add document to `admin_users` collection with same UID

### 8. Run Development Server
```bash
npm run dev
```

Access: http://localhost:5173

---

## Testing the Fixes

### Test 1: Topping Display
1. Navigate to `/order` (Create Pizza)
2. Check that toppings are displayed:
   - Daging section (Pepperoni, Sausage, Bacon, etc.)
   - Sayuran section (Mushrooms, Peppers, etc.)
   - Keju section (Mozzarella, Cheddar, etc.)
   - Saus Spesial section

**Expected:** All topping categories visible with clickable buttons

### Test 2: Payment Flow
1. Create a pizza
2. Add to cart
3. Click "Checkout Sekarang"
4. Verify QR Code appears
5. Check console - no errors
6. QR Code should be valid Midtrans QRIS

**Expected:** Valid QR code displayed with 15-minute timer

### Test 3: Webhook (In Production)
1. Complete payment using test e-wallet
2. Check Firestore `payments` collection
3. Verify `payment_status` changes to 'success'
4. Verify `orders` status changes to 'processing'

**Expected:** Status updates automatically within 5 seconds

---

## Common Issues & Solutions

### Issue: "Topping tidak muncul"
**Solution:** Populate `inventory` collection in Firestore
```bash
# Make sure inventory items have:
- is_available: true
- category: 'meat' | 'vegetable' | 'cheese' | 'sauce'
- name matching items in src/data/toppings.ts
```

### Issue: "QR Code tidak valid"
**Solution:**
1. Check Supabase Edge Functions are deployed
2. Verify MIDTRANS_SERVER_KEY in Supabase secrets
3. Check browser Network tab for errors

### Issue: "Payment status tidak update"
**Solution:**
1. Configure Midtrans webhook URL
2. Check Edge Function logs in Supabase
3. Verify Firebase service account key is correct

### Issue: "Cannot read property of undefined"
**Solution:** Check all environment variables are set correctly

---

## Project Structure (After Fixes)

```
pizzart/
├── src/
│   ├── components/
│   │   ├── pizza/
│   │   │   └── PizzaBuilder.tsx ✅ FIXED
│   │   └── payment/
│   │       └── QRISPayment.tsx ✅ FIXED
│   └── ...
├── supabase/
│   └── functions/
│       ├── create-qris-payment/ ✅ NEW
│       ├── midtrans-webhook/ ✅ NEW
│       └── _shared/
│           └── cors.ts ✅ NEW
├── firestore-data/ (Import to Firestore)
│   ├── inventory.json
│   ├── admin_users.json
│   ├── community_pizzas.json
│   └── contests.json
├── SETUP.md ✅ UPDATED
├── BUG_FIXES_SUMMARY.md ✅ NEW
└── QUICK_START.md (this file)
```

---

## Next Steps

1. **Populate Inventory**: Add more pizza ingredients to Firestore
2. **Test Payment**: Use Midtrans sandbox to test full payment flow
3. **Configure Webhook**: Set webhook URL in Midtrans dashboard
4. **Add More Features**:
   - Google Drive integration for pizza images
   - Email notifications
   - Advanced reporting

---

## Production Deployment

When ready for production:

1. Update `.env` with production values
2. Set `MIDTRANS_IS_PRODUCTION=true` in Supabase
3. Update Midtrans webhook to production Edge Function URL
4. Configure Firebase security rules
5. Deploy to hosting (Vercel, Netlify, Firebase Hosting)

---

## Support

- **Documentation**: See SETUP.md for detailed docs
- **Bug Fixes**: See BUG_FIXES_SUMMARY.md
- **Architecture**: See ARCHITECTURE.md

---

## Summary of Changes

### Files Modified:
1. `src/components/pizza/PizzaBuilder.tsx` - Fixed topping loading
2. `src/components/payment/QRISPayment.tsx` - Integrated with Edge Function
3. `SETUP.md` - Updated documentation

### Files Created:
1. `supabase/functions/create-qris-payment/index.ts` - Generate QRIS
2. `supabase/functions/midtrans-webhook/index.ts` - Handle webhook
3. `supabase/functions/_shared/cors.ts` - CORS headers
4. `BUG_FIXES_SUMMARY.md` - Detailed bug analysis
5. `QUICK_START.md` - This guide

---

**🎉 Your PizzArt application is now ready to use!**
