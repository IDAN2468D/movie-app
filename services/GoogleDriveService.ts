import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_CONFIG } from '@/constants/Config';
import type { BookedTicket } from '@/store/useBookingStore';
import { Colors } from '@/constants/Theme';

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
  private static generateTicketHTML(ticket: BookedTicket): string {
    const seats = ticket.seats?.map(s => `${s.row}${s.number}`).join(', ') || 'N/A';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticket.id}&color=${Colors.background.replace('#', '')}&bgcolor=FFFFFF`;
    const posterUrl = ticket.moviePoster 
      ? `https://image.tmdb.org/t/p/w500${ticket.moviePoster}`
      : 'https://images.unsplash.com/photo-1542204113-e93a434de541?w=500';

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
    }
    .poster-image {
      width: 100px;
      height: 150px;
      object-fit: cover;
      display: block;
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
        <img class="poster-image" src="${posterUrl}" alt="${ticket.movieTitle}">
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
        <img class="qr-image" src="${qrUrl}" alt="Ticket QR Code">
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

      // Build the file metadata and media content
      const fileName = `CineBook_Ticket_${ticket.movieTitle.replace(/\s+/g, '_')}.html`;
      const htmlContent = this.generateTicketHTML(ticket);

      const boundary = 'foo_bar_cinebook_boundary';
      const metadata = JSON.stringify({
        name: fileName,
        mimeType: 'text/html',
      });

      // Construct multipart/related body
      const multipartBody = 
        `\r\n--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${metadata}\r\n` +
        `\r\n--${boundary}\r\n` +
        `Content-Type: text/html; charset=UTF-8\r\n\r\n` +
        `${htmlContent}\r\n` +
        `\r\n--${boundary}--\r\n`;

      console.log('[GoogleDriveService] Uploading file to Google Drive REST API...');
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

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = JSON.parse(responseText);
        return { 
          success: false, 
          message: errorData.error?.message || 'שגיאה בהעלאת הקובץ לגוגל דרייב' 
        };
      }
    } catch (error: any) {
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
}
