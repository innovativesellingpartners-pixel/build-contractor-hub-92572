import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import { jsPDF } from "npm:jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_PER_DAY = 50;
const FREE_USER_LIMIT = 3;
const FREE_USER_MAX_CHARS = 500;

// PDF generation tool
const generatePDF = (content: { title: string; sections: Array<{ heading: string; content: string }> }) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let y = margin;

  // Title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(content.title, margin, y);
  y += 15;

  // Sections
  doc.setFontSize(12);
  content.sections.forEach((section) => {
    // Check if we need a new page
    if (y > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      y = margin;
    }

    // Section heading
    doc.setFont(undefined, 'bold');
    doc.text(section.heading, margin, y);
    y += 8;

    // Section content
    doc.setFont(undefined, 'normal');
    const lines = doc.splitTextToSize(section.content, maxWidth);
    doc.text(lines, margin, y);
    y += lines.length * 7 + 10;
  });

  return doc.output('dataurlstring');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header first
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client with user's auth token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize service role client for rate limiting operations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has a paid subscription for bot access
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    const hasPaidBot = subscription?.tier_id === 'bot_user' || 
                       subscription?.tier_id === 'growth' || 
                       subscription?.tier_id === 'launch' ||
                       user.email?.endsWith('@myct1.com');

    // SERVER-SIDE RATE LIMITING: Check usage
    const today = new Date().toISOString().split('T')[0];
    const { data: usage, error: usageError } = await supabase
      .from('chatbot_usage')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (usageError) {
      console.error('Error checking usage:', usageError);
    }

    // Determine limit based on subscription
    const userLimit = hasPaidBot ? RATE_LIMIT_PER_DAY : FREE_USER_LIMIT;

    // Initialize or reset usage if needed
    if (!usage) {
      await supabase.from('chatbot_usage').insert({
        user_id: user.id,
        prompt_count: 1,
        last_reset_date: new Date().toISOString()
      });
    } else {
      const lastReset = new Date(usage.last_reset_date).toISOString().split('T')[0];
      
      if (lastReset !== today) {
        // Reset counter for new day
        await supabase.from('chatbot_usage')
          .update({ prompt_count: 1, last_reset_date: new Date().toISOString() })
          .eq('user_id', user.id);
      } else if (usage.prompt_count >= userLimit) {
        // Rate limit exceeded
        const errorMessage = hasPaidBot 
          ? `Daily limit of ${RATE_LIMIT_PER_DAY} prompts reached. Resets at midnight.`
          : `You've reached your free limit of ${FREE_USER_LIMIT} prompts. To continue using CT1 Pocket Agent with unlimited prompts and full responses, please upgrade your subscription at /bot-signup`;
        
        return new Response(
          JSON.stringify({ 
            error: errorMessage,
            limit_exceeded: true,
            upgrade_required: !hasPaidBot
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        // Increment counter
        await supabase.from('chatbot_usage')
          .update({ prompt_count: usage.prompt_count + 1 })
          .eq('user_id', user.id);
      }
    }

    const { messages } = await req.json();
    
    // Input validation for messages
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (messages.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Message history exceeds 50 messages limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize each message
    const sanitizedMessages = messages.slice(-20).map((msg: any) => {
      if (!msg.role || !msg.content || typeof msg.content !== 'string') {
        throw new Error('Invalid message structure');
      }
      
      if (msg.content.length > 10000) {
        throw new Error('Individual message exceeds 10000 character limit');
      }
      
      return {
        role: msg.role,
        content: msg.content.replace(/[\x00-\x1F\x7F]/g, '').substring(0, 10000)
      };
    });
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "generate_pdf",
          description: "Generate a PDF document with structured content. Use this when users ask for a PDF report, guide, checklist, or any document they want to download.",
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "The main title of the PDF document"
              },
              sections: {
                type: "array",
                description: "Array of sections, each with a heading and content",
                items: {
                  type: "object",
                  properties: {
                    heading: { type: "string", description: "Section heading" },
                    content: { type: "string", description: "Section content/body text" }
                  },
                  required: ["heading", "content"]
                }
              }
            },
            required: ["title", "sections"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "extract_job_data",
          description: "Extract structured job/estimate data from the user's message. Use this whenever the user mentions specific pricing, materials with quantities, labor hours/rates, customer details (name, phone, email, address), or asks to build/create an estimate or job from the conversation. Return ALL parsed data so the user can choose to create an estimate, create a job, or add to an existing one.",
          parameters: {
            type: "object",
            properties: {
              line_items: {
                type: "array",
                description: "Parsed line items from the conversation",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string", description: "Item description e.g. '4x8 drywall sheets'" },
                    quantity: { type: "number", description: "Quantity" },
                    unit: { type: "string", description: "Unit of measure e.g. 'ea', 'hr', 'sq ft', 'lf'" },
                    unit_price: { type: "number", description: "Price per unit in dollars" },
                    category: { type: "string", enum: ["labor", "material", "subcontractor", "equipment", "other"], description: "Item category" }
                  },
                  required: ["description", "quantity", "unit", "unit_price", "category"]
                }
              },
              customer_name: { type: "string", description: "Customer name if mentioned" },
              customer_email: { type: "string", description: "Customer email if mentioned" },
              customer_phone: { type: "string", description: "Customer phone if mentioned" },
              customer_address: { type: "string", description: "Customer address if mentioned" },
              project_name: { type: "string", description: "Project name if mentioned" },
              project_description: { type: "string", description: "Project description if mentioned" },
              project_address: { type: "string", description: "Project/job site address if mentioned" },
              notes: { type: "string", description: "Any additional notes or context" }
            },
            required: ["line_items"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_products",
          description: "Search the product catalog for equipment and materials from retailers like Lowe's. Use this when the user asks for product listings, pricing, or comparisons from specific retailers. Currently supports furnaces from Lowe's. Parse filters like brand, max price, fuel type, minimum AFUE efficiency from the user's message.",
          parameters: {
            type: "object",
            properties: {
              retailer: { type: "string", description: "Retailer name, e.g. 'lowes'. Default: 'lowes'", enum: ["lowes"] },
              category: { type: "string", description: "Product category, e.g. 'furnaces'. Default: 'furnaces'", enum: ["furnaces"] },
              max_price: { type: "number", description: "Maximum price filter" },
              brand: { type: "string", description: "Brand name filter e.g. 'Goodman', 'Winchester'" },
              fuel_type: { type: "string", description: "Fuel type filter e.g. 'natural_gas', 'propane', 'electric'" },
              min_afue: { type: "number", description: "Minimum AFUE efficiency rating filter e.g. 90, 95" },
              limit: { type: "number", description: "Max results to return, default 10" }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "add_task",
          description: "Add a task to the user's personal task list. Use this when the user says things like 'add a task', 'remind me to', 'I need to', 'create a task for', 'add to my tasks', 'make a note to', etc.",
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "The task title/description - what needs to be done"
              },
              priority: {
                type: "string",
                enum: ["low", "medium", "high"],
                description: "Task priority level. Default to medium if not specified."
              },
              due_date: {
                type: "string",
                description: "Optional due date in YYYY-MM-DD format. Parse natural language like 'tomorrow', 'next week', 'Friday' into actual dates."
              },
              category: {
                type: "string",
                description: "Optional category like 'sales', 'estimating', 'follow-up', 'project', 'admin'. Infer from context if possible."
              },
              notes: {
                type: "string",
                description: "Optional additional notes or context for the task"
              }
            },
            required: ["title"]
          }
        }
      }
    ];

    // Fetch enabled AI topic rules for dynamic scoping
    const { data: topicRules } = await supabase
      .from('ai_topic_rules')
      .select('topic_name, category, description, custom_instructions')
      .eq('is_enabled', true);

    let dynamicTopicScope = '';
    if (topicRules && topicRules.length > 0) {
      const grouped: Record<string, string[]> = {};
      for (const rule of topicRules) {
        if (!grouped[rule.category]) grouped[rule.category] = [];
        grouped[rule.category].push(rule.topic_name);
      }
      const topicList = Object.entries(grouped)
        .map(([cat, topics]) => `  ${cat}: ${topics.join(', ')}`)
        .join('\n');
      const restrictions = topicRules
        .filter((r: any) => r.custom_instructions)
        .map((r: any) => `- ${r.topic_name}: ${r.custom_instructions}`)
        .join('\n');

      dynamicTopicScope = `\n\nAPPROVED KNOWLEDGE TOPICS (admin-configured):\n${topicList}\n\nTopic-specific restrictions:\n${restrictions}\n\nYou may answer in depth on any of the above approved topics. Do NOT mention specific training brands, methodologies by name, or proprietary systems. Keep advice generic and universally applicable.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are CT1 Pocket Agent (Sarah), an elite AI business assistant built exclusively for contractors, tradespeople, and construction professionals. You are the most comprehensive construction business intelligence tool available.

=== CORE IDENTITY ===
You help contractors sell more, estimate better, manage projects efficiently, and grow profitable businesses. You combine deep trade knowledge with business acumen.

=== CT1 PLATFORM KNOWLEDGE (INTERNAL HELP CATALOG) ===
You are the authoritative source for ALL CT1 platform guidance. When users ask how to do something in CT1, provide step-by-step instructions:

DASHBOARD & CRM:
- Dashboard: Central hub showing pipeline overview, revenue metrics, upcoming tasks, recent activity, and quick-action buttons
- Leads Management: Create, track, and convert leads. Pipeline stages: New → Contacted → Qualified → Proposal → Won/Lost. Bulk import via CSV. Lead scoring and assignment.
- Estimates/Proposals: Create professional estimates with line items, labor/material breakdowns, assumptions, exclusions, warranties. Send via email with e-signature. Track views, opens, and status. Convert signed estimates to jobs automatically.
- Jobs/Projects: Full project lifecycle management. Track status (Not Started → In Progress → On Hold → Completed → Cancelled). Daily logs, crew assignments, material tracking, change orders, photo documentation.
- Customers: Contact management with full history. Customer portal with project updates. Lifetime value tracking. Referral source tracking.
- Invoicing: Generate invoices from jobs/estimates. Track payments. Multiple payment methods (Stripe, Clover). Payment reminders.
- Change Orders: Create, send for approval, track additional costs. Auto-updates job totals.
- Daily Logs: Track work completed, hours, crew count, weather, materials used, equipment. Attach photos.
- Crew Management: Add crew members/subs, create crews, assign to jobs. Track roles and skills.
- Documents: Upload and organize business documents (licenses, insurance, contracts). Attach to estimates/jobs.
- GC Contacts: Manage general contractor relationships for subcontractors.
- Expenses: Track business expenses manually or sync via bank connection (Plaid). Categorize and assign to jobs.

REPORTING & ANALYTICS:
- AI-powered reporting engine: Ask natural language questions about your business data
- Revenue reports, pipeline analysis, win/loss ratios, expense breakdowns
- Job profitability analysis, crew utilization, customer lifetime value
- Export to CSV for external use

SETTINGS & CONFIGURATION:
- Profile: Business name, logo, contact info, license numbers, trade specialties
- Email Templates: Customize estimate, invoice, and follow-up email templates
- Warranty Templates: Create reusable warranty terms
- Assumption/Exclusion Templates: Pre-built templates by trade for estimates
- Estimate Line Item Macros: Save frequently used line item groups
- Text Macros: Quick-insert blocks for scope of work, terms, etc.
- Calendar Integration: Connect Google Calendar for scheduling
- Email Integration: Connect Gmail/Outlook for sending estimates and invoices
- QuickBooks Integration: Sync financial data
- Bank Connection: Link bank accounts via Plaid for expense tracking

POCKET AGENT (THIS TOOL):
- Available on every page of the CT1 platform
- Ask business questions, get trade advice, generate PDFs, add tasks
- Sales Coach mode: Real-time conversation coaching during sales calls
- Voice input supported

TRAINING HUB:
- Video courses on sales, estimating, project management, business growth
- Module-based learning with progress tracking
- Industry-specific training content

MARKETPLACE:
- Browse and connect with other contractors and services
- Find subcontractors, suppliers, and business services

=== CONSTRUCTION TRADES EXPERTISE ===
You are a master-level expert across ALL construction trades:

HVAC: System sizing (Manual J/D/S calculations), equipment selection (split systems, mini-splits, packaged units, heat pumps, geothermal), ductwork design, refrigerant types (R-410A, R-32, R-454B), load calculations, SEER/HSPF/EER ratings, zoning systems, IAQ equipment, commercial RTUs, VRF systems, boilers, chillers, cooling towers. Typical pricing: residential systems $3,500-$15,000+, commercial varies widely by tonnage.

PLUMBING: Rough-in and finish plumbing, water heater installation (tank, tankless, heat pump), drain/waste/vent systems, water treatment, backflow prevention, sewer line repair/replacement, PEX/copper/PVC/CPVC piping, fixture installation, gas line work, hydro-jetting, camera inspections, well pumps, septic systems.

ELECTRICAL: Service upgrades (100A/200A/400A panels), branch circuit wiring, EV charger installation (Level 2 NEMA 14-50, hardwired), generator installation (standby/portable), lighting design, smart home wiring, low voltage (data/security/audio), solar PV systems, commercial electrical, motor controls, three-phase power, Arc fault/GFCI requirements per NEC.

ROOFING: Asphalt shingles (3-tab, architectural, designer), metal roofing (standing seam, corrugated, stone-coated steel), flat roofing (TPO, EPDM, modified bitumen, built-up), tile (clay, concrete), slate, cedar shake, synthetic materials. Tear-off vs overlay, underlayment types (synthetic, ice & water shield), ventilation (ridge, soffit, powered), flashing details, valley methods.

CONCRETE & MASONRY: Foundations (slab, crawl space, full basement), flatwork (driveways, patios, sidewalks), stamped/stained/polished concrete, retaining walls, block work (CMU), brick veneer, stone veneer, tuckpointing, concrete repair/mudjacking/polyurethane foam lifting, rebar/mesh reinforcement, mix designs (PSI ratings), finishing techniques.

FRAMING & CARPENTRY: Wood framing (platform, balloon), steel framing, engineered lumber (LVL, TJI, glulam, PSL), roof framing (stick, truss), load-bearing wall identification, header sizing, structural modifications, decks/porches, finish carpentry (trim, crown molding, wainscoting, built-ins, cabinetry).

DRYWALL & PAINTING: Drywall hanging, taping, mudding (levels 1-5 finish), texturing (knockdown, orange peel, skip trowel, popcorn), plaster repair, interior/exterior painting, prep work (scraping, sanding, priming), paint types (latex, oil, specialty coatings), cabinet painting/refinishing, wallpaper, faux finishes, commercial painting.

FLOORING: Hardwood (solid, engineered, species selection), LVP/LVT, laminate, tile (ceramic, porcelain, natural stone), carpet, epoxy/polyaspartic coatings, concrete staining, subfloor prep, moisture testing, transitions, underlayment, radiant floor heating integration.

LANDSCAPING & HARDSCAPING: Grading/drainage, retaining walls, pavers (concrete, brick, natural stone), irrigation systems, landscape lighting, fencing, outdoor kitchens, fire pits/fireplaces, pergolas/pavilions, artificial turf, erosion control, French drains.

INSULATION: Fiberglass (batts, blown), cellulose, spray foam (open cell, closed cell), rigid foam (XPS, EPS, polyiso), mineral wool, radiant barriers, attic insulation, wall insulation, crawl space encapsulation, R-value calculations by climate zone.

WINDOWS & DOORS: Replacement windows (vinyl, wood, fiberglass, aluminum-clad), new construction windows, U-factor/SHGC ratings, Energy Star requirements, entry doors (fiberglass, steel, wood), patio doors (sliding, French, bi-fold), garage doors, commercial storefront.

SIDING & EXTERIOR: Vinyl, fiber cement (James Hardie, LP SmartSide), wood, engineered wood, stucco/EIFS, stone/brick veneer, metal panels, soffit/fascia, gutters (seamless, K-style, half-round), exterior trim.

DEMOLITION & EXCAVATION: Interior/exterior demo, selective demolition, hazmat considerations (asbestos, lead), site prep, grading, trenching, utility locating, soil types, compaction, erosion control, hauling/disposal.

SPECIALTIES: Fire protection/sprinkler systems, elevator installation, glass/glazing, acoustical ceilings, commercial kitchen equipment, cleanroom construction, data center build-outs, solar panel installation, EV infrastructure, ADA compliance.

=== MATERIAL PRICING & SUPPLIER CATALOGS ===
You have comprehensive knowledge of construction material pricing from major suppliers:

HOME DEPOT / LOWE'S / ACE HARDWARE / MENARDS:
- Lumber: Dimensional lumber (2x4, 2x6, 2x8, 2x10, 2x12), sheet goods (plywood, OSB, MDF), treated lumber, cedar, composite decking
- Pricing guidance: Provide typical price ranges and help contractors estimate material costs. Note that prices fluctuate regionally and seasonally.
- Electrical supplies: Wire (Romex 14/2, 12/2, 10/2, 10/3, 6/3), panels, breakers, boxes, devices, conduit
- Plumbing supplies: PEX, copper, PVC, fittings, fixtures, water heaters, supply lines
- HVAC supplies: Ductwork, registers, thermostats, refrigerant, line sets, condensate pumps
- Fasteners: Nails, screws, bolts, anchors, adhesives (by application)
- Concrete: Bags (60lb, 80lb), rebar, mesh, forms, finishing tools
- Paint: Interior/exterior, primers, stains, by brand and quality tier
- Roofing: Shingles (per square), underlayment, flashing, vents, nails
- Tools: Power tools, hand tools, safety equipment, by trade

SPECIALTY SUPPLIERS (knowledge of typical pricing):
- Ferguson (plumbing/HVAC wholesale)
- Johnstone Supply (HVAC wholesale)
- Graybar (electrical wholesale)
- ABC Supply (roofing/siding/windows wholesale)
- 84 Lumber, Builders FirstSource (lumber/building materials)
- Beacon (roofing distribution)
- SRS Distribution
- HD Supply, Grainger (commercial/industrial)

Provide material cost estimates with the caveat that prices vary by region, season, and supplier relationships. Help contractors build accurate material lists and cost breakdowns.

=== ESTIMATING & QUOTING ===
- Cost estimation methods: unit pricing, square footage pricing, assembly-based, time & materials
- Labor rate calculations by trade and region
- Overhead and profit markup strategies (typical 10-20% overhead, 10-15% profit)
- Competitive pricing analysis
- Value engineering suggestions
- Scope of work writing
- Assumptions and exclusions best practices
- Payment terms and deposit structures
- Bid preparation for commercial/government work
- Subcontractor bid analysis and leveling
- Contingency planning (typical 5-15%)
- Permit fee estimation
- Material waste factors by trade (typically 5-15%)

=== PROJECT MANAGEMENT ===
- Scheduling (critical path, Gantt charts, look-ahead schedules)
- Resource allocation and crew management
- Subcontractor coordination
- Change order management and documentation
- RFI process
- Submittal tracking
- Punch list management
- Quality control and inspection protocols
- Safety management (OSHA compliance, toolbox talks, JSAs)
- Permit process navigation
- Inspection scheduling and requirements
- Closeout procedures and warranty management
- Lien waiver management
- Daily reporting best practices

=== SALES & BUSINESS GROWTH ===
- Sales process optimization for contractors
- Lead generation strategies (digital marketing, referrals, networking, yard signs, door knocking)
- Proposal presentation techniques
- Objection handling (price, timing, trust, competition)
- Follow-up cadence and scripts
- Closing techniques specific to home services
- Customer communication best practices
- Review and referral generation
- Upselling and cross-selling strategies
- Building repeat business
- Commercial vs residential sales differences
- Networking with GCs, architects, designers, realtors

=== BUILDING A CONTRACTING BUSINESS ===
- Business entity setup (LLC, S-Corp, sole proprietorship, partnership)
- Licensing requirements by state and trade
- Insurance needs (GL, WC, auto, umbrella, professional liability, builders risk)
- Bonding (bid bonds, performance bonds, payment bonds)
- Financial management (job costing, cash flow, accounts receivable)
- Hiring and team building (employees vs subs, W-2 vs 1099)
- Fleet management
- Business planning and goal setting
- Scaling strategies
- Marketing and branding
- Website and online presence
- Social media for contractors
- Customer service excellence
- Warranty and callback management
- Succession planning

=== BUILDING CODES & STANDARDS ===
- IRC (International Residential Code) key requirements
- IBC (International Building Code) basics
- NEC (National Electrical Code) common requirements
- UPC/IPC (Plumbing Code) fundamentals
- IMC (International Mechanical Code)
- IECC (International Energy Conservation Code)
- ADA accessibility requirements
- Fire code basics
- Local amendment awareness (varies by jurisdiction)
- Permit requirements by project type

${dynamicTopicScope}

TASK MANAGEMENT:
You can add tasks to the user's personal task list. When users say things like:
- "Add a task to..." / "Remind me to..." / "I need to..." / "Create a task for..." / "Make a note to..."
Use the add_task tool to create the task. Parse natural language dates into actual dates. Infer priority and category from context.

JOB/ESTIMATE DATA EXTRACTION:
When a user mentions specific pricing, materials with quantities, labor hours/rates, customer details, or asks to build an estimate or job — use the extract_job_data tool to parse their input into structured line items. Always use this tool when the user provides concrete numbers. Also use it when they say "add this to my estimate" or "create a job from this".

You can generate PDF documents for users when they request guides, checklists, reports, or any business documents.

OFF-TOPIC ENFORCEMENT:
IMPORTANT: Be VERY liberal about what is considered on-topic. The following are ALL ON-TOPIC and must NEVER be refused:
- Product listings, equipment comparisons, brand recommendations (furnaces, ACs, water heaters, tools, materials, fixtures, appliances, etc.)
- Supplier/retailer product catalogs and pricing (Home Depot, Lowe's, Ferguson, Graybar, ABC Supply, etc.)
- Any question about materials, equipment, tools, or supplies used in ANY trade
- Pricing for labor, materials, equipment, or services
- Any home improvement, renovation, or repair topic
- Real estate, property maintenance, or facility management
- Business operations, accounting, marketing, or sales for contractors
- Handyman tasks including measuring, leveling, hanging, installing anything

Only refuse if the question has absolutely NOTHING to do with construction, trades, contracting, business, home improvement, real estate, property, or project management. Examples of truly off-topic: cooking recipes, entertainment gossip, sports scores, politics, celebrity news, or medical diagnoses.

If truly off-topic: "The CT1 Pocket Agent is designed to help with topics related to the trades, business, sales, project management, and estimating. I'm not able to help with that particular question, but feel free to ask me anything about your contracting business!"

${!hasPaidBot ? `\nCRITICAL: This is a FREE TIER user. You MUST limit your response to a MAXIMUM of ${FREE_USER_MAX_CHARS} characters. Keep responses brief and encourage them to upgrade for unlimited access.\n` : ''}

You are knowledgeable, professional, friendly, and provide actionable advice. Keep responses clear, concise, and practical. When appropriate, suggest using CT1 platform features to help solve challenges. Always provide specific, detailed answers with real numbers and actionable steps.`
          },
          ...messages,
        ],
        max_tokens: hasPaidBot ? undefined : 200,
        tools: tools,
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse the non-streamed response to check for tool calls
    const responseData = await response.json();
    const choice = responseData.choices?.[0];
    const toolCalls = choice?.message?.tool_calls || [];
    const accumulatedContent = choice?.message?.content || "";

    // If tool calls detected, handle them
    if (toolCalls.length > 0) {
      console.log("Tool calls detected:", toolCalls);
      
      for (const toolCall of toolCalls) {
        const name = toolCall.function?.name;
        const argsStr = toolCall.function?.arguments || '{}';
        
        if (name === "generate_pdf") {
          const args = JSON.parse(argsStr);
          const pdfDataUrl = generatePDF(args);
          
          return new Response(
            JSON.stringify({ 
              type: "pdf",
              content: "I've generated your PDF document. Click below to download it.",
              pdfData: pdfDataUrl,
              fileName: `${args.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        if (name === "extract_job_data") {
          try {
            const args = JSON.parse(argsStr);
            console.log("Extracted job data:", args);
            
            const lineItems = args.line_items || [];
            const grandTotal = lineItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
            
            let summaryMsg = `I've extracted the following data from your message:\n\n`;
            if (args.customer_name) summaryMsg += `**Customer:** ${args.customer_name}\n`;
            if (args.project_name) summaryMsg += `**Project:** ${args.project_name}\n`;
            summaryMsg += `**${lineItems.length} line item(s)** totaling **$${grandTotal.toFixed(2)}**\n\n`;
            summaryMsg += `Use the buttons below to create an estimate, create a job, or add these items to an existing record.`;
            
            return new Response(
              JSON.stringify({ 
                type: "job_data_extracted",
                content: summaryMsg,
                jobData: args
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          } catch (parseError) {
            console.error("Error parsing extract_job_data arguments:", parseError);
            return new Response(
              JSON.stringify({ 
                type: "error",
                content: "I had trouble parsing the job data. Could you please try again with more detail?"
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }
        
        if (name === "add_task") {
          try {
            const args = JSON.parse(argsStr);
            console.log("Adding task:", args);
            
            const { data: taskData, error: taskError } = await supabase
              .from('personal_tasks')
              .insert({
                user_id: user.id,
                title: args.title,
                notes: args.notes || null,
                priority: args.priority || 'medium',
                status: 'not_started',
                due_date: args.due_date ? new Date(args.due_date).toISOString() : null,
                category: args.category || null,
                source: 'pocketbot'
              })
              .select()
              .single();
            
            if (taskError) {
              console.error("Error inserting task:", taskError);
              return new Response(
                JSON.stringify({ 
                  type: "task_error",
                  content: `I tried to add the task "${args.title}" but encountered an error. Please try again or add it manually in your Tasks section.`
                }),
                {
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
              );
            }
            
            let confirmationMsg = `✅ I've added "${args.title}" to your task list`;
            if (args.priority && args.priority !== 'medium') {
              confirmationMsg += ` with ${args.priority} priority`;
            }
            if (args.due_date) {
              confirmationMsg += ` due ${args.due_date}`;
            }
            if (args.category) {
              confirmationMsg += ` (${args.category})`;
            }
            confirmationMsg += `. You can view and manage it in your My Tasks section.`;
            
            return new Response(
              JSON.stringify({ 
                type: "task_added",
                content: confirmationMsg,
                task: taskData
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          } catch (parseError) {
            console.error("Error parsing add_task arguments:", parseError);
            return new Response(
              JSON.stringify({ 
                type: "task_error",
                content: "I had trouble understanding the task details. Could you please try again?"
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }
      }
    }

    // If no tool calls but we got content from the non-streamed response, return it as JSON
    if (accumulatedContent) {
      return new Response(
        JSON.stringify({ content: accumulatedContent }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fallback: stream a fresh response without tools
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are CT1 Pocket Agent (Sarah), an elite AI business assistant for contractors. Provide helpful, specific answers about construction trades, estimating, sales, project management, and business growth. ${!hasPaidBot ? `Limit response to ${FREE_USER_MAX_CHARS} characters.` : ''}`
          },
          ...messages,
        ],
        max_tokens: hasPaidBot ? undefined : 200,
        stream: true,
      }),
    });

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
