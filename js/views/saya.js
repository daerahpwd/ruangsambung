/* Saya: profil, tema, ganti PIN, pasang aplikasi, pengaturan (Super Admin), keluar */
(function () {
  const { esc, ic } = App, C = window.RS_CONFIG;
  App.views.saya = { render(ctx) {
    const el = ctx.el, u = App.state.user; App.title('Saya');
    function gambar() {
      const t = App.tema(), lepas = App.installEvt;
      el.innerHTML = '<div class="card" style="background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff;border:0;text-align:center"><div class="tile" style="width:64px;height:64px;margin:0 auto 10px;background:rgba(255,255,255,.14);color:#fff;font-size:22px">' + esc(App.inisial(u.nama)) + '</div>' +
        '<div style="font-size:18px;font-weight:700">' + esc(u.nama) + '</div><div style="opacity:.75;font-size:12px">@' + esc(u.username) + ' · ' + esc(App.peran[u.role]) + '</div>' +
        (u.kelompok || u.desa ? '<div class="chip" style="margin-top:10px">' + esc(u.kelompok ? 'Kelompok ' + u.kelompok : 'Desa ' + u.desa) + '</div>' : '') + '</div>' +
        '<div class="card"><div class="label">Tampilan</div><div class="seg" id="tm" style="margin:0">' + [['light', 'Terang'], ['dark', 'Gelap'], ['system', 'Ikuti sistem']].map(x => '<button data-m="' + x[0] + '" class="' + (x[0] === t ? 'on' : '') + '">' + x[1] + '</button>').join('') + '</div></div>' +
        '<div class="card"><div class="label">Akun</div><div class="list">' +
        '<button class="row" id="gp" style="background:none;border:0;text-align:left;width:100%">' + ic('lock') + '<span class="grow"><b>Ganti PIN</b></span>' + ic('chevron', 18) + '</button>' +
        (lepas ? '<button class="row" id="ps" style="background:none;border:0;text-align:left;width:100%">' + ic('download') + '<span class="grow"><b>Pasang aplikasi</b><div class="muted" style="font-size:12px">Tambahkan ke layar utama</div></span>' + ic('chevron', 18) + '</button>' : '') +
        (App.isSuper() ? '<a class="row" href="#/pengaturan">' + ic('gear') + '<span class="grow"><b>Pengaturan</b><div class="muted" style="font-size:12px">Pengguna, referensi, template WA, AI</div></span>' + ic('chevron', 18) + '</a>' : '') +
        (App.isAdmin() ? '<a class="row" href="#/laporan">' + ic('chart') + '<span class="grow"><b>Laporan</b></span>' + ic('chevron', 18) + '</a>' : '') +
        '</div></div><div class="card" style="font-size:12px"><div class="label">Tentang</div>' + esc(C.APP_NAME) + ' v' + esc(C.VERSION) + '<br><span class="muted">Pendataan jamaah &amp; absensi Daerah Purwodadi</span></div>' +
        '<button class="btn danger blk" id="kl">Keluar</button>';
      el.querySelector('#tm').onclick = e => { const b = e.target.closest('[data-m]'); if (b) { App.setTema(b.dataset.m); gambar(); } };
      el.querySelector('#gp').onclick = ganti;
      if (el.querySelector('#ps')) el.querySelector('#ps').onclick = async () => { try { App.installEvt.prompt(); await App.installEvt.userChoice; } catch (e) { } App.installEvt = null; gambar(); };
      el.querySelector('#kl').onclick = () => { const s = App.sheet('<h3>Keluar dari aplikasi?</h3><p class="muted">Data tersimpan di perangkat ini akan dihapus.</p><div class="row"><button class="btn grow" data-tutup>Batal</button><button class="btn danger grow" id="ya">Keluar</button></div>'); s.querySelector('#ya').onclick = () => { App.sheetTutup(); App.keluar(); }; };
    }
    function ganti() {
      const s = App.sheet('<h3 style="margin-bottom:10px">Ganti PIN</h3><form id="f"><div class="field"><label>PIN lama</label><input class="input" name="a" type="password" inputmode="numeric" autocomplete="current-password"></div><div class="field"><label>PIN baru (6-12 angka)</label><input class="input" name="b" type="password" inputmode="numeric" autocomplete="new-password"></div>' +
        '<div class="field"><label>Ulangi PIN baru</label><input class="input" name="c" type="password" inputmode="numeric" autocomplete="new-password"></div><div class="err" id="e" hidden></div><button class="btn pri blk">Simpan PIN</button></form>');
      const f = s.querySelector('#f'), e = s.querySelector('#e');
      f.onsubmit = async ev => {
        ev.preventDefault(); e.hidden = true;
        if (!/^\d{6,12}$/.test(f.b.value)) { e.textContent = 'PIN baru harus 6-12 angka.'; e.hidden = false; return; }
        if (f.b.value !== f.c.value) { e.textContent = 'Ulangi PIN baru tidak sama.'; e.hidden = false; return; }
        try { await API.tulis('auth.gantiPin', { pinLama: f.a.value, pinBaru: f.b.value }); App.sheetTutup(); App.toast('PIN diganti. Silakan masuk lagi.', 'ok'); App.keluar(); } catch (x) { e.textContent = x.message; e.hidden = false; }
      };
    }
    gambar(); return App.on('install', gambar);
  } };
})();
