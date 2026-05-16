// js/murid.js

const MuridApp = {
    init() {
        this.renderTable();
        this.updateFilterOptions();
    },

    renderTable() {
        const tbody = document.querySelector('#muridTable tbody');
        let murids = Storage.getMurid();
        
        // Apply filters
        const search = document.getElementById('searchInput').value.toLowerCase();
        const kelas = document.getElementById('filterKelas').value;

        if (search) {
            murids = murids.filter(m => 
                m.nis.toLowerCase().includes(search) || 
                m.nama.toLowerCase().includes(search)
            );
        }
        if (kelas) {
            murids = murids.filter(m => m.kelas === kelas);
        }

        tbody.innerHTML = '';

        if (murids.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data murid.</td></tr>';
            return;
        }

        murids.forEach((murid, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${murid.nis}</td>
                <td>${murid.nama}</td>
                <td>${murid.kelas}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="MuridApp.editMurid('${murid.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="MuridApp.deleteMurid('${murid.id}')">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    updateFilterOptions() {
        const filter = document.getElementById('filterKelas');
        const currentVal = filter.value;
        const murids = Storage.getMurid();
        const classes = [...new Set(murids.map(m => m.kelas))].sort();
        
        let html = '<option value="">Semua Kelas</option>';
        classes.forEach(c => {
            html += `<option value="${c}">${c}</option>`;
        });
        
        filter.innerHTML = html;
        filter.value = currentVal; // Restore selection
    },

    resetForm() {
        document.getElementById('muridForm').reset();
        document.getElementById('muridId').value = '';
        document.getElementById('modalTitle').textContent = 'Tambah Murid';
    },

    saveMurid(e) {
        e.preventDefault();
        
        const id = document.getElementById('muridId').value;
        const data = {
            nis: document.getElementById('nis').value,
            nama: document.getElementById('nama').value,
            kelas: document.getElementById('kelas').value
        };

        try {
            if (id) {
                Storage.updateMurid(id, data);
                App.showToast('Data murid berhasil diupdate');
            } else {
                Storage.addMurid(data);
                App.showToast('Murid berhasil ditambahkan');
            }
            App.closeModal('muridModal');
            this.renderTable();
            this.updateFilterOptions();
        } catch (error) {
            App.showToast(error.message, 'danger');
        }
    },

    editMurid(id) {
        const murids = Storage.getMurid();
        const murid = murids.find(m => m.id === id);
        
        if (murid) {
            document.getElementById('muridId').value = murid.id;
            document.getElementById('nis').value = murid.nis;
            document.getElementById('nama').value = murid.nama;
            document.getElementById('kelas').value = murid.kelas;
            document.getElementById('modalTitle').textContent = 'Edit Murid';
            App.openModal('muridModal');
        }
    },

    deleteMurid(id) {
        if (confirm('Apakah Anda yakin ingin menghapus data murid ini? Semua data absensi terkait juga akan terhapus.')) {
            Storage.deleteMurid(id);
            App.showToast('Data murid berhasil dihapus');
            this.renderTable();
            this.updateFilterOptions();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    MuridApp.init();
});
