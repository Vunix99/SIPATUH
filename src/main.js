// src/main.js
import { createApp } from 'vue';
import App from './App.vue';

// --- Impor CSS Bootstrap ---
import 'bootstrap/dist/css/bootstrap.min.css'; // Ini yang utama dari npm
// import { Tooltip, Toast, Popover } from 'bootstrap'; // Ini jika Anda ingin mengimpor komponen JS Bootstrap secara individual

// --- Impor Router Anda ---
import router from './router'; // Mengimpor router yang telah dibuat

// --- Impor File CSS Kustom Anda ---
import './assets/css/bootstrap.min.css'; // Jika ini adalah Bootstrap custom/lama, pastikan tidak konflik
import './assets/css/style.css';
import './assets/css/vendors.css';
import './assets/css/custom.css';

// --- Impor File JS Kustom Anda ---
// Pastikan urutan impor JS benar jika ada dependensi
import './assets/js/jquery-3.7.1.min.js'; // JQuery biasanya diimpor sebelum script lain yang mungkin menggunakannya
import './assets/js/bootstrap.bundle.min.js'; // Bootstrap JS bundle
import './assets/js/common_scripts.min.js';
import './assets/js/functions.js';

// --- Inisialisasi Aplikasi Vue ---
const app = createApp(App); // Buat instance aplikasi Vue

app.use(router); // <-- Gunakan Vue Router di sini, SEBELUM mounting!

app.mount('#app'); // <-- Baru mount aplikasi ke elemen DOM