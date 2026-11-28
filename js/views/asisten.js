/* Asisten: menu sendiri untuk bertanya apa saja tentang aplikasi & data (sesuai hak akses). Memakai penyedia AI yang diatur Admin Daerah. */
(function () {
  const { esc, ic } = App;
  const fmt = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  const kunci = () => 'rs_chat_' + (App.state.user ? App.state.user.username : '');
  const muatRiwayat = () => { try { return JSON.parse(sessionStorage.getItem(kunci()) || '[]'); } catch (e) { return []; } };
  const simpan = r => { try { sessionStorage.setItem(kunci(), JSON.stringify(r.slice(-12))); } catch (e) { } };

  App.views.asisten = { render(ctx) {
    const el = ctx.el; App.title('Asisten'); let riwayat = muatRiwayat(), sibuk = false;
    const adm = App.isAdmin(), saran = adm
      ? ['Ringkas kehadiran bulan ini', 'Kelompok mana yang belum absen pengajian tingkat daerah?', 'Berapa total infaq tahun ini?', 'Berapa jumlah guru MT, MS, dan Asisten?', 'Bagaimana cara impor data jamaah?']
      : ['Kegiatan apa yang akan datang?', 'Bagaimana cara mengabsen?', 'Bagaimana kehadiran bulan ini?'];
    el.innerHTML = '<div class="row between" style="margin-bottom:10px"><h1 class="row" style="font-size:20px;gap:8px">' + ic('sparkles') + ' Asisten</h1><button class="btn sm" id="bar" ' + (riwayat.length ? '' : 'hidden') + '>Percakapan baru</button></div>' +
      '<div id="nonaktif" class="card" hidden style="background:var(--teal-soft);border-color:transparent"><b>Asisten belum aktif</b><div class="muted" style="margin-top:4px;font-size:13px">Admin Daerah perlu mengisi kunci AI di <b>Saya → Pengaturan → Penyedia AI</b>.</div>' +
      (App.isSuper() ? '<a class="btn pri sm" href="#/pengaturan/ai" style="margin-top:10px">Buka Penyedia AI</a>' : '') + '</div>' +
      '<div class="chat" id="ch"></div><div class="row" id="sg" style="flex-wrap:wrap;gap:6px;margin:10px 0"></div>' +
      '<form class="askbar row" id="f"><input class="input" id="m" placeholder="Tanya tentang kegiatan, absensi, data, atau cara pakai…" maxlength="800" autocomplete="off"><button class="btn pri" aria-label="Kirim">' + ic('chevron') + '</button></form>' +
      '<div class="muted" style="font-size:11px">Asisten hanya membaca data sesuai hak akses Anda dan bisa keliru. Periksa kembali angka penting.</div>';
    const q = s => el.querySelector(s), ch = q('#ch'), m = q('#m');
    function bub(r, t, info) {
      const d = document.createElement('div'); d.className = 'msg ' + (r === 'user' ? 'u' : 'a'); d.innerHTML = fmt(t) + (info ? '<div class="muted" style="font-size:10px;margin-top:4px">' + esc(info) + '</div>' : '');
      ch.appendChild(d); d.scrollIntoView({ block: 'end', behavior: 'smooth' }); return d;
    }
    function awal() {
      ch.innerHTML = ''; const nama = (App.state.user.nama || '').split(' ')[0];
      bub('model', 'Halo ' + nama + '! Saya asisten Ruang Sambung. Tanyakan apa saja tentang aplikasi ini: cara memakai, kegiatan, absensi, statistik, infaq, atau keaktifan pengajian.');
      q('#sg').innerHTML = saran.map(x => '<button type="button" class="chip btn-chip">' + esc(x) + '</button>').join('');
    }
    function pulihkan() { ch.innerHTML = ''; riwayat.forEach(h => bub(h.r, h.t)); q('#sg').innerHTML = ''; }
    riwayat.length ? pulihkan() : awal();
    if (!App.state.ai) { q('#nonaktif').hidden = false; }
    q('#sg').onclick = e => { const b = e.target.closest('.chip'); if (b) { m.value = b.textContent; q('#f').requestSubmit(); } };
    q('#bar').onclick = () => { riwayat = []; simpan(riwayat); q('#bar').hidden = true; awal(); };
    q('#f').onsubmit = async ev => {
      ev.preventDefault(); const t = m.value.trim(); if (!t || sibuk) return; sibuk = true; m.value = ''; q('#sg').innerHTML = ''; m.disabled = true;
      bub('user', t); const tunggu = document.createElement('div'); tunggu.className = 'msg a'; tunggu.innerHTML = '<span class="dots"><span></span><span></span><span></span></span>'; ch.appendChild(tunggu); tunggu.scrollIntoView({ block: 'end' });
      try {
        const r = await API.call('ai.chat', { pesan: t, riwayat: riwayat.slice(-6) }, { tulis: true, timeout: 60000 });
        tunggu.remove(); bub('model', r.jawaban, r.penyedia ? 'via ' + r.penyedia + (r.ms ? ' · ' + (r.ms / 1000).toFixed(1) + ' dtk' : '') : '');
        riwayat.push({ r: 'user', t: t }, { r: 'model', t: r.jawaban }); riwayat = riwayat.slice(-12); simpan(riwayat); q('#bar').hidden = false;
      } catch (x) { tunggu.remove(); bub('model', '⚠️ ' + x.message); }
      sibuk = false; m.disabled = false; m.focus();
    };
  } };
})();
