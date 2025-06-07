<template>
  <!-- Header -->
  <header>
    <div class="container-fluid">
      <div class="row">
        <div class="col-5">
          <a href="#"
            ><img src="/src/assets/img/logo.svg" alt="" width="50" height="55"
          /></a>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <div class="wrapper_centering">
    <div class="container_centering">
      <div class="container">
        <div class="row justify-content-between">
          <div class="col-xl-6 col-lg-6 d-flex-start">
            <div class="main_title_1">
              <h3>SIPATUH</h3>
              <p>
                SIPATUH 'Sistem Parkir Tertib untuk Umat HMTB' adalah aplikasi
                yang dirancang untuk membantu mengatur dan memantau sistem
                parkir secara tertib dan efisien bagi umat HMTB. Aplikasi ini
                memudahkan umat dalam memperoleh informasi parkir, mencatat
                kendaraan, serta memastikan keteraturan parkir saat kegiatan
                berlangsung, sehingga menciptakan lingkungan yang lebih aman,
                nyaman, dan tertib.
              </p>
              <p><em>- OMK HMTB Cicurug</em></p>
            </div>
          </div>

          <div class="col-xl-5 col-lg-5">
            <div id="wizard_container">
              <nav>
                <div class="nav nav-tabs" id="nav-tab" role="tablist">
                  <button
                    class="nav-link active"
                    id="nav-masuk-tab"
                    data-bs-toggle="tab"
                    data-bs-target="#nav-masuk"
                    type="button"
                    role="tab"
                    aria-controls="nav-masuk"
                    aria-selected="true"
                  >
                    Parkir Masuk
                  </button>
                  <button
                    class="nav-link"
                    id="nav-keluar-tab"
                    data-bs-toggle="tab"
                    data-bs-target="#nav-keluar"
                    type="button"
                    role="tab"
                    aria-controls="nav-keluar"
                    aria-selected="false"
                  >
                    Parkir Keluar
                  </button>
                </div>
              </nav>
              <div class="tab-content" id="nav-tabContent">
                <div
                  class="tab-pane fade show active"
                  id="nav-masuk"
                  role="tabpanel"
                  aria-labelledby="nav-masuk-tab"
                >
                  <form
                    id="wrapped"
                    @submit.prevent="handleSubmit"
                    autocomplete="off"
                    style="margin-bottom: 24px; height: 100%; width: 100%"
                  >
                    <input id="website" name="website" type="text" value="" />

                    <div id="middle-wizard">
                      <div class="submit step">
                        <h3 class="main_question">
                          <strong>Masukan Kendaraan</strong>Harap Isi Detail
                          Kendaraan yang Masuk
                        </h3>

                        <div class="form-group">
                          <label for="nomortiket">Nomor Tiket Keluar</label>
                          <input
                            type="number"
                            id="nomortiket"
                            v-model="form.nomortiket"
                            class="form-control"
                            min="0"
                            @input="validateNomorTiket"
                            @keypress="preventNonNumeric"
                            pattern="[0-9]*"
                            inputmode="numeric"
                            placeholder="Hanya angka"
                          />
                          <small v-if="ticketError" class="text-danger">{{
                            ticketError
                          }}</small>
                        </div>

                        <div class="form-group">
                          <label for="platnomor">Plat Nomor</label>
                          <input
                            type="text"
                            id="platnomor"
                            v-model="form.platnomor"
                            class="form-control"
                          />
                        </div>
                        <div class="form-group">
                          <label for="pilihfoto">Unggah foto dari galeri</label>
                          <div class="input-group">
                            <input
                              type="file"
                              id="pilihfoto"
                              accept="image/*"
                              class="form-control d-none"
                              @change="handleImageUpload"
                              ref="fileInput"
                            />
                            <div class="input-group-append w-100">
                              <button
                                type="button"
                                class="form-control w-100 d-flex align-items-center justify-content-right"
                                @click="triggerFileInput"
                                style="height: 48px"
                              >
                                <i
                                  class="fas fa-image mr-2"
                                  style="color: aliceblue"
                                ></i>
                                Pilih Foto
                              </button>
                            </div>
                            <small
                              class="form-text text-muted w-100"
                              v-if="selectedFileName"
                            >
                              File terpilih: {{ selectedFileName }}
                            </small>
                          </div>
                        </div>
                        <div class="form-group">
                          <label>Deteksi Plat Nomor via Kamera</label><br />
                          <small
                            >Kamera akan diaktifkan untuk mendeteksi plat
                            nomor.</small
                          ><br />
                          <video
                            id="video"
                            width="100%"
                            height="240"
                            autoplay
                            muted
                            playsinline
                            style="margin-top: 10px"
                          ></video
                          ><br />
                          <div style="text-align: center; margin-top: 10px">
                            <button
                              type="button"
                              class="submit-secondary"
                              @click="capturePlate"
                            >
                              <i
                                class="fas fa-camera"
                                style="color: #ffcc00"
                              ></i>
                              Ambil & Deteksi Plat Nomor
                            </button>
                          </div>
                          <canvas ref="canvas" style="display: none"></canvas>
                        </div>

                        <div class="form-group" v-if="apiStatus">
                          <label>Status API:</label>
                          <div
                            :class="
                              apiStatus.success ? 'text-success' : 'text-danger'
                            "
                          >
                            {{ apiStatus.message }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div id="bottom-wizard">
                      <button
                        type="submit"
                        class="submit"
                        :disabled="!isFormValid"
                        data-form-type="formMasuk"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
                <div
                  class="tab-pane fade"
                  id="nav-keluar"
                  role="tabpanel"
                  aria-labelledby="nav-keluar-tab"
                >
                  <form
                    id="wrapped"
                    @submit.prevent="handleSubmit"
                    autocomplete="off"
                    style="margin-bottom: 24px; height: 100%; width: 100%"
                  >
                    <input id="website" name="website" type="text" value="" />
                    <div id="middle-wizard">
                      <div class="submit step">
                        <h3 class="main_question">
                          <strong>Keluarkan Kendaraan</strong>Harap Isi Detail
                          Kendaraan yang Keluar
                        </h3>

                        <div class="form-group">
                          <label for="nomortiket">Nomor Tiket Keluar</label>
                          <input
                            type="number"
                            id="nomortiket"
                            v-model="form.nomortiket"
                            class="form-control"
                            min="0"
                            @input="validateNomorTiket"
                            @keypress="preventNonNumeric"
                            pattern="[0-9]*"
                            inputmode="numeric"
                            placeholder="Hanya angka"
                          />
                          <small v-if="ticketError" class="text-danger">{{
                            ticketError
                          }}</small>
                        </div>
                      </div>
                    </div>
                    <div id="bottom-wizard">
                      <button
                        type="submit"
                        class="submit"
                        data-form-type="formKeluar"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <!-- /col -->
        </div>
        <!-- /row -->
      </div>
      <!-- /container -->
    </div>
    <!-- /container_centering -->
  </div>
  <!-- /wrapper_centering -->
  <div>
    <footer>
      <div class="container-fluid">
        <div class="row">
          <div
            class="col-md-3"
            style="
              display: flex;
              align-items: center;
              text-align: left;
              height: 100%;
              margin-top: 6px;
              margin-bottom: 6px;
            "
          >
            ©2025 Glorian Hilarius - Built with Vue and Flask
          </div>
        </div>
        <!-- /row -->
      </div>
      <!-- /container-fluid -->
    </footer>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import Swal from "sweetalert2";
// Import FontAwesome icons
import "@fortawesome/fontawesome-free/css/all.min.css";

import Dexie from "dexie";

const db = new Dexie("ParkirDB");
db.version(1).stores({
  parkirMasuk: "++id, nomortiket, platnomor, tanggal, isKeluar",
  parkirKeluar: "++id, nomortiket, tanggal",
});

export default {
  name: "ParkingForm",
  setup() {
    const form = ref({
      nomortiket: "",
      platnomor: "",
      formType: "formMasuk", // Default to entry form
    });
    const videoStream = ref(null);
    const ticketError = ref("");
    const canvas = ref(null);
    const plateNumber = ref("");
    const selectedImage = ref(null);
    const selectedFileName = ref("");
    const fileInput = ref(null);
    const apiStatus = ref(null);
    const isLoading = ref(false);

    const isFormValid = computed(() => {
      // Different validation rules based on form type
      if (form.value.formType === "formKeluar") {
        return form.value.nomortiket && !ticketError.value;
      } else {
        // For entry form (formMasuk), require both fields
        return (
          form.value.nomortiket && form.value.platnomor && !ticketError.value
        );
      }
    });

    const validateNomorTiket = (event) => {
      console.log("Validating nomor tiket:", event.target.value);
      // Stronger validation
      const value = event.target.value;

      // Check if there's any non-numeric character
      if (/\D/.test(value)) {
        ticketError.value = "Hanya masukkan angka";
        console.warn("Validation error: Non-numeric characters detected");
        // Clean up any non-numeric characters
        form.value.nomortiket = value.replace(/\D/g, "");
      } else {
        ticketError.value = "";
        console.log("Nomor tiket valid:", value);
      }
    };

    const preventNonNumeric = (event) => {
      // Prevent input of non-numeric characters
      const charCode = event.which ? event.which : event.keyCode;
      if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        console.warn("Prevented non-numeric input:", charCode);
        event.preventDefault();
        return false;
      }
      return true;
    };

    const initCamera = () => {
      // Only initialize camera for entry form
      if (form.value.formType === "formKeluar") {
        console.log("Skipping camera initialization for exit form");
        return;
      }

      console.log("Initializing camera...");
      const video = document.getElementById("video");
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log("Camera API available, requesting permissions...");
        navigator.mediaDevices;
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: "environment" } })
          .then((stream) => {
            console.log("Camera permission granted, stream active");
            videoStream.value = stream;
            video.srcObject = stream;
          })
          .catch((err) => {
            console.error("Failed to access camera:", err);
            Swal.fire({
              icon: "error",
              title: "Akses Kamera Gagal",
              text: "Izin kamera ditolak atau tidak tersedia.",
              confirmButtonText: "Tutup",
            });
          });
      } else {
        console.error("getUserMedia API not supported in this browser");
        Swal.fire({
          icon: "error",
          title: "Browser Tidak Didukung",
          text: "Peramban Anda tidak mendukung akses kamera.",
          confirmButtonText: "Tutup",
        });
      }
    };

    // Function to resize image to 640x640
    const resizeImageTo640x640 = (originalCanvas) => {
      console.log("Resizing image to 640x640...");
      const resizeCanvas = document.createElement("canvas");
      const resizeContext = resizeCanvas.getContext("2d");

      // Set canvas dimensions to 640x640
      resizeCanvas.width = 640;
      resizeCanvas.height = 640;

      // Calculate aspect ratio to maintain proportions
      const originalWidth = originalCanvas.width;
      const originalHeight = originalCanvas.height;
      const aspectRatio = originalWidth / originalHeight;

      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      // Determine dimensions for centered crop
      if (aspectRatio > 1) {
        // Original is wider than tall
        drawHeight = 640;
        drawWidth = drawHeight * aspectRatio;
        offsetX = -(drawWidth - 640) / 2;
      } else {
        // Original is taller than wide
        drawWidth = 640;
        drawHeight = drawWidth / aspectRatio;
        offsetY = -(drawHeight - 640) / 2;
      }

      // Fill with black background to ensure we have a 640x640 image
      resizeContext.fillStyle = "#000000";
      resizeContext.fillRect(0, 0, 640, 640);

      // Draw the image centered
      resizeContext.drawImage(
        originalCanvas,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight
      );

      console.log("Image resized to 640x640");
      return resizeCanvas;
    };

    // Function to convert canvas to base64 image data (for storing in Google Sheets)
    const canvasToBase64 = (canvas) => {
      return canvas.toDataURL("image/jpeg", 0.7);
    };

    const capturePlate = async () => {
      // Should only be called when in entry form mode
      if (form.value.formType === "formKeluar") {
        console.warn("Capture plate attempted in exit form mode");
        return;
      }

      console.log("Capturing plate image...");
      const video = document.getElementById("video");
      const canvasElement = canvas.value;

      if (video && canvasElement) {
        console.log(
          "Video dimensions:",
          video.videoWidth,
          "x",
          video.videoHeight
        );
        const context = canvasElement.getContext("2d");
        canvasElement.width = video.videoWidth;
        canvasElement.height = video.videoHeight;
        context.drawImage(
          video,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );
        console.log("Image captured to canvas");

        // Resize the image to 640x640
        const resizedCanvas = resizeImageTo640x640(canvasElement);

        // Show loading indicator using SweetAlert2
        Swal.fire({
          title: "Memproses...",
          text: "Sedang mendeteksi plat nomor",
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // Convert resized canvas to blob for API request
        resizedCanvas.toBlob(async (blob) => {
          if (blob) {
            console.log("Image converted to blob, size:", blob.size, "bytes");
            selectedImage.value = blob;

            // Store the base64 image data for submission to Google Sheets
            const base64Image = canvasToBase64(resizedCanvas);
            selectedImage.base64 = base64Image;

            // Proceed directly to plate detection
            try {
              await handlePlateDetection(blob);
            } catch (error) {
              console.error("Error in capture and detect flow:", error);
              Swal.fire({
                icon: "error",
                title: "Error",
                text: "Terjadi kesalahan saat memproses gambar.",
                confirmButtonText: "Tutup",
              });
            }
          } else {
            console.error("Failed to create blob from canvas");
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Gagal memproses gambar dari kamera.",
              confirmButtonText: "Tutup",
            });
          }
        });
      } else {
        console.error("Video or canvas element not found", {
          video: !!video,
          canvas: !!canvasElement,
        });
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Komponen kamera tidak ditemukan.",
          confirmButtonText: "Tutup",
        });
      }
    };

    // Updated handleSubmit function in the setup() method
    // Replace the existing handleSubmit function with this one

    const handleSubmit = async () => {
      Swal.fire({
        title: "Memproses...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const today = new Date();
        const tanggal = today.toISOString().split("T")[0];
        const formType = form.value.formType;
        const nomortiket = form.value.nomortiket;

        if (!/^\d+$/.test(nomortiket)) {
          ticketError.value = "Nomor tiket harus berupa angka";
          Swal.close();
          return;
        }

        let response;
        if (formType === "formMasuk") {
          const platnomor = form.value.platnomor || "";

          response = await fetch(
            "https://sipatuh.domcloud.dev/api/parkirMasuk",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nomortiket, platnomor, tanggal }),
            }
          );
        } else if (formType === "formKeluar") {
          response = await fetch(
            "https://sipatuh.domcloud.dev/api/parkirKeluar",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nomortiket, tanggal }),
            }
          );
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Gagal memproses data");
        }

        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text:
            formType === "formKeluar"
              ? "Data keluar ditambahkan dan status masuk diupdate."
              : "Data masuk berhasil ditambahkan.",
        });

        // Reset form
        form.value.nomortiket = "";
        if (formType === "formMasuk") form.value.platnomor = "";
        ticketError.value = "";
        apiStatus.value = null;
        selectedImage.value = null;
        selectedFileName.value = "";
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message,
        });
      }
    };

    const generateUniqueId = async (existingIds) => {
      const numericIds = existingIds.map(Number).filter((id) => !isNaN(id));
      return numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
    };

    const triggerFileInput = () => {
      fileInput.value.click();
    };

    // Function to resize uploaded images
    const resizeUploadedImage = (file) => {
      return new Promise((resolve, reject) => {
        console.log("Resizing uploaded image...");
        const img = new Image();
        img.onload = () => {
          // Create a canvas to draw the uploaded image
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          const tempCtx = tempCanvas.getContext("2d");
          tempCtx.drawImage(img, 0, 0);

          // Now resize to 640x640
          const resizedCanvas = resizeImageTo640x640(tempCanvas);

          // Store the base64 data
          const base64Image = canvasToBase64(resizedCanvas);

          // Convert to blob and resolve
          resizedCanvas.toBlob((blob) => {
            if (blob) {
              console.log("Upload resized successfully to 640x640");
              // Add base64 data to the blob object for later use
              blob.base64 = base64Image;
              resolve(blob);
            } else {
              console.error("Failed to create blob from resized image");
              reject(new Error("Failed to create blob from resized image"));
            }
          });
        };

        img.onerror = (err) => {
          console.error("Error loading image for resizing:", err);
          reject(new Error("Failed to load image for resizing"));
        };

        // Create URL from the file and set as img source
        img.src = URL.createObjectURL(file);
      });
    };

    const handleImageUpload = async (event) => {
      // Should only be called when in entry form mode
      if (form.value.formType === "formKeluar") {
        console.warn("Image upload attempted in exit form mode");
        return;
      }

      console.log("Handling image upload...");
      const file = event.target.files[0];
      if (file) {
        console.log("File selected:", file.name, file.type, file.size, "bytes");
        selectedFileName.value = file.name;

        // Show loading dialog
        Swal.fire({
          title: "Memproses...",
          text: "Sedang mendeteksi plat nomor dari foto yang diunggah",
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        try {
          // Resize the uploaded image to 640x640
          const resizedBlob = await resizeUploadedImage(file);
          selectedImage.value = resizedBlob;

          // Save the base64 representation for Google Sheets submission
          selectedImage.base64 = resizedBlob.base64;

          // Process the resized image with API
          await handlePlateDetection(resizedBlob);
        } catch (error) {
          console.error("Error processing uploaded image:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Terjadi kesalahan saat memproses gambar.",
            confirmButtonText: "Tutup",
          });
        }
      }
    };

    // Function to format and validate license plate numbers
    const formatPlateNumber = (rawPlate) => {
      if (!rawPlate) return "";

      // Remove all spaces and convert to uppercase
      let cleaned = rawPlate.toUpperCase().replace(/\s+/g, "");

      // Create regex to match the pattern: up to 2 letters, up to 4 numbers, up to 3 letters
      const platePattern = /^([A-Z]{1,2})([0-9]{1,4})([A-Z]{0,3})$/;
      const match = cleaned.match(platePattern);

      if (match) {
        // Format as "XX AAAA XXX" with proper spacing
        const [_, letters1, numbers, letters2] = match;
        const formatted = `${letters1} ${numbers} ${letters2}`.trim();
        console.log("Plate formatted successfully:", formatted);
        return formatted;
      } else {
        console.warn("Plate format doesn't match expected pattern:", cleaned);

        // Try to extract parts based on character types
        let letters1 = "";
        let numbers = "";
        let letters2 = "";
        let parsingStage = 0; // 0: first letters, 1: numbers, 2: second letters

        for (let i = 0; i < cleaned.length; i++) {
          const char = cleaned[i];

          if (/[A-Z]/.test(char)) {
            if (parsingStage === 0) {
              // Still in first letter group
              if (letters1.length < 2) {
                letters1 += char;
              } else {
                parsingStage = 1; // Force move to numbers
                // Since this should be a number but is a letter, we'll skip it
              }
            } else if (parsingStage === 1) {
              // We've seen numbers, so this is the start of the second letter group
              parsingStage = 2;
              letters2 += char;
            } else if (parsingStage === 2) {
              // In second letter group
              if (letters2.length < 3) {
                letters2 += char;
              }
              // Ignore extra letters
            }
          } else if (/[0-9]/.test(char)) {
            if (parsingStage === 0 || parsingStage === 1) {
              // In first letters or numbers stage
              if (parsingStage === 0) parsingStage = 1; // Move to numbers stage

              if (numbers.length < 4) {
                numbers += char;
              }
              // Ignore extra numbers
            } else {
              // Ignore numbers after second letter group has started
            }
          }
        }

        // Format the best-effort parsed plate
        if (numbers) {
          // At minimum we need some numbers
          const bestEffort = `${letters1} ${numbers} ${letters2}`.trim();
          console.log("Best effort plate formatting:", bestEffort);
          return bestEffort;
        }

        // If we couldn't parse it at all, return original with max 2 spaces
        const parts = cleaned.match(/.{1,4}/g) || [cleaned];
        const basic = parts.join(" ").substring(0, 10);
        console.log("Falling back to basic formatting:", basic);
        return basic;
      }
    };

    // Modify the handlePlateDetection function to use our formatter
    const handlePlateDetection = async (imageBlob) => {
      console.log("Plate detection initiated");
      if (!imageBlob) {
        console.warn("No image provided for plate detection");
        Swal.close();
        return;
      }

      console.log("Preparing form data for API request");
      const formData = new FormData();
      formData.append("image", imageBlob);

      try {
        console.log("Starting API request to detect plate...");
        apiStatus.value = { success: false, message: "Sedang memproses..." };

        const apiUrl = "https://sipatuh-rapi.sgp.dom.my.id/api/deteksi-plat";
        console.log("API URL:", apiUrl);

        console.time("plateDetectionAPI");
        const response = await fetch(apiUrl, {
          method: "POST",
          body: formData,
        });
        console.timeEnd("plateDetectionAPI");

        console.log("API Response status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("API Response data:", JSON.stringify(result));

        if (result.detected_plates && result.detected_plates.length > 0) {
          const rawPlateText = result.detected_plates[0].plate_text;
          console.log("Raw plate detected:", rawPlateText);

          // Format the plate number according to our specifications
          const formattedPlate = formatPlateNumber(rawPlateText);
          plateNumber.value = formattedPlate;
          form.value.platnomor = formattedPlate;

          console.log("Plate detected and formatted:", formattedPlate);
          apiStatus.value = {
            success: true,
            message: `Plat terdeteksi: ${formattedPlate}`,
          };

          // Close the SweetAlert loading and show success
          Swal.fire({
            icon: "success",
            title: "Deteksi Berhasil!",
            text: `Plat nomor terdeteksi: ${formattedPlate}`,
            confirmButtonText: "OK",
          });
        } else {
          console.warn("No plates detected in the image");
          apiStatus.value = {
            success: false,
            message: "Plat nomor tidak terdeteksi",
          };

          Swal.fire({
            icon: "warning",
            title: "Tidak Terdeteksi",
            text: "Plat nomor tidak dapat terdeteksi. Silakan coba lagi dengan gambar yang lebih jelas.",
            confirmButtonText: "Tutup",
          });
        }
      } catch (error) {
        console.error("Error during plate detection:", error);
        apiStatus.value = {
          success: false,
          message: `Error: ${error.message}`,
        };

        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Terjadi kesalahan saat memproses gambar.",
          confirmButtonText: "Tutup",
        });
      }
    };

    // Add a function to manually format and validate plate input
    const validateAndFormatPlateInput = (event) => {
      console.log(
        "Validating and formatting manual plate input:",
        event.target.value
      );
      const input = event.target.value;

      // Don't format if the user is still typing (less than 3 characters)
      if (input.length < 3) return;

      // Format the plate input
      const formatted = formatPlateNumber(input);

      // Only update if the format has changed to avoid cursor jump issues
      if (formatted !== input) {
        form.value.platnomor = formatted;
      }
    };

    // Function to toggle between entry and exit forms
    const switchFormType = (type) => {
      console.log(`Switching form type to: ${type}`);

      // Reset form fields and validation
      form.value.nomortiket = "";
      form.value.platnomor = "";
      ticketError.value = "";
      apiStatus.value = null;
      selectedImage.value = null;
      selectedFileName.value = "";

      // Set the form type
      form.value.formType = type;

      // Show/hide the appropriate form elements based on the type
      const showForm = () => {
        // Find the active tab pane
        const activePane = document.querySelector(".tab-pane.active");
        if (activePane) {
          // Find the form step element inside the active pane
          const formStep = activePane.querySelector(".wizard-step");
          if (formStep) {
            // Remove the display:none style to make the form visible
            formStep.style.display = "block";
            console.log(`Made form visible in ${activePane.id}`);
          } else {
            console.warn("Could not find form step in active tab pane");
          }
        } else {
          console.warn("Could not find active tab pane");
        }
      };

      // Short delay to ensure DOM is updated after tab switch
      setTimeout(showForm, 50);

      // If switching to entry form, initialize camera
      if (type === "formMasuk") {
        initCamera();
      } else if (type === "formKeluar" && videoStream.value) {
        // If switching to exit form, stop camera if it's running
        videoStream.value.getTracks().forEach((track) => {
          track.stop();
          console.log("Track stopped due to form type change:", track.kind);
        });
        videoStream.value = null;
      }
    };

    onMounted(() => {
      window.onload = () => {
        console.log("Welcome");
      };
      document.body.classList.add("style_2");

      console.log("Initializing camera on component mount");
      // Only initialize camera if we're in entry form mode
      if (form.value.formType === "formMasuk") {
        initCamera();
      }

      // Inisialisasi Bootstrap tabs
      const tabElms = document.querySelectorAll('button[data-bs-toggle="tab"]');
      tabElms.forEach((tab) => {
        tab.addEventListener("click", function (event) {
          event.preventDefault();
          const bsTab = new bootstrap.Tab(this);
          bsTab.show();

          // If this tab controls form type, update accordingly
          if (this.getAttribute("data-form-type")) {
            switchFormType(this.getAttribute("data-form-type"));
          } else if (
            this.getAttribute("id") === "nav-keluar-tab" ||
            this.getAttribute("aria-controls") === "nav-keluar"
          ) {
            // Special handling for exit tab based on the HTML structure provided
            switchFormType("formKeluar");
          } else if (
            this.getAttribute("id") === "nav-masuk-tab" ||
            this.getAttribute("aria-controls") === "nav-masuk"
          ) {
            // Special handling for entry tab based on HTML naming convention
            switchFormType("formMasuk");
          }
        });
      });

      // Check initial active tab on load and set form type accordingly
      const checkInitialTab = () => {
        // See if exit tab is already active
        const activeExitTab = document.querySelector(
          "#nav-keluar.active, #nav-keluar.show"
        );
        if (activeExitTab) {
          console.log(
            "Exit tab is initially active, setting form type to exit"
          );
          switchFormType("formKeluar");
        }
      };

      // Wait for DOM to be fully loaded
      setTimeout(checkInitialTab, 100);

      console.log("Setting up window load event handler");
      window.addEventListener("load", () => {
        console.log("Window loaded, hiding preloaders");
        const loader = document.querySelector('[data-loader="circle-side"]');
        if (loader) {
          loader.style.display = "none";
          console.log("Main preloader hidden");
        } else {
          console.warn("Main preloader element not found");
        }

        const loaderForm = document.getElementById("loader_form");
        if (loaderForm) {
          loaderForm.style.display = "none";
          console.log("Form loader hidden");
        } else {
          console.warn("Form loader element not found");
        }

        document.body.style.overflow = "visible";
        console.log("Body overflow set to visible");

        // Check active tab again after window load
        checkInitialTab();
      });
    });

    onBeforeUnmount(() => {
      console.log("Component unmounting, cleaning up resources");
      document.body.classList.remove("style_2");

      if (videoStream.value) {
        console.log("Stopping video stream tracks");
        videoStream.value.getTracks().forEach((track) => {
          track.stop();
          console.log("Track stopped:", track.kind);
        });
      }

      console.log("Component cleanup complete");
    });

    return {
      form,
      ticketError,
      canvas,
      fileInput,
      selectedFileName,
      apiStatus,
      isFormValid,
      isLoading,
      validateNomorTiket,
      preventNonNumeric,
      capturePlate,
      handleImageUpload,
      triggerFileInput,
      handleSubmit,
      validateAndFormatPlateInput,
      switchFormType,
    };
  },
};
</script>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
.text-success {
  color: #28a745;
}
.text-danger {
  color: #dc3545;
}
.mr-2 {
  margin-right: 0.5rem;
}
.w-100 {
  width: 100%;
}
.d-none {
  display: none;
}
.d-flex {
  display: flex;
}
.align-items-center {
  align-items: center;
}
.justify-content-center {
  justify-content: center;
}
</style>
