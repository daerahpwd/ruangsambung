/* Bagikan ke WhatsApp: pilih template, pratinjau & edit teks, buka WhatsApp (wa.me) atau salin */
(function () {
  const { esc } = App, NAMA = { info_kegiatan: 'Info Kegiatan', rekap_absensi: 'Rekap Absensi' };
  App.views.wa = {
    render() { },
    async bagikan(id, kode) {
      const s = App.sheet('<h3 style="margin-bottom:10px">Bagikan ke WhatsApp</h3><div class="field"><label>Template</label><select class="input" id="tk">' +
        Object.keys(NAMA).map(k => '<option value="' + k + '"' + (k === (kode || 'info_kegiatan') ? ' selected' : '') + '>' + NAMA[k] + '</option>').join('') + '</select></div>' +
        '<div class="field"><label>Pratinjau (bisa diedit)</label><textarea class="input" id="tx" rows="9" style="background:var(--teal-soft)" placeholder="Memuat…"></textarea></div>' +
        '<div class="row"><button class="btn grow" id="sl">Salin teks</button><button class="btn wa grow" id="bw">Buka WhatsApp</button></div>');
      const tk = s.querySelector('#tk'), tx = s.querySelector('#tx');
      const muat = async () => { tx.value = ''; tx.placeholder = 'Memuat…'; try { tx.value = (await API.call('wa.build', { kode: tk.value, id: id })).teks; } catch (e) { tx.placeholder = ''; App.galat(e); } };
      tk.onchange = muat; muat();
      s.querySelector('#bw').onclick = () => { const u = 'https://wa.me/?text=' + encodeURIComponent(tx.value); window.open(u, '_blank') || (location.href = u); };
      s.querySelector('#sl').onclick = async () => { try { await navigator.clipboard.writeText(tx.value); App.toast('Teks disalin', 'ok'); } catch (e) { tx.select(); App.toast('Tekan Salin pada papan ketik', 'warn'); } };
    }
  };
})();
