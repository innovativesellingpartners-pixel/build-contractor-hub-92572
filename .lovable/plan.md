

## Google OAuth Verification Fix

### The Problem

Google is rejecting your verification because the **scopes listed on your OAuth Consent Screen in Google Cloud Console don't match the scopes your app actually requests** in code.

### What Your App Requests (in code)

Your edge functions request these scopes:

```text
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.compose
openid
email
profile
```

### What You Need to Do (in Google Cloud Console)

1. Go to **Google Cloud Console → APIs & Services → OAuth consent screen**
2. Click **Edit App** and go to the **Scopes** step
3. Make sure **all of the following scopes are listed** (add any missing ones):
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.compose`
4. **Remove any scopes listed there that are NOT in the list above** — they must match exactly
5. Save and submit
6. **Reply to Google's email** confirming you've updated the scopes

### About the Demo Video

For the demo video Google requires, you need to show:
- Your app's login screen
- The Google consent screen appearing with the correct scopes listed
- The user granting access
- Your app actually using the Gmail and Calendar data (show an email being sent or calendar events loading)
- Keep it under 5 minutes, no narration needed — just screen recording with captions

### No Code Changes Needed

This is purely a Google Cloud Console configuration fix — your code is correct. The scopes in your consent screen just need to match what the code requests.

