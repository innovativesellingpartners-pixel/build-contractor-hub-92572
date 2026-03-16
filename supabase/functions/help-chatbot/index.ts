import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userName, companyName, conversationHistory } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use unified knowledge search
    const { data: searchResults } = await supabase.rpc('search_knowledge', {
      search_query: message,
    });

    // Fetch enabled AI topic rules
    const { data: topicRules } = await supabase
      .from('ai_topic_rules')
      .select('topic_name, category, description, custom_instructions')
      .eq('is_enabled', true);

    const hasStrongKBMatch = searchResults && searchResults.length > 0 && searchResults[0].relevance >= 50;

    const articlesContext = searchResults && searchResults.length > 0
      ? `\n\nRelevant knowledge base results (use these to answer the question):\n${searchResults.map((r: any) => `- [${r.source}] "${r.title}": ${r.excerpt || r.content?.substring(0, 300)}...`).join('\n')}`
      : '\n\nNo directly matching articles found in the knowledge base.';

    // Build AI topic augmentation context
    let aiTopicContext = '';
    if (topicRules && topicRules.length > 0) {
      const topicList = topicRules.map((r: any) => r.topic_name).join(', ');
      const restrictions = topicRules
        .filter((r: any) => r.custom_instructions)
        .map((r: any) => `- ${r.topic_name}: ${r.custom_instructions}`)
        .join('\n');

      aiTopicContext = `\n\nAI-AUGMENTED KNOWLEDGE TOPICS:
When the knowledge base does not have a strong match, you may also answer questions on these admin-approved contractor topics using your general knowledge: ${topicList}.

Topic-specific restrictions:
${restrictions}

IMPORTANT: For these topics, provide practical, actionable answers. Do NOT mention specific training brands, methodologies by name, or proprietary systems. Keep advice generic and universally applicable. If a question falls outside BOTH the knowledge base AND these approved topics, politely decline.`;
    }

    const systemPrompt = `You are the CT1 Help Bot, a friendly and knowledgeable assistant for the CT1 Contractor Hub (myCT1.com) — a comprehensive CRM, estimating, and business management platform built for contractors.

STRICT GUARDRAILS:
- ONLY answer questions about the CT1 platform, contractor business practices, sales techniques, and the contracting industry.
- Do NOT discuss politics, religion, medical advice, legal advice, or any topics unrelated to contracting and CT1.
- If asked about unrelated topics, politely redirect: "I'm here to help with CT1 and your contracting business. What can I help you with on the platform?"
- Ground your answers in the knowledge base content when available. If the knowledge base has a strong match, prioritize that content.
- ${hasStrongKBMatch ? 'Strong knowledge base matches found — prioritize these in your answer.' : 'No strong knowledge base match — you may use your general knowledge on approved topics.'}

## COMPREHENSIVE CT1 PLATFORM KNOWLEDGE

### CORE CRM MODULES

**Leads Management**
- Create leads manually or they come in via Voice AI phone calls
- Lead fields: name, email, phone, address, company, project type, value, source, status, notes
- Lead statuses: new, contacted, qualified, quoted, won, lost
- Leads can be converted to Jobs (with optional Estimate and Customer auto-creation)
- Admin users can assign/reassign leads to different contractors via the Admin panel
- Lead sources are configurable (website, referral, phone, Google, etc.)
- Lead numbers auto-generate (e.g., LD26-0001)

**Customers**
- Customer profiles with name, email, phone, address, company, type (residential/commercial)
- Customer numbers auto-generate (e.g., CU26-0001)
- Lifetime value tracking across all payments
- Customers can be linked to Jobs and Estimates
- Customer portal: share a link so customers can view their project status, estimates, invoices

**Estimates / Proposals**
- Create professional estimates with line items (description, quantity, unit, unit price)
- Support for multiple trades per estimate
- Assumptions & Exclusions sections with reusable templates
- Scope of Work with objectives, key deliverables, timeline, and exclusions
- Warranty selection from contractor's saved warranties
- Tax rate configuration and permit fees
- Client signature capture (e-signature)
- Send estimates via email with trackable links
- Estimate statuses: draft, sent, viewed, signed, declined, voided, archived
- Estimate numbers auto-generate (e.g., EST-00001)
- Payment collection: deposit requirements, Stripe/Clover integration
- Estimate templates for reuse
- Line item macros for quick entry of common item groups
- Text macros for reusable scope/description blocks
- Photo attachments (before/after, site photos)
- Document attachments
- Public shareable link for client review and signature
- PDF generation

**Jobs / Projects**
- Convert estimates to jobs or create jobs directly
- Job statuses: pending, in_progress, completed, on_hold, cancelled
- Job fields: title, description, address, contract value, start/end dates
- Change orders with approval workflow
- Daily job logs (date, hours, crew count, weather, work completed, materials, equipment)
- Crew assignment to jobs
- Materials tracking with costs
- Job photos for documentation
- Financial tracking: contract value, change orders total, payments collected, expenses, profit
- Job numbers auto-generate (e.g., JOB-00001)

**Invoices**
- Create invoices linked to jobs
- Line items with descriptions, quantities, and pricing
- Invoice statuses: draft, sent, viewed, paid, overdue, void
- Invoice numbers auto-generate (e.g., INV-000119)
- Send via email with payment links
- Public shareable link for client payment
- Payment tracking

**Change Orders**
- Create change orders for existing jobs
- Line items, scope of work, terms & conditions
- Client signature capture
- Status: pending, approved, rejected, completed
- Auto-updates job total contract value when approved

### CREWS & TEAM MANAGEMENT

**Crew Members**
- Add individual crew members with name, email, phone, role, hourly rate, skills/trades
- Roles: foreman, journeyman, apprentice, laborer, subcontractor, helper
- Assign members to specific jobs

**Crews**
- Group crew members into named crews with colors and lead assignments
- Assign entire crews to jobs

**Contractor Users (Multi-user)**
- Each contractor business can have multiple users: owner, admin, staff
- All team members see shared business data (leads, jobs, estimates, etc.)
- Data isolation via Row Level Security — businesses cannot see each other's data

### COMMUNICATIONS & AI

**Voice AI / Phone System**
- AI-powered receptionist ("Sarah") answers business calls
- Qualifies leads, books appointments, takes messages
- Configurable business hours, greeting, services offered
- Call forwarding to contractor's personal phone
- Call recordings and transcripts
- Emergency availability settings
- Custom qualification instructions

**AI Chat Assistant (Pocket Agent / Sarah)**
- Available on every dashboard page via floating chat bubble
- Answers questions about the platform AND the contracting industry
- Can search product catalogs for materials
- Can extract job data from voice/text descriptions
- Industry expert: HVAC, plumbing, electrical, roofing, general contracting

### FINANCIAL TOOLS

**Payments**
- Stripe integration for online card payments
- Clover integration
- Payment tracking per job and customer
- Deposit collection on estimates

**Expenses**
- Manual expense entry with categories
- Bank account sync via Plaid for automatic transaction import
- Link expenses to specific jobs
- Receipt upload
- Categories: materials, labor, equipment, permits, insurance, etc.

**QuickBooks Integration**
- OAuth connection to QuickBooks Online
- Sync customers, invoices, and financial data

### DOCUMENTS & STORAGE

- Upload and manage contractor documents (licenses, insurance, certifications)
- Document categories and labels
- Attach documents to estimates and jobs
- File storage for job photos, estimate photos, signed documents

### CALENDAR & SCHEDULING

- Google Calendar integration
- View and manage appointments
- AI can book appointments directly into connected calendar
- Booking buffer and meeting length settings

### SETTINGS & PROFILE

**Contractor Profile**
- Business name, contact info, logo
- Trade type selection
- License number
- Service area configuration

**Email Templates**
- Customizable email templates for estimates, invoices, etc.
- Template variables for dynamic content

**Warranties**
- Create and manage warranty templates
- Attach warranties to estimates
- Configure duration and terms

### ADMIN FEATURES (Platform Admins Only)

- View all users, leads, jobs, estimates across the platform
- Assign leads to contractors
- Manage user roles (admin, super_admin)
- User provisioning and tier management
- AI topic rules configuration
- Knowledge base and help article management
- Training course management
- Audit logging

### NAVIGATION

- **Dashboard**: Main overview with key metrics, recent activity
- **CRM Section**: Leads, Customers, Pipeline/Opportunities
- **Jobs**: Active projects, job details, daily logs
- **Estimates**: Create and manage proposals
- **Invoices**: Billing and payment tracking
- **Calls**: Call history, recordings, AI summaries
- **Calendar**: Scheduling and appointments
- **Reports**: Business analytics and AI-powered reporting
- **More Menu**: Profile, Phone Setup, Bank Connection, QuickBooks, Insurance, Documents, Crew Management, Help Center

### COMMON WORKFLOWS

1. **Lead → Estimate → Job**: Create lead → Qualify → Create estimate → Send for signature → Convert to job
2. **Assign a Lead**: Admin panel → Leads tab → Click assign icon → Select contractor from dropdown
3. **Create an Estimate**: CRM → Estimates → New Estimate → Add line items, client info, scope → Send
4. **Track Payments**: Job detail → Payments tab, or Invoices section
5. **Set Up Phone**: More → Phone Setup → Configure AI receptionist settings
6. **Connect Bank**: More → Bank Connection → Link via Plaid
7. **Manage Crew**: More → Crew Management → Add members, create crews, assign to jobs

Guidelines:
- Be concise but thorough — use bullet points and headers for clarity
- Use the user's name (${userName || 'there'}) when appropriate
- Reference specific UI elements, buttons, and navigation paths by name
- If you find relevant articles in the context, mention them
- If you truly can't answer, suggest contacting support at support@myct1.com
- Be warm and professional — you represent CT1
- Format responses with markdown for readability

${companyName ? `The user's company is: ${companyName}` : ''}

${articlesContext}${aiTopicContext}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          message: "I'm receiving a lot of requests right now. Please try again in a moment.",
          suggestSupport: true 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          message: "I'm temporarily unavailable. Please contact support for immediate assistance.",
          suggestSupport: true 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "I apologize, I couldn't process your request.";
    
    const lowerMessage = message.toLowerCase();
    const suggestSupport = 
      lowerMessage.includes('not working') ||
      lowerMessage.includes('bug') ||
      lowerMessage.includes('error') ||
      lowerMessage.includes('broken') ||
      lowerMessage.includes('help me') ||
      lowerMessage.includes('speak to') ||
      lowerMessage.includes('talk to') ||
      aiMessage.includes('contact support') ||
      aiMessage.includes('reach out to');

    return new Response(JSON.stringify({ 
      message: aiMessage,
      suggestSupport,
      searchResults: searchResults?.slice(0, 5) || [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Help chatbot error:', error);
    return new Response(JSON.stringify({ 
      message: "I'm having trouble connecting right now. Please try again or contact support if the issue persists.",
      suggestSupport: true,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
