# LIQRA Browser

LIQRA Browser is an Electron-based desktop browser prototype for Windows, with a translucent dark interface, tabs, address/search bar, navigation controls, and a light theme.

## Run locally
```bash
npm install
npm start
```

## Build Windows installer
```bash
npm run dist
```
The installer is written to `dist/`.

## Automated build
GitHub Actions builds a Windows x64 NSIS installer on pushes to `main` that change the app files, or when manually started from the Actions tab. Download the `LIQRA-Browser-Windows` artifact from a completed workflow run.

## Notes
This is an initial MVP. It uses the Google homepage/search by default. Browser profiles, bookmarks sync, extensions, password manager, and advanced privacy controls are not included yet.
