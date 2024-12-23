import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { StoredTokenInfo } from '../types';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
let isInitialized = false;
let tokenClient: google.accounts.oauth2.TokenClient | null = null;

const TOKEN_STORAGE_KEY = 'google_calendar_token';

const storeTokenInfo = (tokenResponse: google.accounts.oauth2.TokenResponse) => {
  const tokenInfo: StoredTokenInfo = {
    access_token: tokenResponse.access_token,
    expires_at: Date.now() + (tokenResponse.expires_in * 1000)
  };
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenInfo));
};

const getStoredToken = (): StoredTokenInfo | null => {
  const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!stored) return null;

  const tokenInfo: StoredTokenInfo = JSON.parse(stored);
  if (Date.now() >= tokenInfo.expires_at) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }
  return tokenInfo;
};

const validateEnvVars = () => {
  if (!GOOGLE_API_KEY || !GOOGLE_CLIENT_ID) {
    throw new Error('Missing Google Calendar credentials');
  }
};

const handleGoogleCalendarError = (error: unknown) => {
  console.error('Error:', error);
  if (error instanceof Error) {
    toast.error(`Calendar operation failed: ${error.message}`);
  } else {
    toast.error('An unknown error occurred');
  }
};

export const initGoogleCalendar = async (): Promise<void> => {
  if (isInitialized) return;

  try {
    validateEnvVars();

    // Load GIS library
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });

    // Initialize token client
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: () => {
        /* Callback will be set later */
      },
    });

    isInitialized = true;
  } catch (error) {
    console.error('Google Calendar initialization error:', error);
    handleGoogleCalendarError(error);
    throw error;
  }
};

export const addToGoogleCalendar = async (subscription: {
  name: string;
  price: string;
  renewalDate: string;
}): Promise<void> => {
  try {
    if (!isInitialized) {
      await initGoogleCalendar();
    }

    let accessToken: string;
    const storedToken = getStoredToken();

    if (storedToken) {
      accessToken = storedToken.access_token;
    } else {
      if (!tokenClient) {
        throw new Error('Token client not initialized');
      }

      // Request new access token
      const tokenResponse = await new Promise<google.accounts.oauth2.TokenResponse>(
        (resolve, reject) => {
          tokenClient!.callback = (response: google.accounts.oauth2.TokenResponse) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          };
          tokenClient.requestAccessToken({ prompt: 'consent' });
        }
      );

      storeTokenInfo(tokenResponse);
      accessToken = tokenResponse.access_token;
    }

    // Load gapi client if needed
    if (!window.gapi?.client) {
      await loadGapiClient();
    }

    // Set access token
    window.gapi.client.setToken({
      access_token: accessToken,
    });

    // Create and insert event
    const event = {
      summary: `${subscription.name} Subscription Renewal`,
      description: `Renewal for ${subscription.name} subscription - ${subscription.price}`,
      start: {
        dateTime: format(new Date(subscription.renewalDate), "yyyy-MM-dd'T'HH:mm:ssxxx"),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: format(new Date(subscription.renewalDate), "yyyy-MM-dd'T'HH:mm:ssxxx"),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    await window.gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    toast.success('Successfully added event to Google Calendar!');
  } catch (error) {
    console.error('Calendar operation failed:', error);
    handleGoogleCalendarError(error);
    throw error;
  }
};

const loadGapiClient = async () => {
  if (!window.gapi?.client) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load gapi client'));
      document.head.appendChild(script);
    });

    await new Promise<void>((resolve, reject) => {
      window.gapi.load('client', {
        callback: resolve,
        onerror: () => reject(new Error('Failed to load gapi client')),
        timeout: 5000,
        ontimeout: () => reject(new Error('Timeout loading gapi client')),
      });
    });

    await window.gapi.client.init({
      apiKey: GOOGLE_API_KEY,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    });
  }
};