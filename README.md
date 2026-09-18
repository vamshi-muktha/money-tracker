# Money Ledger

Mobile-first offline personal finance PWA. Data is stored locally on the device in browser storage.

## Run in VS Code
1. Open this folder in VS Code.
2. Double-click `START.bat` (or run `python -m http.server 8000 --bind 0.0.0.0` in the terminal).
3. Open `http://localhost:8000`.
4. To use it on your phone over the same Wi-Fi, run `ipconfig` on Windows, find the computer's IPv4 address, and open `http://YOUR-IP:8000` on the phone. For example: `http://192.168.1.20:8000`.
5. Allow Python through Windows Firewall on Private networks if the phone cannot connect.
6. For a downloadable offline app, deploy this folder to an HTTPS static host, then install it from the phone browser. This PWA stores its data on the phone and continues working offline after the first successful load.

The simplest free option is GitHub Pages: create a GitHub repository, upload these files, then enable **Settings > Pages > Source: GitHub Actions**. The included workflow publishes the site after every push to `main`; open the generated `https://...github.io/...` address on your phone.

On Android Chrome: open the HTTPS URL, tap the three-dot menu, then choose `Install app` or `Add to Home screen`.

On iPhone Safari: open the HTTPS URL, tap Share, then choose `Add to Home Screen`.

The app stores numbers, notes, income, expenses, and assets in the phone's browser storage. Use `Settings > Export backup` regularly, especially before clearing browser data or changing phones. Use `Settings > Import backup` to restore the JSON file.

Important: opening `index.html` directly with `file://` can prevent PWA/service-worker features from working. Use the local server above. Local Wi-Fi access is suitable for testing; HTTPS hosting is required for reliable PWA installation on phones.
