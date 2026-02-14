const { google } = require('googleapis');
const { OAuth2 } = google.auth;

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/integrations/google/callback';

const createOAuth2Client = () => {
  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth Credentials');
  }
  return new OAuth2(clientId, clientSecret, redirectUri);
};

/**
 * Generate Auth URL
 */
const getAuthUrl = (state) => {
  const oauth2Client = createOAuth2Client();
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Crucial for refresh token
    scope: scopes,
    state: state, // To pass workspaceId and userId securely
    prompt: 'consent', // Force consent to get refresh token
  });
};

/**
 * Exchange Code for Tokens
 */
const getTokens = async (code) => {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

/**
 * Send Email via Gmail API
 */
const sendEmail = async (auth, to, subject, htmlContent) => {
    const gmail = google.gmail({ version: 'v1', auth });

    // Create raw email string
    // Headers must be correct for Gmail API
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      htmlContent,
    ];
    const message = messageParts.join('\n');

    // Encode the message
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return res.data;
};

/**
 * Create Authenticated Client from Refresh Token
 */
const createAuthFromRefreshToken = (refreshToken) => {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return oauth2Client;
};


module.exports = {
  getAuthUrl,
  getTokens,
  sendEmail,
  createAuthFromRefreshToken
};
