export interface FeaturePageConfig {
  slug: string;
  title: string;
  keyword: string;
  metaDescription: string;
  heroSubtitle: string;
  overview: string;
  benefits: { title: string; desc: string }[];
  howItWorks: { step: string; detail: string }[];
  faqItems: { question: string; answer: string }[];
}

const featurePages: FeaturePageConfig[] = [
  {
    slug: "contractor-crm",
    title: "Contractor CRM Software",
    keyword: "Contractor CRM",
    metaDescription: "Manage every lead, customer, and job from one contractor CRM. myCT1 Business-in-a-Box tracks your entire sales pipeline and customer history.",
    heroSubtitle: "Stop losing leads. Track every customer interaction, follow-up, and deal from one platform built for contractors.",
    overview: "The myCT1 CRM gives contractors a single place to manage leads, customers, and sales pipelines. No more sticky notes, spreadsheets, or missed follow-ups. Every phone call, estimate, and job ties back to the customer record so you always know where things stand.",
    benefits: [
      { title: "Never lose a lead", desc: "Every inquiry is captured and tracked through your pipeline automatically." },
      { title: "Faster follow-ups", desc: "Automated reminders ensure you respond to leads before your competition." },
      { title: "Complete customer history", desc: "See every estimate, job, invoice, and communication in one timeline." },
      { title: "Pipeline visibility", desc: "Know exactly how many deals are in each stage and what revenue is coming." },
    ],
    howItWorks: [
      { step: "Capture leads", detail: "Leads flow in from phone calls, web forms, and referrals into your CRM automatically." },
      { step: "Track your pipeline", detail: "Move deals through stages from new lead to closed job with drag-and-drop simplicity." },
      { step: "Follow up on time", detail: "Automated reminders and Forge AI ensure no lead goes cold." },
      { step: "Close more jobs", detail: "Convert estimates to jobs and track everything through completion and payment." },
    ],
    faqItems: [
      { question: "What is a contractor CRM?", answer: "A contractor CRM is software designed to help home service businesses track leads, manage customer relationships, and organize their sales pipeline. Unlike generic CRMs, contractor-specific CRMs include features like estimating, job scheduling, and invoice tracking built into the customer record." },
      { question: "How does myCT1 CRM help contractors close more jobs?", answer: "myCT1 CRM tracks every lead from first contact through estimate, follow-up, and job completion. Automated reminders and Forge AI follow-ups ensure no lead slips through the cracks, helping contractors respond faster and close at higher rates." },
      { question: "Can I track my sales pipeline with myCT1?", answer: "Yes. myCT1 provides a visual sales pipeline where you can see every deal by stage, track conversion rates, and forecast upcoming revenue. You can customize stages to match your business workflow." },
    ],
  },
  {
    slug: "contractor-estimating",
    title: "Contractor Estimating Software",
    keyword: "Contractor Estimating",
    metaDescription: "Create professional estimates in minutes. myCT1 estimating software helps contractors build accurate bids, send them digitally, and track approvals.",
    heroSubtitle: "Build accurate estimates faster. Send professional proposals that win more jobs and get signed digitally.",
    overview: "myCT1 estimating software lets contractors create detailed, professional estimates with line items, labor costs, materials, and markup. Send estimates digitally for e-signature approval, track when clients view them, and convert accepted estimates directly into scheduled jobs.",
    benefits: [
      { title: "Professional proposals", desc: "Branded estimates with your logo, terms, and detailed line items impress clients." },
      { title: "Digital signatures", desc: "Clients approve estimates online with legally binding e-signatures." },
      { title: "View tracking", desc: "Know exactly when a client opens your estimate so you can follow up at the right time." },
      { title: "Estimate-to-job conversion", desc: "Convert approved estimates into active jobs with one click." },
    ],
    howItWorks: [
      { step: "Build your estimate", detail: "Add line items, materials, labor, and markup using templates or from scratch." },
      { step: "Send for approval", detail: "Email or text your estimate with a secure link for client review." },
      { step: "Track and follow up", detail: "See when clients view your estimate and send reminders automatically." },
      { step: "Convert to job", detail: "Once approved, convert the estimate into a scheduled job instantly." },
    ],
    faqItems: [
      { question: "How do contractors create estimates with myCT1?", answer: "Contractors build estimates using customizable templates with line items for labor, materials, and markup. Estimates include your company branding, terms, and can be sent digitally for e-signature approval." },
      { question: "Can clients sign estimates digitally?", answer: "Yes. myCT1 includes built-in e-signature capability so clients can review and approve estimates from any device. Signed estimates are stored securely with a complete audit trail." },
      { question: "Does myCT1 track when clients view estimates?", answer: "Yes. You receive notifications when a client opens your estimate, helping you time your follow-up calls for maximum effectiveness." },
    ],
  },
  {
    slug: "job-scheduling",
    title: "Contractor Job Scheduling Software",
    keyword: "Job Scheduling for Contractors",
    metaDescription: "Schedule jobs, assign crews, and track project timelines with myCT1. Contractor job scheduling software that eliminates double-bookings and delays.",
    heroSubtitle: "Schedule jobs, assign crews, and keep every project on track from one dashboard.",
    overview: "myCT1 job scheduling gives contractors a clear view of every active job, crew assignment, and project timeline. Eliminate double-bookings, reduce scheduling conflicts, and keep your field teams organized with a system built for how contractors actually work.",
    benefits: [
      { title: "No more double-bookings", desc: "See all jobs and crew availability in one calendar view." },
      { title: "Crew assignments", desc: "Assign specific crew members or teams to jobs with clear responsibilities." },
      { title: "Project timelines", desc: "Track start dates, milestones, and completion targets for every job." },
      { title: "Status tracking", desc: "Know which jobs are scheduled, in progress, completed, or on hold at a glance." },
    ],
    howItWorks: [
      { step: "Create a job", detail: "Convert an approved estimate into a job or create one manually with all project details." },
      { step: "Schedule and assign", detail: "Set dates, assign crews, and add the job to your calendar." },
      { step: "Track progress", detail: "Update job status as work progresses through daily logs and status updates." },
      { step: "Complete and invoice", detail: "Mark jobs complete and generate invoices directly from the job record." },
    ],
    faqItems: [
      { question: "How does myCT1 help contractors schedule jobs?", answer: "myCT1 provides a centralized job scheduling system where contractors can view all active jobs, assign crews, set timelines, and track progress. Jobs connect to estimates, invoices, and customer records for a complete project view." },
      { question: "Can I assign crews to specific jobs?", answer: "Yes. myCT1 includes crew management where you can create teams, assign members to jobs, and track who is working where. This prevents scheduling conflicts and keeps your field operations organized." },
      { question: "Does myCT1 prevent double-booking?", answer: "Yes. The calendar view shows all scheduled jobs and crew assignments, making it easy to spot conflicts before they happen. You can see crew availability at a glance." },
    ],
  },
  {
    slug: "invoice-automation",
    title: "Contractor Invoice Automation",
    keyword: "Invoice Automation for Contractors",
    metaDescription: "Automate contractor invoicing with myCT1. Generate invoices from jobs, track payments, and sync with QuickBooks automatically.",
    heroSubtitle: "Generate invoices from completed jobs, collect payments, and sync everything to your books automatically.",
    overview: "myCT1 invoice automation eliminates manual invoicing for contractors. Generate professional invoices directly from job records, send them digitally, accept online payments, and sync transactions to QuickBooks. Forge AI can even handle payment reminders and follow-ups.",
    benefits: [
      { title: "One-click invoicing", desc: "Generate invoices directly from job records with all line items pre-filled." },
      { title: "Online payments", desc: "Clients pay invoices online via credit card or ACH through your branded portal." },
      { title: "QuickBooks sync", desc: "Invoices and payments sync automatically to your QuickBooks account." },
      { title: "Payment tracking", desc: "See outstanding balances, overdue invoices, and payment history at a glance." },
    ],
    howItWorks: [
      { step: "Complete the job", detail: "When work is finished, generate an invoice from the job record with pre-filled details." },
      { step: "Send the invoice", detail: "Email invoices with a secure payment link for online payment." },
      { step: "Collect payment", detail: "Clients pay online via credit card or ACH. You get notified instantly." },
      { step: "Sync to books", detail: "Payments and invoices sync to QuickBooks automatically for clean bookkeeping." },
    ],
    faqItems: [
      { question: "How does myCT1 automate invoicing?", answer: "myCT1 generates invoices directly from completed job records, pre-filling line items, amounts, and customer details. Invoices are sent digitally with secure payment links, and payments sync to QuickBooks automatically." },
      { question: "Can clients pay invoices online?", answer: "Yes. myCT1 includes online payment processing so clients can pay invoices via credit card or ACH directly from the invoice email or your customer portal." },
      { question: "Does myCT1 sync with QuickBooks?", answer: "Yes. myCT1 integrates with QuickBooks to automatically sync invoices, payments, and customer records so your books are always up to date without manual data entry." },
    ],
  },
  {
    slug: "customer-portal",
    title: "Contractor Customer Portal",
    keyword: "Customer Portal for Contractors",
    metaDescription: "Give your clients a professional customer portal. myCT1 lets homeowners view estimates, approve change orders, make payments, and track job progress.",
    heroSubtitle: "Give your clients a branded portal to view estimates, track jobs, approve changes, and make payments online.",
    overview: "The myCT1 customer portal gives your clients a professional, branded experience where they can review estimates, approve change orders, make payments, and track job progress. No more chasing clients for approvals or payments. Everything happens in one secure portal.",
    benefits: [
      { title: "Professional client experience", desc: "A branded portal with your logo that impresses homeowners and commercial clients." },
      { title: "Self-service approvals", desc: "Clients review and approve estimates and change orders without phone tag." },
      { title: "Online payments", desc: "Clients pay invoices and deposits directly through the portal." },
      { title: "Job progress visibility", desc: "Clients can see real-time job status updates, reducing inbound calls." },
    ],
    howItWorks: [
      { step: "Create a portal link", detail: "Generate a secure portal link for each job and share it with your client." },
      { step: "Client reviews documents", detail: "Clients view estimates, change orders, and invoices in a professional interface." },
      { step: "Client approves and pays", detail: "Approvals and payments happen digitally with e-signatures and online payment." },
      { step: "Everyone stays informed", detail: "Both you and your client can see job updates, messages, and document history." },
    ],
    faqItems: [
      { question: "What is a contractor customer portal?", answer: "A customer portal is a secure, branded web page where your clients can view project documents, approve estimates and change orders, make payments, and track job progress without needing to call or email." },
      { question: "How does the myCT1 customer portal work?", answer: "You generate a secure link for each job and share it with your client. They can access their portal from any device to review documents, sign approvals, and make payments." },
      { question: "Can clients make payments through the portal?", answer: "Yes. The customer portal includes online payment capability so clients can pay deposits, progress payments, and final invoices directly through the portal using credit card or ACH." },
    ],
  },
  {
    slug: "forge-ai-automation",
    title: "Forge AI Contractor Automation",
    keyword: "AI Automation for Contractors",
    metaDescription: "Automate lead follow-ups, call answering, and customer communication with Forge AI. The AI assistant built for contractor businesses.",
    heroSubtitle: "Let Forge AI handle your calls, follow-ups, and customer communication so you can focus on the job site.",
    overview: "Forge AI is the intelligent automation engine inside myCT1. It answers missed calls, follows up with leads, sends appointment reminders, and handles routine customer communication. Forge AI works 24/7 so you never miss a lead or forget a follow-up, even when you are on the job site.",
    benefits: [
      { title: "Never miss a call", desc: "Forge AI answers calls when you cannot, captures lead information, and schedules callbacks." },
      { title: "Automated follow-ups", desc: "Leads receive timely follow-up messages without you lifting a finger." },
      { title: "24/7 availability", desc: "Your business responds to inquiries around the clock, even on weekends." },
      { title: "Reduced admin work", desc: "Routine communication is handled automatically so you can focus on billable work." },
    ],
    howItWorks: [
      { step: "Set up your profile", detail: "Tell Forge AI about your business, services, and preferred communication style." },
      { step: "AI answers calls", detail: "When you miss a call, Forge AI answers, qualifies the lead, and captures details." },
      { step: "Automated follow-up", detail: "Forge AI sends follow-up messages to leads based on your configured rules." },
      { step: "You close the deal", detail: "When a lead is ready, Forge AI notifies you so you can step in and close." },
    ],
    faqItems: [
      { question: "What is Forge AI?", answer: "Forge AI is the intelligent automation engine built into the myCT1 platform. It handles missed calls, follows up with leads, sends reminders, and manages routine customer communication so contractors can focus on field work." },
      { question: "How does Forge AI answer calls?", answer: "When you miss a call, Forge AI picks up, greets the caller professionally using your business name, qualifies the lead by asking relevant questions, and captures their information for follow-up." },
      { question: "Can Forge AI follow up with leads automatically?", answer: "Yes. Forge AI sends timely follow-up messages to leads based on configurable rules, ensuring no lead goes cold while you are busy on the job site." },
    ],
  },
  {
    slug: "contractor-reporting",
    title: "Contractor Reporting Dashboards",
    keyword: "Contractor Reporting Software",
    metaDescription: "Track revenue, job profitability, lead conversion, and team performance with myCT1 reporting dashboards built for contractors.",
    heroSubtitle: "See your numbers clearly. Track revenue, profitability, and team performance from real-time dashboards.",
    overview: "myCT1 reporting dashboards give contractors real-time visibility into business performance. Track revenue, job profitability, lead conversion rates, outstanding invoices, and team productivity from one dashboard. Make data-driven decisions instead of guessing.",
    benefits: [
      { title: "Revenue tracking", desc: "See total revenue, outstanding invoices, and cash flow trends at a glance." },
      { title: "Job profitability", desc: "Track costs vs revenue on every job to know which work is most profitable." },
      { title: "Lead conversion", desc: "Measure how many leads convert to estimates and estimates to jobs." },
      { title: "Team performance", desc: "Track crew productivity, job completion rates, and response times." },
    ],
    howItWorks: [
      { step: "Data flows automatically", detail: "As you manage leads, jobs, and invoices, reporting data updates in real time." },
      { step: "View your dashboards", detail: "Pre-built dashboards show revenue, profitability, pipeline, and more." },
      { step: "Drill into details", detail: "Click any metric to see the underlying jobs, invoices, or leads driving it." },
      { step: "Make better decisions", detail: "Use real data to decide which services to offer, where to market, and how to price." },
    ],
    faqItems: [
      { question: "What reports does myCT1 provide?", answer: "myCT1 provides dashboards for revenue tracking, job profitability, lead conversion rates, outstanding invoices, expense tracking, and team performance. All reports update in real time as you manage your business." },
      { question: "Can I track job profitability?", answer: "Yes. myCT1 tracks all costs (materials, labor, expenses) against revenue for each job, giving you clear profitability metrics so you know which jobs and services are most profitable." },
      { question: "Do I need to enter data manually for reports?", answer: "No. myCT1 reports pull data automatically from your leads, estimates, jobs, invoices, and payments. As you use the platform, your reporting dashboards stay current without extra data entry." },
    ],
  },
  {
    slug: "contractor-payments",
    title: "Contractor Payment Processing",
    keyword: "Payment Processing for Contractors",
    metaDescription: "Accept credit card and ACH payments from clients. myCT1 payment processing helps contractors get paid faster with online invoicing.",
    heroSubtitle: "Get paid faster. Accept credit cards, ACH, and online payments directly from your invoices and customer portal.",
    overview: "myCT1 payment processing lets contractors accept credit card and ACH payments directly from invoices and the customer portal. Clients pay online with a secure payment link. Payments sync to your accounting system automatically so your books stay clean.",
    benefits: [
      { title: "Get paid faster", desc: "Clients pay instantly from invoice emails or the customer portal." },
      { title: "Multiple payment methods", desc: "Accept credit cards, debit cards, and ACH bank transfers." },
      { title: "Automatic reconciliation", desc: "Payments sync to invoices and QuickBooks automatically." },
      { title: "Secure processing", desc: "PCI-compliant payment processing protects your clients' financial data." },
    ],
    howItWorks: [
      { step: "Send an invoice", detail: "Generate and send an invoice with an embedded payment link." },
      { step: "Client clicks to pay", detail: "Clients click the payment link and enter their card or bank details." },
      { step: "Payment is processed", detail: "Funds are processed securely and deposited to your account." },
      { step: "Records update automatically", detail: "The invoice is marked paid and the transaction syncs to your books." },
    ],
    faqItems: [
      { question: "How do contractors accept payments with myCT1?", answer: "Contractors send invoices with embedded payment links. Clients click the link and pay using credit card, debit card, or ACH bank transfer. Payments are processed securely and recorded automatically." },
      { question: "What payment methods does myCT1 support?", answer: "myCT1 supports credit cards, debit cards, and ACH bank transfers. Clients can pay from invoice emails or through the customer portal." },
      { question: "Are payments synced to QuickBooks?", answer: "Yes. All payments processed through myCT1 sync automatically to your QuickBooks account, keeping your financial records accurate without manual entry." },
    ],
  },
  {
    slug: "contractor-lead-generation",
    title: "Contractor Lead Generation",
    keyword: "Lead Generation for Contractors",
    metaDescription: "Capture and convert more leads with myCT1. Track lead sources, automate follow-ups, and never miss a potential job.",
    heroSubtitle: "Capture every lead. Track every source. Follow up automatically. Close more jobs.",
    overview: "myCT1 lead generation tools help contractors capture leads from every source, including phone calls, web forms, referrals, and marketing campaigns. Track where your best leads come from, automate follow-ups with Forge AI, and convert more inquiries into paying jobs.",
    benefits: [
      { title: "Multi-source capture", desc: "Capture leads from calls, web forms, referrals, and marketing automatically." },
      { title: "Source tracking", desc: "Know which marketing channels generate the most profitable leads." },
      { title: "Automated follow-up", desc: "Forge AI follows up with new leads instantly so you respond before competitors." },
      { title: "Pipeline management", desc: "Track leads through qualification, estimate, and close stages." },
    ],
    howItWorks: [
      { step: "Leads flow in", detail: "Leads from calls, forms, and referrals are captured in your CRM automatically." },
      { step: "Qualify and assign", detail: "Review lead details, qualify the opportunity, and assign to your team." },
      { step: "Follow up fast", detail: "Forge AI sends immediate responses while you handle job site work." },
      { step: "Convert to revenue", detail: "Move qualified leads to estimates and close more jobs." },
    ],
    faqItems: [
      { question: "How does myCT1 help contractors generate leads?", answer: "myCT1 captures leads from phone calls (via Forge AI), web forms, referrals, and marketing campaigns. All leads flow into your CRM with source tracking so you know which channels drive the best results." },
      { question: "Can myCT1 follow up with leads automatically?", answer: "Yes. Forge AI sends immediate responses to new leads and follows up on a configurable schedule. This ensures fast response times even when you are busy on the job site." },
      { question: "Can I track which lead sources are most profitable?", answer: "Yes. myCT1 tracks the source of every lead and connects it to estimates and completed jobs, so you can see exactly which marketing channels generate the most revenue." },
    ],
  },
  {
    slug: "contractor-training",
    title: "Contractor Training Platform",
    keyword: "Training Platform for Contractors",
    metaDescription: "Train your team with myCT1. On-demand courses for sales, operations, and business management built for contractor businesses.",
    heroSubtitle: "Level up your team with on-demand training courses built specifically for contractor businesses.",
    overview: "The myCT1 training platform provides on-demand courses for contractor teams covering sales, estimating, operations, customer service, and business management. Whether you are onboarding new hires or sharpening your own skills, the training platform helps contractor businesses operate at a higher level.",
    benefits: [
      { title: "On-demand access", desc: "Training courses available anytime, anywhere, from any device." },
      { title: "Contractor-specific content", desc: "Courses designed for home service businesses, not generic corporate training." },
      { title: "Team onboarding", desc: "Get new hires up to speed faster with structured training modules." },
      { title: "Business growth skills", desc: "Learn sales, marketing, and operations strategies that drive revenue." },
    ],
    howItWorks: [
      { step: "Access training hub", detail: "Open the training section inside your myCT1 dashboard." },
      { step: "Choose a course", detail: "Browse courses by topic including sales, estimating, operations, and management." },
      { step: "Learn at your pace", detail: "Watch video lessons, read guides, and complete modules on your schedule." },
      { step: "Apply to your business", detail: "Implement what you learn directly into your myCT1 workflows." },
    ],
    faqItems: [
      { question: "What training does myCT1 offer?", answer: "myCT1 offers on-demand training courses covering contractor sales, estimating best practices, operations management, customer service, and business growth strategies. All content is designed specifically for home service businesses." },
      { question: "Can I train my team with myCT1?", answer: "Yes. The training platform supports team access so you can onboard new hires and upskill existing team members with structured courses and modules." },
      { question: "Is training included with myCT1?", answer: "Training access depends on your subscription tier. Check the myCT1 pricing page for details on which plans include training platform access." },
    ],
  },
];

export default featurePages;

export function getAllFeaturePageSlugs(): string[] {
  return featurePages.map((f) => f.slug);
}
