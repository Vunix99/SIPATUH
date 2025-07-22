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
          <router-link to="/pengaturan-admin" class="nav-link">
            <i class="fa-solid fa-gear"></i> Pengaturan Admin
          </router-link>
        </li>
        <li>
          <router-link to="/logout" class="nav-link" style="color: red; font-weight: bolder;">
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
          Data Parkir
        </h5>
      </nav>

      <div class="content-wrapper">
        <div class="container-fluid mt-3">
          <div class="card shadow mb-4">
            <div class="card-header">
              <strong>📋 Data Log Parkir</strong>
            </div>
            <div class="card-body">
              <div
                class="d-flex justify-content-between align-items-center mb-3"
              >
                <div class="form-group flex-grow-1 me-3">
                  <label for="filterDateParkir" class="form-label text-white-50"
                    >Filter Tanggal:</label
                  >
                  <div class="d-flex gap-2 align-items-end">
                    <div class="date-input-container">
                      <input
                        type="date"
                        class="form-control"
                        id="filterDateParkir"
                        v-model="filterDateParkir"
                        @change="applyDayFilter"
                      />
                      <i class="fas fa-calendar-alt calendar-icon"></i>
                    </div>
                    <button
                      class="btn btn-outline-light"
                      @click="clearDayFilter"
                      v-if="filterDateParkir"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
              <div ref="parkirTable" class="tabulator-table-container"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from "vue";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator_midnight.min.css"; // Tetap gunakan tema dasar ini
import axios from "axios";
import Swal from "sweetalert2";

// GLightbox imports
import GLightbox from 'glightbox';
import 'glightbox/dist/css/glightbox.min.css';

export default {
  name: "DataParkir",
  setup() {
    const sidebarOpen = ref(false);
    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    const parkirTable = ref(null);
    let tabulatorInstance = null;
    let lightboxInstance = null; // GLightbox instance
    const filterDateParkir = ref("");

    const API_DOMAIN =
      import.meta.env.VITE_DOMAIN_SERVER || "http://localhost:3000";

    const mobileBreakpoint = 768; // Misalnya, di bawah 768px dianggap mobile

    // --- Fungsi Helper untuk Formatter ---
    const formatDateTime = (value) => {
      if (value) {
        const date = new Date(value);
        return date.toLocaleString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return "Belum Keluar";
    };

    const formatStatus = (status) => {
      if (status === "active") {
        return '<span class="badge bg-success">Aktif</span>';
      } else if (status === "completed") {
        return '<span class="badge bg-secondary">Selesai</span>';
      }
      return status;
    };

    // MODIFIKASI FUNGSI INI: menerima parameter isMobileView
    const formatFotoMasuk = (imageUrl, isMobileView = false) => {
      if (imageUrl) {
        // Konten tombol akan berbeda tergantung isMobileView
        const buttonContent = isMobileView ? 'Lihat Gambar' : '<i class="fa-solid fa-eye"></i>';
        return `<button type="button" class="btn btn-sm btn-info view-photo-btn" data-image-url="${imageUrl}">${buttonContent}</button>`;
      }
      return 'Tidak Ada Foto';
    };
    // --- Akhir Fungsi Helper ---

    const fetchParkingData = async () => {
      try {
        const response = await axios.get(`${API_DOMAIN}/api/logParkir`, {
          withCredentials: true,
        });
        console.log("Parking log data fetched successfully:", response.data);
        return response.data;
      } catch (error) {
        console.error("Error fetching parking log data:", error);
        Swal.fire({
          icon: "error",
          title: "Gagal Memuat Data",
          text:
            error.response?.data?.message ||
            "Terjadi kesalahan saat memuat data parkir.",
          confirmButtonColor: "#fc0",
        });
        return [];
      }
    };

    // Fungsi utama untuk inisialisasi/ulang inisialisasi Tabulator
    const initializeTabulator = async () => {
      if (!parkirTable.value) {
        console.error("Elemen tabel tidak ditemukan.");
        return;
      }

      // Deteksi apakah layar adalah mobile
      const isMobile = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`).matches;

      // Hancurkan instance Tabulator yang ada jika ada
      if (tabulatorInstance) {
        tabulatorInstance.destroy();
      }

      const data = await fetchParkingData();

      const baseColumns = [
        // Kolom untuk Desktop View
        {
          title: "ID",
          field: "id",
          hozAlign: "center",
          headerWordWrap: true,
          width: 50,
          headerFilter: false,
          resizable: false,
          responsive: 0, // Selalu tampil
        },
        {
          title: "Plat Kendaraan",
          field: "plat_nomor",
          headerWordWrap: true,
          hozAlign: "center",
          headerFilter: false,
          resizable: false,
          responsive: 0, // Selalu tampil
        },
        {
          title: "Nomor Tiket",
          field: "nomor_tiket",
          headerWordWrap: true,
          hozAlign: "center",
          headerFilter: false,
          resizable: false,
          responsive: 1, // Prioritas sembunyi/collapse
        },
        {
          title: "Waktu Masuk",
          field: "waktu_masuk",
          headerWordWrap: true,
          hozAlign: "center",
          formatter: (cell) => formatDateTime(cell.getValue()),
          headerFilter: false,
          resizable: false,
          responsive: 2, // Prioritas sembunyi/collapse
        },
        {
          title: "Waktu Keluar",
          field: "waktu_keluar",
          hozAlign: "center",
          formatter: (cell) => formatDateTime(cell.getValue()),
          headerFilter: false,
          resizable: false,
          responsive: 3, // Prioritas sembunyi/collapse
        },
        {
          title: "Status",
          field: "status",
          hozAlign: "center",
          headerWordWrap: true,
          formatter: (cell) => formatStatus(cell.getValue()),
          headerFilter: false,
          resizable: false,
          responsive: 0, // Selalu tampil
        },
        {
          title: "Foto Masuk",
          field: "foto_masuk",
          hozAlign: "center",
          headerWordWrap: true,
          headerSort: false,
          resizable: false,
          // Panggil formatter dengan isMobileView = false untuk desktop
          formatter: (cell) => formatFotoMasuk(cell.getValue(), false),
          cellClick: function(e, cell) {
            const button = e.target.closest('.view-photo-btn');
            if (button) {
              e.stopPropagation();
              const imageUrl = button.dataset.imageUrl;
              if (imageUrl) {
                if (typeof GLightbox !== 'undefined') {
                  if (lightboxInstance) {
                    lightboxInstance.destroy();
                  }
                  lightboxInstance = GLightbox({
                    elements: [{ 'href': imageUrl, 'type': 'image' }]
                  });
                  lightboxInstance.open();
                } else {
                  console.warn("GLightbox is not loaded. Cannot open image.");
                }
              }
            }
          },
          responsive: 1, // Prioritas sembunyi/collapse
        },
      ];

      const tabulatorOptions = {
        data: data,
        history: true,
        pagination: "local",
        paginationSize: 10,
        movableColumns: false,
        resizableColumns: false,
        resizeableRows: false,
        placeholder: "Tidak ada data parkir",
        cssClass: "tabulator-dark-theme", // Ini sudah diterapkan oleh import tabulator_midnight.min.css
      };

      if (isMobile) {
        // Mode mobile: gunakan fitDataFill dan rowFormatter (tampilan kartu)
        tabulatorOptions.layout = "fitDataFill"; // Atur layout untuk mobile
        tabulatorOptions.responsiveLayout = false; // Nonaktifkan responsiveLayout bawaan
        tabulatorOptions.rowHeader = false; // Sembunyikan rowHeader jika ada
        tabulatorOptions.columns = [
          // Kolom dummy untuk mode rowFormatter
          {
            title: "",
            field: "id", // Bisa field apa saja, yang penting ada 1 kolom
            formatter: "html", // Penting: agar bisa merender HTML kustom
            headerSort: false,
            resizable: false
          }
        ];
        tabulatorOptions.rowFormatter = function(row){
          const data = row.getData();
          const element = row.getElement();

          // Tambahkan atribut untuk CSS agar header bisa disembunyikan
          parkirTable.value.setAttribute("data-mobile-card-active", "true");

          // Kosongkan konten default sel Tabulator
          element.innerHTML = "";

          const rowContent = document.createElement("div");
          rowContent.classList.add("custom-mobile-card");

          rowContent.innerHTML = `
            <div class="custom-mobile-card-field" style="margin-bottom: 8px;">
                <span class="custom-mobile-card-label" style="font-weight: bold; color: #fc0">ID:</span>
                <span class="custom-mobile-card-value">${data.id}</span>
            </div>
            <div class="custom-mobile-card-field" style="margin-bottom: 8px;">
                <span class="custom-mobile-card-label" style="font-weight: bold; color: #fc0">Plat:</span>
                <span class="custom-mobile-card-value">${data.plat_nomor}</span>
            </div>
            <div class="custom-mobile-card-field" style="margin-bottom: 8px;">
                <span class="custom-mobile-card-label" style="font-weight: bold; color: #fc0">Tiket:</span>
                <span class="custom-mobile-card-value">${data.nomor_tiket}</span>
            </div>
            <div class="custom-mobile-card-field" style="margin-bottom: 8px;">
                <span class="custom-mobile-card-label" style="font-weight: bold; color: #fc0">Masuk:</span>
                <span class="custom-mobile-card-value">${formatDateTime(data.waktu_masuk)}</span>
            </div>
            <div class="custom-mobile-card-field" style="margin-bottom: 8px;">
                <span class="custom-mobile-card-label" style="font-weight: bold; color: #fc0">Keluar:</span>
                <span class="custom-mobile-card-value">${formatDateTime(data.waktu_keluar)}</span>
            </div>
            <div class="custom-mobile-card-field" style="margin-bottom: 8px;">
                <span class="custom-mobile-card-label" style="font-weight: bold; color: #fc0">Status:</span>
                <span class="custom-mobile-card-value">${formatStatus(data.status)}</span>
            </div>
            <div class="custom-mobile-card-field" style="margin-bottom: 8px;">
                <span class="custom-mobile-card-label" style="font-weight: bold; color: #fc0">Foto:</span>
                <span class="custom-mobile-card-value">${formatFotoMasuk(data.foto_masuk, true)}</span>
            </div>
          `;
          element.appendChild(rowContent);

          // Re-attach cellClick listener for the photo button in the custom row
          const photoButton = rowContent.querySelector('.view-photo-btn');
          if (photoButton) {
            photoButton.addEventListener('click', (e) => {
              e.stopPropagation();
              const imageUrl = photoButton.dataset.imageUrl;
              if (imageUrl) {
                if (typeof GLightbox !== 'undefined') {
                  if (lightboxInstance) {
                    lightboxInstance.destroy();
                  }
                  lightboxInstance = GLightbox({
                    elements: [{ 'href': imageUrl, 'type': 'image' }]
                  });
                  lightboxInstance.open();
                } else {
                  console.warn("GLightbox is not loaded. Cannot open image.");
                }
              }
            });
          }
        };
      } else {
        // Mode desktop: gunakan fitColumns dan responsiveLayout collapse
        tabulatorOptions.layout = "fitColumns"; // Atur layout untuk desktop
        tabulatorOptions.responsiveLayout = "collapse";
        tabulatorOptions.rowHeader = {formatter:"responsiveCollapse", width:30, hozAlign:"center"};
        tabulatorOptions.columns = baseColumns;
        tabulatorOptions.rowFormatter = null; // Hapus formatter jika kembali ke desktop
        // Hapus atribut untuk CSS agar header kembali terlihat
        parkirTable.value.removeAttribute("data-mobile-card-active");
      }

      tabulatorInstance = new Tabulator(parkirTable.value, tabulatorOptions);
    };

    const applyDayFilter = () => {
      if (!tabulatorInstance) return;

      const dateInput = filterDateParkir.value;
      console.log("Date input for filtering parking data:", dateInput);

      tabulatorInstance.clearFilter();

      if (dateInput) {
        const filterDay = new Date(dateInput);
        filterDay.setHours(0, 0, 0, 0);

        tabulatorInstance.setFilter((row) => {
          const rowRawDate = row.waktu_masuk;
          const rowDate = new Date(rowRawDate);
          rowDate.setHours(0, 0, 0, 0);

          return rowDate.getTime() === filterDay.getTime();
        });
      } else {
        console.log("Filter date is empty, clearing filter.");
      }
    };

    const clearDayFilter = () => {
      filterDateParkir.value = "";
      if (tabulatorInstance) {
        tabulatorInstance.clearFilter();
        console.log("Parking data filter cleared.");
      }
    };

    watch(filterDateParkir, (newValue, oldValue) => {
      if (newValue !== oldValue) {
        applyDayFilter();
      }
    });

    // Inisialisasi awal dan tambahkan listener resize
    onMounted(() => {
      initializeTabulator();

      // Tambahkan event listener untuk perubahan ukuran layar dengan debounce
      let resizeTimeout;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          initializeTabulator();
        }, 200); // Tunggu 200ms setelah resize selesai
      });
    });

    return {
      sidebarOpen,
      toggleSidebar,
      parkirTable,
      filterDateParkir,
      clearDayFilter,
    };
  },
};
</script>

<style scoped>
/* Main background for body and content */
body,
.content {
  background-color: #2b0057; /* Existing dark purple background */
  color: #fdfdfd; /* Changed to FDFDFD for main content text */
}

/* Sidebar Specific Styles - START */
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


/* Router Link Active/Exact Active and Nav Link Base Style */
.router-link-active,
.router-link-exact-active,
.nav-link {
  margin-right: 20px;
  margin-bottom: 8px;
}

/* Card Title */
h5.card-title {
  color: #fdfdfd; /* Changed to FDFDFD for card titles */
}

/* Date Input Customization */
/* Add a custom style to remove the default calendar icon on date inputs for Webkit browsers (Chrome, Safari) */
input[type="date"]::-webkit-calendar-picker-indicator {
  opacity: 0;
  width: 100%; /* Make the clickable area cover the entire input */
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  cursor: pointer; /* Show pointer cursor on hover */
  z-index: 1; /* Pastikan ini di atas ikon kustom jika perlu */
  filter: invert(1); /* Invert color for dark theme if native icon is visible */
}

/* For Firefox, you might need a different approach or accept its default behavior */
input[type="date"] {
  position: relative; /* Ensure it's positioned for the absolute overlay */
  color-scheme: dark; /* Force dark mode for calendar popup if browser supports */
}

.date-input-container {
  position: relative;
}

/* Styling dasar untuk input date */
#filterDateParkir {
  width: 100%;
  padding-right: 40px; /* Beri ruang di kanan untuk ikon */
  background-color: #36394c; /* Contoh: latar belakang gelap dari tema Anda */
  color: #fdfdfd; /* Warna teks terang */
  border: 1px solid #555; /* Border yang cocok untuk tema gelap */
  border-radius: 5px;
}

/* Atur posisi dan warna ikon Font Awesome kustom */
.calendar-icon {
  position: absolute;
  right: 10px; /* Atur posisi horizontal ikon dari kanan */
  top: 55%; /* Atur posisi vertikal ke tengah */
  transform: translateY(-50%); /* Geser ke atas 50% dari tingginya sendiri untuk pusatkan */
  pointer-events: none; /* Sangat penting: agar klik tembus ke input di belakangnya */
  color: #fc0; /* Warna ikon sesuai permintaan Anda (kuning/oranye) */
  font-size: 1.2em; /* Ukuran ikon */
  z-index: 2; /* Pastikan ikon kustom terlihat di atas indikator bawaan */
}


/* Navbar style */
.navbar {
  background-color: #210038 !important; /* Slightly lighter purple for the navbar */
  color: #fdfdfd; /* Changed to FDFDFD */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* Add a subtle shadow */
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1030;
  transition: padding-left 0.3s;
  /* padding-left akan diatur di media query untuk desktop */
}

.navbar .btn-outline-secondary {
  border-color: #fc0; /* Use accent color for button border */
  color: #fc0; /* Use accent color for button text */
}

.navbar .btn-outline-secondary:hover {
  background-color: #fc0; /* Accent color on hover */
  color: #000; /* Black text on accent background */
}

/* Card styles - adjusted for better contrast and consistency */
.card {
  background-color: rgba(0, 0, 0, 0.25); /* Darker transparent background for cards */
  color: #fdfdfd; /* Changed to FDFDFD for card titles */
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3); /* More prominent shadow for cards */
}

.card-header {
  background-color: rgba(0, 0, 0, 0.35); /* Even darker for card headers */
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Statistik Cards specific colors - now unified to purple shades */
.card.bg-primary,
.card.bg-success,
.card.bg-warning,
.card.bg-info {
  background-color: #4d0073 !important; /* A uniform dark purple for all statistic cards */
  color: #fdfdfd !important; /* Changed to FDFDFD */
}

/* You can still add subtle variations if desired, e.g., slightly different shades on hover or with borders */
.card.bg-primary {
  border-left: 5px solid #a64dff;
} /* Example: a lighter purple border */
.card.bg-success {
  border-left: 5px solid #00cc66;
} /* Example: green border for success */
.card.bg-warning {
  border-left: 5px solid #fc0;
} /* Example: accent yellow border for warning */
.card.bg-info {
  border-left: 5px solid #008cba;
} /* Example: blue border for info */

/* Custom button style - if you add more custom buttons */
.btn-custom {
  background-color: #fc0; /* Consistent secondary accent color */
  color: #000; /* Kept black for contrast on yellow background */
  font-weight: 600;
  border: none;
  height: 48px; /* Ensure consistent height for buttons */
}
.btn-custom:hover {
  background-color: #e6b800; /* Slightly darker accent on hover */
}

/* Table style */
.table {
  color: #fdfdfd; /* Ensure table text is FDFDFD */
}

.table-dark {
  background-color: #4d0073; /* Darker purple for table header */
  color: #fdfdfd; /* Ensure header text is FDFDFD */
}

.table-striped > tbody > tr:nth-of-type(odd) {
  background-color: rgba(255, 255, 255, 0.08); /* Slightly more visible stripe */
}

/* Crucial: Ensure all TD elements in the table body are FDFDFD */
.table tbody td {
  color: #fdfdfd !important; /* Force FDFDFD color for all table body cells */
}

/* Text for the "Belum ada data hari ini." message */
.table .text-muted {
  color: #ccc !important; /* Keep it slightly muted for informational text */
}

/* Activity Log */
.list-group-item {
  background-color: transparent !important; /* Removed background for list items */
  color: #fdfdfd; /* Ensure list item text is FDFDFD */
  border-color: rgba(255, 255, 255, 0.1); /* Subtle border for separation */
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

/* Badges for status */
.badge.bg-success {
  background-color: #00cc66 !important;
  color: #000 !important;
}
.badge.bg-secondary {
  background-color: #777 !important;
  color: #fdfdfd !important;
}

/* NEW: Wrapper for content below fixed navbar */
.content-wrapper {
  padding-top: 56px; /* Adjust this to the height of your fixed navbar */
}


/* Responsive adjustments */
/* Styles for screens smaller than 768px (mobile/tablet) */
@media (max-width: 767.98px) { /* Use 767.98px for Bootstrap's 'md' breakpoint */
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

.content {
  /* margin-left: 240px; Dihapus karena sudah ada di media query min-width: 768px */
  width: 100%; /* Pastikan konten mengambil lebar penuh yang tersedia */
  transition: margin-left 0.3s;
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