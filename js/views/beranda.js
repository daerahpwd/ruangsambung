/* Beranda: ringkasan kehadiran, data jamaah, data generus, kegiatan mendatang (mengikuti desain Stitch) */
(function () {
  const { esc, ic, tgl } = App, HARI = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'], BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const bar = ps => { const t = ps.reduce((a, p) => a + p.v, 0) || 1; return '<div class="bar">' + ps.map(p => '<i style="width:' + (p.v * 100 / t) + '%;background:' + p.c + '"></i>').join('') + '</div>'; };
  const bulanLabel = b => { const m = /^(\d{4})-(\d{2})$/.exec(b || ''); return m ? ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][+m[2] - 1] + ' ' + m[1] : ''; };

  App.views.beranda = { render(ctx) {
    const el = ctx.el, u = App.state.user, adm = App.isAdmin();
    let f = { desa: '', kelompok: '', bulan: '' }, d = App.state.beranda || null;
    App.title('Beranda');

    function profil() {
      const n = new Date();
      return '<div class="card" style="background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff;border:0"><div class="row">' +
        '<div class="tile" style="width:52px;height:52px;background:rgba(255,255,255,.14);color:#fff;font-size:18px">' + esc(App.inisial(u.nama)) + '</div>' +
        '<div class="grow"><div style="font-size:18px;font-weight:700">' + esc(u.nama) + '</div><div style="font-size:12px;opacity:.75">' + esc(App.peran[u.role]) + (u.kelompok ? ' · ' + esc(u.kelompok) : '') + '</div></div>' +
        '<div style="text-align:right"><div style="font-size:10px;letter-spacing:.1em;color:#9fe3d4;font-weight:700">' + HARI[n.getDay()] + '</div><div style="font-size:28px;font-weight:800;line-height:1">' + n.getDate() + '</div><div style="font-size:11px;opacity:.75">' + BLN[n.getMonth()] + ' ' + n.getFullYear() + '</div></div></div></div>';
    }
    function filter() {
      if (u.role === 'super_admin') {
        const ds = (App.state.ref.desa || []), kl = f.desa ? (ds.filter(x => x.nama === f.desa)[0] || { kelompok: [] }).kelompok : ds.reduce((a, x) => a.concat(x.kelompok), []);
        return '<div class="row" style="margin-bottom:12px"><select class="input" id="fd" style="height:38px"><option value="">Semua desa</option>' + ds.map(x => '<option' + (x.nama === f.desa ? ' selected' : '') + '>' + esc(x.nama) + '</option>').join('') + '</select>' +
          '<select class="input" id="fk" style="height:38px"><option value="">Semua kelompok</option>' + kl.map(x => '<option' + (x.nama === f.kelompok ? ' selected' : '') + '>' + esc(x.nama) + '</option>').join('') + '</select></div>';
      }
      return u.kelompok ? '<div class="row" style="margin-bottom:12px"><span class="chip">' + ic('lock', 14) + ' Kelompok ' + esc(u.kelompok) + '</span></div>' : '';
    }
    function kehadiran() {
      const k = d.kehadiran, t = k.hadir + k.izin + k.sakit + k.alfa;
      return '<div class="card"><div class="row between"><div class="label">Ringkasan Kehadiran</div><input type="month" class="chip" id="bl" value="' + esc(d.bulan) + '" style="border:0"></div>' +
        '<div class="big">' + k.persen + '<small> %</small></div><div class="muted" style="margin:6px 0 12px">Rata-rata · ' + k.acara + ' acara · ' + k.hadir + ' hadir</div>' +
        bar([{ v: k.hadir, c: 'var(--hadir)' }, { v: k.izin, c: 'var(--izin)' }, { v: k.sakit, c: 'var(--sakit)' }, { v: k.alfa, c: 'var(--alfa)' }].map(p => t ? p : { v: 0, c: p.c })) +
        '<div class="row" style="margin:12px 0;justify-content:space-between">' + [['Hadir', k.hadir, 'hadir'], ['Izin', k.izin, 'izin'], ['Sakit', k.sakit, 'sakit'], ['Alfa', k.alfa, 'alfa']].map(x => '<div><span class="dot" style="background:var(--' + x[2] + ')"></span><span class="muted">' + x[0] + '</span><div style="font-weight:700;font-size:16px">' + x[1] + '</div></div>').join('') + '</div>' +
        (k.terakhir ? '<a href="#/kegiatan/' + esc(k.terakhir.id) + '" class="row" style="background:var(--alt);border-radius:12px;padding:10px 12px;font-weight:600"><span class="dot" style="background:var(--teal)"></span><span class="grow">Terakhir: ' + esc(k.terakhir.nama) + '</span><span class="muted" style="font-size:12px">' + esc(tgl(k.terakhir.tanggal)) + ' · ' + k.terakhir.hadir + ' hadir</span></a>' : '<div class="muted" style="font-size:12px">Belum ada absensi bulan ini.</div>') + '</div>';
    }
    function jamaah() {
      const j = d.jamaah;
      return '<div class="card"><div class="row between"><div class="label">Data Jamaah</div><span class="chip">Tanpa generus</span></div>' +
        '<div class="row between"><div class="big">' + j.total + ' <small>jiwa</small></div><div class="row"><span class="chip teal">L ' + j.L + '</span><span class="chip soft">P ' + j.P + '</span></div></div>' +
        '<div style="margin:12px 0">' + bar([{ v: j.L, c: 'var(--teal)' }, { v: j.P, c: 'var(--teal-soft)' }]) + '</div>' +
        '<div class="row" style="background:var(--alt);border-radius:12px;padding:10px;text-align:center">' + [['Dewasa', j.dewasa], ['Duda & Janda', j.dudaJanda], ['Lansia', j.lansia]].map(x => '<div class="grow"><div class="muted" style="font-size:12px">' + x[0] + '</div><div style="font-weight:800;font-size:18px">' + x[1] + '</div></div>').join('') + '</div>' +
        '<button class="btn blk" id="wl" style="margin-top:12px;justify-content:space-between;background:var(--teal-soft);border-color:transparent;color:var(--tx)"><span class="row" style="gap:8px">' + ic('share') + ' Bagikan data lansia</span><span class="muted">' + j.lansia + ' orang ›</span></button></div>';
    }
    function generus() {
      const g = d.generus, mx = Math.max.apply(null, g.grup.map(x => x.total).concat([1]));
      return '<div class="card"><div class="row between"><div class="label">Data Generus</div><span><b>' + g.total + '</b> Generus <span class="muted">[L ' + g.L + ' · P ' + g.P + ']</span></span></div><div class="list">' +
        g.grup.map(x => '<div><div class="tile">' + esc(x.kode) + '</div><div class="grow"><div class="row between"><b>' + esc(x.nama) + '</b><span>' + x.total + ' anak <span class="muted" style="font-size:11px">(L ' + x.L + ' · P ' + x.P + ')</span></span></div>' + bar([{ v: x.total, c: 'var(--teal)' }, { v: mx - x.total, c: 'transparent' }]) + '</div></div>').join('') + '</div></div>';
    }
    function mendatang() {
      return '<div class="card"><div class="row between"><div class="label">Kegiatan Mendatang</div><a href="#/kegiatan" style="color:var(--teal);font-weight:700">Lihat Semua ›</a></div>' +
        (d.mendatang.length ? '<div class="list">' + d.mendatang.map(k => { const m = /^\d{4}-(\d{2})-(\d{2})/.exec(k.tanggal) || [0, 1, 1];
          return '<a href="#/kegiatan/' + esc(k.id) + '"><div class="tile" style="width:48px;height:48px;flex-direction:column;line-height:1.1"><b style="font-size:18px">' + (+m[2]) + '</b><small style="font-size:9px">' + BLN[+m[1] - 1].toUpperCase() + '</small></div>' +
            '<div class="grow"><b>' + esc(k.nama) + '</b><div class="row" style="margin-top:4px;gap:6px"><span class="chip soft">' + esc(k.tingkat) + '</span><span class="chip">' + esc(k.secara) + '</span><span class="muted" style="font-size:12px">' + (k.jam ? esc(k.jam) : '') + '</span></div></div></a>'; }).join('') + '</div>'
          : '<div class="empty"><b>Belum ada kegiatan</b>' + (adm ? '<a class="btn pri sm" href="#/kegiatan/baru" style="margin-top:10px">Buat Kegiatan</a>' : '') + '</div>') + '</div>';
    }
    function tampil() {
      if (!d) { el.innerHTML = profil() + App.skeleton(3); return; }
      el.innerHTML = profil() + filter() + kehadiran() + (adm ? jamaah() + generus() : '') + mendatang();
      const q = id => el.querySelector(id);
      if (q('#fd')) q('#fd').onchange = e => { f.desa = e.target.value; f.kelompok = ''; muat(); tampil(); };
      if (q('#fk')) q('#fk').onchange = e => { f.kelompok = e.target.value; muat(); };
      if (q('#bl')) q('#bl').onchange = e => { f.bulan = e.target.value; muat(); };
      if (q('#wl')) q('#wl').onclick = async () => { try { const r = await API.call('wa.build', { kode: 'data_lansia', desa: f.desa, kelompok: f.kelompok }); window.open(r.url, '_blank') || (location.href = r.url); } catch (x) { App.galat(x); } };
    }
    function muat() { API.baca('dash.beranda', f, { segar: 20000, onData: x => { d = x; tampil(); }, onGalat: App.galat }).catch(App.galat); }
    tampil();
    muat();
    return App.on('boot', () => { if (!f.desa && !f.kelompok && !f.bulan && App.state.beranda) { d = App.state.beranda; tampil(); } });
  } };
})();
