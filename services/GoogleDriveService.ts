import { GoogleSignin, isGoogleSigninAvailable } from '@/utils/safeGoogleSignin';
import { Alert } from 'react-native';
import { GOOGLE_CONFIG } from '@/constants/Config';
import type { BookedTicket } from '@/store/useBookingStore';
import { Colors } from '@/constants/Theme';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';

export class GoogleDriveService {
  /**
   * Configures the Google SDK with appropriate OAuth scopes for Google Drive
   */
  private static configureGoogle() {
    try {
      if (!GOOGLE_CONFIG.web) {
        throw new Error('Web Client ID is missing in GOOGLE_CONFIG');
      }
      GoogleSignin.configure({
        webClientId: GOOGLE_CONFIG.web,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
        offlineAccess: true,
      });
    } catch (e) {
      console.error('Failed to configure GoogleSignin:', e);
      throw e;
    }
  }

  /**
   * Generates an elegant, CSS-styled HTML document for the digital ticket.
   */
  private static generateTicketHTML(ticket: BookedTicket, posterDataUri: string, qrDataUri: string): string {
    const seats = ticket.seats?.map(s => `${s.row}${s.number}`).join(', ') || 'N/A';

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CineBook Digital Ticket - ${ticket.movieTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&family=Rubik:wght@500;700;900&family=Outfit:wght@500;700;900&display=swap" rel="stylesheet">
  <style>
    body {
      background-color: #09090B;
      color: #FAFAF7;
      font-family: 'Assistant', 'Rubik', sans-serif;
      margin: 0;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .ticket-container {
      background: rgba(30, 30, 33, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 40px;
      padding: 0;
      width: 100%;
      max-width: 420px;
      overflow: hidden;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6), 0 0 80px rgba(255, 20, 100, 0.15);
      backdrop-filter: blur(20px);
      position: relative;
    }
    .glow-header {
      background: linear-gradient(135deg, rgba(255, 20, 100, 0.15), rgba(212, 175, 55, 0.05));
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 40px 30px;
      text-align: center;
    }
    .poster-wrapper {
      margin-bottom: 24px;
      display: inline-block;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 20, 100, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.1);
      width: 100px;
      height: 150px;
      position: relative;
      background: linear-gradient(135deg, #1e1e24, #0f0f12);
    }
    .poster-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .poster-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #FF1464, #9B1B30);
      color: #FFFFFF;
      font-family: 'Rubik', sans-serif;
    }
    .poster-fallback-icon {
      font-size: 28px;
      margin-bottom: 6px;
    }
    .poster-fallback-text {
      font-size: 18px;
      font-weight: 900;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .badge {
      display: inline-block;
      font-family: 'Outfit', sans-serif;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 3px;
      color: #D4AF37;
      text-transform: uppercase;
      margin-bottom: 12px;
      text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
    }
    h1 {
      font-family: 'Rubik', sans-serif;
      font-size: 28px;
      font-weight: 900;
      margin: 0 0 12px 0;
      line-height: 1.2;
      background: linear-gradient(to left, #FFFFFF, #E5E5E5);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hall-format {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 600;
    }
    .qr-section {
      padding: 40px 30px;
      text-align: center;
      background: rgba(9, 9, 11, 0.3);
    }
    .qr-wrapper {
      display: inline-block;
      padding: 20px;
      background: #FFFFFF;
      border-radius: 32px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      border: 8px solid rgba(255, 255, 255, 0.05);
    }
    .qr-image {
      width: 180px;
      height: 180px;
      display: block;
    }
    .ref-code {
      margin-top: 24px;
      font-family: monospace;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.25);
      letter-spacing: 5px;
    }
    .perforations {
      display: flex;
      align-items: center;
      height: 24px;
      margin: 0 -12px;
    }
    .circle {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: #09090B;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .line {
      flex: 1;
      border-top: 2px dashed rgba(255, 255, 255, 0.15);
      margin: 0 12px;
    }
    .details-grid {
      padding: 30px;
      background: rgba(255, 255, 255, 0.02);
    }
    .grid-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .grid-item {
      width: 48%;
    }
    .label {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 6px;
    }
    .value {
      font-size: 16px;
      font-weight: 700;
    }
    .value.accent {
      color: #FF1464;
    }
    .value.secondary {
      color: #E5FF00;
    }
    .footer-note {
      text-align: center;
      padding: 24px 30px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.35);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="ticket-container">
    <div class="glow-header">
      <div class="poster-wrapper">
        ${posterDataUri.startsWith('data:') 
          ? `<img class="poster-image" src="${posterDataUri}" alt="${ticket.movieTitle}">`
          : `
            <div class="poster-fallback">
              <div class="poster-fallback-icon">🎬</div>
              <div class="poster-fallback-text">${ticket.movieTitle ? ticket.movieTitle.charAt(0) : '🍿'}</div>
            </div>
          `
        }
      </div>
      <div><span class="badge">CineBook Platinum</span></div>
      <h1>${ticket.movieTitle}</h1>
      <div class="hall-format">
        <span>${ticket.showtime?.hall || 'אולם'}</span>
        <span style="margin: 0 8px; opacity: 0.3;">•</span>
        <span>${ticket.showtime?.format || 'דו מימד'}</span>
      </div>
    </div>

    <div class="qr-section">
      <div class="qr-wrapper">
        <img class="qr-image" src="${qrDataUri}" alt="Ticket QR Code">
      </div>
      <div class="ref-code">REF: ${ticket.id.split('-')[0].toUpperCase()}</div>
    </div>

    <div class="perforations">
      <div class="circle" style="margin-left: -12px;"></div>
      <div class="line"></div>
      <div class="circle" style="margin-right: -12px;"></div>
    </div>

    <div class="details-grid">
      <div class="grid-row">
        <div class="grid-item">
          <div class="label">תאריך</div>
          <div class="value">${ticket.date}</div>
        </div>
        <div class="grid-item" style="text-align: left;">
          <div class="label" style="text-align: left;">שעה</div>
          <div class="value">${ticket.showtime?.time || '--:--'}</div>
        </div>
      </div>
      <div class="grid-row" style="margin-bottom: 0;">
        <div class="grid-item">
          <div class="label">מושבים</div>
          <div class="value secondary">${seats}</div>
        </div>
        <div class="grid-item" style="text-align: left;">
          <div class="label" style="text-align: left;">סטטוס</div>
          <div class="value" style="color: #22c55e;">מאושר ✓</div>
        </div>
      </div>
    </div>

    <div class="footer-note">
      כרטיס זה נשמר ב-Google Drive שלך בהצלחה.<br>
      יש להציג את קוד ה-QR המופיע לעיל בכניסה לקולנוע. תהנו! 🍿
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Prompts authentication and uploads the generated ticket to Google Drive
   */
  public static async uploadTicketToDrive(ticket: BookedTicket): Promise<{ success: boolean; message?: string }> {
    // EXPO GO DYNAMIC SIMULATION BYPASS (Fast Path):
    // Check if Google Sign-In is unavailable or not supported up front to avoid triggering native exceptions
    if (!isGoogleSigninAvailable) {
      console.log('[GoogleDriveService] Expo Go / Mock mode detected. Running simulated Google Drive upload...');
      // Simulate realistic progress delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'סימולציית שמירה (Google Drive)',
        'מפתח יקר: עקב ריצה ב-Expo Go, ביצענו סימולציית שמירה והעלאה מוצלחת של כרטיס ה-PDF המעוצב ל-Google Drive שלך! 📄🚀',
        [{ text: 'מצוין' }]
      );
      return { success: true };
    }

    try {
      console.log('[GoogleDriveService] Starting Google Auth setup...');
      this.configureGoogle();

      // Check if already signed in, otherwise trigger native sign in
      let currentUser = GoogleSignin.getCurrentUser();
      console.log('[GoogleDriveService] Already signed in?', !!currentUser);

      const targetScope = 'https://www.googleapis.com/auth/drive.file';

      if (!currentUser) {
        console.log('[GoogleDriveService] Fetching Play Services status...');
        await GoogleSignin.hasPlayServices();
        console.log('[GoogleDriveService] Prompting native Google sign-in...');
        await GoogleSignin.signIn();
        currentUser = GoogleSignin.getCurrentUser();
      } else {
        // Incremental Scopes: Check if the already signed-in user granted Drive permission
        const hasScope = currentUser.scopes && currentUser.scopes.includes(targetScope);
        console.log('[GoogleDriveService] User already signed in. Has Drive scope?', hasScope);
        
        if (!hasScope) {
          console.log('[GoogleDriveService] Requesting additional Google Drive scope...');
          await GoogleSignin.addScopes({ scopes: [targetScope] });
          currentUser = GoogleSignin.getCurrentUser();
        }
      }

      console.log('[GoogleDriveService] Checked user info and scopes...');

      // Retrieve tokens
      console.log('[GoogleDriveService] Fetching OAuth tokens...');
      const tokens = await GoogleSignin.getTokens();
      const accessToken = tokens.accessToken;

      if (!accessToken) {
        throw new Error('Failed to retrieve access token from Google');
      }
      console.log('[GoogleDriveService] OAuth token acquired successfully.');

      let pdfUri = '';
      try {
        // Pre-download and base64 encode ticket images to avoid missing images due to fast print rendering
        console.log('[GoogleDriveService] Downloading and encoding ticket images to Base64...');
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticket.id}&color=${Colors.background.replace('#', '')}&bgcolor=FFFFFF`;
        // Bulletproof poster URL resolution (handles absolute, relative, leading slash and undefined poster paths)
        let posterUrl = 'https://images.unsplash.com/photo-1542204113-e93a434de541?w=500';
        if (ticket.moviePoster) {
          const posterStr = String(ticket.moviePoster).trim();
          if (posterStr.startsWith('http://') || posterStr.startsWith('https://')) {
            posterUrl = posterStr;
          } else {
            const leadingSlash = posterStr.startsWith('/') ? '' : '/';
            posterUrl = `https://image.tmdb.org/t/p/w500${leadingSlash}${posterStr}`;
          }
        }

        let qrDataUri = qrUrl;
        const base64Qr = await this.getBase64FromUrl(qrUrl);
        if (base64Qr) {
          qrDataUri = base64Qr;
        }

        let posterDataUri = '';
        const base64Poster = await this.getBase64FromUrl(posterUrl);
        if (base64Poster) {
          posterDataUri = base64Poster;
        }

        // Build the file metadata and media content
        const fileName = `CineBook_Ticket_${ticket.movieTitle.replace(/\s+/g, '_')}.pdf`;
        const htmlContent = this.generateTicketHTML(ticket, posterDataUri, qrDataUri);

        console.log('[GoogleDriveService] Generating PDF from HTML design using expo-print...');
        const pdfFile = await Print.printToFileAsync({ html: htmlContent });
        pdfUri = pdfFile.uri;
        console.log('[GoogleDriveService] PDF generated at:', pdfUri);

        console.log('[GoogleDriveService] Reading PDF as Base64 string...');
        const base64Pdf = await FileSystem.readAsStringAsync(pdfUri, {
          encoding: 'base64',
        });

        const boundary = 'foo_bar_cinebook_boundary';
        const metadata = JSON.stringify({
          name: fileName,
          mimeType: 'application/pdf',
        });

        // Construct multipart/related body with Base64 encoded PDF
        const multipartBody = 
          `\r\n--${boundary}\r\n` +
          `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
          `${metadata}\r\n` +
          `\r\n--${boundary}\r\n` +
          `Content-Type: application/pdf\r\n` +
          `Content-Transfer-Encoding: base64\r\n\r\n` +
          `${base64Pdf}\r\n` +
          `\r\n--${boundary}--\r\n`;

        console.log('[GoogleDriveService] Uploading PDF file to Google Drive REST API...');
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
            'Content-Length': String(multipartBody.length),
          },
          body: multipartBody,
        });

        const responseText = await response.text();
        console.log('[GoogleDriveService] Drive API Response Code:', response.status);
        console.log('[GoogleDriveService] Drive API Response:', responseText);

        // Delete temporary PDF file proactively
        try {
          await FileSystem.deleteAsync(pdfUri, { idempotent: true });
          console.log('[GoogleDriveService] Cleaned up temporary PDF file.');
        } catch (cleanupErr) {
          console.warn('[GoogleDriveService] Failed to delete temporary PDF:', cleanupErr);
        }

        if (response.ok) {
          return { success: true };
        } else {
          const errorData = JSON.parse(responseText);
          return { 
            success: false, 
            message: errorData.error?.message || 'שגיאה בהעלאת הקובץ לגוגל דרייב' 
          };
        }
      } catch (err) {
        // Fallback cleanup if error happens before proactive deletion
        if (pdfUri) {
          try {
            await FileSystem.deleteAsync(pdfUri, { idempotent: true });
          } catch {}
        }
        throw err;
      }
    } catch (error: any) {
      // EXPO GO DYNAMIC SIMULATION BYPASS (Fallback):
      // If Google Sign-In is missing/not supported, catch the error and simulate success without console.error
      const isExpoGoError = !isGoogleSigninAvailable || 
                            (error.message && (
                              error.message.includes('supported in Expo Go') || 
                              error.message.includes('RNGoogleSignin') ||
                              error.message.includes('native module')
                            ));
                            
      if (isExpoGoError) {
        console.log('[GoogleDriveService] Bypassing Google Drive upload with simulated success on Expo Go...');
        // Simulate realistic progress delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        Alert.alert(
          'סימולציית שמירה (Google Drive)',
          'מפתח יקר: עקב ריצה ב-Expo Go, ביצענו סימולציית שמירה והעלאה מוצלחת של כרטיס ה-PDF המעוצב ל-Google Drive שלך! 📄🚀',
          [{ text: 'מצוין' }]
        );
        return { success: true };
      }
      
      console.error('[GoogleDriveService] Critical Error:', error);
      
      if (error.code === 'SIGN_IN_CANCELLED') {
        return { success: false, message: 'ההתחברות לגוגל בוטלה על ידי המשתמש' };
      }
      return { 
        success: false, 
        message: error.message || 'שגיאת חיבור לשרתי גוגל' 
      };
    }
  }

  /**
   * Prompts authentication and uploads a custom stamp image directly to Google Drive
   */
  /**
   * Generates a fully-designed, perforated postage stamp HTML template.
   */
  private static generateStampHTML(movieTitle: string, posterDataUri: string): string {
    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      background-color: #09090B;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: 'Assistant', 'Rubik', system-ui, sans-serif;
    }
    .stamp-wrapper {
      position: relative;
      width: 320px;
      height: 440px;
      background-color: #121214;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .stamp-inner {
      position: absolute;
      top: 10px;
      bottom: 10px;
      left: 10px;
      right: 10px;
      border-radius: 8px;
      overflow: hidden;
      background-image: url('${posterDataUri}');
      background-size: cover;
      background-position: center;
    }
    .tint {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.25);
    }
    .details {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: #FAFAF7;
    }
    .row-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .country-he {
      font-size: 20px;
      font-weight: 700;
      color: #FAFAF7;
    }
    .country-en {
      font-size: 13px;
      font-weight: 600;
      color: rgba(255,255,255,0.7);
    }
    .row-mid {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 8px;
    }
    .price {
      font-size: 16px;
      font-weight: 700;
      color: #FAFAF7;
    }
    .year {
      font-size: 11px;
      color: rgba(255,255,255,0.6);
    }
    .row-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 8px;
    }
    .title {
      font-size: 13px;
      font-weight: 600;
      color: #FAFAF7;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      text-align: right;
    }
    .badge {
      background: #FF1464;
      color: white;
      font-size: 9px;
      font-weight: 700;
      padding: 3px 6px;
      border-radius: 10px;
      margin-right: 8px;
    }
    /* Perforation holes */
    .hole {
      width: 14px;
      height: 14px;
      background-color: #09090B;
      border-radius: 50%;
      position: absolute;
    }
  </style>
</head>
<body>
  <div class="stamp-wrapper">
    <!-- Top & Bottom Perforations -->
    ${Array.from({ length: 10 }).map((_, i) => `<div class="hole" style="top: -7px; left: ${i * 30 + 20}px;"></div>`).join('')}
    ${Array.from({ length: 10 }).map((_, i) => `<div class="hole" style="bottom: -7px; left: ${i * 30 + 20}px;"></div>`).join('')}
    
    <!-- Left & Right Perforations -->
    ${Array.from({ length: 14 }).map((_, i) => `<div class="hole" style="left: -7px; top: ${i * 29 + 25}px;"></div>`).join('')}
    ${Array.from({ length: 14 }).map((_, i) => `<div class="hole" style="right: -7px; top: ${i * 29 + 25}px;"></div>`).join('')}

    <div class="stamp-inner">
      <div class="tint"></div>
      <div class="details">
        <div class="row-top">
          <span class="country-he">ישראל</span>
          <span class="country-en">ISRAEL</span>
        </div>
        <div class="row-mid">
          <span class="price">4.20 ש"ח</span>
          <span class="year">2026</span>
        </div>
        <div class="row-bottom">
          <span class="title">${movieTitle}</span>
          <span class="badge">CINEBOOK</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Prompts authentication and uploads the fully-designed stamp PDF directly to Google Drive
   */
  public static async uploadStampToDrive(stampImage: string, movieTitle: string): Promise<{ success: boolean; message?: string }> {
    if (!isGoogleSigninAvailable) {
      console.log('[GoogleDriveService] Expo Go / Mock mode detected. Running simulated Google Drive stamp upload...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert(
        'סימולציית שמירה ב-Drive',
        'מפתח יקר: עקב ריצה ב-Expo Go, ביצענו סימולציית שמירה והעלאה מוצלחת של הבול המעוצב השלם ל-Google Drive שלך! 📄🚀',
        [{ text: 'מצוין' }]
      );
      return { success: true };
    }

    try {
      console.log('[GoogleDriveService] Starting Google Auth for stamp upload...');
      this.configureGoogle();

      let currentUser = GoogleSignin.getCurrentUser();
      const targetScope = 'https://www.googleapis.com/auth/drive.file';

      if (!currentUser) {
        await GoogleSignin.hasPlayServices();
        await GoogleSignin.signIn();
        currentUser = GoogleSignin.getCurrentUser();
      } else {
        const hasScope = currentUser.scopes && currentUser.scopes.includes(targetScope);
        if (!hasScope) {
          await GoogleSignin.addScopes({ scopes: [targetScope] });
          currentUser = GoogleSignin.getCurrentUser();
        }
      }

      const tokens = await GoogleSignin.getTokens();
      const accessToken = tokens.accessToken;

      if (!accessToken) {
        throw new Error('Failed to retrieve access token from Google');
      }

      // Convert the stamp background image to Base64
      let posterDataUri = stampImage;
      let tempFileUri = '';
      if (stampImage.startsWith('http')) {
        const base64Url = await this.getBase64FromUrl(stampImage);
        if (base64Url) {
          posterDataUri = base64Url;
        }
      } else {
        const base64Local = await FileSystem.readAsStringAsync(stampImage, { encoding: 'base64' });
        posterDataUri = `data:image/jpeg;base64,${base64Local}`;
      }

      // Generate the full stamp design HTML
      const htmlContent = this.generateStampHTML(movieTitle, posterDataUri);

      // Print full design to PDF
      console.log('[GoogleDriveService] Rendering full stamp design to PDF...');
      const pdfFile = await Print.printToFileAsync({ html: htmlContent });
      const pdfUri = pdfFile.uri;

      const base64Pdf = await FileSystem.readAsStringAsync(pdfUri, {
        encoding: 'base64',
      });

      const fileName = `CineBook_Stamp_${movieTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      const boundary = 'foo_bar_cinebook_boundary';
      const metadata = JSON.stringify({
        name: fileName,
        mimeType: 'application/pdf',
      });

      const multipartBody = 
        `\r\n--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${metadata}\r\n` +
        `\r\n--${boundary}\r\n` +
        `Content-Type: application/pdf\r\n` +
        `Content-Transfer-Encoding: base64\r\n\r\n` +
        `${base64Pdf}\r\n` +
        `\r\n--${boundary}--\r\n`;

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': String(multipartBody.length),
        },
        body: multipartBody,
      });

      const responseText = await response.text();
      
      // Clean up the temporary PDF file
      try {
        await FileSystem.deleteAsync(pdfUri, { idempotent: true });
      } catch {}

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = JSON.parse(responseText);
        return { 
          success: false, 
          message: errorData.error?.message || 'שגיאה בהעלאת הבול לגוגל דרייב' 
        };
      }
    } catch (error: any) {
      console.error('[GoogleDriveService] Stamp Upload Error:', error);
      return { success: false, message: error.message || 'שגיאת חיבור לשרתי גוגל' };
    }
  }

  /**
   * Downloads a remote image and converts it to a Base64 Data URI
   */
  private static async getBase64FromUrl(url: string): Promise<string | null> {
    try {
      const filename = url.split('/').pop()?.split('?')[0] || 'temp_img';
      const localUri = `${FileSystem.cacheDirectory}${Date.now()}_${filename}`;
      const downloadResult = await FileSystem.downloadAsync(url, localUri, {
        headers: {
          'Accept': 'image/*, */*',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Mobile Safari/537.36'
        }
      });
      if (downloadResult.status === 200) {
        const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
          encoding: 'base64',
        });
        // Delete the temporary downloaded file
        try {
          await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
        } catch {}
        
        const mimeType = url.includes('.png') || url.includes('qrserver') ? 'image/png' : 'image/jpeg';
        return `data:${mimeType};base64,${base64}`;
      }
      return null;
    } catch (err) {
      console.warn('[GoogleDriveService] Failed to download and encode image:', url, err);
      return null;
    }
  }
}
