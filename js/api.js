/* api.js — klien REST untuk backend GAS.
   Cepat: cache stale-while-revalidate (tampil instan dari penyimpanan, perbarui di belakang),
   permintaan identik digabung (dedup), percobaan ulang saat jaringan putus, dan batch 1 round-trip. */
(function () {
  const C = window.RS_CONFIG, PRE = 'rs_c_';
  let token = localStorage.getItem('rs_token') || '', who = localStorage.getItem('rs_who') || '';
  const inflight = new Map(), mem = new Map();
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const kunci = (a, d) => PRE + who + '|' + a + '|' + JSON.stringify(d || {});

  function simpan(k, val) {
    const e = { t: Date.now(), d: val };
    mem.set(k, e);
    try { localStorage.setItem(k, JSON.stringify(e)); } catch (x) { /* penyimpanan penuh: abaikan, memori tetap */ }
  }
  function baca(k) {
    if (mem.has(k)) return mem.get(k);
    try { const s = localStorage.getItem(k); if (s) { const e = JSON.parse(s); mem.set(k, e); return e; } } catch (x) { }
    return null;
  }

  async function kirim(action, data, timeout) {
    if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(C.GAS_URL)) throw new Error('GAS_URL belum diisi di js/config.js');
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), timeout || 25000);
    try {
      const r = await fetch(C.GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token, data: data || {} }), signal: ctl.signal });
      return await r.json();
    } finally { clearTimeout(tm); }
  }

  // Panggilan dasar: dedup + 1x ulang bila jaringan gagal. Kegagalan bisnis => melempar Error(message).
  async function call(action, data, opt) {
    opt = opt || {};
    const k = action + JSON.stringify(data || {});
    if (!opt.tulis && inflight.has(k)) return inflight.get(k);
    const p = (async () => {
      let res, err;
      for (let i = 0; i < (opt.tulis ? 1 : 2); i++) {
        try { res = await kirim(action, data, opt.timeout); err = null; break; } catch (e) { err = e; await sleep(700); }
      }
      if (err) { const e = new Error(err.name === 'AbortError' ? 'Server lambat merespons. Coba lagi.' : (err.message || 'Tidak ada koneksi.')); e.jaringan = true; throw e; }
      if (!res.success) { const e = new Error(res.message || 'Terjadi kesalahan.'); e.code = res.code; e.data = res.data; if (res.code === 'AUTH') API.onAuth && API.onAuth(); throw e; }
      return res.data;
    })();
    if (!opt.tulis) { inflight.set(k, p); p.then(() => inflight.delete(k), () => inflight.delete(k)); }
    return p;
  }

  const API = {
    onAuth: null,
    setSession(t, username) { token = t; who = username || ''; localStorage.setItem('rs_token', t); localStorage.setItem('rs_who', who); },
    hasToken() { return !!token; },
    clear() {
      token = ''; who = ''; mem.clear(); localStorage.removeItem('rs_token'); localStorage.removeItem('rs_who');
      Object.keys(localStorage).filter(k => k.indexOf(PRE) === 0).forEach(k => localStorage.removeItem(k)); // bersihkan data tersimpan saat keluar
    },
    call,
    // Tulis: tidak di-cache, lalu cache bagian terkait dibuang. invalidasi = awalan nama aksi, mis. ['jamaah.','dash.']
    async tulis(action, data, invalidasi) {
      const r = await call(action, data, { tulis: true, timeout: 40000 });
      API.invalidasi(invalidasi || []);
      return r;
    },
    invalidasi(awalan) {
      const cocok = k => awalan.some(a => k.indexOf(PRE + who + '|' + a) === 0);
      [...mem.keys()].filter(cocok).forEach(k => mem.delete(k));
      Object.keys(localStorage).filter(cocok).forEach(k => localStorage.removeItem(k));
    },
    // Baca ber-cache: onData(data, dariCache) dipanggil segera dari cache (jika ada) lalu dengan data segar.
    // segar (ms): jika cache lebih baru dari ini, tidak perlu ke server. Mengembalikan data terbaru.
    async baca(action, data, opt) {
      opt = opt || {};
      const k = kunci(action, data), e = baca(k), segar = opt.segar === undefined ? 15000 : opt.segar;
      if (e && opt.onData) opt.onData(e.d, true);
      if (e && Date.now() - e.t < segar) return e.d;
      try {
        const d = await call(action, data);
        const lama = e && JSON.stringify(e.d);
        simpan(k, d);
        if (opt.onData && (!e || lama !== JSON.stringify(d))) opt.onData(d, false);
        return d;
      } catch (err) {
        if (e) { if (opt.onGalat) opt.onGalat(err); return e.d; } // offline: pakai data tersimpan
        throw err;
      }
    },
    // Banyak aksi baca dalam 1 round-trip. Mengembalikan array {success,data|message}
    async batch(calls) { return call('batch', { calls: calls }); },
    ping() { return fetch(C.GAS_URL + '?action=ping').then(r => r.json()); }
  };
  window.API = API;
})();
