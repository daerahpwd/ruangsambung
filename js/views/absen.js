/* Absensi ceklist: ketuk H/I/S/A per nama. Filter instan (tanpa render ulang), draf tersimpan otomatis,
   hanya perubahan yang dikirim, disimpan sekali jalan. */
(function () {
  const { esc, ic } = App, KODE = { H: 'Hadir', I: 'Izin', S: 'Sakit', A: 'Alfa' }, BALIK = { Hadir: 'H', Izin: 'I', Sakit: 'S', Alfa: 'A' };
  const INV = ['kegiatan.', 'dash.', 'laporan.', 'absen.', 'boot'];

  App.views.absen = { render(ctx) {
    const id = ctx.params[0], el = ctx.el, u = App.state.user, draftKey = 'rs_draft_' + (u ? u.username : '') + '_' + id;
    App.title('Absensi');
    el.innerHTML = '<div id="a">' + App.skeleton(2) + '</div>';
    const root = el.querySelector('#a');
    let kg = null, daftar = [], asli = {}, now = {}, mode = 'semua', kel = '', cari = '', mati = false;

    const dirty = () => Object.keys(now).filter(j => (now[j] || '') !== (asli[j] || ''));
    const simpanDraft = () => { try { const d = {}; dirty().forEach(j => { d[j] = now[j] || ''; }); Object.keys(d).length ? sessionStorage.setItem(draftKey, JSON.stringify(d)) : sessionStorage.removeItem(draftKey); } catch (e) { } };

    function hitung() {
      const c = { Hadir: 0, Izin: 0, Sakit: 0, Alfa: 0 }; let cek = 0;
      daftar.forEach(j => { const s = now[j.id]; if (s) { cek++; c[s]++; } });
      const t = daftar.length, ch = dirty().length;
      root.querySelector('#pg').textContent = cek + ' dari ' + t + ' sudah dicek';
      root.querySelector('#pb').style.width = (t ? cek * 100 / t : 0) + '%';
      root.querySelector('#ct').textContent = 'H ' + c.Hadir + ' · I ' + c.Izin + ' · S ' + c.Sakit + ' · A ' + c.Alfa;
      const sv = root.querySelector('#sv'); sv.disabled = !ch; sv.textContent = ch ? 'Simpan (' + ch + ' perubahan)' : 'Simpan Absensi';
    }
    function setRow(r, s) {
      r.querySelectorAll('.hs').forEach(b => b.classList.toggle('on', BALIK[s] === b.dataset.c));
      r.dataset.s = s || '';
    }
    function saring() { // sembunyikan/tampilkan baris, tanpa membangun ulang HTML => instan
      const t = cari.toLowerCase(); const adaPerKel = {};
      root.querySelectorAll('.arow').forEach(r => {
        const j = r._j, ok = (!t || j.nama.toLowerCase().indexOf(t) > -1) && (!kel || j.kelompok === kel) && (mode === 'semua' || !now[j.id]);
        r.hidden = !ok; if (ok) adaPerKel[j.kelompok] = (adaPerKel[j.kelompok] || 0) + 1;
      });
      root.querySelectorAll('.grp').forEach(g => { const n = adaPerKel[g.dataset.k] || 0; g.hidden = !n; g.querySelector('b').textContent = n; });
      root.querySelector('#kosong').hidden = Object.keys(adaPerKel).length > 0;
    }
    function gambar() {
      const kelompok = Array.from(new Set(daftar.map(j => j.kelompok))), op = u.role === 'operator_l' || u.role === 'operator_p';
      let h = '<a href="#/kegiatan/' + esc(id) + '" class="row muted" style="margin-bottom:8px">' + ic('back') + ' Detail kegiatan</a>' +
        '<div class="card" style="padding:14px"><h1 style="font-size:18px">' + esc(kg.nama) + '</h1><div class="muted" style="font-size:12px;margin:2px 0 10px">' + esc(App.tgl(kg.tanggal)) + (op ? ' · Peserta: ' + (u.role === 'operator_l' ? 'Laki-laki' : 'Perempuan') : '') + '</div>' +
        '<div class="row between"><b id="pg"></b><span class="muted" id="ct" style="font-size:12px"></span></div><div class="bar" style="margin-top:6px"><i id="pb" style="background:var(--teal);width:0"></i></div></div>' +
        '<div style="position:relative;margin-bottom:8px"><span style="position:absolute;left:12px;top:12px;color:var(--tx2)">' + ic('search') + '</span><input class="input" id="cr" placeholder="Cari nama" style="padding-left:40px" autocomplete="off"></div>' +
        '<div class="row" style="flex-wrap:wrap;margin-bottom:6px"><button class="chip btn-chip on" data-m="semua">Semua</button><button class="chip btn-chip" data-m="belum">Belum dicek</button>' +
        (kelompok.length > 1 ? '<select class="input" id="fk" style="width:auto;height:34px"><option value="">Semua kelompok</option>' + kelompok.map(k => '<option>' + esc(k) + '</option>').join('') + '</select>' : '') +
        '<button class="btn sm" id="th" style="margin-left:auto">Tandai semua hadir</button></div><div class="card" style="padding:4px 14px" id="ls">';
      let g = null;
      daftar.forEach((j, i) => {
        if (j.kelompok !== g) { g = j.kelompok; h += '<div class="grp" data-k="' + esc(g) + '"><span class="dot" style="background:' + App.warnaDesa(j.desa) + '"></span>' + esc(g) + ' · <b></b></div>'; }
        h += '<div class="arow" data-i="' + i + '"><div class="tile" style="width:36px;height:36px;font-size:12px">' + esc(App.inisial(j.nama)) + '</div><div class="grow"><b style="font-size:14px">' + esc(j.nama) + '</b><div class="muted" style="font-size:11px">' + esc(j.jenjang) + '</div></div>' +
          '<div class="hh">' + ['H', 'I', 'S', 'A'].map(c => '<button class="hs ' + c + '" data-c="' + c + '" aria-label="' + KODE[c] + '">' + c + '</button>').join('') + '</div></div>';
      });
      h += '</div><div class="empty" id="kosong" hidden><b>Tidak ada nama</b>Ubah pencarian atau filter.</div>' +
        '<div class="sticky-bar" style="flex-direction:column;gap:6px"><button class="btn pri blk" id="sv" disabled>Simpan Absensi</button></div>';
      root.innerHTML = daftar.length ? h : '<div class="empty"><b>Tidak ada peserta aktif</b>Belum ada jamaah aktif yang sesuai kriteria kegiatan ini.<br><br><a class="btn sm" href="#/kegiatan/' + esc(id) + '">Kembali</a></div>';
      if (!daftar.length) return;
      root.querySelectorAll('.arow').forEach(r => { r._j = daftar[+r.dataset.i]; setRow(r, now[r._j.id]); });

      root.querySelector('#ls').onclick = e => { // satu pendengar untuk semua baris
        const b = e.target.closest('.hs'); if (!b) return; const r = b.closest('.arow'), j = r._j, s = KODE[b.dataset.c];
        now[j.id] = now[j.id] === s ? '' : s; setRow(r, now[j.id]); hitung(); simpanDraft(); if (mode === 'belum') saring();
      };
      let tm; root.querySelector('#cr').oninput = e => { clearTimeout(tm); tm = setTimeout(() => { cari = e.target.value; saring(); }, 80); };
      root.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; root.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b)); saring(); });
      if (root.querySelector('#fk')) root.querySelector('#fk').onchange = e => { kel = e.target.value; saring(); };
      root.querySelector('#th').onclick = () => { root.querySelectorAll('.arow:not([hidden])').forEach(r => { now[r._j.id] = 'Hadir'; setRow(r, 'Hadir'); }); hitung(); simpanDraft(); if (mode === 'belum') saring(); };
      root.querySelector('#sv').onclick = async ev => {
        const b = ev.currentTarget, items = dirty().map(j => ({ j: j, s: now[j] || '' })); if (!items.length) return;
        b.disabled = true; b.textContent = 'Menyimpan…';
        try {
          const r = await API.tulis('absen.save', { id: id, items: items }, INV);
          asli = Object.assign({}, now); sessionStorage.removeItem(draftKey); mati = true; hitung();
          App.toast('Absensi tersimpan' + (r.ditolak ? ' (' + r.ditolak + ' ditolak)' : ''), 'ok'); App.go('#/kegiatan/' + id); App.boot().catch(() => { });
        } catch (x) { App.galat(x); hitung(); }
      };
      hitung(); saring();
    }

    API.baca('absen.get', { id: id }, { segar: 0, onData: (d, cache) => {
      if (kg && !cache) { // data segar tiba setelah tampil dari cache: pertahankan ketukan pengguna
        const mine = {}; dirty().forEach(j => { mine[j] = now[j] || ''; });
        asli = {}; now = {}; d.daftar.forEach(j => { asli[j.id] = j.status; now[j.id] = j.status; });
        Object.keys(mine).forEach(j => { if (j in now) now[j] = mine[j]; });
        daftar = d.daftar; kg = d.kegiatan; gambar(); return;
      }
      kg = d.kegiatan; daftar = d.daftar; asli = {}; now = {}; daftar.forEach(j => { asli[j.id] = j.status; now[j.id] = j.status; });
      try { const dr = JSON.parse(sessionStorage.getItem(draftKey) || '{}'); Object.keys(dr).forEach(j => { if (j in now) now[j] = dr[j]; }); } catch (e) { } // pulihkan draf
      gambar();
    }, onGalat: App.galat }).catch(e => { root.innerHTML = '<div class="empty"><b>Tidak dapat memuat absensi</b>' + esc(e.message) + '</div>'; });

    const peringatan = e => { if (dirty().length && !mati) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', peringatan);
    return () => window.removeEventListener('beforeunload', peringatan);
  } };
})();
