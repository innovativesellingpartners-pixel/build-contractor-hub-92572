

## Update Live Stripe API Keys

### Overview
Update all three Stripe secrets to use live mode keys instead of test keys.

### Steps

1. **Update STRIPE_SECRET_KEY** - Request the new live secret key (`sk_live_...`) from the user and save it
2. **Update STRIPE_PUBLISHABLE_KEY** - Request the new live publishable key (`pk_live_...`) and save it
3. **Update STRIPE_WEBHOOK_SECRET** - Request the new live webhook signing secret (`whsec_...`) and save it
4. **Update frontend code** - Ensure the publishable key used in frontend Stripe components references the updated secret (check if it's hardcoded or pulled from the backend)
5. **Verify** - Test the Stripe connection from the app to confirm the new keys work

### Technical Details
- Secrets are stored securely as backend secrets and accessed by backend functions
- The publishable key may also need to be updated in the frontend code if it's embedded there
- After updating, the webhook endpoint will need to be configured in the Stripe dashboard to point to the live webhook URL

