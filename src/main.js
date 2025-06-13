// src/main.js
import { createApp } from 'vue';
import App from './App.vue';

// --- Impor CSS Bootstrap ---
import 'bootstrap/dist/css/bootstrap.min.css'; // Ini yang utama dari npm
// import { Tooltip, Toast, Popover } from 'bootstrap'; // Ini jika Anda ingin mengimpor komponen JS Bootstrap secara individual

// --- Impor Router Anda ---
import router from './router'; // Mengimpor router yang telah dibuat







// --- Inisialisasi Aplikasi Vue ---
const app = createApp(App); // Buat instance aplikasi Vue

app.use(router); // <-- Gunakan Vue Router di sini, SEBELUM mounting!

app.mount('#app'); // <-- Baru mount aplikasi ke elemen DOM