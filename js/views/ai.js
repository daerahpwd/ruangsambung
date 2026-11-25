/* Asisten AI (Gemini): obrolan singkat di lembar bawah. Hanya membaca data sesuai hak pengguna. */
(function () {
  const { esc, ic } = App; let riwayat = [];
  const fmt = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  const SARAN = ['Ringkas kehadiran bulan ini', 'Kegiatan apa yang akan datang?', 'Buatkan pesan WA untuk kegiatan terdekat'];
  App.views.ai = {
    render() { },
    buka() {
      const s = App.sheet('<div class="row between" style="margin-bottom:8px"><h3 class="row" style="gap:8px">' + ic('sparkles') + ' Asisten</h3><button class="btn sm" data-tutup aria-label="Tutup">' + ic('x', 16) + '</button></div>' +
        '<div id="ch" style="min-height:180px;max-height:48vh;overflow:auto"></div><div class="row" id="sg" style="flex-wrap:wrap;gap:6px;margin:8px 0"></div>' +
        '<form id="f" class="row"><input class="input" id="m" placeholder="Tanya sesuatu…" maxlength="800" autocomplete="off"><button class="btn pri" aria-label="Kirim">' + ic('chevron') + '</button></form><div class="muted" style="font-size:11px;margin-top:6px">Asisten hanya membaca data dan bisa keliru; periksa kembali angka penting.</div>');
      const ch = s.querySelector('#ch'), f = s.querySelector('#f'), m = s.querySelector('#m'), sg = s.querySelector('#sg');
      const gelembung = (r, t) => { const d = document.createElement('div'); d.style.cssText = 'margin:6px 0;display:flex;justify-content:' + (r === 'user' ? 'flex-end' : 'flex-start'); d.innerHTML = '<div style="max-width:86%;padding:9px 12px;border-radius:14px;' + (r === 'user' ? 'background:var(--teal);color:#fff' : 'background:var(--alt)') + '">' + fmt(t) + '</div>'; ch.appendChild(d); ch.scrollTop = ch.scrollHeight; return d; };
      riwayat.forEach(h => gelembung(h.r, h.t));
      if (!riwayat.length) { gelembung('model', 'Halo ' + App.state.user.nama.split(' ')[0] + '! Saya bisa membantu membaca ringkasan data, daftar kegiatan, dan menyusun pesan WhatsApp.'); sg.innerHTML = SARAN.map(x => '<button type="button" class="chip btn-chip">' + esc(x) + '</button>').join(''); }
      sg.onclick = e => { const b = e.target.closest('.chip'); if (b) { m.value = b.textContent; f.requestSubmit(); } };
      f.onsubmit = async ev => {
        ev.preventDefault(); const t = m.value.trim(); if (!t) return; m.value = ''; sg.innerHTML = ''; m.disabled = true;
        gelembung('user', t); const tunggu = gelembung('model', '…');
        try { const r = await API.call('ai.chat', { pesan: t, riwayat: riwayat.slice(-8) }, { tulis: true, timeout: 55000 }); tunggu.remove(); gelembung('model', r.jawaban); riwayat.push({ r: 'user', t: t }, { r: 'model', t: r.jawaban }); riwayat = riwayat.slice(-12); }
        catch (x) { tunggu.remove(); gelembung('model', '⚠️ ' + x.message); }
        m.disabled = false; m.focus();
      };
      setTimeout(() => m.focus(), 80);
    }
  };
})();
