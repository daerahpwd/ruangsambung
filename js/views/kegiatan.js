/* Kegiatan: daftar (tab), detail + ringkasan absensi, form buat/ubah, batalkan */
(function () {
  const { esc, ic, tgl } = App, st = () => App.state, L = () => st().ref.lists || {};
  const INV = ['kegiatan.', 'dash.', 'laporan.', 'absen.', 'boot'];
  const BLN = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
  const PILL = { Hadir: 'p-hadir', Izin: 'p-izin', Sakit: 'p-sakit', Alfa: 'p-alfa' };
  const hariIni = () => { const n = new Date(); return n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2); };
  const tile = t => { const m = /^\d{4}-(\d{2})-(\d{2})/.exec(t || '') || [0, 1, 1]; return '<div class="tile" style="width:52px;height:52px;flex-direction:column;line-height:1.1"><b style="font-size:19px">' + (+m[2]) + '</b><small style="font-size:9px;font-weight:700">' + BLN[+m[1] - 1] + '</small></div>'; };
  const jam = k => (k.jamMulai || '') + (k.jamSelesai ? '–' + k.jamSelesai : '');
  const wilayah = k => k.tingkat + (k.wilayah ? ' ' + k.wilayah : '');
  const segarkan = () => App.boot().catch(() => { });

  // ================= DAFTAR =================
  function daftar(el) {
    App.title('Kegiatan');
    let tab = sessionStorage.getItem('rs_ktab') || 'mendatang', tingkat = '', data = null;
    el.innerHTML = '<div class="row between" style="margin-bottom:10px"><h1 style="font-size:20px">Kegiatan</h1>' + (App.isAdmin() ? '<a class="btn pri sm" href="#/kegiatan/baru">' + ic('plus', 16) + ' Buat</a>' : '') + '</div>' +
      '<div class="seg" id="tb"></div><select class="input" id="ft" style="height:38px;margin-bottom:10px"><option value="">Semua tingkat</option>' + (L().tingkat || []).map(t => '<option>' + t + '</option>').join('') + '</select><div id="ls"></div>';
    const tb = el.querySelector('#tb'), ls = el.querySelector('#ls');
    function gambar() {
      tb.innerHTML = [['mendatang', 'Mendatang'], ['selesai', 'Selesai'], ['semua', 'Semua']].map(x => '<button data-t="' + x[0] + '" class="' + (x[0] === tab ? 'on' : '') + '">' + x[1] + '</button>').join('');
      if (!data) { ls.innerHTML = App.skeleton(2); return; }
      const h = hariIni();
      ls.innerHTML = data.length ? data.map(k => {
        const belum = k.status !== 'Batal' && k.dicek === 0 && k.tanggal <= h;
        return '<div class="card" style="padding:12px"><div class="row" data-go="#/kegiatan/' + esc(k.id) + '" style="cursor:pointer">' + tile(k.tanggal) +
          '<div class="grow"><b style="font-size:15px">' + esc(k.nama) + '</b><div class="row" style="gap:6px;margin:4px 0;flex-wrap:wrap"><span class="chip soft">' + esc(wilayah(k)) + '</span><span class="chip">' + esc(k.secara) + '</span>' + (k.status === 'Batal' ? '<span class="pill p-alfa">Batal</span>' : '') + '</div>' +
          '<div class="muted" style="font-size:12px">' + (k.tempat ? esc(k.tempat) + ' · ' : '') + esc(jam(k)) + '</div></div></div>' +
          '<div class="row between" style="margin-top:10px"><div class="grow">' + (k.peserta ? '<div class="muted" style="font-size:12px;margin-bottom:4px">' + (belum ? '<span class="pill p-sakit">Belum diabsen</span> ' : '') + 'Absensi ' + k.dicek + '/' + k.peserta + '</div><div class="bar" style="width:70%"><i style="width:' + Math.min(100, k.dicek * 100 / k.peserta) + '%;background:var(--teal)"></i></div>' : '<span class="muted" style="font-size:12px">Belum ada peserta sesuai kriteria</span>') + '</div>' +
          '<div class="row"><button class="btn sm" data-wa="' + esc(k.id) + '" aria-label="Bagikan ke WhatsApp" style="color:#25D366">' + ic('share', 16) + '</button>' + (k.status !== 'Batal' ? '<button class="btn sm pri" data-ab="' + esc(k.id) + '">' + ic('check', 16) + ' Absen</button>' : '') + '</div></div></div>';
      }).join('') : '<div class="empty"><b>Belum ada kegiatan</b>' + (App.isAdmin() ? '<a class="btn pri sm" href="#/kegiatan/baru" style="margin-top:10px">Buat Kegiatan</a>' : '') + '</div>';
    }
    function muat() { API.baca('kegiatan.list', { tab: tab, tingkat: tingkat }, { segar: 15000, onData: x => { data = x; gambar(); }, onGalat: App.galat }).catch(e => { App.galat(e); data = data || []; gambar(); }); }
    el.onclick = async e => {
      const t = e.target.closest('[data-t]'), w = e.target.closest('[data-wa]'), a = e.target.closest('[data-ab]');
      if (t) { tab = t.dataset.t; sessionStorage.setItem('rs_ktab', tab); data = null; gambar(); muat(); }
      else if (w) { await App.muat('wa'); App.views.wa.bagikan(w.dataset.wa); }
      else if (a) App.go('#/absen/' + a.dataset.ab);
    };
    el.querySelector('#ft').onchange = e => { tingkat = e.target.value; data = null; gambar(); muat(); };
    gambar(); muat();
  }

  // ================= DETAIL =================
  function detail(el, id) {
    App.title('Detail Kegiatan'); let k = null, tab = 'ringkasan', cari = '';
    el.innerHTML = '<a href="#/kegiatan" class="row muted" style="margin-bottom:8px">' + ic('back') + ' Kegiatan</a><div id="d">' + App.skeleton(2) + '</div>';
    const d = el.querySelector('#d');
    const baris = (i, v) => v ? '<div class="row" style="padding:5px 0"><span class="muted">' + ic(i, 16) + '</span><span>' + esc(v) + '</span></div>' : '';
    function gambar() {
      if (!k) return;
      const c = k.hitung, tot = c.Hadir + c.Izin + c.Sakit + c.Alfa, batal = k.status === 'Batal', t = cari.toLowerCase();
      const daftar = (k.daftar || []).filter(j => !t || j.nama.toLowerCase().indexOf(t) > -1);
      d.innerHTML = '<div class="card" style="padding:0;overflow:hidden"><div style="background:var(--navy);color:#fff;padding:16px"><h1 style="font-size:19px">' + esc(k.nama) + '</h1><div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap"><span class="chip">' + esc(wilayah(k)) + '</span><span class="chip">' + esc(k.secara) + '</span>' + (batal ? '<span class="pill p-alfa">Batal</span>' : '') + '</div></div><div style="padding:12px 16px">' +
        baris('calendar', tgl(k.tanggal)) + baris('clock', jam(k)) + baris('map', k.tempat) + baris('user', k.pemateri ? 'Pemateri: ' + k.pemateri : '') + baris('chart', k.materi ? 'Materi: ' + k.materi : '') + baris('download', k.infaq ? 'Infaq: ' + App.rupiah(k.infaq) : '') + '</div></div>' +
        '<div class="card"><div class="row" style="text-align:center">' + [['Peserta', k.peserta, 'tx'], ['Hadir', c.Hadir, 'hadir'], ['Izin', c.Izin, 'izin'], ['Sakit', c.Sakit, 'sakit'], ['Alfa', c.Alfa, 'alfa']].map(x => '<div class="grow"><div class="muted" style="font-size:11px">' + x[0] + '</div><div style="font-weight:800;font-size:20px;color:var(--' + x[2] + ')">' + x[1] + '</div></div>').join('') + '</div><div style="margin-top:10px" class="bar">' +
        [['hadir', c.Hadir], ['izin', c.Izin], ['sakit', c.Sakit], ['alfa', c.Alfa]].map(x => '<i style="width:' + (tot ? x[1] * 100 / tot : 0) + '%;background:var(--' + x[0] + ')"></i>').join('') + '</div>' + (k.peserta ? '<div class="muted" style="font-size:12px;margin-top:6px">Sudah dicek ' + tot + ' dari ' + k.peserta + '</div>' : '') + '</div>' +
        '<div class="seg"><button data-tab="ringkasan" class="' + (tab === 'ringkasan' ? 'on' : '') + '">Ringkasan</button><button data-tab="peserta" class="' + (tab === 'peserta' ? 'on' : '') + '">Peserta (' + (k.daftar || []).length + ')</button></div>' +
        (tab === 'peserta' ? '<input class="input" id="cr" placeholder="Cari nama" value="' + esc(cari) + '" style="margin-bottom:8px"><div class="card" style="padding:4px 16px"><div class="list">' + (daftar.length ? daftar.map(j => '<div><div class="grow"><b>' + esc(j.nama) + '</b><div class="muted" style="font-size:12px">' + esc(j.kelompok) + ' · ' + esc(j.jenjang) + '</div></div><span class="pill ' + (PILL[j.status] || 'p-belum') + '">' + (j.status || 'Belum') + '</span></div>').join('') : '<div class="empty">Tidak ada peserta</div>') + '</div></div>'
          : '<div class="card muted" style="font-size:13px">Peserta: ' + esc(k.jenjang ? k.jenjang.split(',').join(', ') : 'Semua jenjang') + (k.jk === 'L' ? ' (laki-laki)' : k.jk === 'P' ? ' (perempuan)' : '') + '.</div>') +
        '<div class="sticky-bar">' + (batal ? '' : '<a class="btn pri grow" href="#/absen/' + esc(k.id) + '">' + ic('check') + ' ' + (tot ? 'Ubah Absen' : 'Mulai Absen') + '</a>') + '<button class="btn wa grow" id="wa">' + ic('share') + ' Bagikan WA</button>' + (App.isAdmin() && !batal ? '<button class="btn" id="mn" aria-label="Menu">' + ic('more') + '</button>' : '') + '</div>';
      const q = s => d.querySelector(s);
      d.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; gambar(); });
      if (q('#cr')) { q('#cr').oninput = e => { cari = e.target.value; const p = e.target.selectionStart; gambar(); const n = q('#cr'); n.focus(); n.setSelectionRange(p, p); }; }
      q('#wa').onclick = async () => { await App.muat('wa'); App.views.wa.bagikan(id, tot ? 'rekap_absensi' : 'info_kegiatan'); };
      if (q('#mn')) q('#mn').onclick = () => { const s = App.sheet('<a class="btn blk" href="#/kegiatan/ubah/' + esc(id) + '" style="margin-bottom:8px">Ubah kegiatan</a><button class="btn danger blk" id="bt">Batalkan kegiatan</button>'); s.querySelector('#bt').onclick = () => batalkan(id, false); };
    }
    async function batalkan(kid, paksa) {
      try { await API.tulis('kegiatan.batal', { id: kid, paksa: paksa }, INV); App.sheetTutup(); App.toast('Kegiatan dibatalkan', 'ok'); App.go('#/kegiatan'); segarkan(); }
      catch (e) {
        if (e.code === 'ADA_ABSEN') { const s = App.sheet('<h3>Sudah ada data absensi</h3><p class="muted">Membatalkan kegiatan ini akan menyembunyikannya dari daftar. Lanjutkan?</p><div class="row"><button class="btn grow" data-tutup>Kembali</button><button class="btn danger grow" id="ya">Ya, batalkan</button></div>'); s.querySelector('#ya').onclick = () => batalkan(kid, true); }
        else App.galat(e);
      }
    }
    API.baca('kegiatan.get', { id: id }, { segar: 0, onData: x => { k = x; gambar(); }, onGalat: App.galat }).catch(e => { d.innerHTML = '<div class="empty"><b>Kegiatan tidak ditemukan</b>' + esc(e.message) + '</div>'; });
  }

  // ================= FORM =================
  async function form(el, id) {
    const u = st().user, kunci = u.role === 'admin_kelompok', ref = st().ref;
    let k = { tingkat: kunci ? 'Kelompok' : 'Desa', wilayah: kunci ? u.kelompok : '', nama: '', secara: 'Offline', tanggal: hariIni(), tempat: '', jamMulai: '', jamSelesai: '', jenjang: '', jk: 'LP', materi: '', pemateri: '', infaq: 0 };
    if (id) { try { k = await API.call('kegiatan.get', { id: id }); } catch (e) { el.innerHTML = '<div class="empty"><b>Kegiatan tidak ditemukan</b></div>'; return; } }
    App.title(id ? 'Ubah Kegiatan' : 'Buat Kegiatan');
    const pil = new Set(String(k.jenjang || '').split(',').filter(Boolean)); let jk = k.jk || 'LP', secara = k.secara || 'Offline';
    const fld = (l, h) => '<div class="field"><label>' + l + '</label>' + h + '</div>', val = v => esc(v == null ? '' : v);
    el.innerHTML = '<a href="' + (id ? '#/kegiatan/' + esc(id) : '#/kegiatan') + '" class="row muted" style="margin-bottom:8px">' + ic('back') + ' Kembali</a><h1 style="font-size:20px;margin-bottom:12px">' + (id ? 'Ubah Kegiatan' : 'Buat Kegiatan') + '</h1><form id="f" novalidate>' +
      '<div class="card"><div class="label">Kegiatan</div>' +
      fld('Tingkat *', kunci ? '<div class="chip">' + ic('lock', 14) + ' Kelompok ' + esc(u.kelompok) + '</div>' : '<select class="input" id="tg">' + (L().tingkat || []).map(t => '<option' + (t === k.tingkat ? ' selected' : '') + '>' + t + '</option>').join('') + '</select>') +
      '<div id="wl"></div>' + fld('Nama kegiatan *', '<input class="input" id="nm" list="dl" value="' + val(k.nama) + '" placeholder="Pilih atau ketik sendiri" autocomplete="off"><datalist id="dl">' + (L().nama_kegiatan || []).map(n => '<option value="' + esc(n) + '">').join('') + '</datalist>') +
      fld('Secara', '<div class="row" id="sc">' + (L().secara || ['Online', 'Offline', 'Hybrid']).map(s => '<button type="button" class="chip btn-chip' + (s === secara ? ' on' : '') + '" data-s="' + s + '" style="height:38px;padding:0 16px">' + s + '</button>').join('') + '</div>') +
      '<div class="row"><div class="field grow"><label>Tanggal *</label><input class="input" type="date" id="tn" value="' + val(k.tanggal) + '"></div></div><div class="row"><div class="field grow"><label>Jam mulai</label><input class="input" type="time" id="jm" value="' + val(k.jamMulai) + '"></div><div class="field grow"><label>Jam selesai</label><input class="input" type="time" id="js" value="' + val(k.jamSelesai) + '"></div></div>' +
      fld('Tempat', '<input class="input" id="tp" value="' + val(k.tempat) + '">') + '</div>' +
      '<div class="card"><div class="label">Peserta (yang berkewajiban hadir)</div><div class="row" id="jn" style="flex-wrap:wrap;gap:6px">' + (L().jenjang || []).map(j => '<button type="button" class="chip btn-chip' + (pil.has(j) ? ' on' : '') + '" data-j="' + esc(j) + '">' + esc(j) + '</button>').join('') + '</div><div class="muted" style="font-size:12px;margin:6px 0 10px">Kosongkan jika untuk semua jenjang.</div>' +
      '<div class="row" id="jkb">' + [['LP', 'Semua'], ['L', 'Laki-laki'], ['P', 'Perempuan']].map(x => '<button type="button" class="chip btn-chip' + (x[0] === jk ? ' on' : '') + '" data-k="' + x[0] + '" style="height:38px;padding:0 16px">' + x[1] + '</button>').join('') + '</div>' +
      (App.isAdmin() ? '<div class="row" style="background:var(--teal-soft);border-radius:12px;padding:10px 12px;margin-top:12px;color:var(--teal);font-weight:700">' + ic('users') + '<span id="est"></span></div>' : '') + '</div>' +
      '<div class="card"><div class="label">Lainnya</div>' + fld('Rencana materi', '<textarea class="input" id="mt" rows="2">' + val(k.materi) + '</textarea>') + fld('Pemateri', '<input class="input" id="pm" value="' + val(k.pemateri) + '">') + fld('Infaq (Rp)', '<input class="input" id="ij" inputmode="numeric" value="' + (k.infaq || '') + '" placeholder="0">') + '</div>' +
      '<div class="err" id="e" hidden></div><div class="sticky-bar"><a class="btn grow" href="' + (id ? '#/kegiatan/' + esc(id) : '#/kegiatan') + '">Batal</a><button class="btn pri grow" id="sv">Simpan</button></div></form>';
    const q = s => el.querySelector(s), tg = () => kunci ? 'Kelompok' : q('#tg').value;
    function wil() {
      const t = tg(); let h = '';
      if (t === 'Desa') h = fld('Desa *', '<select class="input" id="wv"><option value="">Pilih desa…</option>' + ref.desa.map(d => '<option' + (d.nama === k.wilayah ? ' selected' : '') + '>' + esc(d.nama) + '</option>').join('') + '</select>');
      else if (t === 'Kelompok' && !kunci) h = fld('Kelompok *', '<select class="input" id="wv"><option value="">Pilih kelompok…</option>' + ref.desa.map(d => d.kelompok.map(x => '<option' + (x.nama === k.wilayah ? ' selected' : '') + '>' + esc(x.nama) + '</option>').join('')).join('') + '</select>');
      q('#wl').innerHTML = h; if (q('#wv')) q('#wv').onchange = e => { k.wilayah = e.target.value; taksir(); };
      taksir();
    }
    function taksir() { // perkiraan jumlah peserta aktif, dihitung di perangkat dari daftar jamaah
      if (!q('#est')) return; const t = tg(), w = kunci ? u.kelompok : (q('#wv') ? q('#wv').value : '');
      const n = (st().jamaah || []).filter(j => j.status === 'Aktif' && (t === 'Daerah' || (t === 'Desa' && j.desa === w) || (t === 'Kelompok' && j.kelompok === w)) && (!pil.size || pil.has(j.jenjang)) && (jk === 'LP' || j.jk === jk)).length;
      q('#est').textContent = 'Perkiraan peserta aktif: ' + n + ' orang';
    }
    if (q('#tg')) q('#tg').onchange = () => { k.wilayah = ''; wil(); }; wil();
    q('#sc').onclick = e => { const b = e.target.closest('[data-s]'); if (b) { secara = b.dataset.s; q('#sc').querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b)); } };
    q('#jn').onclick = e => { const b = e.target.closest('[data-j]'); if (b) { pil.has(b.dataset.j) ? pil.delete(b.dataset.j) : pil.add(b.dataset.j); b.classList.toggle('on'); taksir(); } };
    q('#jkb').onclick = e => { const b = e.target.closest('[data-k]'); if (b) { jk = b.dataset.k; q('#jkb').querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b)); taksir(); } };
    q('#f').onsubmit = async ev => {
      ev.preventDefault(); const e = q('#e'), b = q('#sv'); e.hidden = true;
      const d = { tingkat: tg(), wilayah: kunci ? u.kelompok : (q('#wv') ? q('#wv').value : ''), nama: q('#nm').value.trim(), secara: secara, tanggal: q('#tn').value, tempat: q('#tp').value.trim(), jamMulai: q('#jm').value, jamSelesai: q('#js').value,
        jenjang: Array.from(pil), jk: jk, materi: q('#mt').value.trim(), pemateri: q('#pm').value.trim(), infaq: Number(String(q('#ij').value).replace(/\D/g, '')) || 0 };
      if (id) d.id = id;
      if (!d.nama || !d.tanggal || (d.tingkat !== 'Daerah' && !d.wilayah)) { e.textContent = 'Nama, tanggal, dan wilayah wajib diisi.'; e.hidden = false; return; }
      b.disabled = true; b.textContent = 'Menyimpan…';
      try { const r = await API.tulis('kegiatan.save', d, INV); App.toast('Kegiatan tersimpan', 'ok'); App.go('#/kegiatan/' + r.id); segarkan(); }
      catch (x) { b.disabled = false; b.textContent = 'Simpan'; e.textContent = x.message; e.hidden = false; }
    };
  }

  App.views.kegiatan = { render(ctx) {
    const p = ctx.params, el = ctx.el;
    if (!p.length) return daftar(el);
    if (p[0] === 'baru' || p[0] === 'ubah') { if (!App.isAdmin()) return App.go('#/kegiatan'); return form(el, p[0] === 'ubah' ? p[1] : null); }
    return detail(el, p[0]);
  } };
})();
