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
          Pemasukan Parkir
        </h5>
      </nav>

      <div class="content-wrapper">
        <div class="container-fluid mt-3">
          <div class="card shadow mb-4">
            <div class="card-header">
              <strong>📊 Data Pemasukan Parkir</strong>
            </div>
            <div class="card-body">
              <p class="text-white-50">
                <i class="fas fa-info-circle me-2"></i>
                Nominal bersih merupakan nominal pemasukan dikurangi 20% untuk
                Biaya Admin Aplikasi.
              </p>
              <div
                class="d-flex justify-content-between align-items-center mb-3"
              >
                <div class="form-group flex-grow-1 me-3">
                  <label for="filterDate" class="form-label text-white-50"
                    >Filter Tanggal:</label
                  >
                  <div class="d-flex gap-2 align-items-end">
                    <div class="date-input-container">
                      <input
                        type="date"
                        class="form-control"
                        id="filterDate"
                        v-model="filterDate"
                        @change="applyDayFilter"
                      />
                      <i class="fas fa-calendar-alt calendar-icon"></i>
                    </div>
                    <button
                      class="btn btn-outline-light"
                      @click="clearDayFilter"
                      v-if="filterDate"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div class="ms-auto">
                  <button class="btn btn-custom" @click="openAddIncomeModal">
                    <i class="fas fa-plus-circle me-2"></i>Tambah Pemasukan
                  </button>
                </div>
              </div>
              <div ref="pemasukanTable" class="tabulator-table-container"></div>
            </div>
          </div>

          <div class="card shadow mb-4 mt-4">
            <div class="card-header">
              <strong>📈 Pemasukan Bulanan</strong>
            </div>
            <div class="card-body">
              <canvas id="revenueChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div
      class="modal fade"
      id="incomeModal"
      tabindex="-1"
      aria-labelledby="incomeModalLabel"
      aria-hidden="true"
      data-bs-backdrop="false"
      data-bs-keyboard="false"
      :class="{ show: isModalOpen }"
      :style="{ display: isModalOpen ? 'block' : 'none' }"
    >
      <div class="custom-modal-backdrop" v-if="isModalOpen"></div>

      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content custom-modal-content">
          <div class="modal-header custom-modal-header">
            <h5 class="modal-title" id="incomeModalLabel">
              {{ isEditing ? 'Edit Pemasukan' : 'Tambah Pemasukan Baru' }}
            </h5>
            <button
              type="button"
              class="btn-close custom-btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body custom-modal-body">
            <form @submit.prevent="submitIncomeForm">
              <div class="mb-3">
                <label for="tanggalPemasukan" class="form-label"
                  >Tanggal Pemasukan</label
                >
                <input
                  type="date"
                  class="form-control"
                  id="tanggalPemasukan"
                  v-model="newIncome.tanggal_pemasukan"
                  required
                />
              </div>
              <div class="mb-3">
                <label for="nominalPemasukan" class="form-label"
                  >Nominal Pemasukan</label
                >
                <input
                  type="number"
                  class="form-control"
                  id="nominalPemasukan"
                  v-model="newIncome.nominal_pemasukan"
                  required
                />
              </div>
              <p class="text-white-50 mt-2">
                Nominal Bersih akan dihitung otomatis:
                <span class="fw-bold"
                  >Rp
                  {{ calculatedNominalBersih.toLocaleString("id-ID") }}</span
                >
              </p>
              <div class="d-grid gap-2">
                <button type="submit" class="btn btn-custom">
                  {{ isEditing ? 'Update Pemasukan' : 'Simpan Pemasukan' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator_midnight.min.css";
import axios from "axios";
import Swal from "sweetalert2";
import { Modal } from "bootstrap";
// NEW: Import Chart from chart.js
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables); // Register all Chart.js components

export default {
  name: "Pemasukan",
  setup() {
    const sidebarOpen = ref(false);
    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    const pemasukanTable = ref(null);
    let tabulatorInstance = null;
    let chartInstance = null; // NEW: To store the Chart.js instance

    const filterDate = ref("");

    const newIncome = ref({
      id: null, // Add an ID field for editing
      tanggal_pemasukan: "",
      nominal_pemasukan: 0,
    });

    const isModalOpen = ref(false);
    const isEditing = ref(false); // New state to track if we are in edit mode

    // KONSISTEN: Nominal bersih tetap dihitung di frontend untuk tampilan pratinjau
    const calculatedNominalBersih = computed(() => {
      return newIncome.value.nominal_pemasukan - (newIncome.value.nominal_pemasukan * 0.20);
    });

    const API_DOMAIN =
      import.meta.env.VITE_API_DOMAIN || "http://localhost:3000";

    // --- Fungsi Helper untuk Formatter ---
    const formatCurrency = (value) => {
        return "Rp " + parseFloat(value).toLocaleString("id-ID");
    };

    const formatDateOnly = (value) => {
        const date = new Date(value);
        return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatStatusBadge = (status) => {
        if (status === "active") {
            return '<span class="badge bg-success">Aktif</span>';
        } else if (status === "completed") {
            return '<span class="badge bg-secondary">Selesai</span>';
        }
        return status;
    };
    // --- Akhir Fungsi Helper ---

    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${API_DOMAIN}/api/pemasukanMingguan`,
          { withCredentials: true }
        );
        console.log("Pemasukan data fetched successfully:", response.data);
        return response.data;
      } catch (error) {
        console.error("Error fetching pemasukan data:", error);
        Swal.fire({
          icon: "error",
          title: "Gagal Memuat Data",
          text:
            error.response?.data?.message ||
            "Terjadi kesalahan saat memuat data pemasukan.",
          confirmButtonColor: "#fc0",
        });
        return [];
      }
    };

    // NEW: Function to fetch data for the monthly revenue chart
    const fetchMonthlyRevenueData = async () => {
      try {
        const response = await axios.get(`${API_DOMAIN}/api/pemasukanMingguan`, { withCredentials: true });
        
        const currentYear = new Date().getFullYear();
        const monthlyAggregatedData = {}; // { month_index: total_nominal_bersih }

        response.data.forEach(item => {
            const date = new Date(item.tanggal_pemasukan);
            if (date.getFullYear() === currentYear) {
                const monthIndex = date.getMonth(); // 0-indexed (Jan=0, Feb=1, ...)
                monthlyAggregatedData[monthIndex] = (monthlyAggregatedData[monthIndex] || 0) + parseFloat(item.nominal_bersih) || 0;
            }
        });

        return monthlyAggregatedData; 

      } catch (error) {
        console.error("Error fetching and aggregating monthly revenue data:", error);
        return {}; // Return empty object on error
      }
    };

    const mobileBreakpoint = 768; // Mendefinisikan breakpoint mobile

    const initializeTabulator = async () => {
      if (!pemasukanTable.value) {
        console.error("Elemen tabel tidak ditemukan.");
        return;
      }

      const isMobile = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`).matches;

      if (tabulatorInstance) {
        tabulatorInstance.destroy();
      }

      const data = await fetchData();

      const baseColumns = [
        {
          title: "ID",
          field: "id",
          hozAlign: "center",
          width: 70,
          headerFilter: false,
          resizable: false,
          responsive: 0, // Selalu tampil
        },
        {
          title: "Tanggal Pemasukan",
          field: "tanggal_pemasukan",
          hozAlign: "center",
          formatter: (cell) => formatDateOnly(cell.getValue()),
          headerFilter: false,
          resizable: false,
          responsive: 0, // Selalu tampil
        },
        {
          title: "Nominal Pemasukan",
          field: "nominal_pemasukan",
          hozAlign: "right",
          formatter: (cell) => formatCurrency(cell.getValue()),
          headerFilter: false,
          resizable: false,
          responsive: 1, // Prioritas sembunyi/collapse
        },
        {
          title: "Nominal Bersih",
          field: "nominal_bersih",
          hozAlign: "right",
          formatter: (cell) => formatCurrency(cell.getValue()),
          headerFilter: false,
          resizable: false,
          responsive: 1, // Prioritas sembunyi/collapse
        },
        {
          title: "Aksi",
          field: "actions",
          hozAlign: "center",
          resizable: false,
          formatter: (cell, formatterParams, onRendered) => {
            const id = cell.getRow().getData().id;
            const editBtn = `<button class="btn btn-sm btn-info me-1"><i class="fas fa-edit"></i></button>`;
            const deleteBtn = `<button class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>`;

            const container = document.createElement("div");
            container.innerHTML = editBtn + deleteBtn;

            container.querySelector(".btn-info").addEventListener("click", () => {
              editIncome(id);
            });

            container.querySelector(".btn-danger").addEventListener("click", () => {
              deleteIncome(id);
            });
            return container;
          },
          headerSort: false,
          responsive: 0, // Selalu tampil
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
        placeholder: "Tidak ada data pemasukan",
        // cssClass: "tabulator-dark-theme", // Ini sudah diterapkan oleh import tabulator_midnight.min.css
      };

      if (isMobile) {
        tabulatorOptions.layout = "fitDataFill"; // Mobile: fitDataFill
        tabulatorOptions.responsiveLayout = false; // Nonaktifkan responsiveLayout bawaan
        tabulatorOptions.rowHeader = false; // Sembunyikan rowHeader
        tabulatorOptions.columns = [
          // Kolom dummy untuk mode rowFormatter
          {
            title: "",
            field: "id",
            formatter: "html",
            headerSort: false,
            resizable: false
          }
        ];
        tabulatorOptions.rowFormatter = function(row){
          const data = row.getData();
          const element = row.getElement();

          pemasukanTable.value.setAttribute("data-mobile-card-active", "true");
          element.innerHTML = ""; // Kosongkan konten default sel Tabulator

          const rowContent = document.createElement("div");
          rowContent.classList.add("custom-mobile-card");

          rowContent.innerHTML = `
            <div class="custom-mobile-card-field" style="margin-bottom: 8px;">
                <span class="custom-mobile-card-label" style="font-weight: bold; color: #fc0">ID:</span>
                <span class="custom-mobile-card-value">${data.id}</span>
            </div>
            <div class="custom-mobile-card-field"  style="margin-bottom: 8px;">
                <span class="custom-mobile-card-label" style="font-weight: bold; color: #fc0">Tanggal:</span>
                <span class="custom-mobile-card-value">${formatDateOnly(data.tanggal_pemasukan)}</span>
            </div>
            <div class="custom-mobile-card-field" style="margin-bottom: 8px;">
                <span class="custom-mobile-card-label" style="font-weight: bold; color: #fc0">Nominal:</span>
                <span class="custom-mobile-card-value">${formatCurrency(data.nominal_pemasukan)}</span>
            </div>
            <div class="custom-mobile-card-field" style="margin-bottom: 8px;">
                <span class="custom-mobile-card-label" style="font-weight: bold; color: #fc0">Bersih:</span>
                <span class="custom-mobile-card-value">${formatCurrency(data.nominal_bersih)}</span>
            </div>
            <div class="custom-mobile-card-field" style="margin-bottom: 8px;">
                <span class="custom-mobile-card-label" style="font-weight: bold; color: #fc0">Aksi:</span>
                <span class="custom-mobile-card-value d-flex gap-1">
                    <button class="btn btn-sm btn-info edit-btn" data-id="${data.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${data.id}"><i class="fas fa-trash"></i></button>
                </span>
            </div>
          `;
          element.appendChild(rowContent);

          // Re-attach listeners for buttons within the custom row
          rowContent.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            editIncome(data.id);
          });
          rowContent.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteIncome(data.id);
          });
        };
      } else {
        // Mode desktop: gunakan fitColumns dan responsiveLayout collapse
        tabulatorOptions.layout = "fitColumns"; // Desktop: fitColumns
        tabulatorOptions.responsiveLayout = "collapse";
        tabulatorOptions.rowHeader = {formatter:"responsiveCollapse", width:30, hozAlign:"center"};
        tabulatorOptions.columns = baseColumns;
        tabulatorOptions.rowFormatter = null; // Hapus formatter jika kembali ke desktop
        pemasukanTable.value.removeAttribute("data-mobile-card-active"); // Hapus atribut CSS
      }

      tabulatorInstance = new Tabulator(pemasukanTable.value, tabulatorOptions);
    };

    const renderChartMonthlyRevenue = async () => {
      const monthlyAggregatedData = await fetchMonthlyRevenueData();

      const labels = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"
      ];
      const dataValues = [];

      for (let i = 0; i < labels.length; i++) {
        dataValues.push(monthlyAggregatedData[i] || 0);
      }

      const ctxRevenue = document.getElementById("revenueChart");

      if (chartInstance) {
        chartInstance.destroy();
      }

      chartInstance = new Chart(ctxRevenue, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Pendapatan Bersih (Rp)",
              data: dataValues,
              backgroundColor: "rgba(255, 206, 86, 0.6)",
              borderColor: "rgba(255, 206, 86, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: "#FDFDFD",
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color: "#FDFDFD",
              },
              grid: {
                color: "rgba(255, 255, 255, 0.1)",
              },
              title: {
                display: false,
                color: "#FDFDFD",
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: "#FDFDFD",
                callback: function (value) {
                  return "Rp " + value.toLocaleString("id-ID");
                },
              },
              grid: {
                color: "rgba(255, 255, 255, 0.1)",
              },
              title: {
                display: false,
                color: "#FDFDFD",
              },
            },
          },
        },
      });
    };

    let bsModalInstance = null;

    const initializeModal = () => {
      const modalElement = document.getElementById("incomeModal");
      if (modalElement && !bsModalInstance) {
        bsModalInstance = new Modal(modalElement, {
          backdrop: false,
          keyboard: false,
        });

        modalElement.addEventListener("hide.bs.modal", () => {
          isModalOpen.value = false;
          modalElement.setAttribute("aria-hidden", "true");
          document.body.classList.remove("modal-custom-open");
        });
        modalElement.addEventListener("show.bs.modal", () => {
          modalElement.removeAttribute("aria-hidden");
          document.body.classList.add("modal-custom-open");
        });
      }
    };

    const openModal = () => {
      isModalOpen.value = true;
      nextTick(() => {
        if (bsModalInstance) {
          bsModalInstance.show();
        }
      });
    };

    const closeModal = () => {
      isModalOpen.value = false;
      nextTick(() => {
        if (bsModalInstance) {
          bsModalInstance.hide();
        }
      });
    };

    const openAddIncomeModal = () => {
      isEditing.value = false; // Set to add mode
      newIncome.value = {
        id: null,
        tanggal_pemasukan: new Date().toISOString().substring(0, 10),
        nominal_pemasukan: 0,
      };
      openModal();
    };

    const editIncome = async (id) => {
      isEditing.value = true; // Set to edit mode
      try {
        const response = await axios.get(`${API_DOMAIN}/api/pemasukanMingguan/${id}`, { withCredentials: true });
        const incomeData = response.data;
        newIncome.value = {
          id: incomeData.id,
          tanggal_pemasukan: new Date(incomeData.tanggal_pemasukan).toISOString().substring(0, 10),
          nominal_pemasukan: incomeData.nominal_pemasukan,
        };
        openModal();
      } catch (error) {
        console.error("Error fetching income for edit:", error);
        Swal.fire({
          icon: "error",
          title: "Gagal Memuat Data",
          text: error.response?.data?.error || "Terjadi kesalahan saat memuat data untuk diedit.",
          confirmButtonColor: "#fc0",
        });
      }
    };


    const submitIncomeForm = async () => {
      if (isEditing.value) {
        await updateIncome();
      } else {
        await addIncome();
      }
      await renderChartMonthlyRevenue(); // Re-render chart after any data change
    };

    const addIncome = async () => {
      try {
        const payload = {
          tanggal_pemasukan: newIncome.value.tanggal_pemasukan,
          nominal_pemasukan: newIncome.value.nominal_pemasukan,
        };

        const response = await axios.post(
          `${API_DOMAIN}/api/pemasukanMingguan`,
          payload,
          { withCredentials: true }
        );

        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: response.data.message,
          confirmButtonColor: "#fc0",
        });

        closeModal();

        tabulatorInstance.setData(await fetchData()).then(() => {
          applyDayFilter();
        });
      } catch (error) {
        console.error("Error adding income:", error);
        Swal.fire({
          icon: "error",
          title: "Gagal Menambahkan Pemasukan",
          text:
            error.response?.data?.error ||
            "Terjadi kesalahan saat menambahkan data pemasukan.",
          confirmButtonColor: "#fc0",
        });
      }
    };

    const updateIncome = async () => {
      try {
        const payload = {
          tanggal_pemasukan: newIncome.value.tanggal_pemasukan,
          nominal_pemasukan: newIncome.value.nominal_pemasukan,
        };

        const response = await axios.put(
          `${API_DOMAIN}/api/pemasukanMingguan/${newIncome.value.id}`,
          payload,
          { withCredentials: true }
        );

        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: response.data.message,
          confirmButtonColor: "#fc0",
        });

        closeModal();

        tabulatorInstance.setData(await fetchData()).then(() => {
          applyDayFilter();
        });
      } catch (error) {
        console.error("Error updating income:", error);
        Swal.fire({
          icon: "error",
          title: "Gagal Memperbarui Pemasukan",
          text:
            error.response?.data?.error ||
            "Terjadi kesalahan saat memperbarui data pemasukan.",
          confirmButtonColor: "#fc0",
        });
      }
    };

    const deleteIncome = async (id) => {
      Swal.fire({
        title: "Anda Yakin?",
        text: "Data pemasukan ini akan dihapus permanen!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#fc0",
        cancelButtonColor: "#d33",
        confirmButtonText: "Ya, Hapus!",
        cancelButtonText: "Batal",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const response = await axios.delete(
              `${API_DOMAIN}/api/pemasukanMingguan/${id}`,
              { withCredentials: true }
            );

            Swal.fire({
              icon: "success",
              title: "Dihapus!",
              text: response.data.message,
              confirmButtonColor: "#fc0",
            });

            tabulatorInstance.setData(await fetchData()).then(() => {
              applyDayFilter();
            });
            await renderChartMonthlyRevenue(); // Re-render chart after deletion
          } catch (error) {
            console.error("Error deleting income:", error);
            Swal.fire({
              icon: "error",
              title: "Gagal Menghapus",
              text:
                error.response?.data?.error ||
                "Terjadi kesalahan saat menghapus data.",
              confirmButtonColor: "#fc0",
            });
          }
        }
      });
    };

    const applyDayFilter = () => {
      if (!tabulatorInstance) return;

      const dateInput = filterDate.value;
      console.log("Date input for filtering:", dateInput);

      tabulatorInstance.clearFilter();

      if (dateInput) {
        const filterDay = new Date(dateInput);
        filterDay.setHours(0, 0, 0, 0);

        tabulatorInstance.setFilter((row) => {
          const rowRawDate = row.tanggal_pemasukan;
          const rowDate = new Date(rowRawDate);
          rowDate.setHours(0, 0, 0, 0);

          return rowDate.getTime() === filterDay.getTime();
        });
      } else {
        console.log("Filter date is empty, clearing filter.");
      }
    };

    const clearDayFilter = () => {
      filterDate.value = "";
      if (tabulatorInstance) {
        tabulatorInstance.clearFilter();
        console.log("Filter cleared.");
      }
    };

    watch(filterDate, (newValue, oldValue) => {
      if (newValue !== oldValue) {
        applyDayFilter();
      }
    });

    onMounted(() => {
      initializeTabulator();
      initializeModal();
      renderChartMonthlyRevenue(); // Call to render the chart on mount

      // Tambahkan event listener untuk perubahan ukuran layar dengan debounce
      let resizeTimeout;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          initializeTabulator(); // Re-initialize Tabulator on resize
        }, 200);
      });
    });

    return {
      sidebarOpen,
      toggleSidebar,
      pemasukanTable,
      openAddIncomeModal,
      newIncome,
      calculatedNominalBersih,
      submitIncomeForm, // Use a single function for form submission
      isModalOpen,
      closeModal,
      filterDate,
      clearDayFilter,
      isEditing, // Expose isEditing
    };
  },
};
</script>

<style scoped>
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}
/* Main background for body and content */
body,
.content {
  background-color: #2b0057; /* Existing dark purple background */
  color: #fdfdfd; /* Changed to FDFDFD for main content text */
}

/* Add a custom style to remove the default calendar icon on date inputs for Webkit browsers (Chrome, Safari) */
input[type="date"]::-webkit-calendar-picker-indicator {
  opacity: 0;
  width: 100%; /* Make the clickable area cover the entire input */
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  cursor: pointer; /* Show pointer cursor on hover */
}

/* For Firefox, you might need a different approach or accept its default behavior */
input[type="date"] {
  position: relative; /* Ensure it's positioned for the absolute overlay */
}

/* If you previously had custom styles for .date-input-container-modal or .calendar-icon-modal, you can remove them */
.date-input-container-modal, .calendar-icon-modal {
  display: none !important; /* Hide them if they somehow persist */
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

.date-input-container {
  position: relative;
  /* Atur lebar sesuai kebutuhan, atau biarkan input mengambil lebar penuh */
  /* width: 250px; */
}

/* Styling dasar untuk input date */
#filterDate {
  width: 100%;
  padding-right: 40px; /* Beri ruang di kanan untuk ikon */
  background-color: #36394c; /* Contoh: latar belakang gelap dari tema Anda */
  color: #fdfdfd; /* Warna teks terang */
  border: 1px solid #555; /* Border yang cocok untuk tema gelap */
  border-radius: 5px;
}

/* Sembunyikan ikon kalender bawaan di Chrome/Safari */
#filterDate::-webkit-calendar-picker-indicator {
  opacity: 0; /* Membuat ikon bawaan tidak terlihat */
  position: absolute; /* Menutupi seluruh input */
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  cursor: pointer; /* Pertahankan kursor pointer agar pengguna tahu bisa diklik */
  z-index: 1; /* Pastikan ini di atas ikon kustom jika perlu */
}

/* Atur posisi dan warna ikon Font Awesome kustom */
.calendar-icon {
  position: absolute;
  right: 10px; /* Atur posisi horizontal ikon dari kanan */
  top: 55%; /* Atur posisi vertikal ke tengah */
  transform: translateY(
    -50%
  ); /* Geser ke atas 50% dari tingginya sendiri untuk pusatkan */
  pointer-events: none; /* Sangat penting: agar klik tembus ke input di belakangnya */
  color: #fc0; /* Warna ikon sesuai permintaan Anda (kuning/oranye) */
  font-size: 1.2em; /* Ukuran ikon */
  z-index: 2; /* Pastikan ikon kustom terlihat di atas indikator bawaan */
}

/* Sidebar style */
.sidebar {
  background-color: #5a0099; /* Darker purple for sidebar */
  color: #fdfdfd; /* Changed to FDFDFD */
  width: 240px;
  height: 100vh;
  padding-top: 1rem;
  position: fixed; /* Membuat elemen tetap di posisi tertentu di viewport */
  top: 0;          /* Memposisikan di bagian atas viewport */
  left: 0;         /* Memposisikan di bagian kiri viewport */
  transition: all 0.3s;
  z-index: 2000; /* Pastikan sidebar di atas konten lain */
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
  position: fixed; /* NEW: Membuat navbar melayang */
  top: 0;          /* NEW: Menempel di bagian atas */
  width: 100%;     /* NEW: Memenuhi lebar layar */
  z-index: 1030;   /* NEW: Higher than sidebar's default content, but lower than modals etc. */
  padding-left: 240px !important; /* NEW: Default padding-left to push content past the fixed sidebar */
  transition: padding-left 0.3s; /* NEW: Smooth transition for padding when sidebar opens/closes */
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
  border-left: 5_0px solid #fc0;
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
  height: 48px;
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

/* Specific styles for Pemasukan.vue */
.tabulator-table-container {
  overflow-x: auto; /* Enable horizontal scrolling for the table */
}

/* Custom button style */
.btn-custom {
  background-color: #fc0; /* Consistent secondary accent color */
  color: #000; /* Kept black for contrast on yellow background */
  font-weight: 600;
  border: none;
}
.btn-custom:hover {
  background-color: #e6b800; /* Slightly darker accent on hover */
}

/* Modal specific styles to match dark theme */
.custom-modal-content {
  background-color: #2b0057; /* Dark background like content */
  color: #fdfdfd;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.custom-modal-header {
  background-color: #210038; /* Darker header like navbar */
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.custom-modal-header .modal-title {
  color: #fdfdfd;
}

.custom-btn-close {
  filter: invert(1); /* Invert color for white 'x' on dark background */
}

.custom-modal-body {
  background-color: #2b0057; /* Ensure body also dark */
}

.custom-modal-body .form-label {
  color: #fdfdfd; /* Label text color */
}

.custom-modal-body .form-control {
  background-color: rgba(
    255,
    255,
    255,
    0.1
  ); /* Slightly transparent input background */
  color: #fdfdfd;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.custom-modal-body .form-control:focus {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: #fc0; /* Highlight with accent color on focus */
  box-shadow: 0 0 0 0.25rem rgba(255, 204, 0, 0.25);
}

/* Date input specific styles */
input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1); /* Makes the calendar icon white */
}
input[type="date"] {
  color-scheme: dark; /* Tries to enforce a dark theme for the date picker itself */
}

/* CUSTOM BACKDROP STYLES */
/* Mengatur backdrop kustom agar mengisi seluruh area modal */
.custom-modal-backdrop {
  position: absolute; /* Posisikan absolut di dalam .modal.fade */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Warna hitam transparan */
  z-index: 1; /* Harus lebih rendah dari modal-dialog yang akan punya z-index lebih tinggi */
  opacity: 1; /* Karena kita pakai v-if, saat elemen ada, dia langsung opaque */
  transition: opacity 0.3s ease;
}

/* Modifikasi .modal.fade agar jadi container utama fixed */
.modal.fade {
  position: fixed; /* Penting: agar modal menutupi seluruh viewport */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1040; /* Z-index untuk seluruh modal, termasuk backdrop kustom di dalamnya */
  display: flex; /* Gunakan flexbox untuk menengahkan modal-dialog */
  justify-content: center;
  align-items: center;
  overflow: hidden; /* Sembunyikan overflow dari modal itu sendiri */
  /* backdrop-filter: blur(5px); (opsional, untuk efek blur pada background) */
}

/* Pastikan modal-dialog dan isinya berada di atas backdrop kustom */
.modal-dialog {
  position: relative; /* Penting untuk z-index di dalam modal.fade */
  z-index: 2; /* Lebih tinggi dari custom-modal-backdrop (yang punya z-index 1) */
  /* Gaya penengahan modal-dialog secara vertikal dan horizontal sudah ditangani oleh flexbox di .modal.fade */
}

/* Override gaya Bootstrap yang menambahkan overflow: hidden ke body */
/* Ini diperlukan jika Anda ingin scrollbar body tetap berfungsi saat modal terbuka */
body.modal-custom-open {
  /* Gunakan kelas kustom yang kita tambahkan di JS */
  overflow: hidden !important; /* Untuk mencegah scrolling body saat modal terbuka */
  padding-right: var(
    --bs-body-padding-right,
    0
  ) !important; /* Biarkan padding scrollbar default Bootstrap jika ada */
}

/* Tambahan: Bootstrap juga menambahkan class 'modal-open' ke body. Anda bisa target ini juga */
body.modal-open {
  padding-right: 0px !important; /* Pastikan padding kanan tidak ada jika tidak diinginkan */
  overflow: hidden !important; /* Sembunyikan scrollbar pada body */
}

/* Specific styles for Pemasukan.vue */
.tabulator-table-container {
  overflow-x: auto; /* Enable horizontal scrolling for the table */
}

/* Tabulator Dark Theme Overrides */
/* The main table container */
.tabulator.tabulator-dark-theme {
  background-color: transparent; /* Inherit from card-body */
  border: none; /* Remove default border */
  color: #fdfdfd; /* Default text color for table */
  font-family: sans-serif; /* Ensure consistent font */
}

/* Table header */
.tabulator.tabulator-dark-theme .tabulator-header {
  background-color: #4d0073 !important; /* Dark purple for header */
  color: #fdfdfd !important; /* White text for header */
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  border-top: none; /* Remove top border if present */
}

/* Individual column headers */
.tabulator.tabulator-dark-theme .tabulator-col {
  background-color: #4d0073 !important; /* Ensure column backgrounds match header */
  color: #fdfdfd !important;
  border-right: 1px solid rgba(255, 255, 255, 0.05); /* Subtle column dividers */
}

/* Hover state for sortable columns */
.tabulator.tabulator-dark-theme .tabulator-col.tabulator-sortable:hover {
  background-color: #5a0099 !important; /* Slightly lighter purple on hover */
}

/* Sorted column headers */
.tabulator.tabulator-dark-theme
  .tabulator-col.tabulator-sortable[aria-sort="asc"],
.tabulator.tabulator-dark-theme
  .tabulator-col.tabulator-sortable[aria-sort="desc"] {
  background-color: #5a0099 !important; /* Lighter purple for sorted columns */
}

/* Header filter input fields */
.tabulator.tabulator-dark-theme .tabulator-header-filter {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #fdfdfd !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  padding: 5px 8px; /* Adjust padding for better look */
  box-sizing: border-box; /* Include padding in element's total width and height */
}

.tabulator.tabulator-dark-theme .tabulator-header-filter:focus {
  border-color: #fc0 !important;
  box-shadow: 0 0 0 0.25rem rgba(255, 204, 0, 0.25) !important;
}

/* Table body (rows and cells) */
.tabulator.tabulator-dark-theme .tabulator-tableHolder {
  background-color: transparent; /* No specific background for table holder */
}

.tabulator.tabulator-dark-theme .tabulator-row {
  background-color: rgba(
    0,
    0,
    0,
    0.2
  ) !important; /* Slightly transparent row background */
  color: #fdfdfd !important; /* Row text color */
  border-bottom: 1px solid rgba(255, 255, 255, 0.05); /* Subtle row dividers */
}

/* Even rows for striping */
.tabulator.tabulator-dark-theme .tabulator-row.tabulator-row-even {
  background-color: rgba(
    0,
    0,
    0,
    0.25
  ) !important; /* Slightly darker for even rows */
}

/* Selected row */
.tabulator.tabulator-dark-theme .tabulator-row.tabulator-selected {
  background-color: rgba(
    252,
    204,
    0,
    0.2
  ) !important; /* Accent color for selected row */
  color: #fdfdfd !important;
}

/* Row hover state */
.tabulator.tabulator-dark-theme .tabulator-row:hover {
  background-color: rgba(0, 0, 0, 0.35) !important; /* Darker on hover */
}

/* Individual cells */
.tabulator.tabulator-dark-theme .tabulator-cell {
  border-right: 1px solid rgba(255, 255, 255, 0.05); /* Cell borders */
  color: #fdfdfd; /* Cell text color */
  padding: 8px 12px; /* Adjust cell padding */
}

/* Pagination styles */
.tabulator.tabulator-dark-theme .tabulator-footer {
  background-color: #4d0073 !important; /* Dark purple for footer */
  color: #fdfdfd !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px; /* Add some padding to the footer */
}

.tabulator.tabulator-dark-theme .tabulator-page-counter {
  color: #fdfdfd !important;
}

.tabulator.tabulator-dark-theme .tabulator-pages button {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #fdfdfd !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  margin: 0 4px; /* Adjust spacing between buttons */
  padding: 5px 10px; /* Adjust button padding */
  border-radius: 4px; /* Slightly rounded corners */
}

.tabulator.tabulator-dark-theme .tabulator-pages button.active {
  background-color: #fc0 !important; /* Accent color for active page */
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
  padding: 5px 8px; /* Adjust padding for page size dropdown */
  border-radius: 4px;
}

/* Placeholder message */
.tabulator.tabulator-dark-theme .tabulator-placeholder {
  background-color: transparent;
  color: #ccc;
  font-style: italic;
  padding: 20px;
}

/* Adjustments for icons within cells for visibility */
.tabulator.tabulator-dark-theme .tabulator-cell .btn {
  /* You already have good button styles, just ensure they are visible */
  color: #fdfdfd; /* Or specific icon color */
}


/* --- Custom Tabulator Resizer Overrides --- */

/* Target the column resizer element */
.tabulator .tabulator-col .tabulator-col-resize-handle {
  cursor: default !important; /* Change cursor to default */
  pointer-events: none !important; /* Prevent interaction with the handle */
}

/* Ensure the header itself doesn't show resize cursor */
.tabulator .tabulator-col.tabulator-sortable {
  cursor: pointer !important; /* Keep pointer cursor for sortable headers */
}

/* For non-sortable headers, ensure default cursor */
.tabulator .tabulator-col:not(.tabulator-sortable) {
  cursor: default !important;
}

/* Also target the general table resize handle, though you've set resizeable:false */
.tabulator .tabulator-footer .tabulator-resize-handle {
    display: none !important; /* Hide footer resize handle */
}

</style>