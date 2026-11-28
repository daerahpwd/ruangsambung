/* Data Jamaah: daftar (filter di klien = instan), form tambah/ubah, detail, ubah status, impor Excel */
(function () {
  const { esc, ic } = App, st = () => App.state, L = () => st().ref.lists || {};
  const PILL = { Aktif: 'p-aktif', Pindah: 'p-pindah', Meninggal: 'p-meninggal' };
  const dasar = ['jamaah.', 'dash.', 'laporan.', 'boot'];
  const opsi = (arr, pilih, kosong) => (kosong !== undefined ? '<option value="">' + esc(kosong) + '</option>' : '') + (arr || []).map(v => '<option' + (v === pilih ? ' selected' : '') + '>' + esc(v) + '</option>').join('');
  const desaBoleh = () => (st().ref.desa || []).filter(d => App.lv() !== 'desa' || d.nama === st().user.desa);
  const kelompokSemua = () => desaBoleh().reduce((a, d) => a.concat(d.kelompok.map(k => ({ nama: k.nama, desa: d.nama, sub: k.sub }))), []);
  function umur(t) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t || ''); if (!m) return ''; const n = new Date(); let u = n.getFullYear() - m[1]; if (n.getMonth() + 1 < +m[2] || (n.getMonth() + 1 === +m[2] && n.getDate() < +m[3])) u--; return u < 0 ? '' : u; }
  function saran(u) { return u === '' ? '' : u <= 4 ? 'Balita (0-4 tahun)' : u >= 60 ? 'Lansia (60+)' : u >= 18 ? 'Dewasa' : ''; }
  const cari = id => (st().jamaah || []).filter(j => j.id === id)[0];
  function lokal(id, d, desa) { // perbarui daftar lokal seketika (optimistis), server menyusul di belakang
    const r = { id: id, nama: d.nama, panggilan: d.panggilan, jk: d.jk, tgl: d.tgl, umur: umur(d.tgl), desa: desa, kelompok: d.kelompok, sub: d.sub, sk: d.sk, jenjang: d.jenjang, dom: d.dom, pend: d.pend, guru: d.guru, status: d.status };
    const a = st().jamaah || (st().jamaah = []), i = a.findIndex(x => x.id === id);
    if (i > -1) a[i] = r; else a.push(r);
  }
  const segarkan = () => App.boot().catch(() => { });

  // ================= DAFTAR =================
  function daftar(el) {
    App.title('Data Jamaah');
    const u = st().user, kelompokTerkunci = u.role === 'admin_kelompok';
    const f = { q: '', desa: '', kel: kelompokTerkunci ? u.kelompok : '', jenjang: '', status: 'Aktif', jk: '' }; let batas = 40;
    el.innerHTML = '<div class="row between" style="margin-bottom:10px"><h1 style="font-size:20px">Data</h1><div class="row"><a class="btn sm" href="#/data/impor">' + ic('upload', 16) + ' Impor</a><a class="btn pri sm" href="#/data/baru">' + ic('plus', 16) + ' Tambah</a></div></div>' +
      '<div class="field"><div style="position:relative"><span style="position:absolute;left:12px;top:12px;color:var(--tx2)">' + ic('search') + '</span><input class="input" id="q" placeholder="Cari nama atau panggilan" style="padding-left:40px" autocomplete="off"></div></div>' +
      '<div class="row" style="flex-wrap:wrap;margin-bottom:10px">' +
      (kelompokTerkunci ? '<span class="chip">' + ic('lock', 14) + ' ' + esc(u.kelompok) + '</span>' : '<select class="input" id="fd" style="width:auto;height:36px"><option value="">Semua desa</option>' + opsi(desaBoleh().map(d => d.nama)) + '</select><select class="input" id="fk" style="width:auto;height:36px"></select>') +
      '<select class="input" id="fj" style="width:auto;height:36px"><option value="">Semua jenjang</option>' + opsi(L().jenjang) + '</select>' +
      '<select class="input" id="fs" style="width:auto;height:36px">' + opsi(['Aktif', 'Pindah', 'Meninggal'], 'Aktif', 'Semua status') + '</select>' +
      '<select class="input" id="fg" style="width:auto;height:36px"><option value="">L &amp; P</option><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>' +
      '<div class="row" id="ring" style="margin-bottom:8px"></div><div class="card" style="padding:4px 16px"><div class="list" id="hasil"></div></div><div id="lagi" style="text-align:center"></div>';
    const q = s => el.querySelector(s);
    function isiKelompok() { if (q('#fk')) q('#fk').innerHTML = '<option value="">Semua kelompok</option>' + opsi(kelompokSemua().filter(k => !f.desa || k.desa === f.desa).map(k => k.nama), f.kel); }
    function gambar() {
      const t = f.q.trim().toLowerCase();
      const a = (st().jamaah || []).filter(j => (!f.desa || j.desa === f.desa) && (!f.kel || j.kelompok === f.kel) && (!f.jenjang || j.jenjang === f.jenjang) && (!f.status || j.status === f.status) && (!f.jk || j.jk === f.jk) &&
        (!t || j.nama.toLowerCase().indexOf(t) > -1 || (j.panggilan || '').toLowerCase().indexOf(t) > -1)).sort((x, y) => x.nama.localeCompare(y.nama));
      const l = a.filter(j => j.jk === 'L').length;
      q('#ring').innerHTML = '<span class="chip teal">' + a.length + ' jiwa</span><span class="chip">L ' + l + '</span><span class="chip">P ' + (a.length - l) + '</span>';
      q('#hasil').innerHTML = a.length ? a.slice(0, batas).map(j => '<a href="#/data/' + esc(j.id) + '"><div class="tile">' + esc(App.inisial(j.nama)) + '</div><div class="grow"><b>' + esc(j.nama) + '</b>' + (j.panggilan ? ' <span class="muted">(' + esc(j.panggilan) + ')</span>' : '') +
        '<div class="muted" style="font-size:12px">' + (j.umur !== '' ? j.umur + ' th · ' : '') + esc(j.jenjang || '-') + ' · <span class="dot" style="background:' + App.warnaDesa(j.desa) + '"></span>' + esc(j.kelompok) + '</div></div><span class="pill ' + (PILL[j.status] || 'p-belum') + '">' + esc(j.status) + '</span></a>').join('')
        : '<div class="empty"><b>Tidak ada data</b>Ubah filter atau tambah jamaah baru.</div>';
      q('#lagi').innerHTML = a.length > batas ? '<button class="btn sm" id="ml" style="margin:8px 0">Muat lebih banyak (' + (a.length - batas) + ')</button>' : '';
      if (q('#ml')) q('#ml').onclick = () => { batas += 40; gambar(); };
    }
    let tm; q('#q').oninput = e => { clearTimeout(tm); tm = setTimeout(() => { f.q = e.target.value; batas = 40; gambar(); }, 90); };
    if (q('#fd')) q('#fd').onchange = e => { f.desa = e.target.value; f.kel = ''; isiKelompok(); batas = 40; gambar(); };
    if (q('#fk')) q('#fk').onchange = e => { f.kel = e.target.value; batas = 40; gambar(); };
    q('#fj').onchange = e => { f.jenjang = e.target.value; batas = 40; gambar(); };
    q('#fs').onchange = e => { f.status = e.target.value; batas = 40; gambar(); };
    q('#fg').onchange = e => { f.jk = e.target.value; batas = 40; gambar(); };
    isiKelompok(); gambar();
    return App.on('boot', gambar); // data segar dari server -> gambar ulang tanpa kedip
  }

  // ================= FORM =================
  async function form(el, id) {
    const u = st().user, kunci = u.role === 'admin_kelompok';
    let j = id ? cari(id) : null;
    if (id && !j) { try { j = await API.call('jamaah.get', { id: id }); } catch (e) { el.innerHTML = '<div class="empty"><b>Data tidak ditemukan</b></div>'; return; } }
    j = j || { nama: '', panggilan: '', jk: '', tgl: '', kelompok: kunci ? u.kelompok : '', sub: '', sk: '', jenjang: '', dom: '', pend: '', guru: '', status: 'Aktif' };
    App.title(id ? 'Ubah Jamaah' : 'Tambah Jamaah');
    const sec = (t, h) => '<div class="card"><div class="label">' + t + '</div>' + h + '</div>', fld = (l, h) => '<div class="field"><label>' + l + '</label>' + h + '</div>';
    el.innerHTML = '<a href="#/data" class="row muted" style="margin-bottom:8px">' + ic('back') + ' Data</a><h1 style="font-size:20px;margin-bottom:12px">' + (id ? 'Ubah Jamaah' : 'Tambah Jamaah') + '</h1><form id="f" novalidate>' +
      sec('Identitas', fld('Nama lengkap *', '<input class="input" name="nama" value="' + esc(j.nama) + '" autocomplete="off">') + fld('Panggilan', '<input class="input" name="panggilan" value="' + esc(j.panggilan) + '">') +
        fld('Jenis kelamin *', '<select class="input" name="jk"><option value="">Pilih…</option><option value="L"' + (j.jk === 'L' ? ' selected' : '') + '>Laki-laki</option><option value="P"' + (j.jk === 'P' ? ' selected' : '') + '>Perempuan</option></select>') +
        fld('Tanggal lahir', '<input class="input" type="date" name="tgl" value="' + esc(j.tgl) + '"><div class="muted" id="um" style="font-size:12px;margin-top:4px"></div>')) +
      sec('Wilayah', fld('Kelompok *', '<select class="input" name="kelompok"' + (kunci ? ' disabled' : '') + '><option value="">Pilih kelompok…</option>' + kelompokSemua().map(k => '<option' + (k.nama === j.kelompok ? ' selected' : '') + ' value="' + esc(k.nama) + '">' + esc(k.nama) + ' (' + esc(k.desa) + ')</option>').join('') + '</select>') +
        '<div id="sb"></div><div class="muted" id="ds" style="font-size:12px"></div>') +
      sec('Keluarga &amp; Jenjang', fld('Status dalam keluarga', '<select class="input" name="sk">' + opsi(L().status_keluarga, j.sk, 'Pilih…') + '</select>') +
        fld('Jenjang', '<select class="input" name="jenjang">' + opsi(L().jenjang, j.jenjang, 'Pilih…') + '</select><div class="muted" id="sj" style="font-size:12px;margin-top:4px">Paud, TK, 1-6 SD termasuk Caberawit.</div>')) +
      sec('Lainnya', fld('Domisili &amp; hunian', '<select class="input" name="dom">' + opsi(L().domisili, j.dom, 'Pilih…') + '</select>') + fld('Pendidikan', '<select class="input" name="pend">' + opsi(L().pendidikan, j.pend, 'Pilih…') + '</select>') +
        fld('Guru', '<select class="input" name="guru">' + opsi(L().guru, j.guru, 'Pilih…') + '</select>') + fld('Status jamaah', '<select class="input" name="status">' + opsi(L().status_jamaah, j.status) + '</select>')) +
      '<div class="err" id="e" hidden></div><div class="sticky-bar"><a class="btn grow" href="#/data">Batal</a><button class="btn pri grow" id="sv">Simpan</button></div></form>';
    const f = el.querySelector('#f');
    function sinkron() {
      const k = kelompokSemua().filter(x => x.nama === (kunci ? u.kelompok : f.kelompok.value))[0];
      el.querySelector('#ds').textContent = k ? 'Desa: ' + k.desa : '';
      el.querySelector('#sb').innerHTML = k && k.sub.length ? '<div class="field"><label>Sub</label><select class="input" name="sub">' + opsi(k.sub, j.sub, 'Tanpa sub') + '</select></div>' : '';
      const um = umur(f.tgl.value); el.querySelector('#um').textContent = um === '' ? '' : 'Umur: ' + um + ' tahun';
      const sg = saran(um); el.querySelector('#sj').textContent = sg ? 'Disarankan: ' + sg : 'Paud, TK, 1-6 SD termasuk Caberawit.';
      if (sg && !f.jenjang.value) f.jenjang.value = sg;
    }
    f.kelompok.onchange = () => { j.sub = ''; sinkron(); }; f.tgl.onchange = sinkron; sinkron();
    f.onsubmit = async ev => {
      ev.preventDefault();
      const e = el.querySelector('#e'), b = el.querySelector('#sv'); e.hidden = true;
      const d = { nama: f.nama.value.trim(), panggilan: f.panggilan.value.trim(), jk: f.jk.value, tgl: f.tgl.value, kelompok: kunci ? u.kelompok : f.kelompok.value, sub: f.sub ? f.sub.value : '',
        sk: f.sk.value, jenjang: f.jenjang.value, dom: f.dom.value, pend: f.pend.value, guru: f.guru.value, status: f.status.value };
      if (id) d.id = id;
      if (!d.nama || !d.jk || !d.kelompok) { e.textContent = 'Nama, jenis kelamin, dan kelompok wajib diisi.'; e.hidden = false; return; }
      const kirim = async paksa => {
        b.disabled = true; b.textContent = 'Menyimpan…';
        try {
          const r = await API.tulis('jamaah.save', Object.assign({ paksa: paksa }, d), dasar);
          const k = kelompokSemua().filter(x => x.nama === d.kelompok)[0];
          lokal(r.id, d, k ? k.desa : ''); App.toast('Data tersimpan', 'ok'); App.go('#/data'); segarkan();
        } catch (x) {
          b.disabled = false; b.textContent = 'Simpan';
          if (x.code === 'DUPLIKAT') {
            const s = App.sheet('<h3>Nama mirip sudah ada</h3><p class="muted">' + (x.data || []).map(m => esc(m.nama) + ' (' + esc(m.kelompok) + ', ' + esc(m.tgl || 'tgl lahir kosong') + ')').join('<br>') + '</p><div class="row"><button class="btn grow" data-tutup>Periksa lagi</button><button class="btn pri grow" id="tp">Tetap simpan</button></div>');
            s.querySelector('#tp').onclick = () => { App.sheetTutup(); kirim(true); };
          } else { e.textContent = x.message; e.hidden = false; }
        }
      };
      kirim(false);
    };
  }

  // ================= DETAIL =================
  async function detail(el, id) {
    let j = cari(id);
    if (!j) { try { j = await API.call('jamaah.get', { id: id }); } catch (e) { el.innerHTML = '<div class="empty"><b>Data tidak ditemukan</b><a class="btn sm" href="#/data">Kembali</a></div>'; return; } }
    App.title('Detail Jamaah');
    const baris = (l, v) => '<div class="row between" style="padding:9px 0;border-bottom:1px solid var(--bd)"><span class="muted">' + l + '</span><b style="text-align:right">' + esc(v || '-') + '</b></div>';
    el.innerHTML = '<a href="#/data" class="row muted" style="margin-bottom:8px">' + ic('back') + ' Data</a>' +
      '<div class="card" style="text-align:center"><div class="tile" style="width:64px;height:64px;margin:0 auto 10px;font-size:22px">' + esc(App.inisial(j.nama)) + '</div><h1 style="font-size:20px">' + esc(j.nama) + '</h1>' + (j.panggilan ? '<div class="muted">' + esc(j.panggilan) + '</div>' : '') +
      '<div class="row" style="justify-content:center;flex-wrap:wrap;margin-top:10px"><span class="chip"><span class="dot" style="background:' + App.warnaDesa(j.desa) + '"></span>' + esc(j.desa) + '</span><span class="chip">' + esc(j.kelompok) + '</span>' + (j.sub ? '<span class="chip">' + esc(j.sub) + '</span>' : '') +
      '<span class="chip soft">' + esc(j.jenjang || '-') + '</span><span class="pill ' + (PILL[j.status] || 'p-belum') + '">' + esc(j.status) + '</span></div></div>' +
      '<div class="card"><div class="label">Informasi</div>' + baris('Jenis kelamin', j.jk === 'L' ? 'Laki-laki' : 'Perempuan') + baris('Tanggal lahir', j.tgl ? App.tgl(j.tgl) : '') + baris('Umur', j.umur !== '' ? j.umur + ' tahun' : '') + baris('Status keluarga', j.sk) + baris('Domisili', j.dom) + baris('Pendidikan', j.pend) + baris('Guru', j.guru) + '</div>' +
      '<div class="row"><a class="btn pri grow" href="#/data/ubah/' + esc(j.id) + '">Ubah</a><button class="btn grow" id="ss">Ubah status</button></div>';
    el.querySelector('#ss').onclick = () => {
      const s = App.sheet('<h3 style="margin-bottom:6px">Ubah status</h3><p class="muted" style="margin-top:0">Jamaah tidak dihapus, hanya dinonaktifkan dari daftar absen baru.</p>' + ['Aktif', 'Pindah', 'Meninggal'].map(x => '<button class="btn blk" data-s="' + x + '" style="margin-bottom:8px"' + (x === j.status ? ' disabled' : '') + '>' + x + '</button>').join(''));
      s.querySelectorAll('[data-s]').forEach(b => b.onclick = async () => {
        try { await API.tulis('jamaah.status', { id: j.id, status: b.dataset.s }, dasar); j.status = b.dataset.s; App.sheetTutup(); App.toast('Status diubah menjadi ' + b.dataset.s, 'ok'); detail(el, id); segarkan(); } catch (x) { App.galat(x); }
      });
    };
  }

  // ================= IMPOR EXCEL =================
  const HEAD = ['Nama', 'Panggilan', 'Jenis Kelamin', 'Tgl Lahir', 'Desa', 'Kelompok', 'Sub', 'Status dalam Keluarga', 'Jenjang', 'Domisili & Hunian', 'Pendidikan Jamaah', 'Guru', 'Rincian Data Jamaah'];
  function muatXLSX() {
    if (window.XLSX) return Promise.resolve();
    return new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = ok; s.onerror = () => no(new Error('Pustaka Excel gagal dimuat. Periksa koneksi.')); document.head.appendChild(s); });
  }
  function impor(el) {
    App.title('Impor Excel'); let rows = [];
    el.innerHTML = '<a href="#/data" class="row muted" style="margin-bottom:8px">' + ic('back') + ' Data</a><h1 style="font-size:20px;margin-bottom:12px">Impor dari Excel</h1>' +
      '<div class="card"><div class="label">1. Pilih berkas</div><label class="empty" style="display:block;border:2px dashed var(--bd);border-radius:16px;cursor:pointer">' + ic('upload', 28) + '<b>Pilih berkas Excel / CSV</b>Kolom: ' + HEAD.slice(0, 6).join(', ') + ', dst.<input type="file" id="fl" accept=".xlsx,.xls,.csv" hidden></label>' +
      '<button class="btn sm" id="tp" style="margin-top:10px">' + ic('download', 16) + ' Unduh template</button></div><div id="hs"></div>';
    el.querySelector('#tp').onclick = () => { const csv = '\ufeff' + HEAD.join(',') + '\nContoh Nama,Contoh,Laki-laki,1990-05-17,' + ((st().ref.desa || [{}])[0].nama || '') + ',' + (kelompokSemua()[0] || {}).nama + ',,Kepala keluarga,Dewasa,Mukim,Sarjana (S1),Non guru,Aktif\n';
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'template-jamaah.csv'; a.click(); };
    async function jalan(dry, hs, progress) {
      const tot = { inserted: 0, updated: 0, skipped: 0, errors: [] };
      for (let i = 0; i < rows.length; i += 300) {
        progress(Math.min(i + 300, rows.length));
        const r = await API.call('jamaah.import', { rows: rows.slice(i, i + 300), dryRun: dry, offset: i }, { tulis: true, timeout: 55000 });
        tot.inserted += r.inserted; tot.updated += r.updated; tot.skipped += r.skipped; tot.errors = tot.errors.concat(r.errors);
      }
      return tot;
    }
    el.querySelector('#fl').onchange = async e => {
      const file = e.target.files[0]; if (!file) return; const hs = el.querySelector('#hs'); hs.innerHTML = '<div class="card"><div class="sk" style="height:60px"></div></div>';
      try {
        await muatXLSX();
        const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' }), ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false, dateNF: 'yyyy-mm-dd' }).filter(r => String(r.Nama || r.nama || '').trim() || Object.keys(r).some(k => /^nama$/i.test(k) && String(r[k]).trim()));
        if (!rows.length) { hs.innerHTML = '<div class="card err">Tidak ada baris data yang terbaca. Pastikan baris pertama berisi judul kolom.</div>'; return; }
        const hasil = await jalan(true, hs, n => { hs.innerHTML = '<div class="card">Memeriksa ' + n + ' dari ' + rows.length + ' baris…</div>'; });
        hs.innerHTML = '<div class="card"><div class="label">2. Hasil pemeriksaan</div><div class="row" style="flex-wrap:wrap"><span class="chip teal">' + hasil.inserted + ' baru</span><span class="chip soft">' + hasil.updated + ' diperbarui</span><span class="chip">' + hasil.skipped + ' dilewati</span><span class="chip" style="background:#FEE2E2;color:#991B1B">' + hasil.errors.length + ' bermasalah</span></div>' +
          (hasil.errors.length ? '<div class="list" style="margin-top:10px">' + hasil.errors.slice(0, 15).map(x => '<div><span class="pill p-alfa">Baris ' + x.baris + '</span><span class="grow">' + esc(x.pesan) + '</span></div>').join('') + (hasil.errors.length > 15 ? '<div class="muted">…dan ' + (hasil.errors.length - 15) + ' lainnya</div>' : '') + '</div>' : '') +
          '<button class="btn pri blk" id="go" style="margin-top:12px"' + (hasil.inserted + hasil.updated ? '' : ' disabled') + '>Impor sekarang</button><p class="muted" style="font-size:12px">Baris bermasalah dilewati. Mengimpor ulang berkas yang sama aman (tidak membuat data ganda).</p></div>';
        hs.querySelector('#go').onclick = async ev => {
          ev.target.disabled = true;
          try { const h = await jalan(false, hs, n => { ev.target.textContent = 'Mengimpor ' + n + '/' + rows.length + '…'; }); API.invalidasi(dasar); await App.boot();
            hs.innerHTML = '<div class="card empty">' + ic('check', 32) + '<b>Selesai</b>' + h.inserted + ' ditambahkan, ' + h.updated + ' diperbarui.<br><a class="btn pri sm" href="#/data" style="margin-top:10px">Lihat Data</a></div>'; } catch (x) { App.galat(x); ev.target.disabled = false; }
        };
      } catch (x) { hs.innerHTML = ''; App.galat(x); }
    };
  }

  App.views.data = { render(ctx) {
    const p = ctx.params, el = ctx.el;
    if (!p.length) return daftar(el);
    if (p[0] === 'baru') return form(el, null);
    if (p[0] === 'ubah') return form(el, p[1]);
    if (p[0] === 'impor') return impor(el);
    return detail(el, p[0]);
  } };
})();
