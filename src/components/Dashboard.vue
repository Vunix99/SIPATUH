<template>
  <div class="d-flex">
    <nav :class="['sidebar', sidebarOpen ? 'open' : '']">
      <div class="sidebar-header d-flex justify-content-between align-items-center">
        <h5 class="text-white m-0">SIPATUH</h5>
        <button class="btn btn-sm btn-light d-md-none" @click="toggleSidebar">✕</button>
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
      </ul>
    </nav>

    <div class="content flex-grow-1">
      <nav class="navbar navbar-light bg-light px-3">
        <button class="btn btn-outline-secondary d-md-none" @click="toggleSidebar">☰</button>
        <h5 class="m-0 ms-2" style="color: #fdfdfd; font-weight: bold;">Dashboard Admin</h5>
      </nav>

      <div class="container-fluid mt-3">
        <div class="row g-4">
          <div class="col-md-6 col-xl-3" v-for="stat in statistics" :key="stat.title">
            <div :class="['card', 'h-100', stat.bg, 'text-white', 'shadow']">
              <div class="card-body">
                <h5 class="card-title">{{ stat.title }}</h5>
                <p class="card-text fs-3 fw-bold">{{ stat.value }}</p>
                <p class="card-text"><small>{{ stat.desc }}</small></p>
              </div>
            </div>
          </div>
        </div>

        <div class="row mt-4">
          <div class="col-lg-6">
            <div class="card shadow">
              <div class="card-header">
                <strong>📈 Tren Parkir Mingguan</strong>
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
                    v-for="(log, index) in activityLog"
                    :key="index"
                    class="list-group-item"
                  >
                    <strong>{{ log.user }}</strong> - {{ log.action }}
                    <br /><small class="text-muted">{{ log.time }}</small>
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
                        <span :class="['badge', data.status === 'Parkir' ? 'bg-success' : 'bg-secondary']">
                          {{ data.status }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="!parkirData.length">
                      <td colspan="5" class="text-center text-muted">Belum ada data hari ini.</td>
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
import { ref, onMounted } from 'vue';
import Chart from 'chart.js/auto';

export default {
  name: 'Dashboard',
  setup() {
    const sidebarOpen = ref(false);
    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    const statistics = ref([
      { title: 'Total Parkir', value: 120, desc: 'Hari ini', bg: 'bg-primary' },
      { title: 'Pendapatan', value: 'Rp 240.000', desc: 'Hari ini', bg: 'bg-success' },
      { title: 'Admin Aktif', value: 4, desc: 'Dalam sistem', bg: 'bg-warning' },
      { title: 'Parkir Selesai', value: 80, desc: 'Hari ini', bg: 'bg-info' },
    ]);

    const activityLog = ref([
      { user: 'Admin A', action: 'Menambah data parkir', time: '5 menit lalu' },
      { user: 'Admin B', action: 'Logout sistem', time: '15 menit lalu' },
      { user: 'Admin C', action: 'Login', time: '20 menit lalu' },
    ]);

    const parkirData = ref([
      { plat: 'B 1234 XYZ', masuk: '08:00', keluar: '-', status: 'Parkir' },
      { plat: 'D 5678 ABC', masuk: '07:30', keluar: '09:45', status: 'Selesai' },
      { plat: 'F 4444 GH', masuk: '06:20', keluar: '-', status: 'Parkir' },
    ]);

    // Fungsi untuk merender Chart Parkir Mingguan (Existing)
    const renderChart = () => {
      const ctx = document.getElementById('parkirChart');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
          datasets: [
            {
              label: 'Jumlah Kendaraan',
              data: [20, 35, 25, 40, 30, 50, 45],
              borderColor: 'rgba(255, 206, 86, 1)', // Warna kuning-oranye solid
              backgroundColor: 'rgba(255, 206, 86, 0.2)', // Warna kuning-oranye transparan
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
                color: '#FDFDFD'
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: '#FDFDFD'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              title: {
                display: false,
                color: '#FDFDFD'
              }
            },
            y: {
              ticks: {
                color: '#FDFDFD'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              title: {
                display: false,
                color: '#FDFDFD'
              }
            }
          }
        },
      });
    };

    // FUNGSI BARU UNTUK CHART PEMASUKAN BULANAN (Warna disamakan)
    const renderChartMonthlyRevenue = () => {
      const ctxRevenue = document.getElementById('revenueChart');
      new Chart(ctxRevenue, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'],
          datasets: [
            {
              label: 'Pendapatan (Rp)',
              data: [500000, 750000, 600000, 900000, 800000, 1100000, 1250000],
              backgroundColor: 'rgba(255, 206, 86, 0.6)', // Warna kuning-oranye transparan untuk bar
              borderColor: 'rgba(255, 206, 86, 1)', // Warna kuning-oranye solid untuk border bar
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
                color: '#FDFDFD'
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: '#FDFDFD'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              title: {
                display: false,
                color: '#FDFDFD'
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: '#FDFDFD',
                callback: function(value) {
                  return 'Rp ' + value.toLocaleString('id-ID');
                }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              title: {
                display: false,
                color: '#FDFDFD'
              }
            }
          }
        },
      });
    };

    onMounted(() => {
      renderChart();
      renderChartMonthlyRevenue();
    });

    return {
      sidebarOpen,
      toggleSidebar,
      statistics,
      activityLog,
      parkirData,
    };
  },
};
</script>

<style scoped>
/* Main background for body and content */
body, .content {
  background-color: #2b0057; /* Existing dark purple background */
  color: #FDFDFD; /* Changed to FDFDFD for main content text */
}

.router-link-active, .router-link-exact-active, .nav-link{
  margin-right: 20px;
  margin-bottom: 8px;
}
h5.card-title {
  color: #FDFDFD; /* Changed to FDFDFD for card titles */
}

/* Sidebar style */
.sidebar {
  background-color: #5a0099; /* Darker purple for sidebar */
  color: #FDFDFD; /* Changed to FDFDFD */
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
  color: #FDFDFD; /* Changed to FDFDFD */
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
  background-color: rgba(0, 0, 0, 0.25); /* Darker transparent background for cards */
  color: #FDFDFD; /* Changed to FDFDFD */
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
  color: #FDFDFD !important; /* Changed to FDFDFD */
}

/* You can still add subtle variations if desired, e.g., slightly different shades on hover or with borders */
.card.bg-primary { border-left: 5px solid #a64dff; } /* Example: a lighter purple border */
.card.bg-success { border-left: 5px solid #00cc66; } /* Example: green border for success */
.card.bg-warning { border-left: 5px solid #fc0; } /* Example: accent yellow border for warning */
.card.bg-info { border-left: 5px solid #008cba; } /* Example: blue border for info */


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
  color: #FDFDFD; /* Ensure table text is FDFDFD */
}

.table-dark {
  background-color: #4d0073; /* Darker purple for table header */
  color: #FDFDFD; /* Ensure header text is FDFDFD */
}

.table-striped > tbody > tr:nth-of-type(odd) {
  background-color: rgba(255, 255, 255, 0.08); /* Slightly more visible stripe */
}

/* Crucial: Ensure all TD elements in the table body are FDFDFD */
.table tbody td {
  color: #FDFDFD !important; /* Force FDFDFD color for all table body cells */
}

/* Text for the "Belum ada data hari ini." message */
.table .text-muted {
  color: #ccc !important; /* Keep it slightly muted for informational text */
}


/* Activity Log */
.list-group-item {
  background-color: transparent !important; /* Removed background for list items */
  color: #FDFDFD; /* Ensure list item text is FDFDFD */
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
  color: #FDFDFD !important; /* Ensure FDFDFD text on gray */
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