<template>
  <div class="d-flex min-vh-100">
    <nav :class="['sidebar', sidebarOpen ? 'open' : '']">
      <div
        class="sidebar-header d-flex justify-content-between align-items-center"
      >
        <h5 class="text-white m-0">SIPATUH</h5>
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

.sidebar {
  background-color: #5a0099;
  color: #fdfdfd;
  width: 240px;
  height: 100vh;
  padding-top: 1rem;
  position: fixed;
  transition: all 0.3s;
  left: 0;
  z-index: 2000;
}

.sidebar .nav-link {
  color: #eee;
  padding: 10px;
  display: block;
  border-radius: 5px;
}

.sidebar .nav-link.router-link-exact-active,
.sidebar .nav-link:hover {
  background-color: #fc0;
  color: #000;
  font-weight: bold;
}

.sidebar-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Navbar style */
.navbar {
  background-color: #210038 !important;
  color: #fdfdfd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  /* NEW: Tambahkan properti fixed untuk navbar */
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1030; /* Pastikan di atas konten dan di bawah modal */
  padding-left: 240px !important; /* Untuk memberi ruang pada sidebar di desktop */
  transition: padding-left 0.3s; /* Transisi halus */
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
@media (max-width: 768px) {
  .sidebar {
    left: -240px;
  }
  .sidebar.open {
    left: 0;
  }
  .content {
    margin-left: 0 !important;
  }
  /* Navbar on smaller screens: full width, no left padding */
  .navbar {
    padding-left: 1rem !important; /* Adjust if Bootstrap's px-3 means 1rem by default */
  }
}

.content {
  margin-left: 240px;
  width: 100%;
  transition: margin-left 0.3s;
}
</style>
