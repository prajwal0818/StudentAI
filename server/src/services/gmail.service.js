const { google } = require('googleapis');
const User = require('../models/User');
const { encrypt, decrypt } = require('../utils/encryption');
const logger = require('../utils/logger');

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
];

function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

/**
 * Generate the Google OAuth consent URL.
 */
function getAuthUrl(userId) {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: userId,
    prompt: 'consent',
  });
}

/**
 * Exchange the authorization code for tokens, fetch the user's
 * Gmail address, and store encrypted tokens in the User document.
 */
async function handleCallback(code, userId) {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  // Fetch the user's email address
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data: profile } = await oauth2.userinfo.get();

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.googleTokens = {
    accessToken: encrypt(tokens.access_token),
    refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : user.googleTokens?.refreshToken,
    expiryDate: tokens.expiry_date,
    gmailAddress: profile.email,
  };
  await user.save();

  logger.info(`Gmail connected for user ${userId} (${profile.email})`);
}

/**
 * Build an authenticated OAuth2 client for a user.
 * Automatically refreshes the access token if expired.
 */
async function getAuthenticatedClient(userId) {
  const user = await User.findById(userId);
  if (!user?.googleTokens?.accessToken) {
    throw new Error('Gmail not connected');
  }

  const client = createOAuth2Client();
  client.setCredentials({
    access_token: decrypt(user.googleTokens.accessToken),
    refresh_token: user.googleTokens.refreshToken ? decrypt(user.googleTokens.refreshToken) : undefined,
    expiry_date: user.googleTokens.expiryDate,
  });

  // If the token is expired, force a refresh
  if (user.googleTokens.expiryDate && Date.now() >= user.googleTokens.expiryDate) {
    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);

    user.googleTokens.accessToken = encrypt(credentials.access_token);
    if (credentials.refresh_token) {
      user.googleTokens.refreshToken = encrypt(credentials.refresh_token);
    }
    user.googleTokens.expiryDate = credentials.expiry_date;
    await user.save();
    logger.info(`Gmail token refreshed for user ${userId}`);
  }

  return client;
}

/**
 * Send an email via the Gmail API.
 */
async function sendEmail(userId, { to, cc, subject, body }) {
  const auth = await getAuthenticatedClient(userId);
  const gmail = google.gmail({ version: 'v1', auth });

  const lines = [
    `To: ${to}`,
    cc ? `Cc: ${cc}` : null,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    body,
  ].filter(Boolean);

  const raw = Buffer.from(lines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  logger.info(`Email sent via Gmail for user ${userId}, messageId=${result.data.id}`);
  return { messageId: result.data.id };
}

/**
 * Disconnect Gmail — clear stored tokens.
 */
async function disconnect(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.googleTokens = {
    accessToken: null,
    refreshToken: null,
    expiryDate: null,
    gmailAddress: null,
  };
  await user.save();
  logger.info(`Gmail disconnected for user ${userId}`);
}

/**
 * Return connection status.
 */
async function getStatus(userId) {
  const user = await User.findById(userId);
  if (!user?.googleTokens?.accessToken) {
    return { connected: false };
  }
  return { connected: true, gmailAddress: user.googleTokens.gmailAddress };
}

module.exports = { getAuthUrl, handleCallback, sendEmail, disconnect, getStatus };
