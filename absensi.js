// js/absensi.js

const AbsensiApp = {
    init() {
        document.getElementById('tanggal').value = App.getCurrentDate();
        document.getElementById('tanggal').addEventListener('change', () => this.loadMurid());
        this.populateKelas();
    },

    populateKelas() {
        const murids = Storage.getMurid();
        const classes = [...new Set(murids.map(m => m.kelas))].sort();
        const select = document.getElementById('kelas');
        
        classes.forEach(c => {
            const option = document.createElement('option');
            option.value = c;
            option.textContent = c;
            select.appendChild(option);
        });
        
        if(classes.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
            document.getElementById('emptyState').innerHTML = '<p>Belum ada data kelas. Silakan tambah data murid terlebih dahulu.</p>';
        } else {
            document.getElementById('emptyState').style.display = 'block';
        }
    },

    loadMurid() {
        const kelas = document.getElementById('kelas').value;
        const tanggal = document.getElementById('tanggal').value;
        const formContainer = document.getElementById('formContainer');
        const emptyState = document.getElementById('emptyState');

        if (!kelas || !tanggal) {
            formContainer.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        const allMurid = Storage.getMurid();
        const classMurid = allMurid.filter(m => m.kelas === kelas);
        
        if (classMurid.length === 0) {
            formContainer.style.display = 'none';
            emptyState.style.display = 'block';
            emptyState.innerHTML = '<p>Tidak ada murid di kelas ini.</p>';
            return;
        }

        // Get existing absensi for this date
        const allAbsensi = Storage.getAbsensi();
        const todayAbsensi = allAbsensi.filter(a => a.date === tanggal);

        document.getElementById('classTitle').textContent = `Daftar Murid Kelas ${kelas}`;
        const tbody = document.querySelector('#absensiTable tbody');
        tbody.innerHTML = '';

        classMurid.forEach((murid, index) => {
            const existingRecord = todayAbsensi.find(a => a.muridId === murid.id);
            const status = existingRecord ? existingRecord.status : 'H'; // Default Hadir
            const ket = existingRecord ? existingRecord.keterangan : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${murid.nis}</td>
                <td>${murid.nama}</td>
                <td>
                    <div class="status-radios" data-murid="${murid.id}">
                        <label>
                            <input type="radio" name="status_${murid.id}" value="H" ${status === 'H' ? 'checked' : ''} required>
                            <span class="status-btn">Hadir</span>
                        </label>
                        <label>
                            <input type="radio" name="status_${murid.id}" value="S" ${status === 'S' ? 'checked' : ''}>
                            <span class="status-btn">Sakit</span>
                        </label>
                        <label>
                            <input type="radio" name="status_${murid.id}" value="I" ${status === 'I' ? 'checked' : ''}>
                            <span class="status-btn">Izin</span>
                        </label>
                        <label>
                            <input type="radio" name="status_${murid.id}" value="A" ${status === 'A' ? 'checked' : ''}>
                            <span class="status-btn">Alpha</span>
                        </label>
                    </div>
                </td>
                <td>
                    <input type="text" name="ket_${murid.id}" value="${ket}" placeholder="Catatan opsional..." class="form-control" style="background: rgba(15, 23, 42, 0.3); border-color: rgba(255,255,255,0.05)">
                </td>
            `;
            tbody.appendChild(tr);
        });

        formContainer.style.display = 'block';
        emptyState.style.display = 'none';
    },

    setAll(status) {
        const radios = document.querySelectorAll(`input[type="radio"][value="${status}"]`);
        radios.forEach(radio => {
            radio.checked = true;
        });
    },

    saveAbsensi(e) {
        e.preventDefault();
        
        const tanggal = document.getElementById('tanggal').value;
        const kelas = document.getElementById('kelas').value;
        
        const rows = document.querySelectorAll('.status-radios');
        const records = [];
        
        rows.forEach(div => {
            const muridId = div.dataset.murid;
            const status = document.querySelector(`input[name="status_${muridId}"]:checked`).value;
            const keterangan = document.querySelector(`input[name="ket_${muridId}"]`).value;
            
            records.push({ muridId, status, keterangan });
        });
        
        try {
            Storage.saveBulkAbsensi(tanggal, kelas, records);
            App.showToast(`Absensi kelas ${kelas} berhasil disimpan`);
        } catch (error) {
            App.showToast('Terjadi kesalahan saat menyimpan', 'danger');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AbsensiApp.init();
});
