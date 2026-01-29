
# Feature Verification Matrix & Implementation Plan

## Feature Verification Matrix

| # | Feature | Location | Status | Notes |
|---|---------|----------|--------|-------|
| **A** | **Start Travel → Client Message + Maps** | JobDetailViewBlue.tsx | ✅ Already Working | Lines 496-551: ETA dialog prompts for SMS before maps launch |
| **B** | **Address Autocomplete Everywhere** | Various dialogs | ✅ Already Working | Used in 13+ components (AddJobDialog, AddLeadDialog, EditJobDialog, etc.) |
| **C** | **Change Order Customer Signature** | PublicChangeOrder.tsx | ✅ Already Working | Full signature flow with SignatureCanvas, agreement checkbox, status update |
| **D** | **Chatbot Floating Widget UI Fix** | FloatingPocketbot.tsx | ⚠️ Needs Fix | Draggable but can overlap controls, needs collapse behavior |
| **E** | **Job Photos: Multi-Capture + Auto Upload + Refresh** | JobPhotosSection.tsx, JobDetailViewBlue.tsx | ✅ Already Working | Multiple file input, RefreshCw button, auto-upload loop |
| **F** | **First Job Photo Requirement** | JobDetailViewBlue.tsx | ❌ Missing | No enforced prompt for "front of property" photo |
| **G1** | **Estimate Deposit Consistency** | send-estimate/index.ts | ✅ Already Working | Email shows deposit (line 254), PDF attached |
| **G2** | **Preview Estimate PDF Before Sending** | EstimateDetailViewBlue.tsx | ✅ Already Working | "REVIEW PDF" button (line 326-334), EstimatePDFPreview component |
| **G3** | **"Labor & Materials" Option** | LineItemsStep.tsx | ✅ Already Working | In CATEGORIES array (line 16) |
| **G4** | **Estimate Next/Back Button Spacing** | EstimateBuilder.tsx | ✅ Already Working | Has `mb-20 md:mb-0 relative z-50` (line 338) |
| **G5** | **Insurance Section on Estimates** | EstimateBuilder.tsx, EnhancedEstimateForm.tsx | ✅ Already Working | `terms_insurance` field exists throughout |
| **G6** | **Send Estimate by SMS (Twilio)** | EstimateDetailViewBlue.tsx | ❌ Missing | Only email sending exists, no SMS option |
| **H** | **Invoices: Send to Customer** | (cut off in requirements) | Needs verification | |

---

## Items Requiring Implementation

### 1. Chatbot Widget UI Fix (Feature D)

**Problem**: FloatingPocketbot can overlap primary UI controls and lacks minimize behavior.

**Implementation**:

**File: `src/components/contractor/FloatingPocketbot.tsx`**

- Add minimize/collapse state and button
- Adjust default position to bottom-right corner (safer for mobile)
- Add safe area padding for mobile bottom nav
- Collapsed state shows only small icon that can expand

```tsx
// Add minimize state
const [isMinimized, setIsMinimized] = useState(false);

// Adjust initial position to bottom-right
const defaultPosition = { 
  x: isMobile ? 16 : Math.max(0, window.innerWidth - 400), 
  y: isMobile ? window.innerHeight - 520 : window.innerHeight - 560
};

// Collapsed view
{isMinimized ? (
  <Card className="fixed w-14 h-14 rounded-full shadow-xl cursor-pointer">
    <Button onClick={() => setIsMinimized(false)}>
      <Bot className="h-6 w-6" />
    </Button>
  </Card>
) : (
  // Full chat card with minimize button in header
)}
```

**File: `src/components/GlobalPocketbot.tsx`**

- Move trigger button to avoid overlap with page content
- Add `bottom-safe` padding for iOS

---

### 2. First Job Photo Requirement (Feature F)

**Problem**: No enforced prompt when taking the first job photo.

**Implementation**:

**File: `src/components/contractor/crm/JobDetailViewBlue.tsx`**

Add state and dialog for first photo prompt:

```tsx
// Add state
const [showFirstPhotoPrompt, setShowFirstPhotoPrompt] = useState(false);
const [hasShownFirstPhotoPrompt, setHasShownFirstPhotoPrompt] = useState(false);

// In PhotosTabContent
useEffect(() => {
  if (photos.length === 0 && !hasShownFirstPhotoPrompt) {
    setShowFirstPhotoPrompt(true);
    setHasShownFirstPhotoPrompt(true);
  }
}, [photos.length, hasShownFirstPhotoPrompt]);

// Add dialog
<Dialog open={showFirstPhotoPrompt} onOpenChange={setShowFirstPhotoPrompt}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>First Photo Required</DialogTitle>
    </DialogHeader>
    <Alert>
      <AlertDescription>
        The first photo for this job should be the **front of the property with the address visible**. 
        This helps verify the job location for documentation purposes.
      </AlertDescription>
    </Alert>
    <Button onClick={() => {
      setShowFirstPhotoPrompt(false);
      cameraInputRef.current?.click();
    }}>
      Take Front Photo
    </Button>
  </DialogContent>
</Dialog>
```

**File: `src/hooks/useJobPhotos.ts`**

Add tagging for first photo:

```tsx
// In uploadPhoto function, add auto-tag logic
const isFirstPhoto = photos.length === 0;
const { data, error } = await supabase
  .from('job_photos')
  .insert([{
    job_id: jobId,
    user_id: user.id,
    photo_url: filePath,
    caption: isFirstPhoto ? 'Front of Property' : caption,
    is_front_photo: isFirstPhoto, // Add this column if needed
  }])
```

---

### 3. Send Estimate by SMS (Feature G6)

**Problem**: No option to send estimate link via text message.

**Implementation**:

**File: `supabase/functions/send-estimate-sms/index.ts`** (NEW)

Create new edge function for SMS:

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEstimateSMSRequest {
  estimateId: string;
  phoneNumber: string;
  contractorName: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { estimateId, phoneNumber, contractorName }: SendEstimateSMSRequest = await req.json();

    // Fetch estimate
    const { data: estimate, error: fetchError } = await supabase
      .from('estimates')
      .select('*')
      .eq('id', estimateId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !estimate) {
      return new Response(JSON.stringify({ error: "Estimate not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get contractor's Twilio number
    const { data: phoneData } = await supabase
      .from("phone_numbers")
      .select("twilio_number")
      .eq("contractor_id", user.id)
      .eq("is_active", true)
      .single();

    if (!phoneData?.twilio_number) {
      return new Response(JSON.stringify({ 
        error: "No Twilio number configured. Set up Voice AI first." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format message
    const appUrl = Deno.env.get('APP_URL') || 'https://myct1.com';
    const publicUrl = `${appUrl}/estimate/${estimate.public_token}`;
    const total = estimate.total_amount || estimate.grand_total || 0;
    
    const message = `Hi ${estimate.client_name || 'there'},

${contractorName} has sent you an estimate for ${estimate.title || 'your project'}.

Total: $${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}

View, sign & pay online:
${publicUrl}

Questions? Reply to this text.`;

    // Send via Twilio
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const twilioAuth = btoa(`${accountSid}:${authToken}`);

    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${twilioAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: formattedPhone,
        From: phoneData.twilio_number,
        Body: message,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      // Update estimate sent_at
      await supabase
        .from('estimates')
        .update({ sms_sent_at: new Date().toISOString() })
        .eq('id', estimateId);

      return new Response(JSON.stringify({ 
        success: true, 
        sid: result.sid 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: result.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;
  if (cleaned.length > 10) return `+${cleaned}`;
  return phone;
}
```

**File: `src/components/contractor/crm/sections/EstimateDetailViewBlue.tsx`**

Add SMS button and dialog:

```tsx
// Add state
const [showSMSDialog, setShowSMSDialog] = useState(false);
const [isSendingSMS, setIsSendingSMS] = useState(false);

// Add SMS handler
const handleSendSMS = async () => {
  if (!estimate.client_phone) {
    toast.error('Client phone number is required');
    return;
  }

  setIsSendingSMS(true);
  try {
    const { data, error } = await supabase.functions.invoke('send-estimate-sms', {
      body: {
        estimateId: estimate.id,
        phoneNumber: estimate.client_phone,
        contractorName: user?.user_metadata?.full_name || 'Your Contractor',
      },
    });

    if (error) throw error;
    toast.success('Estimate sent via SMS!');
    setShowSMSDialog(false);
  } catch (error: any) {
    toast.error('Failed to send SMS: ' + error.message);
  } finally {
    setIsSendingSMS(false);
  }
};

// Add button in ActionButtonRow
{estimate.client_phone && (
  <ActionButton 
    variant="secondary" 
    onClick={() => setShowSMSDialog(true)}
    className="flex items-center gap-2"
  >
    <MessageSquare className="w-4 h-4" />
    SEND SMS
  </ActionButton>
)}
```

---

## Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/contractor/FloatingPocketbot.tsx` | Modify | Add minimize/collapse behavior, adjust positioning |
| `src/components/GlobalPocketbot.tsx` | Modify | Move trigger button to avoid overlap |
| `src/components/contractor/crm/JobDetailViewBlue.tsx` | Modify | Add first photo requirement dialog in PhotosTabContent |
| `src/hooks/useJobPhotos.ts` | Modify | Auto-tag first photo as "Front of Property" |
| `supabase/functions/send-estimate-sms/index.ts` | Create | New Twilio SMS function for estimates |
| `src/components/contractor/crm/sections/EstimateDetailViewBlue.tsx` | Modify | Add "SEND SMS" button and handler |

---

## QA Checklist

### D) Chatbot Widget
- [ ] Minimize button collapses to icon
- [ ] Expand restores full chat
- [ ] Does not overlap bottom nav on mobile
- [ ] Does not cover primary action buttons
- [ ] Works in light and dark mode

### F) First Job Photo
- [ ] New job with no photos triggers prompt
- [ ] Prompt explains "front of property with address"
- [ ] Clicking "Take Photo" opens camera
- [ ] First photo auto-captioned "Front of Property"
- [ ] Subsequent photos don't trigger prompt

### G6) SMS Estimates
- [ ] "SEND SMS" button visible when client has phone
- [ ] SMS contains estimate link, total, contractor name
- [ ] Success toast on send
- [ ] Error shown if no Twilio number configured
- [ ] Estimate updated with sms_sent_at timestamp
