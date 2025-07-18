<template>
  <div class="d-flex min-vh-100">
    <nav :class="['sidebar', sidebarOpen ? 'open' : '']">
      <div
        class="sidebar-header d-flex justify-content-between align-items-center"
      >
        <img src="/src/assets/img/LogoSipatuhLong_Transparent.svg" alt="" class="sidebar-logo">
        <button class="btn btn-sm btn-light d-md-none" @click="toggleSidebar">
          ✕
        </button>
      </div>
      <ul class="list-unstyled ps-3">
        <li>
          <router-link to="/dashboard" class="nav-link">
            <i class="fa-solid fa-chart-line"></i> Dashboard
          </router-link>
        </li>
        <li>
          <router-link to="/tambah-admin" class="nav-link">
            <i class="fa-solid fa-user-plus"></i> Tambah Admin
          </router-link>
        </li>
        <li>
          <router-link to="/data-parkir" class="nav-link">
            <i class="fa-solid fa-square-parking"></i> Data Parkir
          </router-link>
        </li>
        <li>
          <router-link to="/pemasukan" class="nav-link">
            <i class="fa-solid fa-money-bill-wave"></i> Pemasukan Parkir
          </router-link>
        </li>
        <li>
          <router-link to="/log-aktivitas" class="nav-link">
            <i class="fa-solid fa-clipboard-list"></i> Log Aktivitas
          </router-link>
        </li>
        <li>
          <router-link to="/pencadangan-pemulihan" class="nav-link">
            <i class="fa-solid fa-arrows-rotate"></i> Pencadangan dan Pemulihan
          </router-link>
        </li>
        <li>
          <router-link
            to="/logout"
            class="nav-link"
            style="color: red; font-weight: bolder"
          >
            <i class="fa-solid fa-right-from-bracket"></i> Logout
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="content flex-grow-1">
      <nav class="navbar navbar-light bg-light px-3 fixed-top">
        <button
          class="btn btn-outline-secondary d-md-none"
          @click="toggleSidebar"
        >
          ☰
        </button>
        <h5 class="m-0 ms-2" style="color: #fdfdfd; font-weight: bold">
          Log Aktivitas Admin
        </h5>
      </nav>

      <div class="content-wrapper">
        <div class="container-fluid pt-4 px-3 form-wrapper-top">
          <div class="container-fluid mt-3">
            <div class="row g-4">
              <div class="col-md-6 col-lg-4">
                <div class="card shadow h-100">
                  <div class="card-header">
                    <strong>💰 Log Pemasukan</strong>
                  </div>
                  <div class="card-body">
                    <ul class="list-group list-group-flush activity-list">
                      <li
                        v-for="log in filteredLogs.income"
                        :key="log.id"
                        class="list-group-item"
                      >
                        <span>{{ formatLogMessage(log) }}</span>
                        <br /><small class="text-muted">{{
                          formatTimeAgo(log.tanggal_pesan)
                        }}</small>
                      </li>
                      <li
                        v-if="!filteredLogs.income.length"
                        class="list-group-item text-center text-muted"
                      >
                        Tidak ada log pemasukan.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="col-md-6 col-lg-4">
                <div class="card shadow h-100">
                  <div class="card-header">
                    <strong>🚗 Log Parkir Masuk/Keluar</strong>
                  </div>
                  <div class="card-body">
                    <ul class="list-group list-group-flush activity-list">
                      <li
                        v-for="log in filteredLogs.parking"
                        :key="log.id"
                        class="list-group-item"
                      >
                        <span>{{ formatLogMessage(log) }}</span>
                        <br /><small class="text-muted">{{
                          formatTimeAgo(log.tanggal_pesan)
                        }}</small>
                      </li>
                      <li
                        v-if="!filteredLogs.parking.length"
                        class="list-group-item text-center text-muted"
                      >
                        Tidak ada log parkir.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="col-md-6 col-lg-4">
                <div class="card shadow h-100">
                  <div class="card-header">
                    <strong>⚙️ Log Sistem (Backup/Pemulihan)</strong>
                  </div>
                  <div class="card-body">
                    <ul class="list-group list-group-flush activity-list">
                      <li
                        v-for="log in filteredLogs.system"
                        :key="log.id"
                        class="list-group-item"
                      >
                        <span>{{ formatLogMessage(log) }}</span>
                        <br /><small class="text-muted">{{
                          formatTimeAgo(log.tanggal_pesan)
                        }}</small>
                      </li>
                      <li
                        v-if="!filteredLogs.system.length"
                        class="list-group-item text-center text-muted"
                      >
                        Tidak ada log sistem.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="col-md-6 col-lg-4">
                <div class="card shadow h-100">
                  <div class="card-header">
                    <strong>👥 Log Admin & Autentikasi</strong>
                  </div>
                  <div class="card-body">
                    <ul class="list-group list-group-flush activity-list">
                      <li
                        v-for="log in filteredLogs.adminAuth"
                        :key="log.id"
                        class="list-group-item"
                      >
                        <span>{{ formatLogMessage(log) }}</span>
                        <br /><small class="text-muted">{{
                          formatTimeAgo(log.tanggal_pesan)
                        }}</small>
                      </li>
                      <li
                        v-if="!filteredLogs.adminAuth.length"
                        class="list-group-item text-center text-muted"
                      >
                        Tidak ada log admin/autentikasi.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="col-md-6 col-lg-4">
                <div class="card shadow h-100">
                  <div class="card-header">
                    <strong>🎫 Log Tiket</strong>
                  </div>
                  <div class="card-body">
                    <ul class="list-group list-group-flush activity-list">
                      <li
                        v-for="log in filteredLogs.ticket"
                        :key="log.id"
                        class="list-group-item"
                      >
                        <span>{{ formatLogMessage(log) }}</span>
                        <br /><small class="text-muted">{{
                          formatTimeAgo(log.tanggal_pesan)
                        }}</small>
                      </li>
                      <li
                        v-if="!filteredLogs.ticket.length"
                        class="list-group-item text-center text-muted"
                      >
                        Tidak ada log tiket.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="col-md-6 col-lg-4">
                <div class="card shadow h-100">
                  <div class="card-header">
                    <strong>ℹ️ Log Lainnya</strong>
                  </div>
                  <div class="card-body">
                    <ul class="list-group list-group-flush activity-list">
                      <li
                        v-for="log in filteredLogs.other"
                        :key="log.id"
                        class="list-group-item"
                      >
                        <span>{{ formatLogMessage(log) }}</span>
                        <br /><small class="text-muted">{{
                          formatTimeAgo(log.tanggal_pesan)
                        }}</small>
                      </li>
                      <li
                        v-if="!filteredLogs.other.length"
                        class="list-group-item text-center text-muted"
                      >
                        Tidak ada log lainnya.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { io } from "socket.io-client";

export default {
  name: "LogAktivitas",
  setup() {
    const sidebarOpen = ref(false);
    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    const allLogMessages = ref([]); // Semua log pesan dari backend

    let socket = null;

    const API_DOMAIN =
      import.meta.env.VITE_DOMAIN_SERVER || "http://localhost:3000";

    const formatTimeAgo = (dateString) => {
      const cleanDateString = dateString.replace("Z", "");
      const past = new Date(cleanDateString);
      const now = new Date();

      const diffMilliseconds = now.getTime() - past.getTime();
      const diffSeconds = Math.floor(diffMilliseconds / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffMonths = Math.floor(diffDays / 30.44);
      const diffYears = Math.floor(diffDays / 365.25);

      if (diffSeconds < 0) {
        return "Waktu masa depan";
      } else if (diffMinutes >= 0 && diffMinutes < 2) {
        return "Baru saja";
      } else if (diffMinutes < 60) {
        return `${diffMinutes} menit yang lalu`;
      } else if (diffHours < 24) {
        return `${diffHours} jam yang lalu`;
      } else if (diffDays < 30) {
        return `${diffDays} hari yang lalu`;
      } else if (diffMonths < 12) {
        return `${diffMonths} bulan yang lalu`;
      } else {
        return `${diffYears} tahun yang lalu`;
      }
    };

    const formatLogMessage = (log) => {
      const adminEmail = log.admin_email || "Unknown Admin";
      const rawMessage = log.isi_pesan;
      return rawMessage.replace("email_admin", adminEmail);
    };

    // Fungsi untuk menentukan kategori log berdasarkan isi pesan
    const getLogCategory = (logMessage) => {
      const message = logMessage.toLowerCase();

      // Pemasukan
      if (message.includes("menambah pemasukan")) return "income";
      if (message.includes("mengubah pemasukan")) return "income";
      if (message.includes("menghapus pemasukan")) return "income";

      // Tiket (TERMASUK PARKIR MASUK & KELUAR YANG TERKAIT TIKET)
      if (message.includes("telah menambah tiket nomor")) return "ticket";
      if (message.includes("mengaktifkan tiket nomor")) return "ticket";
      if (message.includes("menonaktifkan tiket nomor")) return "ticket";
      if (message.includes("telah memakai no. tiket")) return "ticket"; // Logika baru untuk parkir masuk
      if (message.includes("telah mengembalikan no. tiket")) return "ticket"; // Logika baru untuk parkir keluar

      // Parkir (Jika ada log parkir lain yang tidak terkait tiket, bisa ditambahkan di sini)
      // Contoh: if (message.includes("kendaraan tanpa tiket masuk")) return "parking";
      // Untuk saat ini, jika semua log parkir terkait tiket, kategori 'parking' mungkin kosong.
      // Anda bisa menghapus kartu 'Log Parkir Masuk/Keluar' jika tidak ada log yang akan masuk ke sana.
      if (message.includes("menambah data parkir plat nomor")) return "parking"; // Pertahankan ini jika ada log lama
      if (message.includes("mengeluarkan data parkir plat nomor"))
        return "parking"; // Pertahankan ini jika ada log lama

      // Sistem (Backup, Pemulihan)
      if (message.includes("melakukan backup")) return "system";
      if (message.includes("melakukan pemulihan")) return "system";

      // Admin & Autentikasi
      if (message.includes("berhasil login")) return "adminAuth";
      if (message.includes("telah logout")) return "adminAuth";
      if (message.includes("telah menambah admin baru")) return "adminAuth"; // Pastikan pola log ini benar

      // Catch-all for other logs
      return "other";
    };

    // Computed property untuk memfilter log ke dalam kategori-kategori
    const filteredLogs = computed(() => {
      const logsByCategory = {
        income: [],
        parking: [],
        system: [],
        adminAuth: [],
        ticket: [],
        other: [],
      };

      allLogMessages.value.forEach((log) => {
        const category = getLogCategory(log.isi_pesan);
        if (logsByCategory[category]) {
          logsByCategory[category].push(log);
        } else {
          logsByCategory.other.push(log); // Fallback if category not found
        }
      });

      return logsByCategory;
    });

    onMounted(() => {
      socket = io(API_DOMAIN, {
        withCredentials: true,
      });

      socket.on("connect", () => {
        console.log("Connected to WebSocket server from LogAktivitas!");
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from WebSocket server from LogAktivitas.");
      });

      socket.on("connect_error", (err) => {
        console.error("WebSocket connection error:", err.message);
      });

      // Menerima semua log pesan dari backend
      socket.on("logMessagesUpdate", (data) => {
        allLogMessages.value = data;
      });
    });

    onUnmounted(() => {
      if (socket) {
        socket.disconnect();
      }
    });

    return {
      sidebarOpen,
      toggleSidebar,
      allLogMessages,
      filteredLogs,
      formatTimeAgo,
      formatLogMessage,
    };
  },
};
</script>

<style scoped>
/* Wrapper full height, tapi mulai dari atas kiri */
.form-wrapper-top {
  /* Hapus min-height: 100vh; dan display: block; jika ingin menyesuaikan dengan padding-top content-wrapper */
  /* min-height: 100vh; */
  /* display: block; */
}
/* Pastikan gaya konsisten dengan Dashboard.vue */
body,
.content {
  background-color: #2b0057;
  color: #fdfdfd;
}

.router-link-active,
.router-link-exact-active,
.nav-link {
  margin-right: 20px;
  margin-bottom: 8px;
}
h5.card-title {
  color: #fdfdfd;
}

/* Sidebar style */
.sidebar {
  background-color: #5a0099; /* Darker purple for sidebar */
  color: #fdfdfd; /* Changed to FDFDFD */
  width: 260px; /* Lebar sidebar yang diperbesar */
  height: 100vh;
  padding-top: 1rem;
  position: fixed;
  transition: all 0.3s;
  left: 0;
  z-index: 2000;
  overflow-x: hidden; /* Penting untuk mencegah konten melebihi lebar sidebar */
}

/* Style for the logo inside the sidebar header */
.sidebar-logo {
  max-width: calc(100% - 60px); /* Batasi lebar agar ada ruang untuk tombol close, misal 60px untuk tombol dan padding */
  height: auto;    /* Maintain aspect ratio */
  display: block;  /* Treat it as a block element */
  margin-right: auto; /* Mendorong logo ke kiri dalam flexbox */
  margin-left: -5%; /* Geser logo lebih ke kiri, sesuaikan persentase ini */
  box-sizing: border-box; /* Pastikan padding dihitung dalam total lebar elemen */
}

/* Styles for the sidebar close button */
.sidebar-close-btn {
  margin-right: 0.5rem; /* Memberi sedikit ruang dari tepi kanan sidebar */
  background-color: rgba(255, 255, 255, 0.2); /* Sedikit transparan agar terlihat */
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fdfdfd; /* Warna teks putih */
  font-weight: bold;
  font-size: 1rem;
  line-height: 1; /* Pastikan tinggi baris untuk '✕' pas */
  padding: 0.25rem 0.5rem; /* Padding tombol */
  border-radius: 5px;
  flex-shrink: 0; /* Pastikan tombol tidak menyusut */
}

.sidebar-close-btn:hover {
  background-color: rgba(255, 255, 255, 0.4);
  color: #fff;
}

.sidebar .nav-link {
  color: #eee; /* Kept slightly off-white for contrast against FDFDFD main text */
  padding: 10px;
  display: block;
  border-radius: 5px;
}

.sidebar .nav-link.router-link-exact-active,
.sidebar .nav-link:hover {
  background-color: #fc0; /* Consistent secondary accent color */
  color: #000; /* Kept black for contrast on yellow background */
  font-weight: bold;
}

.sidebar-header {
  padding: 0.75rem 1rem; /* Padding kontainer utama */
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  /* Sudah ada d-flex justify-content-between align-items-center di HTML,
     jadi flexbox akan menangani positioning anak-anaknya. */
}
/* Sidebar Specific Styles - END */

/* Navbar style */
.navbar {
  background-color: #210038 !important;
  color: #fdfdfd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1030;
  transition: padding-left 0.3s;
  /* padding-left akan diatur di media query */
}

.navbar .btn-outline-secondary {
  border-color: #fc0;
  color: #fc0;
}

.navbar .btn-outline-secondary:hover {
  background-color: #fc0;
  color: #000;
}

.card {
  background-color: rgba(0, 0, 0, 0.25);
  color: #fdfdfd;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.card-header {
  background-color: rgba(0, 0, 0, 0.35);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card.bg-primary,
.card.bg-success,
.card.bg-warning,
.card.bg-info {
  background-color: #4d0073 !important;
  color: #fdfdfd !important;
}

.card.bg-primary {
  border-left: 5px solid #a64dff;
}
.card.bg-success {
  border-left: 5px solid #00cc66;
}
.card.bg-warning {
  border-left: 5px solid #fc0;
}
.card.bg-info {
  border-left: 5px solid #008cba;
}

.btn-custom {
  background-color: #fc0;
  color: #000;
  font-weight: 600;
  border: none;
  height: 48px; /* Ensure consistent height for buttons */
}
.btn-custom:hover {
  background-color: #e6b800;
}

/* Tabel styles (jika suatu saat dibutuhkan lagi) */
.table {
  color: #fdfdfd;
}

.table-dark {
  background-color: #4d0073;
  color: #fdfdfd;
}

.table-striped > tbody > tr:nth-of-type(odd) {
  background-color: rgba(255, 255, 255, 0.08);
}

.table tbody td {
  color: #fdfdfd !important;
}

.table .text-muted {
  color: #ccc !important;
}

.list-group-item {
  background-color: transparent !important;
  color: #fdfdfd;
  border-color: rgba(255, 255, 255, 0.1);
}

.list-group-item:first-child {
  border-top-width: 0;
}

.list-group-item:last-child {
  border-bottom-width: 0;
}

.list-group-item .text-muted {
  color: #ccc !important;
}

.badge.bg-success {
  background-color: #00cc66 !important;
  color: #000 !important;
}
.badge.bg-info {
  background-color: #008cba !important;
  color: #fdfdfd !important;
}
.badge.bg-secondary {
  background-color: #777 !important;
  color: #fdfdfd !important;
}

.log-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
}

/* Scrollable list for activity logs if they get too long */
.activity-list {
  max-height: 300px; /* Sesuaikan tinggi sesuai kebutuhan */
  overflow-y: auto;
}

/* --- SCROLLBAR CUSTOM STYLES --- */
.activity-list::-webkit-scrollbar {
  width: 8px; /* Lebar scrollbar */
}

.activity-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1); /* Warna track scrollbar */
  border-radius: 10px; /* Sudut membulat pada track */
}

.activity-list::-webkit-scrollbar-thumb {
  background-color: #5a0099; /* Warna thumb (pegangan) scrollbar */
  border-radius: 10px; /* Sudut membulat pada thumb */
  border: 2px solid rgba(0, 0, 0, 0.25); /* Border agar terpisah dari track */
}

.activity-list::-webkit-scrollbar-thumb:hover {
  background-color: #7d00d9; /* Warna thumb saat hover */
}
/* --- END SCROLLBAR CUSTOM STYLES --- */

/* NEW: Wrapper for content below fixed navbar */
.content-wrapper {
  padding-top: 56px; /* Adjust this to the height of your fixed navbar */
}

/* Responsive adjustments */
/* Styles for screens smaller than 768px (mobile/tablet) */
@media (max-width: 767.98px) {
  .sidebar {
    left: -260px; /* Sidebar tersembunyi secara default */
  }
  .sidebar.open {
    left: 0; /* Sidebar terbuka */
  }
  .content {
    margin-left: 0 !important; /* Konten tanpa margin saat sidebar tersembunyi */
  }
  .navbar {
    padding-left: 1rem !important; /* Sesuaikan padding kiri navbar mobile */
  }
  /* Tombol close di sidebar harus terlihat di mobile */
  .sidebar-close-btn {
    display: block;
  }
  /* Pada mobile, pastikan logo berada di posisi normal atau sedikit digeser jika diinginkan */
  .sidebar-logo {
    margin-left: 0; /* Reset margin-left yang negatif */
    max-width: calc(100% - 60px); /* Pastikan gambar mengecil */
  }
}

/* Styles for screens larger than or equal to 768px (desktop/larger tablet) */
@media (min-width: 768px) {
  .sidebar {
    left: 0; /* Pastikan sidebar selalu terlihat di desktop */
  }
  .content {
    margin-left: 260px; /* Dorong konten ke kanan sejauh lebar sidebar */
    /* width: auto; Dihapus karena .content sudah flex-grow-1, akan ambil sisa ruang */
  }
  .navbar {
    padding-left: 275px !important; /* Lebar sidebar (260px) + padding tambahan (15px) */
    width: auto; /* Biarkan lebar mengikuti konten setelah padding */
    right: 0; /* Agar navbar memenuhi sisa lebar layar */
    left: 0; /* Ensure navbar starts from left on desktop */
  }
  /* Tombol hamburger di navbar harus disembunyikan di desktop */
  .navbar .btn-outline-secondary.d-md-none {
    display: none !important;
  }
  /* Tombol close di sidebar harus disembunyikan di desktop */
  .sidebar-close-btn {
    display: none !important;
  }
}

/* Content base style */
.content {
  /* margin-left: 240px; Dihapus karena sudah ada di media query min-width: 768px */
  width: 100%; /* Pastikan konten mengambil lebar penuh yang tersedia */
  /* transition: margin-left 0.3s; Dihapus karena sudah diatur di atas */
}

.card-body canvas {
  width: 100% !important;
  height: 300px !important;
}

/* Specific styles for DataParkir.vue - Tabulator */
.tabulator-table-container {
  overflow-x: auto; /* Memastikan scroll horizontal untuk tabel Tabulator jika terlalu lebar */
}

/* Sembunyikan header tabel ketika mode mobile-card aktif */
.tabulator[data-mobile-card-active="true"] .tabulator-header {
    display: none;
}

/* Pastikan kontainer utama Tabulator mengambil lebar penuh */
.tabulator {
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box;
}

/* Targetkan tabulator-tableholder dan tabulator-table di dalamnya */
/* Ini adalah elemen yang bertanggung jawab untuk scroll dan lebar tabel internal */
.tabulator .tabulator-tableholder {
    width: 100% !important;
    overflow: auto; /* Memastikan scrollbar muncul jika konten terlalu lebar */
}

/* Ini yang paling penting untuk mengisi lebar penuh di mobile mode (ketika rowFormatter aktif) */
.tabulator[data-mobile-card-active="true"] .tabulator-tableholder .tabulator-table {
    width: 100% !important;
    min-width: 100% !important; /* INI SANGAT PENTING */
    box-sizing: border-box;

    /* Gaya yang Anda inginkan, dengan penyesuaian untuk mobile */
    background-color: #666 !important; /* Latar belakang abu-abu */
    color: #fff !important; /* Warna teks putih */
    display: block !important; /* UBAH DARI inline-block KE block */
    overflow: hidden !important; /* Sembunyikan overflow untuk table, konten akan di-wrap */
    position: relative !important;
    white-space: normal !important; /* UBAH DARI nowrap KE normal untuk wrapping */
}

/* Menargetkan sel dummy yang dibuat oleh rowFormatter */
.tabulator[data-mobile-card-active="true"] .tabulator-row .tabulator-cell {
    width: 100% !important; /* Ini harus 100% */
    min-width: 100% !important; /* Ini juga sangat penting untuk mengatasi min-width */
    padding: 0 !important; /* Hapus padding default */
    margin: 0 !important; /* Hapus margin default */
    display: block !important; /* Pastikan sel ini berperilaku sebagai blok */
    box-sizing: border-box;
    background-color: transparent !important; /* Pastikan selnya transparan */
    color: inherit !important; /* Warisi warna teks dari parent */
}

/* Styling untuk konten baris kustom (mode kartu) */
.custom-mobile-card {
    padding: 10px;
    border-bottom: 1px solid #444;
    background-color: #2b2e32; /* Warna latar belakang kartu */
    color: #eee; /* Warna teks kartu */
    font-size: 0.9em;
    width: 100%; /* Ini sudah benar */
    margin-bottom:20px;
    box-sizing: border-box;
}

.custom-mobile-card:last-child {
    border-bottom: none;
}
.custom-mobile-card-field {
    margin-bottom: 15px;
    display: flex; /* Gunakan flexbox untuk label & value */
    align-items: flex-start;
}
.custom-mobile-card-label {
    font-weight: bold;
    min-width: 100px; /* Lebar minimum untuk label */
    margin-bottom: 15px;
    margin-right: 10px;
    color: #bbb; /* Warna label */
}
.custom-mobile-card-value {
    flex-grow: 1; /* Memungkinkan nilai mengambil sisa ruang */
    word-wrap: break-word; /* Pastikan teks panjang membungkus */
    white-space: normal;
}

/* Styling badge di mobile card */
.custom-mobile-card .badge {
    padding: 0.3em 0.6em;
    font-size: 0.75em;
    display: inline-block; /* Agar badge tidak pecah di baris baru jika ada flex */
}

/* Styling tombol di mobile card */
.custom-mobile-card .btn {
    padding: 0.4em 0.8em;
    font-size: 0.85em;
}

/* Pastikan sel wrap di desktop juga, jika belum */
/* Ini berlaku untuk sel non-custom-mobile-card (yaitu di desktop / collapse view) */
.tabulator-cell {
    white-space: normal !important;
    word-wrap: break-word;
    overflow: visible !important;
    text-overflow: clip !important;
    height: auto !important; /* Penting untuk wrapping */
}
.tabulator .tabulator-row {
    height: auto !important;
}

/* Tambahan: Penyesuaian untuk responsiveCollapse di desktop */
.tabulator-responsive-collapse table {
    width: 100%;
    border-collapse: collapse;
}
.tabulator-responsive-collapse td {
    padding: 5px 0;
    vertical-align: top;
    border-bottom: 1px dashed #444; /* Garis putus-putus antar item di collapse */
}
.tabulator-responsive-collapse td:first-child {
    font-weight: bold;
    width: 35%; /* Sesuaikan lebar label */
}
.tabulator-responsive-collapse td:last-child {
    text-align: right; /* Rata kanan nilai */
}


/* Modal specific styles to match dark theme */
.custom-modal-content {
  background-color: #2b0057;
  color: #fdfdfd;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.custom-modal-header {
  background-color: #210038;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.custom-modal-header .modal-title {
  color: #fdfdfd;
}

.custom-btn-close {
  filter: invert(1);
}

.custom-modal-body {
  background-color: #2b0057;
}

.custom-modal-body .form-label {
  color: #fdfdfd;
}

.custom-modal-body .form-control {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fdfdfd;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.custom-modal-body .form-control:focus {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: #fc0;
  box-shadow: 0 0 0 0.25rem rgba(255, 204, 0, 0.25);
}

/* CUSTOM BACKDROP STYLES */
.custom-modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.modal.fade {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1040;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.modal-dialog {
  position: relative;
  z-index: 2;
}

body.modal-custom-open {
  overflow: hidden !important;
  padding-right: var(--bs-body-padding-right, 0) !important;
}

body.modal-open {
  padding-right: 0px !important;
  overflow: hidden !important;
}

/* Tabulator Dark Theme Overrides */
.tabulator.tabulator-dark-theme {
  background-color: transparent;
  border: none;
  color: #fdfdfd;
  font-family: sans-serif;
}

.tabulator.tabulator-dark-theme .tabulator-header {
  background-color: #4d0073 !important;
  color: #fdfdfd !important;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  border-top: none;
}

.tabulator.tabulator-dark-theme .tabulator-col {
  background-color: #4d0073 !important;
  color: #fdfdfd !important;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.tabulator.tabulator-dark-theme .tabulator-col.tabulator-sortable:hover {
  background-color: #5a0099 !important;
}

.tabulator.tabulator-dark-theme
  .tabulator-col.tabulator-sortable[aria-sort="asc"],
.tabulator.tabulator-dark-theme
  .tabulator-col.tabulator-sortable[aria-sort="desc"] {
  background-color: #5a0099 !important;
}

.tabulator.tabulator-dark-theme .tabulator-header-filter {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #fdfdfd !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  padding: 5px 8px;
  box-sizing: border-box;
}

.tabulator.tabulator-dark-theme .tabulator-header-filter:focus {
  border-color: #fc0 !important;
  box-shadow: 0 0 0 0.25rem rgba(255, 204, 0, 0.25) !important;
}

.tabulator.tabulator-dark-theme .tabulator-tableHolder {
  background-color: transparent;
}

.tabulator.tabulator-dark-theme .tabulator-row {
  background-color: rgba(0, 0, 0, 0.2) !important;
  color: #fdfdfd !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.tabulator.tabulator-dark-theme .tabulator-row.tabulator-row-even {
  background-color: rgba(0, 0, 0, 0.25) !important;
}

.tabulator.tabulator-dark-theme .tabulator-row.tabulator-selected {
  background-color: rgba(252, 204, 0, 0.2) !important;
  color: #fdfdfd !important;
}

.tabulator.tabulator-dark-theme .tabulator-row:hover {
  background-color: rgba(0, 0, 0, 0.35) !important;
}

.tabulator.tabulator-dark-theme .tabulator-cell {
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  color: #fdfdfd;
  padding: 8px 12px;
}

.tabulator.tabulator-dark-theme .tabulator-footer {
  background-color: #4d0073 !important;
  color: #fdfdfd !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px;
}

.tabulator.tabulator-dark-theme .tabulator-page-counter {
  color: #fdfdfd !important;
}

.tabulator.tabulator-dark-theme .tabulator-pages button {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #fdfdfd !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  margin: 0 4px;
  padding: 5px 10px;
  border-radius: 4px;
}

.tabulator.tabulator-dark-theme .tabulator-pages button.active {
  background-color: #fc0 !important;
  color: #000 !important;
  border-color: #fc0 !important;
}

.tabulator.tabulator-dark-theme .tabulator-pages button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tabulator.tabulator-dark-theme .tabulator-page-size {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #fdfdfd !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  padding: 5px 8px;
  border-radius: 4px;
}

.tabulator.tabulator-dark-theme .tabulator-placeholder {
  background-color: transparent;
  color: #ccc;
  font-style: italic;
  padding: 20px;
}

.tabulator.tabulator-dark-theme .tabulator-cell .btn {
  color: #fdfdfd;
}

.tabulator .tabulator-col .tabulator-col-resize-handle {
  cursor: default !important;
  pointer-events: none !important;
}

.tabulator .tabulator-col.tabulator-sortable {
  cursor: pointer !important;
}

.tabulator .tabulator-col:not(.tabulator-sortable) {
  cursor: default !important;
}

.tabulator .tabulator-footer .tabulator-resize-handle {
    display: none !important;
}

.parking-thumbnail {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 4px;
    cursor: pointer;
    vertical-align: middle;
}
</style>
