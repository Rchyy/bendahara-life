import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot
  } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

  // =============================
  // KONFIGURASI FIREBASE
  // =============================
  const firebaseConfig = {
    apiKey: "AIzaSyDQ8ZLsK7mywN4tgQRHiL7UUitaQoUcazc",
    authDomain: "bendahara-life-541f5.firebaseapp.com",
    projectId: "bendahara-life-541f5",
    storageBucket: "bendahara-life-541f5.firebasestorage.app",
    messagingSenderId: "27175976100",
    appId: "1:27175976100:web:bd09ea38e22125955f7a31",
    measurementId: "G-XWMVDD6CKP"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const namaBulan = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
                     "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  let dataSiswa = {};
  let dataPemasukan = [];
  let dataPengeluaran = [];

  // =============================
  // SISTEM NOTIFIKASI & ALERT
  // =============================
  
  // Toast Notification
  function showToast(type, title, message) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = '';
    if (type === 'success') icon = '✓';
    else if (type === 'error') icon = '✕';
    else if (type === 'info') icon = 'ℹ';
    
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <span class="toast-close" onclick="this.parentElement.remove()">×</span>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  // Custom Alert
  function showAlert(type, title, message, showCancel = false) {
    return new Promise((resolve) => {
      const overlay = document.getElementById("alertOverlay");
      const header = document.getElementById("alertHeader");
      const icon = document.getElementById("alertIcon");
      const titleEl = document.getElementById("alertTitle");
      const body = document.getElementById("alertBody");
      const okBtn = document.getElementById("alertOkBtn");
      const cancelBtn = document.getElementById("alertCancelBtn");
      
      // Set icon based on type
      let iconClass = '';
      if (type === 'success') iconClass = 'fas fa-check-circle';
      else if (type === 'error') iconClass = 'fas fa-times-circle';
      else if (type === 'info') iconClass = 'fas fa-info-circle';
      else if (type === 'warning') iconClass = 'fas fa-exclamation-triangle';
      
      header.className = `alert-header ${type}`;
      icon.className = `alert-header-icon ${iconClass}`;
      titleEl.textContent = title;
      body.textContent = message;
      
      // Show/hide cancel button
      if (showCancel) {
        cancelBtn.style.display = 'block';
      } else {
        cancelBtn.style.display = 'none';
      }
      
      overlay.style.display = 'block';
      
      // OK button handler
      okBtn.onclick = () => {
        overlay.style.display = 'none';
        resolve(true);
      };
      
      // Cancel button handler
      cancelBtn.onclick = () => {
        overlay.style.display = 'none';
        resolve(false);
      };
      
      // Close on overlay click
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          overlay.style.display = 'none';
          resolve(false);
        }
      };
    });
  }

  // =============================
  // FUNGSI MODAL
  // =============================
  window.bukaModalPemasukan = function() {
    document.getElementById("modalPemasukan").style.display = "block";
  };

  window.tutupModalPemasukan = function() {
    document.getElementById("modalPemasukan").style.display = "none";
  };

  window.bukaModalPengeluaran = function() {
    document.getElementById("modalPengeluaran").style.display = "block";
  };

  window.tutupModalPengeluaran = function() {
    document.getElementById("modalPengeluaran").style.display = "none";
  };

  // Tutup modal jika klik di luar modal
  window.onclick = function(event) {
    const modalPemasukan = document.getElementById("modalPemasukan");
    const modalPengeluaran = document.getElementById("modalPengeluaran");
    
    if (event.target === modalPemasukan) {
      modalPemasukan.style.display = "none";
    }
    if (event.target === modalPengeluaran) {
      modalPengeluaran.style.display = "none";
    }
  };

  // =============================
  // LOAD DATA SISWA
  // =============================
  function loadSiswa() {
    const q = query(collection(db, "siswa"));
    onSnapshot(q, (snapshot) => {
      const siswaSelect = document.getElementById("siswaSelect");
      siswaSelect.innerHTML = '<option value="">-- Pilih Siswa --</option>';
      
      dataSiswa = {};
      snapshot.forEach((docSnap) => {
        const siswa = docSnap.data();
        dataSiswa[docSnap.id] = siswa.nama;
        
        const option = document.createElement("option");
        option.value = docSnap.id;
        option.textContent = siswa.nama;
        siswaSelect.appendChild(option);
      });

      console.log("Data siswa:", dataSiswa);
    }, (error) => {
      console.error("Error loading siswa:", error);
    });
  }

  // =============================
  // LOAD PEMASUKAN
  // =============================
  function loadPemasukan() {
    const q = query(collection(db, "pemasukan"));
    onSnapshot(q, (snapshot) => {
      dataPemasukan = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        dataPemasukan.push({
          id: docSnap.id,
          ...data
        });
        console.log("Pemasukan doc:", docSnap.id, data);
      });
      
      console.log("Total pemasukan dimuat:", dataPemasukan.length);
      renderPemasukan();
      hitungTotal();
    }, (error) => {
      console.error("Error loading pemasukan:", error);
    });
  }

  // =============================
  // RENDER TABEL PEMASUKAN
  // =============================
  function renderPemasukan(filterBulan = "", filterTahun = "") {
    const tbody = document.getElementById("pemasukanBody");
    
    // Kelompokkan data per siswa, bulan, tahun
    const grouped = {};
    
    dataPemasukan.forEach(item => {
      if (filterBulan && item.bulan != filterBulan) return;
      if (filterTahun && item.tahun != filterTahun) return;
      
      const key = `${item.siswaId}-${item.bulan}-${item.tahun}`;
      if (!grouped[key]) {
        grouped[key] = {
          siswaId: item.siswaId,
          bulan: item.bulan,
          tahun: item.tahun,
          minggu: {}
        };
      }
      grouped[key].minggu[item.minggu] = {
        jumlah: item.jumlah,
        keterangan: item.keterangan
      };
    });

    if (Object.keys(grouped).length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>Belum ada data pemasukan${filterBulan || filterTahun ? ' (coba hapus filter)' : ''}</p>
          </td>
        </tr>`;
      return;
    }

    let html = "";
    Object.values(grouped).forEach(group => {
      const namaSiswa = dataSiswa[group.siswaId] || `ID: ${group.siswaId}`;
      
      let total = 0;
      let statusLunas = false;
      
      html += `<tr>`;
      html += `<td>${namaSiswa}</td>`;
      html += `<td>${namaBulan[group.bulan] || group.bulan}</td>`;
      html += `<td>${group.tahun}</td>`;
      
      // Minggu 1-4
      for (let m = 1; m <= 4; m++) {
        const mingguData = group.minggu[m];
        if (mingguData) {
          const keterangan = mingguData.keterangan || "";
          const klass = keterangan === "lunas" ? "lunas" : "bayar";
          html += `<td class="${klass}">Rp ${mingguData.jumlah.toLocaleString('id-ID')}</td>`;
          total += mingguData.jumlah;
          if (keterangan === "lunas") statusLunas = true;
        } else {
          html += `<td>-</td>`;
        }
      }
      
      html += `<td style="font-weight:bold">Rp ${total.toLocaleString('id-ID')}</td>`;
      html += `<td>${statusLunas ? '<span style="color:#2e7d32">✓ LUNAS</span>' : '-'}</td>`;
      html += `</tr>`;
    });
    
    tbody.innerHTML = html;
  }

  // =============================
  // FILTER PEMASUKAN
  // =============================
  window.filterPemasukan = function() {
    const bulan = document.getElementById("filterBulan").value;
    const tahun = document.getElementById("filterTahun").value;
    renderPemasukan(bulan, tahun);
  };

  // =============================
  // LOAD PENGELUARAN
  // =============================
  function loadPengeluaran() {
    const q = query(collection(db, "pengeluaran"));
    onSnapshot(q, (snapshot) => {
      dataPengeluaran = [];
      const tbody = document.getElementById("pengeluaranBody");
      
      if (snapshot.empty) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" class="empty-state">
              <i class="fas fa-inbox"></i>
              <p>Belum ada data pengeluaran</p>
            </td>
          </tr>`;
        hitungTotal();
        return;
      }

      let html = "";
      snapshot.forEach((docSnap) => {
        const item = docSnap.data();
        dataPengeluaran.push({ id: docSnap.id, ...item });
        
        console.log("Pengeluaran doc:", docSnap.id, item);
        
        const tanggal = item.tanggal?.toDate 
          ? item.tanggal.toDate().toLocaleDateString('id-ID')
          : new Date().toLocaleDateString('id-ID');
        
        html += `
          <tr>
            <td style="text-align:left">${item.keterangan || '-'}</td>
            <td>Rp ${(item.jumlah || 0).toLocaleString('id-ID')}</td>
            <td>${tanggal}</td>
            <td>
              <button class="btn-delete" onclick="window.hapusPengeluaran('${docSnap.id}')">
                <i class="fas fa-trash"></i> Hapus
              </button>
            </td>
          </tr>`;
      });
      
      tbody.innerHTML = html;
      hitungTotal();
    }, (error) => {
      console.error("Error loading pengeluaran:", error);
    });
  }

  // =============================
  // TAMBAH PEMASUKAN
  // =============================
  window.tambahPemasukan = async function() {
    const siswaId = document.getElementById("siswaSelect").value;
    const bulan = parseInt(document.getElementById("bulanMasuk").value);
    const tahun = parseInt(document.getElementById("tahunMasuk").value);
    const minggu = parseInt(document.getElementById("mingguMasuk").value);
    const jumlah = parseInt(document.getElementById("jumlahMasuk").value);
    const keterangan = document.getElementById("keteranganMasuk").value;

    if (!siswaId || !jumlah) {
      showAlert('warning', 'Perhatian!', 'Mohon lengkapi semua field!');
      return;
    }

    try {
      await addDoc(collection(db, "pemasukan"), {
        siswaId: siswaId,
        bulan: bulan,
        tahun: tahun,
        minggu: minggu,
        jumlah: jumlah,
        keterangan: keterangan,
        tanggal: new Date()
      });

      const namaSiswa = dataSiswa[siswaId] || 'Siswa';
      showToast('success', 'Pemasukan Berhasil!', `Data pemasukan ${namaSiswa} minggu ${minggu} sebesar Rp ${jumlah.toLocaleString('id-ID')} telah ditambahkan`);
      
      // Reset form dan tutup modal
      document.getElementById("jumlahMasuk").value = "2000";
      document.getElementById("keteranganMasuk").value = "sedekah";
      window.tutupModalPemasukan();
    } catch (error) {
      console.error("Error menambah pemasukan:", error);
      showAlert('error', 'Gagal!', 'Gagal menambah pemasukan: ' + error.message);
    }
  };

  // =============================
  // TAMBAH PENGELUARAN
  // =============================
  window.tambahPengeluaran = async function() {
    const jumlah = parseInt(document.getElementById("jumlahKeluar").value);
    const keterangan = document.getElementById("keteranganKeluar").value.trim();

    if (!keterangan || !jumlah || jumlah <= 0) {
      showAlert('warning', 'Perhatian!', 'Mohon isi keterangan dan jumlah dengan benar!');
      return;
    }

    try {
      await addDoc(collection(db, "pengeluaran"), {
        keterangan: keterangan,
        jumlah: jumlah,
        tanggal: new Date()
      });

      showToast('success', 'Pengeluaran Berhasil!', `Pengeluaran "${keterangan}" sebesar Rp ${jumlah.toLocaleString('id-ID')} telah ditambahkan`);
      
      // Reset form dan tutup modal
      document.getElementById("jumlahKeluar").value = "";
      document.getElementById("keteranganKeluar").value = "";
      window.tutupModalPengeluaran();
    } catch (error) {
      console.error("Error menambah pengeluaran:", error);
      showAlert('error', 'Gagal!', 'Gagal menambah pengeluaran: ' + error.message);
    }
  };

  // =============================
  // HAPUS PENGELUARAN
  // =============================
  window.hapusPengeluaran = async function(id) {
    const confirmed = await showAlert('warning', 'Konfirmasi Hapus', 'Yakin ingin menghapus pengeluaran ini? Tindakan ini tidak dapat dibatalkan.', true);
    
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "pengeluaran", id));
      showToast('success', 'Berhasil Dihapus!', 'Data pengeluaran telah dihapus dari sistem');
    } catch (error) {
      console.error("Error menghapus pengeluaran:", error);
      showAlert('error', 'Gagal!', 'Gagal menghapus pengeluaran: ' + error.message);
    }
  };

  // =============================
  // HITUNG TOTAL
  // =============================
  function hitungTotal() {
    let totalMasuk = 0;
    let totalKeluar = 0;

    dataPemasukan.forEach(item => {
      totalMasuk += item.jumlah || 0;
    });

    dataPengeluaran.forEach(item => {
      totalKeluar += item.jumlah || 0;
    });

    const saldo = totalMasuk - totalKeluar;

    document.getElementById("totalMasuk").innerText = `Rp ${totalMasuk.toLocaleString('id-ID')}`;
    document.getElementById("totalKeluar").innerText = `Rp ${totalKeluar.toLocaleString('id-ID')}`;
    document.getElementById("saldoAkhir").innerText = `Rp ${saldo.toLocaleString('id-ID')}`;
  }

  // =============================
  // INISIALISASI
  // =============================
  function init() {
    const now = new Date();
    const bulanSekarang = now.getMonth() + 1;
    const tahunSekarang = now.getFullYear();
    
    document.getElementById("bulanMasuk").value = bulanSekarang;
    document.getElementById("tahunMasuk").value = tahunSekarang;
    
    
    loadSiswa();
    loadPemasukan();
    loadPengeluaran();
  }

  init();