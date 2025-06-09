import { createRouter, createWebHistory } from 'vue-router';
import Swal from 'sweetalert2'; // Import SweetAlert2 untuk notifikasi

// 1. Import komponen-komponen yang akan digunakan sebagai halaman
import Login from '../components/Index.vue'; // Misal, ini halaman login Anda
import ParkingForm from '../components/ParkingForm.vue'; // Komponen Parkir Anda yang sudah ada

// 2. Definisikan routes Anda
const routes = [
  {
    path: '/',
    redirect: '/login' // Secara default, arahkan root ke halaman login
  },
  {
    path: '/login', // Path URL untuk halaman ini
    name: 'login', // Nama route
    component: Login, // Komponen yang akan dirender
    meta: { requiresAuth: false } // Rute ini TIDAK memerlukan otentikasi
  },
  {
    path: '/parking', // Contoh route untuk halaman parkir
    name: 'parking',
    component: ParkingForm, // Menggunakan komponen ParkingForm Anda
    meta: { requiresAuth: true } // Rute ini MEMERLUKAN otentikasi
  },
  // Anda bisa menambahkan rute-rute lain yang memerlukan otentikasi di sini:
  // {
  //   path: '/dashboard',
  //   name: 'dashboard',
  //   component: () => import('../components/Dashboard.vue'), // Contoh lazy load
  //   meta: { requiresAuth: true } // Memerlukan otentikasi
  // },
  // Catch-all route for 404 Not Found (Opsional, tapi disarankan)
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: { template: '<div><h1>404 - Halaman Tidak Ditemukan</h1><p>Maaf, halaman yang Anda cari tidak ada.</p><router-link to="/login">Kembali ke Login</router-link></div>' }
  }
];

// 3. Buat instance router
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // Menggunakan HTML5 History mode
  routes // Daftarkan routes yang sudah didefinisikan
});

// 4. Global Navigation Guard
router.beforeEach(async (to, from, next) => {
  const API_DOMAIN = import.meta.env.VITE_DOMAIN_SERVER || "http://localhost:3000";

  // Fungsi untuk memeriksa otentikasi ke server
  const checkAuthentication = async () => {
    try {
      const response = await fetch(`${API_DOMAIN}/api/check-auth`, {
        method: 'GET',
        credentials: 'include' // Penting: Mengirim cookie HttpOnly
      });
      return response.ok; // True jika status 200 OK (terotentikasi), false jika 401/403
    } catch (error) {
      console.error("Authentication check network error:", error);
      // Jika ada error jaringan, asumsikan tidak terotentikasi
      return false;
    }
  };

  const isAuthenticated = await checkAuthentication();

  // A. Jika rute yang dituju memerlukan otentikasi
  if (to.meta.requiresAuth) {
    if (isAuthenticated) {
      next(); // Lanjutkan ke rute yang dituju
    } else {
      // Jika tidak terotentikasi, arahkan ke halaman login
      next('/login');
      // Tampilkan notifikasi hanya jika pengguna bukan berasal dari halaman login (untuk menghindari notifikasi berulang)
      if (from.name !== 'login') {
        Swal.fire({
          icon: "warning",
          title: "Sesi Habis",
          text: "Sesi Anda telah berakhir atau tidak valid. Silakan login kembali.",
          showConfirmButton: false,
          timer: 2000
        });
      }
    }
  }
  // B. Jika rute yang dituju adalah halaman login DAN pengguna sudah terotentikasi
  else if (to.name === 'login' && isAuthenticated) {
    next('/parking'); // Redirect ke halaman parkir jika sudah login
    // Opsional: Anda bisa memberikan notifikasi di sini juga jika diperlukan
    // Swal.fire({
    //   icon: "info",
    //   title: "Sudah Login",
    //   text: "Anda sudah login. Mengalihkan ke halaman parkir.",
    //   showConfirmButton: false,
    //   timer: 1500
    // });
  }
  // C. Untuk rute lain yang tidak memerlukan otentikasi (selain login)
  else {
    next(); // Lanjutkan navigasi
  }
});

// 5. Export router agar bisa digunakan di main.js
export default router;