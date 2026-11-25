/* app.js — inti: router hash, tema, navigasi per peran, toast/sheet, sesi & boot cepat.
   Halaman didaftarkan lewat App.views.nama = { render(ctx) } dan dimuat lazy dari js/views/nama.js */
(function () {
  const C = window.RS_CONFIG, $ = (s, r) => (r || document).querySelector(s);
  const App = window.App = { views: {}, state: { user: null, ref: null, ai: false, jamaah: null }, ls: {} };
  const SA = 'super_admin', AK = 'admin_kelompok';

  // ---------- Util ----------
  App.$ = $;
  App.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const IC = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', chevron: '<path d="m9 18 6-6-6-6"/>', back: '<path d="m15 18-6-6 6-6"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
    sparkles: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4M21 5h-4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9"/>', lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>', download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    whatsapp: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>', chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>', map: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>'
  };
  App.ic = (n, sz) => '<svg class="ic" width="' + (sz || 20) + '" height="' + (sz || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || '') + '</svg>';
  const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  App.tgl = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? (+m[3]) + ' ' + BLN[+m[2] - 1] + ' ' + m[1] : (s || '-'); };
  App.rupiah = n => (Number(n) ? 'Rp ' + String(Number(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '-');
  App.inisial = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  App.peran = { super_admin: 'Super Admin', admin_kelompok: 'Admin Kelompok', operator_l: 'Operator Laki-laki', operator_p: 'Operator Perempuan' };
  App.isAdmin = () => !!App.state.user && [SA, AK].indexOf(App.state.user.role) > -1;
  App.isSuper = () => !!App.state.user && App.state.user.role === SA;
  App.warnaDesa = d => { const x = ((App.state.ref || {}).desa || []).filter(v => v.nama === d)[0]; return x ? x.warna : '#9aa7b8'; };
  App.skeleton = (n) => Array.from({ length: n || 3 }, () => '<div class="card"><div class="sk" style="height:14px;width:40%;margin-bottom:12px"></div><div class="sk" style="height:34px;width:30%;margin-bottom:12px"></div><div class="sk" style="height:8px"></div></div>').join('');
  App.title = (t, sub) => { $('#tbTitle').textContent = t; $('#tbSub').textContent = (sub || 'RUANG SAMBUNG').toUpperCase(); document.title = t + ' · ' + C.APP_NAME; };
  App.go = h => { if (location.hash === h) route(); else location.hash = h; };

  // Event sederhana (mis. 'boot' saat data awal diperbarui)
  const subs = {};
  App.on = (e, f) => { (subs[e] = subs[e] || []).push(f); return () => { subs[e] = (subs[e] || []).filter(x => x !== f); }; };
  App.emit = (e, d) => (subs[e] || []).slice().forEach(f => { try { f(d); } catch (x) { console.error(x); } });

  // ---------- Toast & Sheet ----------
  App.toast = (msg, tipe) => {
    const t = document.createElement('div'); t.className = 'toast ' + (tipe || ''); t.textContent = msg; $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), 3200);
  };
  App.sheet = (html) => { $('#sheetBody').innerHTML = html; $('#sheet').classList.add('on'); return $('#sheetBody'); };
  App.sheetTutup = () => { $('#sheet').classList.remove('on'); $('#sheetBody').innerHTML = ''; };
  $('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet' || e.target.closest('[data-tutup]')) App.sheetTutup(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') App.sheetTutup(); });
  App.galat = e => App.toast(e && e.message ? e.message : 'Terjadi kesalahan.', 'err');

  // ---------- Tema (terang / gelap / ikuti sistem) ----------
  App.tema = () => localStorage.getItem('rs_theme') || 'system';
  App.setTema = m => { localStorage.setItem('rs_theme', m); terapkanTema(); };
  function terapkanTema() {
    const m = App.tema(), gelap = m === 'dark' || (m === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.mode = gelap ? 'dark' : 'light';
    $('#themeColor').content = gelap ? '#1B2E4F' : '#14233F';
    $('#btnTheme').innerHTML = App.ic(gelap ? 'sun' : 'moon');
  }
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', terapkanTema);
  $('#btnTheme').onclick = () => App.setTema(document.documentElement.dataset.mode === 'dark' ? 'light' : 'dark');

  // ---------- Navigasi per peran ----------
  function bangunNav() {
    const u = App.state.user, adm = App.isAdmin();
    const item = [['beranda', 'Beranda', 'home'], ['kegiatan', 'Kegiatan', 'calendar'], adm && ['data', 'Data', 'users'], ['saya', 'Saya', 'user']].filter(Boolean);
    const tengah = Math.ceil(item.length / 2);
    $('#nav').innerHTML = item.map((x, i) => (i === tengah ? '<span class="gap"></span>' : '') + '<a href="#/' + x[0] + '" data-k="' + x[0] + '">' + App.ic(x[2]) + '<span>' + x[1] + '</span></a>').join('');
    document.body.dataset.fab = adm ? '1' : '0';
    $('#fab').innerHTML = App.ic('plus', 26);
    $('#btnAI').hidden = !App.state.ai;
    if (u) $('#btnAI').innerHTML = App.ic('sparkles');
  }
  $('#fab').onclick = () => App.go('#/kegiatan/baru');
  $('#btnAI').onclick = async () => { await muatView('ai'); App.views.ai && App.views.ai.buka(); };
  document.addEventListener('click', e => { const a = e.target.closest('[data-go]'); if (a) { e.preventDefault(); App.go(a.dataset.go); } });

  // ---------- Router (hash) + muat halaman lazy ----------
  let tok = 0, bersih = null;
  const dimuat = {};
  function muatView(n) {
    if (App.views[n]) return Promise.resolve();
    if (dimuat[n]) return dimuat[n];
    return dimuat[n] = new Promise((ok, no) => {
      const s = document.createElement('script'); s.src = 'js/views/' + n + '.js?v=' + C.VERSION;
      s.onload = ok; s.onerror = () => { delete dimuat[n]; no(new Error('Gagal memuat halaman ' + n)); }; document.head.appendChild(s);
    });
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); App.installEvt = e; App.emit('install'); }); // tombol "Pasang aplikasi" di menu Saya
  App.muat = muatView; // dipakai halaman lain untuk memuat modul lazy (mis. 'wa', 'ai')
  const ALIAS = { absen: 'kegiatan' };
  function parse() { const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent); return { nama: p[0] || 'beranda', params: p.slice(1) }; }
  async function route() {
    const r = parse(), my = ++tok, u = App.state.user;
    if (!u && r.nama !== 'login') return location.replace('#/login');
    if (u && r.nama === 'login') return location.replace('#/beranda');
    if (u && r.nama === 'data' && !App.isAdmin()) return location.replace('#/beranda');
    document.body.dataset.shell = r.nama === 'login' ? 'bare' : 'app';
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.k === (ALIAS[r.nama] || r.nama)));
    App.sheetTutup(); if (typeof bersih === 'function') { try { bersih(); } catch (e) { } bersih = null; }
    const el = $('#view'); el.innerHTML = App.skeleton(2);
    try {
      await muatView(r.nama);
      if (my !== tok) return;
      const v = App.views[r.nama];
      if (!v) { el.innerHTML = '<div class="empty"><b>Halaman belum tersedia</b>Fitur ini dibuat pada bagian berikutnya.</div>'; return; }
      el.innerHTML = ''; window.scrollTo(0, 0);
      bersih = await v.render({ el: el, params: r.params, rute: r });
    } catch (e) { if (my === tok) el.innerHTML = '<div class="empty"><b>Tidak dapat memuat halaman</b>' + App.esc(e.message) + '<br><br><button class="btn pri" onclick="location.reload()">Muat ulang</button></div>'; }
  }
  window.addEventListener('hashchange', route);

  // ---------- Sesi & boot ----------
  App.masuk = (token, user) => { API.setSession(token, user.username); App.state.user = user; };
  App.keluar = () => { API.clear(); App.state.user = null; App.state.jamaah = null; $('#nav').innerHTML = ''; location.hash = '#/login'; };
  API.onAuth = () => { if (App.state.user) { App.toast('Sesi berakhir, silakan masuk lagi.', 'warn'); App.keluar(); } };

  function terapBoot(d) {
    Object.assign(App.state, { user: d.user, ref: d.ref, ai: !!d.ai });
    if (d.jamaah) App.state.jamaah = d.jamaah.rows;
    if (d.beranda) App.state.beranda = d.beranda;
    bangunNav(); App.emit('boot', d);
  }
  let diroute = false;
  // Muat awal 1 panggilan (server mengabaikan jamaah untuk operator). Dipakai juga setelah login.
  App.boot = function () {
    return API.baca('boot', { jamaah: true }, { segar: 0, onData: (d, cache) => { terapBoot(d); if (cache) { diroute = true; route(); } } });
  };

  async function mulai() {
    terapkanTema();
    document.addEventListener('visibilitychange', () => { if (!document.hidden && App.state.user) API.baca('boot', { jamaah: true }, { segar: 60000, onData: (d, c) => !c && terapBoot(d) }).catch(() => { }); });
    const up = () => document.body.classList.toggle('offline', !navigator.onLine); addEventListener('online', up); addEventListener('offline', up); up();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
    if (!API.hasToken()) return route();
    document.body.dataset.shell = 'app'; $('#view').innerHTML = App.skeleton(2);
    try { await App.boot(); } catch (e) { if (!App.state.user) { if (e.jaringan) { $('#view').innerHTML = '<div class="empty"><b>Tidak ada koneksi</b>' + App.esc(e.message) + '</div>'; return; } API.clear(); } }
    if (!diroute) route();
  }
  App.rute = route;
  mulai();
})();
