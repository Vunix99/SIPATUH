<template>
  <div class="d-flex">
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
          Pencadangan & Pemulihan Data
        </h5>
      </nav>

      <div class="content-wrapper">
        <div class="container-fluid pt-4 px-3 form-wrapper-top">
          <div class="container-fluid mt-3">
            <div class="row mb-4">
              <div class="col-12">
                <div class="card shadow">
                  <div class="card-header">
                    <strong>💾 Pencadangan Data</strong>
                  </div>
                  <div class="card-body">
                    <p class="card-text lh-base mb-3">
                      Melakukan <strong>pencadangan data</strong> secara berkala
                      sangat penting untuk menjaga
                      <strong>integritas, keamanan, dan ketersediaan</strong>
                      informasi pada sistem parkir Anda. Data yang tersimpan dalam
                      sistem SIPATUH mencakup berbagai informasi penting seperti
                      riwayat parkir, data kendaraan, dan pengguna. Kehilangan
                      data akibat kesalahan teknis, kerusakan perangkat keras,
                      atau serangan siber dapat mengganggu operasional dan
                      merugikan pengguna. Dengan melakukan pencadangan secara
                      rutin, Anda dapat memastikan bahwa seluruh data dapat
                      <strong>dipulihkan dengan cepat</strong> dan sistem dapat
                      kembali berjalan normal tanpa kehilangan informasi penting.
                    </p>

                    <p class="card-text lh-base mb-4">
                      Setiap pencadangan akan menghasilkan file dengan ekstensi
                      <strong>`.sql`</strong>, yang berisi seluruh struktur dan
                      isi basis data dari sistem SIPATUH. File ini mencakup semua
                      tabel, kolom, data, serta hubungan antar entitas di dalam
                      database. Sangat disarankan untuk
                      <strong
                        >menyimpan file cadangan ini di lokasi yang aman</strong
                      >, seperti penyimpanan cloud yang terenkripsi, server
                      cadangan, atau media penyimpanan eksternal dengan kontrol
                      akses terbatas. Hindari menyimpan file cadangan di lokasi
                      yang sama dengan server utama untuk mencegah kehilangan
                      ganda jika terjadi gangguan. Dengan prosedur pencadangan dan
                      penyimpanan yang baik, Anda dapat menjaga kesinambungan
                      layanan dan
                      <strong
                        >keandalan sistem parkir secara jangka panjang</strong
                      >.
                    </p>
                    <button
                      class="btn btn-custom mt-3"
                      @click="handleBackup"
                      :disabled="isLoadingBackup"
                    >
                      <span
                        v-if="isLoadingBackup"
                        class="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      <i v-else class="fa-solid fa-download me-2"></i>
                      {{
                        isLoadingBackup
                          ? "Mencadangkan..."
                          : "Unduh Cadangan Data (.sql)"
                      }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="row">
              <div class="col-12">
                <div class="card shadow">
                  <div class="card-header">
                    <strong>↩️ Pemulihan Data</strong>
                  </div>
                  <div class="card-body">
                    <p class="card-text lh-base mb-3">
                      <strong>Pulihkan data SIPATUH</strong> Anda dari file
                      pencadangan SQL yang telah ada. Proses ini akan
                      <strong>menggantikan data yang ada saat ini</strong> dengan
                      data dari file yang Anda unggah.
                      <br />
                      <strong
                        class="text-danger"
                        style="
                          font-size: 1.1em;
                          display: block;
                          margin-top: 0.5rem;
                        "
                      >
                        ⚠️ Harap gunakan fitur ini dengan sangat hati-hati dan
                        pahami risikonya.
                      </strong>
                      <span style="display: block; font-size: 0.9em"
                        >Pemulihan data adalah tindakan yang tidak dapat
                        dibatalkan.</span
                      >
                    </p>

                    <div
                      class="drop-area text-center d-flex flex-column justify-content-center align-items-center"
                      @dragover.prevent="dragOver"
                      @dragleave.prevent="dragLeave"
                      @drop.prevent="dropFile"
                      :class="{ 'drag-active': isDragging }"
                      @click="openFilePicker"
                    >
                      <div v-if="isLoadingRestore" class="loading-overlay">
                        <div class="spinner-grow text-warning" role="status">
                          <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-3 text-white">
                          Memulihkan data, mohon tunggu...
                        </p>
                      </div>

                      <template v-else>
                        <i class="fa-solid fa-cloud-arrow-up fa-3x mb-3"></i>
                        <p class="mb-1 fw-bold" style="font-size: 1em">
                          Seret & lepas file SQL di sini atau
                          <span class="text-warning fw-bold"
                            >klik untuk memilih</span
                          >
                        </p>
                        <small class="text-muted" style="font-size: 0.9em"
                          >(Hanya file .sql | Ukuran file maksimal: 20MB)</small
                        >
                        <input
                          type="file"
                          ref="fileInput"
                          style="display: none"
                          accept=".sql"
                          @change="handleFileChange"
                        />
                        <div v-if="selectedFile" class="mt-2">
                          <span
                            class="badge bg-success py-2 px-3"
                            style="font-size: 0.9em"
                            >{{ selectedFile.name }}</span
                          >
                          <button
                            class="btn btn-sm btn-link text-danger ms-2"
                            @click.stop="clearSelectedFile"
                          >
                            <i class="fa-solid fa-xmark fa-lg"></i>
                          </button>
                        </div>
                      </template>
                    </div>

                    <button
                      class="btn btn-custom mt-3"
                      @click="handleRestoreConfirmation"
                      :disabled="!selectedFile || isLoadingRestore"
                    >
                      <span
                        v-if="isLoadingRestore"
                        class="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      <i v-else class="fa-solid fa-upload me-2"></i>
                      {{ isLoadingRestore ? "Memulihkan..." : "Pulihkan Data" }}
                    </button>
                    <p
                      v-if="selectedFile && !selectedFile.name.endsWith('.sql')"
                      class="text-danger mt-2"
                    >
                      <small
                        >Hanya file dengan ekstensi .sql yang diizinkan.</small
                      >
                    </p>
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
import { ref, onMounted, onUnmounted } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

export default {
  name: "BackupRestore",
  setup() {
    const sidebarOpen = ref(false);
    const isLoadingBackup = ref(false);
    const isLoadingRestore = ref(false);
    const isDragging = ref(false);
    const selectedFile = ref(null);
    const fileInput = ref(null);

    axios.defaults.baseURL =
      import.meta.env.VITE_API_DOMAIN || "http://localhost:3000";
    axios.defaults.withCredentials = true;

    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    const dragOver = (event) => {
      isDragging.value = true;
    };

    const dragLeave = (event) => {
      isDragging.value = false;
    };

    const dropFile = (event) => {
      isDragging.value = false;
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        selectFile(files[0]);
      }
    };

    const openFilePicker = () => {
      fileInput.value.click();
    };

    const handleFileChange = (event) => {
      const files = event.target.files;
      if (files.length > 0) {
        selectFile(files[0]);
      }
    };

    const selectFile = (file) => {
      if (file.type === "application/sql" || file.name.endsWith(".sql")) {
        if (file.size > 20 * 1024 * 1024) {
          // 20MB limit
          Swal.fire({
            icon: "error",
            title: "Ukuran File Terlalu Besar",
            text: "Ukuran file SQL tidak boleh melebihi 20MB.",
            customClass: {
              confirmButton: "swal-button-custom",
            },
          });
          selectedFile.value = null;
          if (fileInput.value) fileInput.value.value = "";
          return;
        }
        selectedFile.value = file;
      } else {
        Swal.fire({
          icon: "error",
          title: "Format File Salah",
          text: "Hanya file dengan ekstensi .sql yang diizinkan untuk pemulihan.",
          customClass: {
            confirmButton: "swal-button-custom",
          },
        });
        selectedFile.value = null;
        if (fileInput.value) fileInput.value.value = "";
      }
    };

    const clearSelectedFile = () => {
      selectedFile.value = null;
      if (fileInput.value) {
        fileInput.value.value = "";
      }
    };

    const handleBackup = async () => {
      isLoadingBackup.value = true;
      try {
        const response = await axios.post("/api/backup-database", {
          waktu_backup: new Date().toISOString(),
        });

        Swal.fire({
          icon: "success",
          title: "Pencadangan Berhasil!",
          text: response.data.message,
          confirmButtonText: "Unduh File",
          customClass: {
            confirmButton: "swal-button-custom",
          },
        }).then((result) => {
          if (result.isConfirmed) {
            const downloadLink = document.createElement("a");
            downloadLink.href =
              axios.defaults.baseURL + response.data.download_url;
            downloadLink.setAttribute("download", response.data.file_name);
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
          }
        });
      } catch (error) {
        console.error("Error during backup:", error);
        Swal.fire({
          icon: "error",
          title: "Pencadangan Gagal",
          text:
            error.response?.data?.error ||
            "Terjadi kesalahan saat mencadangkan data.",
          customClass: {
            confirmButton: "swal-button-custom",
          },
        });
      } finally {
        isLoadingBackup.value = false;
      }
    };

    const handleRestoreConfirmation = async () => {
      if (!selectedFile.value) {
        Swal.fire({
          icon: "warning",
          title: "Pilih File",
          text: "Mohon pilih file .sql untuk melakukan pemulihan.",
          customClass: {
            confirmButton: "swal-button-custom",
          },
        });
        return;
      }

      const result = await Swal.fire({
        title: "Konfirmasi Pemulihan Data",
        html: `
      <div class="swal-icon-warning-custom">
        <i class="fa-solid fa-triangle-exclamation fa-7x" style="color: red"></i>
      </div>
      <p style="color: grey; margin-top: 15px;">Anda akan memulihkan data dari file <strong>${selectedFile.value.name}</strong>.</p>
      <p style="color: #ff0000; font-weight: bold; font-size: 1.1em;">Tindakan ini akan <u style="text-decoration-color: #ff0000;">MENGGANTI SEMUA DATA SAAT INI</u> dengan data dari file yang diunggah.</p>
      <p style="color: grey; margin-top: 20px; font-size: 1em;">Untuk melanjutkan, ketik <strong style="color: #fc0;">"Lakukan Pemulihan"</strong> di kolom di bawah ini:</p>
    `,
        input: "text",
        inputPlaceholder: "Ketik 'Lakukan Pemulihan'",
        showCancelButton: true,
        confirmButtonText: "Ya, Pulihkan Sekarang",
        cancelButtonText: "Batal",
        confirmButtonColor: "#fc0",
        cancelButtonColor: "#dc3545",
        backdrop: `
      rgba(0,0,0,0.8)
      center center
      no-repeat
    `,
        customClass: {
          container: "swal-dark-theme",
          popup: "swal-dark-popup",
          input: "swal-dark-input",
          confirmButton: "swal-button-custom",
          cancelButton: "swal-button-custom-red",
        },
        preConfirm: (text) => {
          if (text !== "Lakukan Pemulihan") {
            Swal.showValidationMessage("Teks konfirmasi tidak sesuai.");
            return false;
          }
          return text;
        },
      });

      if (result.isConfirmed && result.value === "Lakukan Pemulihan") {
        handleRestore();
      } else if (result.isDismissed) {
        Swal.fire({
          icon: "info",
          title: "Pemulihan Dibatalkan",
          text: "Pemulihan data dibatalkan oleh pengguna.",
          customClass: {
            confirmButton: "swal-button-custom",
          },
        });
      }
    };

    const handleRestore = async () => {
      isLoadingRestore.value = true;
      const formData = new FormData();
      formData.append("sql_file", selectedFile.value);

      try {
        const response = await axios.post("/api/restore-database", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        Swal.fire({
          icon: "success",
          title: "Pemulihan Berhasil!",
          text: response.data.message,
          customClass: {
            confirmButton: "swal-button-custom",
          },
        });
        clearSelectedFile();
      } catch (error) {
        console.error("Error during restore:", error);
        Swal.fire({
          icon: "error",
          title: "Pemulihan Gagal",
          text:
            error.response?.data?.error ||
            "Terjadi kesalahan saat memulihkan data. Pastikan format file SQL valid dan tidak korup.",
          customClass: {
            confirmButton: "swal-button-custom",
          },
        });
      } finally {
        isLoadingRestore.value = false;
      }
    };

    onMounted(() => {
      // Any mounting logic for this specific page, if needed.
    });

    onUnmounted(() => {
      // Cleanup logic specific to this page, if any.
    });

    return {
      sidebarOpen,
      toggleSidebar,
      isLoadingBackup,
      isLoadingRestore,
      isDragging,
      selectedFile,
      fileInput,
      dragOver,
      dragLeave,
      dropFile,
      openFilePicker,
      handleFileChange,
      selectFile,
      clearSelectedFile,
      handleBackup,
      handleRestoreConfirmation,
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

/* Added for proper alignment of form content */
.form-wrapper-top {
  min-height: calc(100vh - 60px); /* Adjust based on navbar height if fixed */
  display: block;
}

.router-link-active,
.router-link-exact-active,
.nav-link {
  margin-right: 20px;
  margin-bottom: 8px;
}
h5.card-title {
  color: #fdfdfd; /* Changed to FDFDFD for card titles */
}

/* Sidebar style */
.sidebar {
  background-color: #5a0099; /* Darker purple for sidebar */
  color: #fdfdfd; /* Changed to FDFDFD */
  width: 240px;
  height: 100vh;
  padding-top: 1rem;
  position: fixed;
  transition: all 0.3s;
  left: 0;
  z-index: 2000;
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
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Navbar style */
.navbar {
  background-color: #210038 !important; /* Slightly lighter purple for the navbar */
  color: #fdfdfd; /* Changed to FDFDFD */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* Add a subtle shadow */
  /* Make the navbar fixed at the top */
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1030; /* Higher than sidebar's default content, but lower than modals etc. */
  padding-left: 240px !important; /* Default padding-left to push content past the fixed sidebar */
  transition: padding-left 0.3s; /* Smooth transition for padding when sidebar opens/closes */
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
  background-color: rgba(
    0,
    0,
    0,
    0.25
  ); /* Darker transparent background for cards */
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
  background-color: rgba(
    255,
    255,
    255,
    0.08
  ); /* Slightly more visible stripe */
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
  border-top-width: 0; /* Remove top border for first item */
}

.list-group-item:last-child {
  border-bottom-width: 0; /* Remove bottom border for last item (if flush) */
}

.list-group-item .text-muted {
  color: #ccc !important; /* Slightly darker white for muted text to provide subtle distinction */
}

/* Badges for status */
.badge.bg-success {
  background-color: #00cc66 !important; /* Brighter green for active status */
  color: #000 !important; /* Ensure black text for readability on green */
}
.badge.bg-secondary {
  background-color: #777 !important; /* A neutral gray for completed status */
  color: #fdfdfd !important; /* Ensure FDFDFD text on gray */
}

/* Drop Area Specific Styles */
.drop-area {
  position: relative; /* Needed for loading overlay positioning */
  border: 2px dashed rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  padding: 40px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 150px; /* Ensure enough height for content */
  overflow: hidden; /* Hide overflowing content during loading */
}

.drop-area:hover,
.drop-area.drag-active {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: #fc0; /* Accent color on hover/drag */
}

.drop-area i {
  color: #fc0; /* Accent color for the icon */
}

.drop-area p {
  color: #fdfdfd;
}

.drop-area small {
  color: #ccc !important;
}

/* Loading Overlay for Drop Area */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8); /* Dark semi-transparent background */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fdfdfd;
  z-index: 10;
}

/* Spinner colors (Bootstrap 5) */
.spinner-grow.text-warning {
  color: #fc0 !important; /* Ensure spinner uses your accent color */
}

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

.card-body canvas {
  width: 100% !important;
  height: 300px !important; /* Keep a consistent height for both canvases */
}

/* Parent container full height */
.wrapper-form {
  height: calc(100vh - 56px); /* 56px untuk navbar tinggi */
  padding-top: 20px;
  padding-bottom: 20px;
}

/* Card styling - already mostly handled, just extra polish */
.card {
  background-color: rgba(0, 0, 0, 0.25);
  color: #FDFDFD;
  border-radius: 12px;
  border: none;
}

.card-header {
  background-color: rgba(0, 0, 0, 0.35);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Form input styling */
.form-control {
  background-color: rgba(255, 255, 255, 0.1);
  color: #FDFDFD;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.form-control::placeholder {
  color: #ccc;
}

.form-control:focus {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: #fc0;
  box-shadow: 0 0 0 0.2rem rgba(255, 204, 0, 0.3);
}

/* Responsive fix for mobile */
@media (max-width: 768px) {
  .wrapper-form {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* Wrapper full height, tapi mulai dari atas kiri */
.form-wrapper-top {
  min-height: 100vh;
  display: block; /* pastikan tidak flex-centered */
}

/* Tambahan margin agar tidak mepet kiri/kanan */
.form-wrapper-top .col-12 {
  margin-left: auto;
  margin-right: auto;
}

/* Pastikan card tetap responsif */
.card {
  background-color: rgba(0, 0, 0, 0.25);
  color: #FDFDFD;
  border: none;
  border-radius: 10px;
}

/* Padding dan jarak nyaman */
.card-body {
  padding: 2rem;
}

/* Input styling tetap elegan */
.form-control {
  background-color: rgba(255, 255, 255, 0.1);
  color: #FDFDFD;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.form-control::placeholder {
  color: #bbb;
}

.form-control:focus {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: #fc0;
  box-shadow: 0 0 0 0.2rem rgba(255, 204, 0, 0.25);
}

/* Tombol full width tapi tidak mepet */
.btn.btn-custom {
  width: 100%;
  background-color: #fc0;
  color: #000;
  font-weight: bold;
  border: none;
  padding: 0.75rem;
  border-radius: 6px;
  margin-top: 1rem;
}

.btn.btn-custom:hover {
  background-color: #e6b800;
}

/* Responsive spacing */
@media (max-width: 576px) {
  .card-body {
    padding: 1.5rem;
  }
}

/* SweetAlert2 Custom Styling */
.swal-button-custom {
  background-color: #fc0 !important;
  color: #000 !important;
  border: none !important;
  font-weight: bold !important;
}
.swal-button-custom:hover {
  background-color: #e6b800 !important;
}

.swal-button-custom-red {
  background-color: #dc3545 !important;
  color: #fdfdfd !important;
  border: none !important;
  font-weight: bold !important;
}
.swal-button-custom-red:hover {
  background-color: #c82333 !important;
}

/* General dark theme for SweetAlert2 popups */
.swal-dark-theme .swal2-popup {
  background-color: #210038 !important;
  color: #fdfdfd !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.swal-dark-theme .swal2-title {
  color: #fdfdfd !important;
}

/* New style for the custom warning icon wrapper */
.swal-icon-warning-custom {
  margin-top: 1em;
  margin-bottom: 1em;
}

.swal-icon-warning-custom .fa-triangle-exclamation {
  color: #fc0; /* Your accent orange color */
}

.swal-dark-theme .swal2-html-container {
  color: #fdfdfd !important;
}

.swal-dark-theme .swal2-input {
  background-color: #3e006b !important;
  color: #fdfdfd !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.swal-dark-theme .swal2-input::placeholder {
  color: #bbb !important;
}

.swal-dark-theme .swal2-validation-message {
  color: #dc3545 !important;
}
</style>