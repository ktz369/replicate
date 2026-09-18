# models.json — cara generate, bukan file template

`models.json` profil pi **berisi API key** (kredensial), jadi sengaja TIDAK
disimpan di repo. Untuk merekonstruksi di mesin baru:

1. Jalankan `pi /model` di dalam pi dan pilih model — pi akan men-generate
   struktur `models.json` yang benar; atau
2. Salin struktur `models.json` dari mesin live yang sudah ada.

Lalu isi kredensial (API key per provider) **manual per mesin**. Jangan pernah
commit file yang berisi kredensial ke repo ini.

Provider/model default profil saat ini tercermin di
[`settings.template.json`](settings.template.json)
(`defaultProvider` / `defaultModel`).
