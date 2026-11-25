/* Pengaturan (Super Admin): Pengguna, Referensi wilayah & pilihan, Template WA, Rahasia & AI, Audit */
(function () {
  const { esc, ic } = App;
  const ROLE_PILL = { super_admin: 'background:var(--navy);color:#fff', admin_kelompok: 'background:var(--teal-soft);color:var(--teal)', operator_l: 'background:#DBEAFE;color:#1D4ED8', operator_p: 'background:#FCE7F3;color:#BE185D' };
  const TABS = [['pengguna', 'Pengguna'], ['referensi', 'Referensi'], ['template', 'Template WA'], ['rahasia', 'Rahasia & AI'], ['audit', 'Audit']];
  const kopi = async t => { try { await navigator.clipboard.writeText(t); App.toast('Disalin', 'ok'); } catch (e) { App.toast('Salin manual', 'warn'); } };
  const refresh = async () => { API.invalidasi(['boot']); await App.boot().catch(() => { }); }; // muat ulang referensi/status AI

  // ---------- Pengguna ----------
  function pengguna(box) {
    let rows = null;
    function gambar() {
      if (!rows) { box.innerHTML = App.skeleton(2); return; }
      box.innerHTML = '<div class="row between" style="margin-bottom:10px"><b>' + rows.length + ' pengguna</b><button class="btn pri sm" id="tb">' + ic('plus', 16) + ' Tambah</button></div><div class="card" style="padding:4px 16px"><div class="list">' +
        rows.map(u => '<div><div class="tile">' + esc(App.inisial(u.nama)) + '</div><div class="grow"><b>' + esc(u.nama) + '</b> <span class="muted">@' + esc(u.username) + '</span><div class="row" style="gap:6px;margin-top:3px;flex-wrap:wrap"><span class="pill" style="' + ROLE_PILL[u.peran] + '">' + esc(App.peran[u.peran] || u.peran) + '</span>' +
          (u.kelompok ? '<span class="muted" style="font-size:12px">' + esc(u.kelompok) + '</span>' : '') + (u.aktif ? '' : '<span class="pill p-alfa">Nonaktif</span>') + '</div></div>' +
          '<button class="btn sm" data-u="' + esc(u.username) + '" data-a="ubah">Ubah</button><button class="btn sm" data-u="' + esc(u.username) + '" data-a="pin" aria-label="Reset PIN">' + ic('lock', 16) + '</button></div>').join('') + '</div></div>';
      box.querySelector('#tb').onclick = () => form(null);
    }
    box.onclick = e => { const b = e.target.closest('[data-u]'); if (!b) return; const u = rows.filter(x => x.username === b.dataset.u)[0]; b.dataset.a === 'ubah' ? form(u) : resetPin(u); };
    function tampilPin(judul, un, pin) {
      const s = App.sheet('<h3>' + esc(judul) + '</h3><p class="muted">Catat PIN ini sekarang. PIN tidak akan ditampilkan lagi.</p><div class="card" style="text-align:center"><div class="muted">@' + esc(un) + '</div><div style="font-size:30px;font-weight:800;letter-spacing:.15em">' + esc(pin) + '</div></div><div class="row"><button class="btn grow" id="sl">Salin PIN</button><button class="btn pri grow" data-tutup>Selesai</button></div>');
      s.querySelector('#sl').onclick = () => kopi(pin);
    }
    function resetPin(u) {
      const s = App.sheet('<h3>Reset PIN @' + esc(u.username) + '?</h3><p class="muted">PIN baru dibuat otomatis dan semua sesi pengguna ini berakhir.</p><div class="row"><button class="btn grow" data-tutup>Batal</button><button class="btn danger grow" id="ya">Reset PIN</button></div>');
      s.querySelector('#ya').onclick = async () => { try { const r = await API.tulis('admin.user.resetPin', { username: u.username }); tampilPin('PIN baru', r.username, r.pinBaru); } catch (x) { App.galat(x); } };
    }
    function form(u) {
      const kel = (App.state.ref.desa || []).reduce((a, d) => a.concat(d.kelompok.map(k => k.nama)), []);
      const s = App.sheet('<h3 style="margin-bottom:10px">' + (u ? 'Ubah pengguna' : 'Tambah pengguna') + '</h3><form id="f"><div class="field"><label>Username</label><input class="input" name="un" value="' + esc(u ? u.username : '') + '"' + (u ? ' disabled' : '') + ' autocapitalize="none" placeholder="huruf kecil, angka, titik"></div>' +
        '<div class="field"><label>Nama</label><input class="input" name="nm" value="' + esc(u ? u.nama : '') + '"></div><div class="field"><label>Peran</label><select class="input" name="pr">' + Object.keys(App.peran).map(k => '<option value="' + k + '"' + (u && u.peran === k ? ' selected' : '') + '>' + App.peran[k] + '</option>').join('') + '</select></div>' +
        '<div class="field" id="fk"><label>Kelompok</label><select class="input" name="kl">' + kel.map(k => '<option' + (u && u.kelompok === k ? ' selected' : '') + '>' + esc(k) + '</option>').join('') + '</select></div>' +
        (u ? '<label class="row" style="margin-bottom:12px"><input type="checkbox" name="ak"' + (u.aktif ? ' checked' : '') + '> Akun aktif</label>' : '<div class="field"><label>PIN awal (opsional, 6-12 angka)</label><input class="input" name="pn" inputmode="numeric" placeholder="kosongkan untuk dibuat otomatis"></div>') +
        '<div class="err" id="e" hidden></div><button class="btn pri blk">Simpan</button></form>');
      const f = s.querySelector('#f'), e = s.querySelector('#e'), sync = () => { s.querySelector('#fk').hidden = f.pr.value !== 'admin_kelompok'; }; f.pr.onchange = sync; sync();
      f.onsubmit = async ev => {
        ev.preventDefault(); e.hidden = true;
        try {
          const r = await API.tulis('admin.user.save', { username: u ? u.username : f.un.value, nama: f.nm.value, peran: f.pr.value, kelompok: f.kl.value, aktif: u ? f.ak.checked : true, pin: f.pn ? f.pn.value : '' }, ['admin.user.']);
          rows = null; gambar(); load(); App.sheetTutup(); App.toast('Pengguna tersimpan', 'ok'); if (r.pinAwal) tampilPin('Pengguna dibuat', r.username, r.pinAwal);
        } catch (x) { e.textContent = x.message; e.hidden = false; }
      };
    }
    function load() { API.baca('admin.user.list', {}, { segar: 0, onData: x => { rows = x; gambar(); }, onGalat: App.galat }).catch(App.galat); }
    gambar(); load();
  }

  // ---------- Referensi ----------
  const LISTS = [['jenjang', 'Jenjang'], ['status_keluarga', 'Status dalam keluarga'], ['domisili', 'Domisili & hunian'], ['pendidikan', 'Pendidikan'], ['guru', 'Guru'], ['nama_kegiatan', 'Nama kegiatan (saran)']];
  function referensi(box) {
    function gambar() {
      const ref = App.state.ref;
      box.innerHTML = '<div class="muted" style="font-size:12px;margin-bottom:8px">Desa tetap 4. Kelompok dan sub yang masih dipakai data jamaah tidak bisa dihapus.</div>' +
        ref.desa.map(d => '<div class="card"><div class="row between"><div class="label" style="margin:0"><span class="dot" style="background:' + esc(d.warna) + '"></span>' + esc(d.nama) + ' · ' + d.kelompok.length + ' kelompok</div><button class="btn sm" data-add="kelompok" data-induk="' + esc(d.nama) + '">+ Kelompok</button></div><div class="list">' +
          d.kelompok.map(k => '<div style="align-items:flex-start"><div class="grow"><b>' + esc(k.nama) + '</b><div class="row" style="flex-wrap:wrap;gap:6px;margin-top:4px">' + k.sub.map(sb => '<span class="chip soft">' + esc(sb) + ' <button data-del="sub" data-v="' + esc(sb) + '" data-induk="' + esc(k.nama) + '" aria-label="Hapus sub" style="background:none;border:0;padding:0">' + ic('x', 12) + '</button></span>').join('') +
            '<button class="chip btn-chip" data-add="sub" data-induk="' + esc(k.nama) + '">+ Sub</button></div></div><button class="btn sm" data-del="kelompok" data-v="' + esc(k.nama) + '" aria-label="Hapus kelompok">' + ic('x', 14) + '</button></div>').join('') + '</div></div>').join('') +
        LISTS.map(l => '<details class="card"><summary style="cursor:pointer;font-weight:700">' + l[1] + ' <span class="muted">(' + ((ref.lists || {})[l[0]] || []).length + ')</span></summary><div class="row" style="flex-wrap:wrap;gap:6px;margin-top:10px">' + ((ref.lists || {})[l[0]] || []).map(v => '<span class="chip">' + esc(v) + ' <button data-del="' + l[0] + '" data-v="' + esc(v) + '" aria-label="Hapus" style="background:none;border:0;padding:0">' + ic('x', 12) + '</button></span>').join('') +
          '<button class="chip btn-chip" data-add="' + l[0] + '">+ Tambah</button></div></details>').join('');
    }
    box.onclick = e => {
      const a = e.target.closest('[data-add]'), d = e.target.closest('[data-del]');
      if (a) { const s = App.sheet('<h3 style="margin-bottom:10px">Tambah ' + esc(a.dataset.add.replace('_', ' ')) + (a.dataset.induk ? ' di ' + esc(a.dataset.induk) : '') + '</h3><form id="f"><div class="field"><input class="input" id="v" maxlength="60" autocomplete="off" placeholder="Nama"></div><div class="err" id="e" hidden></div><button class="btn pri blk">Tambah</button></form>');
        setTimeout(() => s.querySelector('#v').focus(), 60);
        s.querySelector('#f').onsubmit = async ev => { ev.preventDefault(); try { await API.tulis('admin.ref.tambah', { tipe: a.dataset.add, nilai: s.querySelector('#v').value, induk: a.dataset.induk || '' }); await refresh(); App.sheetTutup(); gambar(); App.toast('Ditambahkan', 'ok'); } catch (x) { s.querySelector('#e').textContent = x.message; s.querySelector('#e').hidden = false; } }; }
      if (d) { const s = App.sheet('<h3>Hapus "' + esc(d.dataset.v) + '"?</h3><p class="muted">Data jamaah yang sudah memakai nilai ini tidak diubah.</p><div class="row"><button class="btn grow" data-tutup>Batal</button><button class="btn danger grow" id="ya">Hapus</button></div>');
        s.querySelector('#ya').onclick = async () => { try { await API.tulis('admin.ref.hapus', { tipe: d.dataset.del, nilai: d.dataset.v, induk: d.dataset.induk || '' }); await refresh(); App.sheetTutup(); gambar(); App.toast('Dihapus', 'ok'); } catch (x) { App.sheetTutup(); App.galat(x); } }; }
    };
    gambar();
  }

  // ---------- Template WA ----------
  const PH = { info_kegiatan: ['nama_kegiatan', 'tingkat', 'tanggal', 'hari', 'jam_mulai', 'jam_selesai', 'tempat', 'secara', 'materi', 'pemateri', 'infaq', 'peserta'], rekap_absensi: ['nama_kegiatan', 'tingkat', 'tanggal', 'hari', 'tempat', 'rekap_hadir'], data_lansia: ['wilayah', 'jumlah', 'daftar'] };
  const CONTOH = { nama_kegiatan: 'Pengajian Daerah Umum', tingkat: 'Daerah', tanggal: '28 Nov 2026', hari: 'Sabtu', jam_mulai: '19:30', jam_selesai: '21:00', tempat: 'Masjid Al-Ikhlas', secara: 'Offline', materi: 'Adab menuntut ilmu', pemateri: 'Ust. Ali', infaq: 'Rp 10.000', peserta: 'Dewasa, Lansia', rekap_hadir: 'Hadir: 80 (67%)\nIzin: 10\nSakit: 5\nAlfa: 25', wilayah: 'Daerah Purwodadi', jumlah: '2', daftar: '1. Mbah Karto (72 th) - Sukorejo\n2. Mbah Siti (68 th) - Kejawan' };
  function template(box) {
    box.innerHTML = App.skeleton(2);
    API.baca('wa.template.list', {}, { segar: 0, onGalat: App.galat }).then(list => {
      box.innerHTML = '<div class="muted" style="font-size:12px;margin-bottom:8px">Ketuk placeholder untuk menyisipkan ke teks. Pesan dikirim lewat tautan WhatsApp, tanpa biaya.</div>' + list.map(t => '<div class="card" data-k="' + esc(t.kode) + '"><div class="row between"><div class="label" style="margin:0">' + esc(t.nama) + '</div><label class="row" style="gap:6px"><input type="checkbox" class="ak"' + (t.aktif ? ' checked' : '') + '> Aktif</label></div>' +
        '<textarea class="input tx" rows="8" style="margin:10px 0">' + esc(t.isi) + '</textarea><div class="row" style="flex-wrap:wrap;gap:6px">' + (PH[t.kode] || []).map(p => '<button type="button" class="chip btn-chip" data-p="' + p + '">{' + p + '}</button>').join('') + '</div>' +
        '<div class="muted" style="font-size:11px;margin:10px 0 4px">Pratinjau</div><div class="pv" style="background:var(--teal-soft);border-radius:14px;padding:10px 12px;white-space:pre-wrap;font-size:13px"></div><button class="btn pri blk sv" style="margin-top:10px">Simpan template</button></div>').join('');
      const pv = c => { const tx = c.querySelector('.tx').value.replace(/\{(\w+)\}/g, (m, k) => CONTOH[k] !== undefined ? CONTOH[k] : m); c.querySelector('.pv').textContent = tx.replace(/\*(.+?)\*/g, '$1'); };
      box.querySelectorAll('[data-k]').forEach(c => { pv(c); c.querySelector('.tx').oninput = () => pv(c);
        c.onclick = async e => {
          const p = e.target.closest('[data-p]'), sv = e.target.closest('.sv'), ta = c.querySelector('.tx');
          if (p) { const i = ta.selectionStart, t = '{' + p.dataset.p + '}'; ta.value = ta.value.slice(0, i) + t + ta.value.slice(ta.selectionEnd); ta.focus(); ta.setSelectionRange(i + t.length, i + t.length); pv(c); }
          if (sv) { sv.disabled = true; try { await API.tulis('wa.template.save', { kode: c.dataset.k, isi: ta.value, aktif: c.querySelector('.ak').checked }, ['wa.']); App.toast('Template tersimpan', 'ok'); } catch (x) { App.galat(x); } sv.disabled = false; }
        }; });
    }).catch(e => { box.innerHTML = '<div class="empty"><b>Gagal memuat</b>' + esc(e.message) + '</div>'; });
  }

  // ---------- Rahasia & AI ----------
  function rahasia(box) {
    const BARIS = [['GEMINI_API_KEY', 'Kunci API Gemini', true], ['GEMINI_MODEL', 'Model Gemini', false], ['AI_AKTIF', 'Asisten AI aktif', 'sw'], ['FONNTE_TOKEN', 'Token Fonnte (opsional)', true], ['FONNTE_AKTIF', 'Pengiriman Fonnte aktif', 'sw']];
    async function simpan(k, v) { try { await API.tulis('admin.rahasia.save', { kunci: k, nilai: v }, ['admin.rahasia.']); App.toast('Tersimpan', 'ok'); await refresh(); muat(); } catch (x) { App.galat(x); } }
    function gambar(d) {
      box.innerHTML = '<div class="card" style="background:var(--teal-soft);border-color:transparent;font-size:13px"><b>Asisten AI gratis (Google AI Studio)</b><br>Buat kunci di <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" style="color:var(--teal);font-weight:700">aistudio.google.com</a>, tempel di bawah, lalu aktifkan. Nilai kunci disimpan di server (Script Properties) dan tidak pernah ditampilkan utuh.' +
        '<div class="muted" style="margin-top:6px">Catatan privasi: paket gratis Gemini dapat memakai data untuk peningkatan produk Google. Asisten hanya mengirim data minimum (nama, kelompok, jenjang, umur).</div></div>' +
        BARIS.map(b => { const it = d[b[0]] || {}; return '<div class="card" data-k="' + b[0] + '"><div class="row between"><b>' + b[1] + '</b>' + (b[2] === 'sw' ? '<label class="row" style="gap:6px"><input type="checkbox" class="sw"' + (it.nilai === 'YA' ? ' checked' : '') + '> ' + (it.nilai === 'YA' ? 'Aktif' : 'Nonaktif') + '</label>' : '<span class="pill ' + (it.terisi ? 'p-aktif' : 'p-belum') + '">' + (it.terisi ? 'Terisi' : 'Kosong') + '</span>') + '</div>' +
          (b[2] === 'sw' ? '' : (it.terisi ? '<div class="muted" style="margin-top:4px">' + esc(it.nilai) + '</div>' : '') + '<div class="row" style="margin-top:8px"><input class="input v" ' + (b[2] === true ? 'type="password" autocomplete="off"' : '') + ' placeholder="' + (b[0] === 'GEMINI_MODEL' ? 'gemini-2.5-flash (bawaan)' : 'Tempel nilai baru') + '"><button class="btn pri sm s">Simpan</button>' + (it.terisi ? '<button class="btn danger sm h">Hapus</button>' : '') + '</div>') + '</div>'; }).join('');
      box.querySelectorAll('[data-k]').forEach(c => {
        const k = c.dataset.k, sw = c.querySelector('.sw'), s = c.querySelector('.s'), h = c.querySelector('.h');
        if (sw) sw.onchange = () => simpan(k, sw.checked ? 'YA' : '');
        if (s) s.onclick = () => { const v = c.querySelector('.v').value.trim(); if (v) simpan(k, v); };
        if (h) h.onclick = () => simpan(k, '');
      });
    }
    function muat() { API.baca('admin.rahasia.get', {}, { segar: 0, onData: gambar, onGalat: App.galat }).catch(App.galat); }
    box.innerHTML = App.skeleton(2); muat();
  }

  // ---------- Audit ----------
  function audit(box) {
    box.innerHTML = App.skeleton(1);
    API.baca('admin.audit', {}, { segar: 0, onGalat: App.galat }).then(rows => {
      box.innerHTML = '<div class="card" style="padding:4px 16px"><div class="list">' + (rows.length ? rows.map(r => '<div style="align-items:flex-start"><div class="grow"><b style="font-size:13px">' + esc(r.Aksi) + '</b> <span class="muted" style="font-size:12px">@' + esc(r.Pengguna) + '</span><div class="muted" style="font-size:11px;word-break:break-all">' + esc(r.Detail) + '</div></div><span class="muted" style="font-size:11px;white-space:nowrap">' + esc(new Date(r.Waktu).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })) + '</span></div>').join('') : '<div class="empty">Belum ada catatan</div>') + '</div></div>';
    }).catch(e => { box.innerHTML = '<div class="empty"><b>Gagal memuat</b>' + esc(e.message) + '</div>'; });
  }

  App.views.pengaturan = { render(ctx) {
    if (!App.isSuper()) return App.go('#/beranda');
    const tab = (TABS.filter(t => t[0] === ctx.params[0])[0] || TABS[0])[0]; App.title('Pengaturan');
    ctx.el.innerHTML = '<a href="#/saya" class="row muted" style="margin-bottom:8px">' + ic('back') + ' Saya</a><h1 style="font-size:20px;margin-bottom:10px">Pengaturan</h1><div class="row" style="overflow-x:auto;gap:6px;margin-bottom:12px;padding-bottom:2px">' +
      TABS.map(t => '<a class="chip btn-chip' + (t[0] === tab ? ' on' : '') + '" href="#/pengaturan/' + t[0] + '" style="height:36px;padding:0 14px;white-space:nowrap">' + t[1] + '</a>').join('') + '</div><div id="bx"></div>';
    const box = ctx.el.querySelector('#bx');
    ({ pengguna: pengguna, referensi: referensi, template: template, rahasia: rahasia, audit: audit })[tab](box);
  } };
})();
