/* Halaman Login: username + PIN */
(function () {
  const { esc, ic } = App;
  App.views.login = { render(ctx) {
    App.title('Masuk');
    ctx.el.innerHTML = '<div style="max-width:380px;margin:8vh auto 0" class="card">' +
      '<div style="text-align:center;margin-bottom:18px"><img src="icons/icon-192.png" width="64" height="64" alt="" style="border-radius:16px">' +
      '<h1 style="font-size:24px;margin-top:10px">Ruang Sambung</h1><div class="muted" style="font-size:13px">Data Jamaah &amp; Absensi Daerah Purwodadi</div></div>' +
      '<form id="f" autocomplete="on">' +
      '<div class="field"><label for="u">Username</label><input class="input" id="u" name="username" autocomplete="username" autocapitalize="none" required></div>' +
      '<div class="field"><label for="p">PIN</label><input class="input" id="p" name="password" type="password" inputmode="numeric" autocomplete="current-password" required></div>' +
      '<div class="err" id="e" role="alert" hidden></div>' +
      '<button class="btn pri blk" id="b" style="margin-top:8px">Masuk</button></form>' +
      '<p class="muted" style="text-align:center;font-size:12px;margin:14px 0 0">Lupa PIN? Hubungi Admin Daerah</p></div>';
    const f = ctx.el.querySelector('#f'), b = f.querySelector('#b'), e = f.querySelector('#e');
    f.onsubmit = async ev => {
      ev.preventDefault(); e.hidden = true; b.disabled = true; b.textContent = 'Memeriksa…';
      try {
        const r = await API.call('auth.login', { username: f.u.value, pin: f.p.value }, { tulis: true });
        App.masuk(r.token, r.user);
        await App.boot();
        App.toast('Selamat datang, ' + r.user.nama, 'ok'); App.go('#/beranda');
      } catch (x) { e.textContent = x.message; e.hidden = false; b.disabled = false; b.textContent = 'Masuk'; f.p.select(); }
    };
    setTimeout(() => f.u.focus(), 50);
  } };
})();
