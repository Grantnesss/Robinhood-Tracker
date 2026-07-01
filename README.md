# Robinhood Bet Report Builder

A React/Vite web app for uploading bet screenshots, manually entering bet details, viewing cost vs payout summaries, filtering the bet database, editing records, and exporting a CSV report.

## Upload to GitHub

1. Download and unzip this project.
2. Go to GitHub and create a new repository.
3. Upload **all files and folders inside this project folder** to the repository.
4. Commit the upload.

## Deploy with Vercel

1. Sign in to Vercel with GitHub.
2. Choose **Add New Project**.
3. Select this repository.
4. Use the default Vite settings:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Deploy.

## Run locally, optional

```bash
npm install
npm run dev
```

## Notes

- Data is stored locally in the browser using `localStorage`.
- This does not yet include OCR extraction. Screenshots are previewed and the fields are entered manually.
- The CSV export uses the currently filtered bet list.
