// js/laporan.js

const LaporanApp = {
    init() {
        const date = new Date();
        document.getElementById('bulan').value = date.getMonth() + 1;
        
        this.populateTahun();
        this.populateKelas();
        this.generateReport();
    },

    populateTahun() {
        const currentYear = new Date().getFullYear();
        const select = document.getElementById('tahun');
        for (let i = currentYear - 2; i <= currentYear + 1; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i === currentYear) option.selected = true;
            select.appendChild(option);
        }
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
    },

    generateReport() {
        const month = document.getElementById('bulan').value;
        const year = document.getElementById('tahun').value;
        const kelas = document.getElementById('kelas').value;
        
        // Update print header
        const monthName = document.getElementById('bulan').options[document.getElementById('bulan').selectedIndex].text;
        document.getElementById('printPeriod').textContent = `Periode: ${monthName} ${year} ${kelas ? '- Kelas ' + kelas : ''}`;

        let stats = Storage.getStats(month, year);

        if (kelas) {
            stats = stats.filter(s => s.kelas === kelas);
        }

        const tbody = document.querySelector('#reportTable tbody');
        const emptyDiv = document.getElementById('emptyReport');
        tbody.innerHTML = '';

        if (stats.length === 0 || stats.every(s => s.stats.totalDays === 0)) {
            emptyDiv.style.display = 'block';
            return;
        }

        emptyDiv.style.display = 'none';

        stats.forEach((murid, index) => {
            const st = murid.stats;
            
            // Format badges for status
            const hBadge = `<span class="badge badge-H">${st.hadir}</span>`;
            const sBadge = `<span class="badge badge-S">${st.sakit}</span>`;
            const iBadge = `<span class="badge badge-I">${st.izin}</span>`;
            const aBadge = `<span class="badge badge-A">${st.alpha}</span>`;
            
            let pColor = '';
            if (st.persentase >= 90) pColor = 'color: var(--success)';
            else if (st.persentase >= 75) pColor = 'color: var(--warning)';
            else pColor = 'color: var(--danger); font-weight: bold;';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${murid.nis}</td>
                <td>${murid.nama}</td>
                <td>${murid.kelas}</td>
                <td class="text-center">${hBadge}</td>
                <td class="text-center">${sBadge}</td>
                <td class="text-center">${iBadge}</td>
                <td class="text-center">${aBadge}</td>
                <td class="text-center" style="${pColor}">${st.persentase}%</td>
            `;
            tbody.appendChild(tr);
        });
    },

    exportCSV() {
        const month = document.getElementById('bulan').value;
        const year = document.getElementById('tahun').value;
        const kelas = document.getElementById('kelas').value;
        
        let stats = Storage.getStats(month, year);
        if (kelas) {
            stats = stats.filter(s => s.kelas === kelas);
        }

        if (stats.length === 0 || stats.every(s => s.stats.totalDays === 0)) {
            App.showToast('Tidak ada data untuk diexport', 'warning');
            return;
        }

        // CSV Header
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "NIS,Nama,Kelas,Hadir,Sakit,Izin,Alpha,Persentase(%)\n";

        stats.forEach(murid => {
            const st = murid.stats;
            const row = [
                `"${murid.nis}"`, // wrap in quotes to prevent scientific notation in excel for long numbers
                `"${murid.nama}"`,
                `"${murid.kelas}"`,
                st.hadir,
                st.sakit,
                st.izin,
                st.alpha,
                st.persentase
            ].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Rekap_Absensi_${year}_${month}${kelas ? '_'+kelas : ''}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    LaporanApp.init();
});
