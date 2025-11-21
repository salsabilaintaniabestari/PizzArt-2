# Firestore Data Import Guide

Folder ini berisi data dummy untuk di-import ke Firestore.

## Cara Import Data

### Metode 1: Manual via Firebase Console

1. Buka Firebase Console: https://console.firebase.google.com/
2. Pilih project "pizzart-1"
3. Klik "Firestore Database"
4. Untuk setiap collection, klik "Start collection"
5. Masukkan nama collection sesuai dengan file JSON
6. Copy data dari file JSON dan paste ke Firebase Console

### Metode 2: Menggunakan Firebase Admin SDK (Recommended)

Buat script Node.js untuk import data secara otomatis:

```javascript
const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require('./path-to-serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importCollection(collectionName, fileName) {
  const data = JSON.parse(fs.readFileSync(`./firestore-data/${fileName}`, 'utf8'));

  const batch = db.batch();

  data.forEach(doc => {
    const docRef = db.collection(collectionName).doc();

    // Tambahkan timestamps jika belum ada
    if (!doc.created_at) {
      doc.created_at = admin.firestore.FieldValue.serverTimestamp();
    }
    if (!doc.updated_at) {
      doc.updated_at = admin.firestore.FieldValue.serverTimestamp();
    }

    // Set document ID jika ada field id
    if (doc.id && collectionName !== 'inventory') {
      batch.set(db.collection(collectionName).doc(doc.id), doc);
    } else {
      batch.set(docRef, doc);
    }
  });

  await batch.commit();
  console.log(`✓ Imported ${data.length} documents to ${collectionName}`);
}

async function importAll() {
  try {
    await importCollection('inventory', 'inventory.json');
    await importCollection('community_pizzas', 'community_pizzas.json');
    await importCollection('contests', 'contests.json');

    console.log('✓ All data imported successfully!');
  } catch (error) {
    console.error('Error importing data:', error);
  }
}

importAll();
```

### Untuk Admin User

Karena admin user perlu dibuat dengan Firebase Authentication terlebih dahulu:

1. Buat user admin melalui Firebase Console > Authentication
   - Email: admin@pizzart.com
   - Password: (pilih password yang aman)

2. Copy UID dari user yang baru dibuat

3. Tambahkan document di collection `admin_users`:
   - Document ID: [UID dari step 2]
   - Fields:
     ```json
     {
       "id": "[UID]",
       "email": "admin@pizzart.com",
       "username": "admin",
       "created_at": "2025-01-01T00:00:00.000Z",
       "updated_at": "2025-01-01T00:00:00.000Z"
     }
     ```

### Untuk Regular Users

User regular akan otomatis dibuat saat registrasi melalui aplikasi. Data profil akan tersimpan di collection `users`.

Jika ingin membuat dummy users secara manual:

1. Buat user melalui Firebase Console > Authentication
2. Copy UID user tersebut
3. Tambahkan document di collection `users` dengan structure:
   ```json
   {
     "id": "[UID]",
     "email": "user@example.com",
     "username": "username",
     "full_name": "Full Name",
     "phone": "+628123456789",
     "address": "Jl. Example No. 123",
     "points": 0,
     "created_at": "2025-01-01T00:00:00.000Z",
     "updated_at": "2025-01-01T00:00:00.000Z"
   }
   ```

## File Yang Tersedia

- `inventory.json` - Data stok bahan-bahan pizza (22 items)
- `admin_users.json` - Template untuk admin user (perlu disesuaikan UID)
- `community_pizzas.json` - Contoh pizza dari komunitas (3 items)
- `contests.json` - Contoh lomba pizza (2 items)

## Catatan Penting

1. **Document ID untuk admin_users dan users**: HARUS sama dengan UID dari Firebase Authentication
2. **Timestamps**: Gunakan format ISO 8601 atau Firebase Timestamp
3. **Security Rules**: Pastikan Security Rules sudah di-setup sebelum import data
4. **Indexes**: Buat composite indexes jika diperlukan untuk query yang kompleks

## Verifikasi Data

Setelah import, verifikasi data melalui:
1. Firebase Console > Firestore Database
2. Cek jumlah documents di setiap collection
3. Test query melalui aplikasi
