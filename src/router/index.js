import { createRouter, createWebHistory } from 'vue-router';

// 1. Import komponen-komponen yang akan digunakan sebagai halaman
import Login from '../components/Index.vue'; // Misal, ini Home/Index Anda
import ParkingForm from '../components/ParkingForm.vue'; // Komponen Parkir Anda yang sudah ada

// 2. Definisikan routes Anda
const routes = [
  {
    path: '/', // Path URL untuk halaman ini
    name: 'login', // Nama route, opsional tapi direkomendasikan
    component: Login // Komponen yang akan dirender saat path ini aktif
  },
  {
    path: '/parking', // Contoh route baru untuk halaman parkir
    name: 'parking',
    component: ParkingForm // Menggunakan komponen ParkingForm Anda
  },
  // Anda bisa menambahkan route lain di sini
  // {
  //   path: '/lain',
  //   name: 'lain',
  //   component: () => import('../views/LainView.vue') // Lazy load komponen
  // }
];

// 3. Buat instance router
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // Menggunakan HTML5 History mode
  routes // Daftarkan routes yang sudah didefinisikan
});

// 4. Export router agar bisa digunakan di main.js
export default router;