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
      </ul>
    </nav>

    <div class="content flex-grow-1">
      <nav class="navbar navbar-light bg-light px-3">
        <button
          class="btn btn-outline-secondary d-md-none"
          @click="toggleSidebar"
        >
          ☰
        </button>
        <h5 class="m-0 ms-2" style="color: #fdfdfd; font-weight: bold">
          Dashboard Admin
        </h5>
      </nav>

      <div class="container-fluid mt-3">
        <div class="row g-4">
          <div
            class="col-md-6 col-xl-3"
            v-for="stat in statistics"
            :key="stat.title"
          >
            <div :class="['card', 'h-100', stat.bg, 'text-white', 'shadow']">
              <div class="card-body">
                <h5 class="card-title">{{ stat.title }}</h5>
                <p class="card-text fs-3 fw-bold">{{ stat.value }}</p>
                <p class="card-text">
                  <small>{{ stat.desc }}</small>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="row mt-4">
          <div class="col-lg-6">
            <div class="card shadow">
              <div class="card-header">
                <strong>📈 Tren Parkir Bulanan</strong>
              </div>
              <div class="card-body">
                <canvas id="parkirChart" height="120"></canvas>
              </div>
            </div>
          </div>

          <div class="col-lg-6 mt-4 mt-lg-0">
            <div class="card shadow">
              <div class="card-header">
                <strong>💰 Pemasukan Bulanan</strong>
              </div>
              <div class="card-body">
                <canvas id="revenueChart" height="120"></canvas>
              </div>
            </div>
          </div>
        </div>

        <div class="row mt-4">
          <div class="col-12">
            <div class="card shadow">
              <div class="card-header">
                <strong>📌 Aktivitas Terbaru</strong>
              </div>
              <div class="card-body">
                <ul class="list-group list-group-flush">
                  <li
                    v-for="log in activityLog"
                    :key="log.id || log.tanggal_pesan"
                    class="list-group-item"
                  >
                    <span>{{ formatLogMessage(log) }}</span>
                    <br /><small class="text-muted">{{
                      formatTimeAgo(log.tanggal_pesan)
                    }}</small>
                  </li>
                  <li
                    v-if="!activityLog.length"
                    class="list-group-item text-center text-muted"
                  >
                    Tidak ada aktivitas terbaru.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="row mt-4">
          <div class="col-12">
            <div class="card shadow">
              <div class="card-header">
                <strong>🅿️ Data Parkir Hari Ini</strong>
              </div>
              <div class="card-body table-responsive">
                <table class="table table-striped">
                  <thead class="table-dark">
                    <tr>
                      <th>No</th>
                      <th>Plat Nomor</th>
                      <th>Waktu Masuk</th>
                      <th>Waktu Keluar</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(data, index) in parkirData" :key="index">
                      <td>{{ index + 1 }}</td>
                      <td>{{ data.plat }}</td>
                      <td>{{ data.masuk }}</td>
                      <td>{{ data.keluar }}</td>
                      <td>
                        <span
                          :class="[
                            'badge',
                            data.status === 'Parkir'
                              ? 'bg-success'
                              : 'bg-secondary',
                          ]"
                        >
                          {{ data.status }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="!parkirData.length">
                      <td colspan="5" class="text-center text-muted">
                        Belum ada data hari ini.
                      </td>
                    </tr>
                  </tbody>
                </table>
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
import Chart from "chart.js/auto";
import { io } from "socket.io-client";

export default {
  name: "Dashboard",
  setup() {
    const sidebarOpen = ref(false);
    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    const statistics = ref([
      { title: "Total Parkir", value: 0, desc: "Hari ini", bg: "bg-primary" },
      {
        title: "Pendapatan",
        value: "Rp 0",
        desc: "Tahun ini",
        bg: "bg-success",
      },
      {
        title: "Total Tiket Tersedia",
        value: 0,
        desc: "Saat ini",
        bg: "bg-warning",
      },
      { title: "Parkir Selesai", value: 0, desc: "Hari ini", bg: "bg-info" },
    ]);

    const activityLog = ref([]);
    const parkirData = ref([]);

    let revenueChartInstance = null;
    let parkirChartInstance = null;

    let socket = null;

    const API_DOMAIN =
      import.meta.env.VITE_DOMAIN_SERVER || "http://localhost:3000";

    // Dashboard.vue - dalam setup()
    const formatTimeAgo = (dateString) => {
      // dateString format: '2025-07-16T12:04:18.000Z'
      // Tapi sebenarnya ini sudah dalam WIB, bukan UTC

      // Alternatif 1: Hapus 'Z' dari string dan treat sebagai waktu lokal
      const cleanDateString = dateString.replace("Z", "");
      const past = new Date(cleanDateString);

      // Alternatif 2: Atau konversi manual dengan offset timezone
      // const utcTime = new Date(dateString);
      // const past = new Date(utcTime.getTime() - (7 * 60 * 60 * 1000)); // Kurangi 7 jam

      // Waktu sekarang
      const now = new Date();

      // --- Debugging logs ---
      console.log("--- TimeAgo Debugging (Fixed) ---");
      console.log(`Input dateString (from DB): ${dateString}`);
      console.log(`Clean dateString (without Z): ${cleanDateString}`);
      console.log(`Current Time (System/Local): ${now}`);
      console.log(`Past Time (treated as local): ${past}`);

      // Display in WIB format for comparison
      console.log(
        `Current Time (WIB): ${now.toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
          hour12: false,
        })}`
      );
      console.log(
        `Past Time (WIB): ${past.toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
          hour12: false,
        })}`
      );

      // Calculate difference in milliseconds
      const diffMilliseconds = now.getTime() - past.getTime();
      const diffSeconds = Math.floor(diffMilliseconds / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffMonths = Math.floor(diffDays / 30.44);
      const diffYears = Math.floor(diffDays / 365.25);

      console.log(`Raw Diff (ms): ${diffMilliseconds}`);
      console.log(`Diff Seconds: ${diffSeconds}`);
      console.log(`Diff Minutes: ${diffMinutes}`);
      console.log(`Diff Hours: ${diffHours}`);
      console.log(`Diff Days: ${diffDays}`);
      console.log("-----------------------------------");

      // Return relative time
      if (diffSeconds < 0) {
        return "Waktu masa depan"; // Handle negative values
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
      const adminEmail = log.admin_email || "Admin Sistem";
      const rawMessage = log.isi_pesan;
      return rawMessage.replace("email_admin", adminEmail);
    };

    const updateActivityLog = (newLogs) => {
      activityLog.value = newLogs.slice(0, 7);
    };

    const updateTodaysParkingData = (allParkingData) => {
      const today = new Date();
      // Ensure localizing `today` to WIB if necessary for accurate comparison
      // The `toLocaleTimeString` already handles timezone, but `toDateString()` might not match
      // if `today` is still in client's default timezone and `logDateWIB` is explicitly WIB.
      const todayWIB = new Date(
        today.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
      );
      todayWIB.setHours(0, 0, 0, 0); // Reset time for date-only comparison

      parkirData.value = allParkingData
        .filter((log) => {
          // Convert log time to WIB for accurate comparison
          const logDateWIB = new Date(
            new Date(log.waktu_masuk).toLocaleString("en-US", {
              timeZone: "Asia/Jakarta",
            })
          );
          return logDateWIB.toDateString() === todayWIB.toDateString();
        })
        .map((log) => ({
          plat: log.plat_nomor,
          masuk: new Date(log.waktu_masuk).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Jakarta",
          }),
          keluar: log.waktu_keluar
            ? new Date(log.waktu_keluar).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Jakarta",
              })
            : "-",
          status: log.waktu_keluar ? "Selesai" : "Parkir",
        }))
        .sort(
          (a, b) =>
            new Date(`2000/01/01 ${b.masuk}`) -
            new Date(`2000/01/01 ${a.masuk}`)
        );

      const totalParkirToday = parkirData.value.length;
      const parkirSelesaiToday = parkirData.value.filter(
        (data) => data.status === "Selesai"
      ).length;

      const totalParkirStatIndex = statistics.value.findIndex(
        (s) => s.title === "Total Parkir"
      );
      if (totalParkirStatIndex !== -1) {
        statistics.value[totalParkirStatIndex].value = totalParkirToday;
      }

      const parkirSelesaiStatIndex = statistics.value.findIndex(
        (s) => s.title === "Parkir Selesai"
      );
      if (parkirSelesaiStatIndex !== -1) {
        statistics.value[parkirSelesaiStatIndex].value = parkirSelesaiToday;
      }
    };

    const updateMonthlyRevenueChart = (data) => {
      const labels = data.map((item) => item.month_name);
      const dataValues = data.map((item) => item.total_revenue);

      const ctxRevenue = document.getElementById("revenueChart");

      if (revenueChartInstance) {
        revenueChartInstance.data.labels = labels;
        revenueChartInstance.data.datasets[0].data = dataValues;
        revenueChartInstance.update();
      } else {
        revenueChartInstance = new Chart(ctxRevenue, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Pendapatan (Rp)",
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
      }
      calculateAnnualRevenueFromFetchedData(data);
    };

    const updateAdminStats = (totalAvailableTicketsCount) => {
      const totalAvailableTicketsStatIndex = statistics.value.findIndex(
        (s) => s.title === "Total Tiket Tersedia"
      );
      if (totalAvailableTicketsStatIndex !== -1) {
        statistics.value[totalAvailableTicketsStatIndex].value =
          totalAvailableTicketsCount;
      }
    };

    const updateTotalActiveVehicles = (count) => {
      const totalActiveVehiclesStatIndex = statistics.value.findIndex(
        (s) => s.title === "Total Parkir"
      );
      if (totalActiveVehiclesStatIndex !== -1) {
        statistics.value[totalActiveVehiclesStatIndex].value = count;
      }
    };

    const calculateAnnualRevenueFromFetchedData = (monthlyData) => {
      const currentYear = new Date().getFullYear();
      let totalAnnualRevenue = 0;

      monthlyData.forEach((item) => {
        totalAnnualRevenue += parseFloat(item.total_revenue) || 0;
      });

      const pendapatanStatIndex = statistics.value.findIndex(
        (stat) => stat.title === "Pendapatan"
      );
      if (pendapatanStatIndex !== -1) {
        statistics.value[
          pendapatanStatIndex
        ].value = `Rp ${totalAnnualRevenue.toLocaleString("id-ID")}`;
        statistics.value[pendapatanStatIndex].desc = `Tahun ${currentYear}`;
      }
    };

    const updateParkirChart = (weeklyData) => {
      const labels = weeklyData.map((item) => item.week_of_month);
      const dataValues = weeklyData.map((item) => item.total_vehicles);

      const ctx = document.getElementById("parkirChart");
      if (parkirChartInstance) {
        parkirChartInstance.data.labels = labels;
        parkirChartInstance.data.datasets[0].data = dataValues;
        parkirChartInstance.update();
      } else {
        parkirChartInstance = new Chart(ctx, {
          type: "line",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Jumlah Kendaraan",
                data: dataValues,
                borderColor: "rgba(255, 206, 86, 1)",
                backgroundColor: "rgba(255, 206, 86, 0.2)",
                fill: true,
                tension: 0.4,
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
                  precision: 0,
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
      }
    };

    onMounted(async () => {
      socket = io(API_DOMAIN, {
        withCredentials: true,
      });

      socket.on("connect", () => {
        console.log("Connected to WebSocket server from dashboard!");
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from WebSocket server from dashboard.");
      });

      socket.on("connect_error", (err) => {
        console.error("WebSocket connection error:", err.message);
      });

      socket.on("logMessagesUpdate", (data) => {
        updateActivityLog(data);
      });

      socket.on("parkingLogsUpdate", (data) => {
        updateTodaysParkingData(data);
      });

      socket.on("totalAvailableTicketsUpdate", (count) => {
        updateAdminStats(count);
      });

      socket.on("totalActiveVehiclesUpdate", (count) => {
        const totalParkirStatIndex = statistics.value.findIndex(
          (s) => s.title === "Total Parkir"
        );
        if (totalParkirStatIndex !== -1) {
          statistics.value[totalParkirStatIndex].value = count;
        }
      });

      socket.on("revenueSummaryUpdate", (data) => {
        updateMonthlyRevenueChart(data);
      });

      socket.on("weeklyParkingTrendUpdate", (data) => {
        updateParkirChart(data);
      });

      updateParkirChart([]);
    });

    onUnmounted(() => {
      if (parkirChartInstance) {
        parkirChartInstance.destroy();
      }
      if (revenueChartInstance) {
        revenueChartInstance.destroy();
      }
      if (socket) {
        socket.disconnect();
      }
    });

    return {
      sidebarOpen,
      toggleSidebar,
      statistics,
      activityLog,
      parkirData,
      formatLogMessage,
      formatTimeAgo,
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
  color: #fdfdfd; /* Changed to FDFDFD */
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
</style>
