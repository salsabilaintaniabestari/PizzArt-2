# Dokumentasi Konversi QRIS ke COD (Cash on Delivery)

## Ringkasan Perubahan

Sistem pembayaran telah sepenuhnya dikonversi dari QRIS (Midtrans) ke COD (Cash on Delivery). Semua referensi QRIS telah dihapus dan diganti dengan sistem pembayaran COD yang sederhana dan efektif.

---

## 1. Perubahan Status Pesanan

### Status Lama (QRIS)
- `pending` - Menunggu Konfirmasi
- `processing` - Sedang Diproses
- `completed` - Pesanan Selesai
- `shipped` - Dalam Pengiriman
- `cancelled` - Dibatalkan

### Status Baru (COD)
- `ordered` - Dipesan
- `preparing` - Dibuat
- `shipped` - Dikirim
- `completed` - Selesai

**Alur Status COD:**
```
Dipesan → Dibuat → Dikirim → Selesai
```

---

## 2. File yang Dimodifikasi

### A. `/src/pages/CartPage.tsx`

**Perubahan Utama:**
- Menghapus integrasi QRISPayment component
- Menambahkan modal konfirmasi dengan form:
  - Nama Lengkap
  - Nomor Telepon
  - Alamat Pengiriman
- Mengubah payment method ke `COD`
- Status pesanan awal: `ordered`

**Kode Kunci:**
```typescript
const orderRef = await addDoc(collection(db, 'orders'), {
  user_id: authUser.uid,
  user_email: authUser.email || user?.email || 'guest@pizza.com',
  user_name: customerName,
  shipping_address: shippingAddress,
  customer_phone: customerPhone,
  total_price: finalTotal,
  payment_method: 'COD',
  status: 'ordered',
  created_at: serverTimestamp(),
  updated_at: serverTimestamp(),
});
```

**Fitur Baru:**
- Form pengisian alamat pengiriman
- Validasi data customer sebelum checkout
- Informasi pembayaran COD yang jelas
- Notifikasi sukses setelah pesanan dibuat

---

### B. `/src/pages/OrderTrackingPage.tsx`

**Perubahan Utama:**
- Update interface Order dengan field COD:
  - `shipping_address: string`
  - `customer_phone: string`
  - `payment_method: string`
- Update status system ke 4-stage COD workflow
- Menambahkan informasi pengiriman lengkap
- Timeline visual untuk tracking status

**Timeline Progress:**
```typescript
const steps = [
  { status: 'ordered', label: 'Dipesan', icon: Clock },
  { status: 'preparing', label: 'Dibuat', icon: Package },
  { status: 'shipped', label: 'Dikirim', icon: Truck },
  { status: 'completed', label: 'Selesai', icon: CheckCircle },
];
```

**Deskripsi Status:**
- `ordered`: "Pesanan Anda telah diterima dan menunggu diproses"
- `preparing`: "Pesanan Anda sedang dibuat oleh chef kami"
- `shipped`: "Pesanan Anda sedang dalam perjalanan ke alamat tujuan"
- `completed`: "Pesanan Anda telah selesai dan diterima. Pembayaran COD telah diselesaikan."

**Fitur Baru:**
- Tampilan detail alamat pengiriman
- Informasi customer lengkap
- Timeline visual dengan progress indicator
- Notifikasi pembayaran COD untuk completed orders

---

### C. `/src/pages/admin/AdminOrdersPage.tsx`

**Perubahan Utama:**
- Update Order interface:
```typescript
interface Order {
  id: string;
  user_name: string;
  user_email: string;
  shipping_address?: string;
  customer_phone?: string;
  payment_method?: string;
  total_price: number;
  status: 'ordered' | 'preparing' | 'shipped' | 'completed';
  created_at: any;
  items?: OrderItem[];
}
```

- Update status colors dan labels:
```typescript
const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'ordered': return 'bg-orange-100 text-orange-800';
    case 'preparing': return 'bg-blue-100 text-blue-800';
    case 'shipped': return 'bg-purple-100 text-purple-800';
    case 'completed': return 'bg-green-100 text-green-800';
  }
};

const getStatusLabel = (status: Order['status']) => {
  const labels: Record<string, string> = {
    ordered: 'Dipesan',
    preparing: 'Dibuat',
    shipped: 'Dikirim',
    completed: 'Selesai',
  };
  return labels[status] || status;
};
```

**Statistik Display:**
- 4 kartu status: Dipesan, Dibuat, Dikirim, Selesai
- Label khusus "Selesai (Revenue)" untuk menekankan bahwa hanya order completed yang dihitung sebagai revenue

**Fitur Admin:**
- Dropdown untuk mengubah status pesanan
- Filter berdasarkan status
- Search berdasarkan nama/email customer
- Real-time update setiap 10 detik

---

### D. `/src/pages/admin/AdminDashboardPage.tsx`

**Perubahan Kritis - Perhitungan Revenue:**

**SEBELUM:**
```typescript
const totalRevenue = orders.reduce((sum, order) => {
  const price = order.total_price || order.totalPrice || 0;
  return sum + Number(price);
}, 0);
```

**SESUDAH:**
```typescript
const totalRevenue = orders
  .filter((o) => o.status === 'completed')
  .reduce((sum, order) => {
    const price = order.total_price || order.totalPrice || 0;
    return sum + Number(price);
  }, 0);
```

**Alasan Perubahan:**
Dalam sistem COD, revenue hanya dihitung saat pesanan `completed` karena pembayaran dilakukan saat pengiriman. Order yang masih `ordered`, `preparing`, atau `shipped` belum menghasilkan revenue.

**Update Status Counters:**
```typescript
const pendingOrders = orders.filter((o) => o.status === 'ordered').length;
const processingOrders = orders.filter((o) => o.status === 'preparing' || o.status === 'shipped').length;
const completedOrders = orders.filter((o) => o.status === 'completed').length;
```

---

## 3. Firestore Database Schema

### Collection: `orders`
```typescript
{
  id: string (auto-generated)
  user_id: string (Firebase Auth UID)
  user_email: string
  user_name: string
  shipping_address: string       // BARU
  customer_phone: string          // BARU
  payment_method: string          // BARU (selalu "COD")
  total_price: number
  status: 'ordered' | 'preparing' | 'shipped' | 'completed'  // UPDATED
  created_at: Timestamp
  updated_at: Timestamp
}
```

### Collection: `order_items`
```typescript
{
  id: string (auto-generated)
  order_id: string (reference to orders)
  pizza_name: string
  size: string
  crust: string
  sauce: string
  toppings: array
  quantity: number
  price: number
  created_at: Timestamp
}
```

---

## 4. Komponen dan File yang Dihapus

### Dihapus Sepenuhnya:
- `src/components/payment/QRISPayment.tsx` - Komponen QRIS payment
- Semua import dan referensi ke QRISPayment
- Semua referensi Midtrans API
- Supabase Edge Functions untuk payment (create-qris-payment, midtrans-webhook)

### Environment Variables Tidak Diperlukan:
- `VITE_MIDTRANS_CLIENT_KEY`
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_IS_PRODUCTION`

---

## 5. User Flow - COD System

### A. Customer Flow

**1. Buat Pizza**
- Customer memilih size, crust, sauce, toppings
- Pizza ditambahkan ke cart

**2. Review Cart**
- Customer melihat ringkasan pesanan
- Total harga = Item price + Pajak 10%
- Informasi: Ongkir Gratis, Pembayaran COD

**3. Checkout**
- Klik "Checkout Sekarang"
- Modal konfirmasi muncul
- Isi form:
  - Nama Lengkap
  - Nomor Telepon
  - Alamat Pengiriman Lengkap
- Konfirmasi pesanan

**4. Pesanan Dibuat**
- Status: `ordered` (Dipesan)
- Notifikasi sukses
- Redirect ke halaman Order Tracking

**5. Tracking Progress**
- Customer dapat melihat status real-time:
  - Dipesan → menunggu diproses
  - Dibuat → sedang dibuat oleh chef
  - Dikirim → dalam perjalanan
  - Selesai → diterima, COD paid

**6. Pembayaran**
- Pembayaran dilakukan saat pesanan diterima (COD)
- Status berubah ke `completed` setelah pembayaran

---

### B. Admin Flow

**1. Dashboard**
- Melihat statistik:
  - Total Orders
  - Orders Hari Ini
  - Total Revenue (hanya dari completed orders)
  - Stok Rendah
- Status breakdown: Dipesan, Dibuat, Dikirim, Selesai
- Pizza terpopuler
- Recent orders

**2. Manajemen Pesanan**
- Melihat semua pesanan dengan detail lengkap
- Filter berdasarkan status
- Search customer
- Ubah status pesanan menggunakan dropdown:
  - Dipesan → Dibuat
  - Dibuat → Dikirim
  - Dikirim → Selesai

**3. Update Status**
- Admin mengubah status sesuai progress pesanan
- Customer mendapat update real-time di halaman tracking
- Revenue hanya dihitung saat status `completed`

---

## 6. Keuntungan Sistem COD

### Kelebihan:
1. **Tidak Perlu Payment Gateway**
   - Tidak ada biaya transaksi ke Midtrans
   - Tidak ada kompleksitas integrasi payment API
   - Tidak perlu maintenance webhook

2. **Lebih Sederhana**
   - Flow checkout lebih straightforward
   - Tidak ada handling payment failed/expired
   - Tidak ada QR code generation

3. **Customer Trust**
   - Customer membayar setelah menerima pesanan
   - Mengurangi risiko fraud dari sisi customer
   - Lebih familiar untuk pasar Indonesia

4. **Revenue Tracking Akurat**
   - Revenue hanya dihitung saat pesanan completed
   - Tidak ada pending payments yang membingungkan
   - Cashflow lebih jelas

### Pertimbangan:
1. **Risiko COD**
   - Customer bisa menolak pesanan saat delivery
   - Perlu sistem verifikasi customer yang baik
   - Pertimbangkan down payment untuk order besar

2. **Manajemen Kurir**
   - Kurir harus handle cash
   - Perlu sistem reconciliation cash
   - Keamanan kurir membawa uang

---

## 7. Testing Checklist

### Frontend Testing:
- [x] Cart page menampilkan COD payment info
- [x] Checkout modal muncul dengan form yang benar
- [x] Validasi form berfungsi (nama, phone, address required)
- [x] Order berhasil dibuat dengan status `ordered`
- [x] Redirect ke order tracking setelah checkout

### Order Tracking Testing:
- [x] Halaman tracking menampilkan order list
- [x] Detail order menampilkan informasi lengkap
- [x] Timeline visual update sesuai status
- [x] Real-time update dari Firestore
- [x] Shipping address dan customer info tampil benar

### Admin Testing:
- [x] Admin dashboard menampilkan statistik benar
- [x] Revenue hanya menghitung completed orders
- [x] Admin dapat mengubah status order
- [x] Filter dan search berfungsi
- [x] Status counters akurat

### Database Testing:
- [x] Orders collection menyimpan data lengkap
- [x] Order items tersimpan dengan benar
- [x] Timestamps ter-generate otomatis
- [x] Real-time listener berfungsi

---

## 8. Build Status

```
✓ Build berhasil tanpa error
✓ Tidak ada import QRISPayment yang tersisa
✓ Tidak ada referensi Midtrans
✓ Semua TypeScript types valid
✓ Bundle size: 827.32 kB (gzip: 204.13 kB)
```

---

## 9. Migration Notes

### Untuk Update Production:

1. **Backup Database**
   ```bash
   # Backup existing orders collection
   # Download all data before deployment
   ```

2. **Update Existing Orders (Optional)**
   ```javascript
   // Script untuk update status lama ke baru
   const statusMapping = {
     'pending': 'ordered',
     'processing': 'preparing',
     'completed': 'completed',
     'cancelled': 'completed' // atau delete
   };
   ```

3. **Deploy Steps:**
   - Deploy frontend build
   - Monitor error logs
   - Verify order creation flow
   - Test admin status updates

4. **Rollback Plan:**
   - Keep backup of old CartPage.tsx
   - Document old status system
   - Prepare rollback script if needed

---

## 10. Future Enhancements

### Prioritas Tinggi:
1. **SMS/Email Notifications**
   - Notifikasi saat status berubah
   - Reminder untuk customer
   - Konfirmasi delivery

2. **Order Validation**
   - Phone number verification
   - Address validation
   - Maximum order value untuk COD

3. **Kurir Management**
   - Assignment kurir ke order
   - Tracking lokasi kurir
   - Cash reconciliation system

### Prioritas Medium:
1. **Customer History**
   - Saved addresses
   - Reorder functionality
   - Order statistics

2. **Admin Features**
   - Bulk status update
   - Export orders to CSV
   - Revenue reports by date range

3. **Payment Options**
   - Partial payment/down payment
   - Bank transfer (manual verification)
   - E-wallet integration (future)

---

## 11. Kontak & Support

Untuk pertanyaan atau issue terkait sistem COD:
- Cek console logs untuk debugging
- Review Firestore data structure
- Verify Firebase rules
- Test dengan different user roles (customer, admin)

---

## Kesimpulan

Konversi dari QRIS ke COD telah selesai dengan sempurna:
- Semua kode QRIS dihapus
- Sistem COD fully functional
- Admin dapat manage orders dengan 4-stage workflow
- Revenue tracking akurat (hanya completed orders)
- Build sukses tanpa error
- Ready untuk production deployment

**Status: SELESAI ✓**
