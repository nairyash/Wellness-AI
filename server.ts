import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Diagnostic Route
  app.get("/api/sheets-status", (req, res) => {
    res.json({
      configured: !!(process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY),
      sheetId: process.env.GOOGLE_SHEET_ID ? `${process.env.GOOGLE_SHEET_ID.substring(0, 5)}...` : null,
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      hasKey: !!process.env.GOOGLE_PRIVATE_KEY,
      keyLength: process.env.GOOGLE_PRIVATE_KEY?.length || 0,
      envLoaded: Object.keys(process.env).filter(k => k.startsWith('GOOGLE_')).length
    });
  });

  // API Routes
  app.post("/api/log", async (req, res) => {
    try {
      const { name, age, weight, height, diet, meatPreferences, activityLevel, healthConditions, language } = req.body;
      
      const sheetId = process.env.GOOGLE_SHEET_ID;
      const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      
      let privateKey = (process.env.GOOGLE_PRIVATE_KEY || "")
        .trim();

      // Ensure quotes are removed (common when users paste into env vars)
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
        privateKey = privateKey.slice(1, -1);
      }

      // Convert literal \n sequences into actual line breaks
      privateKey = privateKey.split('\\n').join('\n').trim();

      if (privateKey && !privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
        console.warn("Private key appears to be missing PEM headers. Attempting to wrap it.");
        privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
      }

      if (!sheetId || !clientEmail || !privateKey) {
        const errorMsg = "Google Sheets configuration missing required variables.";
        console.warn(errorMsg, {
          hasSheetId: !!sheetId,
          hasEmail: !!clientEmail,
          hasPrivateKey: !!privateKey
        });
        return res.status(400).json({ success: false, error: errorMsg });
      }
      
      console.log("Attempting to log data to sheet:", sheetId);

      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey.trim(), // Trim added to handle stray whitespace
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      
      const values = [
        [
          new Date().toISOString(),
          name,
          age,
          weight,
          height,
          diet,
          meatPreferences?.join(", ") || "None",
          activityLevel,
          healthConditions || "None",
          language
        ]
      ];

      try {
        await sheets.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range: 'A1', // Using A1 without a sheet name defaults to the first sheet
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values },
        });
      } catch (appendError: any) {
        console.error("Append Error details:", appendError.response?.data || appendError);
        
        // If 'Sheet1' was the issue, the above generic range should solve it.
        // If it's permissions, report that specifically.
        if (appendError.code === 403) {
          throw new Error(`Permission Denied: Ensure ${clientEmail} has 'Editor' access to the sheet.`);
        }
        if (appendError.code === 404) {
          throw new Error("Spreadsheet not found. Check your GOOGLE_SHEET_ID.");
        }
        throw appendError;
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error logging to Google Sheets:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to log data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
