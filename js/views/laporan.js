/* Laporan: statistik (grafik), rekap kegiatan, rekap per orang. Ekspor Excel / cetak PDF / bagikan WA. */
(function () {
  const { esc, ic } = App;
  function muatXLSX() {
    if (window.XLSX) return Promise.resolve();
    return new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = ok; s.onerror = () => no(new Error('Pustaka Excel gagal dimuat. Periksa koneksi.')); document.head.appendChild(s); });
  }
  async function excel(nama, kol, baris) {
    try { await muatXLSX(); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([kol].concat(baris)), 'Data'); XLSX.writeFile(wb, nama + '.xlsx'); } catch (e) { App.galat(e); }
  }
  function cetak(judul, kol, baris) { // buka halaman cetak; pilih "Simpan sebagai PDF" di dialog cetak
    const w = window.open('', '_blank'); if (!w) { App.toast('Izinkan pop-up untuk mencetak', 'warn'); return; }
    w.document.write('<!doctype html><meta charset="utf-8"><title>' + esc(judul) + '</title><style>body{font:12px/1.4 sans-serif;margin:20px;color:#111}h1{font-size:16px;margin:0 0 4px}p{margin:0 0 12px;color:#555}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:4px 6px;text-align:left}th{background:#eee}</style><h1>' + esc(judul) + '</h1><p>Ruang Sambung · dicetak ' + esc(new Date().toLocaleString('id-ID')) + '</p><table><thead><tr>' +
      kol.map(k => '<th>' + esc(k) + '</th>').join('') + '</tr></thead><tbody>' + baris.map(r => '<tr>' + r.map(c => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table><script>setTimeout(function(){print()},300)<\/script>');
    w.document.close();
  }
  const aksi = () => '<div class="row" style="flex-wrap:wrap;margin:10px 0"><button class="btn sm" data-x="xls">' + ic('download', 16) + ' Excel</button><button class="btn sm" data-x="pdf">' + ic('download', 16) + ' PDF</button><button class="btn sm wa" data-x="wa">' + ic('share', 16) + ' Bagikan</button></div>';
  const hb = (nama, v, mx, warna) => '<div class="hb"><span class="nm">' + esc(nama) + '</span><span class="tr"><i style="width:' + (mx ? v * 100 / mx : 0) + '%;background:' + warna + '"></i></span><span class="v">' + v + '</span></div>';

  App.views.laporan = { render(ctx) {
    const el = ctx.el, adm = App.isAdmin(), sup = App.isSuper(); App.title('Laporan');
    let tab = ctx.params[0] || 'statistik', tahun = String(new Date().getFullYear()), dari = '', sampai = '', desa = '', kel = '', rows = null, stat = null;
    const tabs = [['statistik', 'Statistik'], ['kegiatan', 'Rekap Kegiatan']].concat(adm ? [['orang', 'Per Orang']] : []);
    el.innerHTML = '<h1 style="font-size:20px;margin-bottom:10px">Laporan</h1><div class="seg" id="tb"></div><div id="fl"></div><div id="isi"></div>';
    const q = s => el.querySelector(s);

    function filter() {
      if (tab === 'statistik') return '<div class="field"><select class="input" id="th" style="height:38px">' + [0, 1, 2, 3].map(i => { const y = String(new Date().getFullYear() - i); return '<option' + (y === tahun ? ' selected' : '') + '>' + y + '</option>'; }).join('') + '</select></div>';
      const ds = (App.state.ref.desa || []);
      return '<div class="row" style="margin-bottom:8px"><input class="input" type="date" id="dr" value="' + dari + '" style="height:38px" aria-label="Dari"><input class="input" type="date" id="sp" value="' + sampai + '" style="height:38px" aria-label="Sampai"></div>' +
        (tab === 'orang' && sup ? '<div class="row" style="margin-bottom:8px"><select class="input" id="fd" style="height:38px"><option value="">Semua desa</option>' + ds.map(d => '<option' + (d.nama === desa ? ' selected' : '') + '>' + esc(d.nama) + '</option>').join('') + '</select><select class="input" id="fk" style="height:38px"><option value="">Semua kelompok</option>' +
          ds.filter(d => !desa || d.nama === desa).reduce((a, d) => a.concat(d.kelompok), []).map(k => '<option' + (k.nama === kel ? ' selected' : '') + '>' + esc(k.nama) + '</option>').join('') + '</select></div>' : '');
    }
    function gambarStat() {
      if (!stat) return App.skeleton(2);
      const b = stat.kehadiranBulanan, mx = Math.max.apply(null, b.map(m => m.Hadir + m.Izin + m.Sakit + m.Alfa).concat([1]));
      let h = '<div class="card"><div class="label">Kehadiran per bulan ' + esc(stat.tahun) + '</div><div class="stack">' + b.map(m => { const t = m.Hadir + m.Izin + m.Sakit + m.Alfa;
        return '<div><div class="col" style="height:' + (t * 100 / mx) + '%" title="' + esc(m.bulan) + ': ' + t + '">' + [['hadir', m.Hadir], ['izin', m.Izin], ['sakit', m.Sakit], ['alfa', m.Alfa]].map(x => '<i style="height:' + (t ? x[1] * 100 / t : 0) + '%;background:var(--' + x[0] + ')"></i>').join('') + '</div><span style="font-size:9px">' + esc(m.bulan) + '</span></div>'; }).join('') + '</div>' +
        '<div class="row" style="flex-wrap:wrap;gap:12px;margin-top:10px;font-size:12px">' + ['hadir', 'izin', 'sakit', 'alfa'].map(x => '<span><span class="dot" style="background:var(--' + x + ')"></span>' + x[0].toUpperCase() + x.slice(1) + '</span>').join('') + '</div></div>';
      if (stat.jenjang) {
        const mj = Math.max.apply(null, stat.jenjang.map(x => x.total).concat([1])), md = Math.max.apply(null, stat.perDesa.map(x => x.total).concat([1]));
        h += '<div class="card"><div class="label">Jamaah aktif per jenjang</div>' + stat.jenjang.filter(x => x.total).map(x => hb(x.nama, x.total, mj, 'var(--teal)')).join('') + (stat.jenjang.some(x => x.total) ? '' : '<div class="empty">Belum ada data</div>') + '</div>' +
          '<div class="card"><div class="label">Perbandingan desa</div>' + stat.perDesa.map(x => hb(x.desa, x.total, md, x.warna)).join('') + '</div>' +
          '<div class="card"><div class="label">Per kelompok</div>' + (function () { const mk = Math.max.apply(null, stat.perKelompok.map(x => x.total).concat([1])); return stat.perKelompok.filter(x => x.total).sort((a, c) => c.total - a.total).slice(0, 28).map(x => hb(x.kelompok, x.total, mk, App.warnaDesa(x.desa))).join('') || '<div class="empty">Belum ada data</div>'; })() + '</div>';
      }
      return h;
    }
    function tabel(kol, baris, html) {
      return aksi() + '<div class="card"><div class="scroll-x"><table class="tbl"><thead><tr>' + kol.map((k, i) => '<th' + (i > 1 ? ' class="n"' : '') + '>' + esc(k) + '</th>').join('') + '</tr></thead><tbody>' + html + '</tbody></table></div>' + (baris.length ? '' : '<div class="empty"><b>Belum ada data</b>Ubah rentang tanggal.</div>') + '</div>';
    }
    const KK = ['Kegiatan', 'Tanggal', 'Peserta', 'Hadir', 'Izin', 'Sakit', 'Alfa', '%'], KO = ['Nama', 'Kelompok', 'Hadir', 'Izin', 'Sakit', 'Alfa', '%'];
    function gambar() {
      q('#tb').innerHTML = tabs.map(t => '<button data-t="' + t[0] + '" class="' + (t[0] === tab ? 'on' : '') + '">' + t[1] + '</button>').join('');
      q('#fl').innerHTML = filter();
      let h;
      if (tab === 'statistik') h = gambarStat();
      else if (!rows) h = App.skeleton(1);
      else if (tab === 'kegiatan') h = tabel(KK, rows, rows.map(r => '<tr><td><b>' + esc(r.nama) + '</b><div class="muted" style="font-size:11px">' + esc(r.tingkat + (r.wilayah ? ' ' + r.wilayah : '')) + '</div></td><td>' + esc(App.tgl(r.tanggal)) + '</td><td class="n">' + r.peserta + '</td><td class="n">' + r.hadir + '</td><td class="n">' + r.izin + '</td><td class="n">' + r.sakit + '</td><td class="n">' + r.alfa + '</td><td class="n"><b>' + r.persen + '%</b></td></tr>').join(''));
      else h = tabel(KO, rows, rows.map(r => '<tr><td><b>' + esc(r.nama) + '</b></td><td>' + esc(r.kelompok) + '</td><td class="n">' + r.hadir + '</td><td class="n">' + r.izin + '</td><td class="n">' + r.sakit + '</td><td class="n" style="' + (r.alfa >= 3 ? 'color:var(--alfa);font-weight:800' : '') + '">' + r.alfa + '</td><td class="n"><b>' + r.persen + '%</b></td></tr>').join(''));
      q('#isi').innerHTML = h;
      pasang();
    }
    function pasang() {
      const t = q('#th'); if (t) t.onchange = e => { tahun = e.target.value; stat = null; gambar(); muat(); };
      if (q('#dr')) { q('#dr').onchange = e => { dari = e.target.value; rows = null; gambar(); muat(); }; q('#sp').onchange = e => { sampai = e.target.value; rows = null; gambar(); muat(); }; }
      if (q('#fd')) { q('#fd').onchange = e => { desa = e.target.value; kel = ''; rows = null; gambar(); muat(); }; q('#fk').onchange = e => { kel = e.target.value; rows = null; gambar(); muat(); }; }
      el.querySelectorAll('[data-x]').forEach(b => b.onclick = () => ekspor(b.dataset.x));
    }
    function ekspor(jenis) {
      const kol = tab === 'kegiatan' ? KK : KO, judul = tab === 'kegiatan' ? 'Rekap Kegiatan' : 'Rekap Kehadiran per Orang', per = (dari || sampai) ? ' (' + (dari || '…') + ' s/d ' + (sampai || '…') + ')' : '';
      const baris = tab === 'kegiatan' ? rows.map(r => [r.nama, r.tanggal, r.peserta, r.hadir, r.izin, r.sakit, r.alfa, r.persen + '%']) : rows.map(r => [r.nama, r.kelompok, r.hadir, r.izin, r.sakit, r.alfa, r.persen + '%']);
      if (jenis === 'xls') excel(judul.replace(/\s/g, '-'), kol, baris);
      else if (jenis === 'pdf') cetak(judul + per, kol, baris);
      else { const t = '*' + judul + '*' + per + '\n' + (tab === 'kegiatan' ? rows.slice(0, 25).map(r => '• ' + r.nama + ' (' + App.tgl(r.tanggal) + '): hadir ' + r.hadir + '/' + (r.hadir + r.izin + r.sakit + r.alfa) + ' (' + r.persen + '%)').join('\n') : rows.slice(0, 25).map((r, i) => (i + 1) + '. ' + r.nama + ' (' + r.kelompok + '): hadir ' + r.hadir + ', alfa ' + r.alfa + ' (' + r.persen + '%)').join('\n'));
        const u = 'https://wa.me/?text=' + encodeURIComponent(t); window.open(u, '_blank') || (location.href = u); }
    }
    function muat() {
      if (tab === 'statistik') return API.baca('laporan.statistik', { tahun: tahun }, { segar: 30000, onData: x => { stat = x; if (tab === 'statistik') gambar(); }, onGalat: App.galat }).catch(App.galat);
      const aksiApi = tab === 'kegiatan' ? 'laporan.kegiatan' : 'laporan.orang', d = { dari: dari, sampai: sampai, desa: desa, kelompok: kel };
      API.baca(aksiApi, d, { segar: 30000, onData: x => { rows = x; gambar(); }, onGalat: App.galat }).catch(e => { App.galat(e); rows = rows || []; gambar(); });
    }
    el.onclick = e => { const t = e.target.closest('[data-t]'); if (t && t.closest('#tb')) { tab = t.dataset.t; rows = null; gambar(); muat(); } };
    gambar(); muat();
  } };
})();
