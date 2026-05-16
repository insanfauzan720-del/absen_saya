// js/storage.js

const Storage = {
    MURID_KEY: 'siabsen_murid',
    ABSENSI_KEY: 'siabsen_absensi',

    // Murid Methods
    getMurid() {
        const data = localStorage.getItem(this.MURID_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveMurid(data) {
        localStorage.setItem(this.MURID_KEY, JSON.stringify(data));
    },

    addMurid(murid) {
        const murids = this.getMurid();
        if (murids.some(m => m.nis === murid.nis)) {
            throw new Error('NIS sudah terdaftar!');
        }
        murid.id = Date.now().toString();
        murids.push(murid);
        this.saveMurid(murids);
        return murid;
    },

    updateMurid(id, updatedMurid) {
        const murids = this.getMurid();
        const index = murids.findIndex(m => m.id === id);
        if (index === -1) throw new Error('Murid tidak ditemukan');
        
        // Check NIS duplicate if NIS changed
        if (murids[index].nis !== updatedMurid.nis) {
            if (murids.some(m => m.nis === updatedMurid.nis)) {
                throw new Error('NIS sudah terdaftar!');
            }
        }
        
        murids[index] = { ...murids[index], ...updatedMurid };
        this.saveMurid(murids);
        return murids[index];
    },

    deleteMurid(id) {
        let murids = this.getMurid();
        murids = murids.filter(m => m.id !== id);
        this.saveMurid(murids);
        
        // Clean up related absensi
        let absensi = this.getAbsensi();
        absensi = absensi.filter(a => a.muridId !== id);
        this.saveAbsensi(absensi);
    },

    // Absensi Methods
    getAbsensi() {
        const data = localStorage.getItem(this.ABSENSI_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveAbsensi(data) {
        localStorage.setItem(this.ABSENSI_KEY, JSON.stringify(data));
    },

    saveBulkAbsensi(date, kelas, records) {
        let allAbsensi = this.getAbsensi();
        
        // Remove existing records for this date and class to allow overwriting
        const murids = this.getMurid().filter(m => m.kelas === kelas);
        const muridIds = murids.map(m => m.id);
        
        allAbsensi = allAbsensi.filter(a => !(a.date === date && muridIds.includes(a.muridId)));
        
        // Add new records
        const newRecords = records.map(r => ({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            date,
            muridId: r.muridId,
            status: r.status,
            keterangan: r.keterangan || ''
        }));
        
        allAbsensi = [...allAbsensi, ...newRecords];
        this.saveAbsensi(allAbsensi);
    },

    // Get absensi stats for reports
    getStats(month, year) {
        const murids = this.getMurid();
        const absensi = this.getAbsensi();
        
        // Filter absensi by month and year
        const filteredAbsensi = absensi.filter(a => {
            const date = new Date(a.date);
            return date.getMonth() + 1 === parseInt(month) && date.getFullYear() === parseInt(year);
        });

        // Get unique dates in this month to calculate total valid days
        const uniqueDates = [...new Set(filteredAbsensi.map(a => a.date))];
        const totalDays = uniqueDates.length;

        return murids.map(murid => {
            const muridAbsensi = filteredAbsensi.filter(a => a.muridId === murid.id);
            const hadir = muridAbsensi.filter(a => a.status === 'H').length;
            const sakit = muridAbsensi.filter(a => a.status === 'S').length;
            const izin = muridAbsensi.filter(a => a.status === 'I').length;
            const alpha = muridAbsensi.filter(a => a.status === 'A').length;
            
            const persentase = totalDays > 0 ? ((hadir / totalDays) * 100).toFixed(1) : 0;

            return {
                ...murid,
                stats: { hadir, sakit, izin, alpha, totalDays, persentase }
            };
        });
    },

    // Check for 3+ consecutive alphas
    getAlphaWarnings() {
        const murids = this.getMurid();
        const absensi = this.getAbsensi();
        const warnings = [];

        murids.forEach(murid => {
            const muridAbsensi = absensi
                .filter(a => a.muridId === murid.id)
                .sort((a, b) => new Date(b.date) - new Date(a.date)); // descending date
            
            let consecutiveAlpha = 0;
            for (let i = 0; i < muridAbsensi.length; i++) {
                if (muridAbsensi[i].status === 'A') {
                    consecutiveAlpha++;
                } else {
                    break; // stop counting if not alpha
                }
            }

            if (consecutiveAlpha >= 3) {
                warnings.push({
                    murid,
                    consecutiveAlpha,
                    lastDate: muridAbsensi[0].date
                });
            }
        });

        return warnings;
    }
};
