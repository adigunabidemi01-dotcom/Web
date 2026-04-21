# PromptMaster Pro - AI Prompt Generator

A fully functional, monetization-gated AI prompt generation application built with React, Tailwind CSS, Stripe, and Google Gemini API.

## Architecture

*   **Frontend**: React (Vite) + Tailwind CSS
*   **Backend for AI Studio**: Express Server (`server.ts`)
*   **Backend for Netlify Deploy**: Netlify Functions (`netlify/functions/generate.js`)
*   **Monetization**: Dual path (Stripe $300 one-off payment OR Watch 10 Rewarded Ads simulated)
*   **AI Engine**: Google Gemini API (`gemini-2.5-flash`)

## How to Set Up & Deploy (Netlify & GitHub)

The user runs this code via Netlify (for static file hosting + serverless functions):

### Step 1: Create a GitHub Repository
1. Initialize a Git repository in this folder if you haven't.
2. Commit all your files.
3. Push to a new GitHub repository.

### Step 2: Configure Keys
Create accounts and grab the necessary API keys:
1.  **Google AI Studio**: Go to [aistudio.google.com](https://aistudio.google.com/) and grab a Gemini API Key.
2.  **Stripe**: Go to the [Stripe Dashboard](https://dashboard.stripe.com/), enable Test Mode, and copy your `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`.
3.  **Google AdSense**: Register your domain on [AdSense](https://adsense.google.com). Once approved, replace the `AdPlaceholder` component's JSX with your actual `<ins className="adsbygoogle">` snippet and Publisher ID.

### Step 3: Deploy to Netlify
1. Go to [Netlify Settings](https://app.netlify.com) and click **"Add New Site" -> "Import an existing project"**.
2. Connect your GitHub account and select your repository.
3. Netlify will auto-detect the Vite build settings:
    *   Build command: `npm run build`
    *   Publish directory: `dist`
4. **Environment Variables**: Click "Add Environment Variables" and provide:
    *   `GEMINI_API_KEY` - Your Gemini Key
    *   `STRIPE_SECRET_KEY` - Your Stripe Secret Key
    *   `APP_URL` - Set this to your Netlify URL (e.g., `https://my-app.netlify.app`) once assigned.
5. Click **Deploy Site**.

### Step 4: Upgrading from "Simulated Ads" to Real Ads
We implemented an "Ad Credit" simulator via `localStorage`. For real monetization using Rewarded Video Ads:
1.  Sign up for an ad proxy network like **AdMob for Web** or **PropellerAds** that supports "Rewarded Web Ads".
2.  Import their SDK tag into `/index.html`.
3.  In `App.tsx`, inside `handleWatchAd()`, call their Javascript SDK:
    ```javascript
    AdProvider.showRewardedAd({
      onRewarded: () => {
         // This is fired when the user completes the video ad
         const newCredits = adCredits + 1;
         setAdCredits(newCredits);
         localStorage.setItem('ad_credits', newCredits.toString());
      }
    });
    ```

## Development (Local / AI Studio)
To run this application locally outside of a static serverless context, we use the included full-stack Express server:
```bash
npm run dev
```
