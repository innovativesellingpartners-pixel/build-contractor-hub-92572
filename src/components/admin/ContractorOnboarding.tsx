import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Send, FileText, ChevronLeft, ChevronRight, BookOpen, Calendar, Mail, CreditCard, Phone, BarChart2, Briefcase, Users, Receipt, PieChart, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import ct1Logo from '@/assets/ct1-round-logo-new.png';
import ct1OnboardingLogo from '@/assets/ct1-onboarding-logo.png';

const PAGES = [
  {
    id: 1,
    title: 'Welcome & Account Setup',
    icon: BookOpen,
    content: {
      heading: 'Welcome to CT1 Hub',
      sections: [
        {
          title: 'Getting Started',
          body: `Welcome to CT1 — your all-in-one contractor management platform. This guide will walk you through setting up your account and getting the most out of CT1 Hub & CRM.\n\nOnce your account has been provisioned by your CT1 administrator, you will receive an email with login credentials. Follow these steps:\n\n1. Open the email and click the login link\n2. Enter your temporary credentials\n3. You will be prompted to set a new password\n4. Complete your contractor profile (business name, phone, address, license #)\n5. Upload your company logo under Settings → Company Profile\n6. Review and accept the Terms of Service`,
        },
        {
          title: 'Dashboard Overview',
          body: `Your dashboard is your command center. From here you can:\n\n• View active leads, jobs, and estimates at a glance\n• Access quick actions for common tasks\n• Monitor financial summaries and KPIs\n• Navigate to all platform features via the sidebar\n\nTip: Pin your most-used sections for faster access.`,
        },
      ],
    },
  },
  {
    id: 2,
    title: 'Calendar & Email Setup',
    icon: Calendar,
    content: {
      heading: 'Calendar & Email Connections',
      sections: [
        {
          title: 'Google Calendar Integration',
          body: `Connect your Google Calendar to sync appointments, job schedules, and meetings.\n\n1. Navigate to Settings → Calendar Connections\n2. Click "Connect Google Calendar"\n3. Sign in with your Google account and grant permissions\n4. Select which calendar(s) to sync\n5. Your events will now appear in the CT1 CRM calendar\n\nYou can connect multiple Google accounts. Events are color-coded by provider (Blue = Google).`,
        },
        {
          title: 'Outlook Calendar Integration',
          body: `Connect Microsoft Outlook for calendar sync.\n\n1. Navigate to Settings → Calendar Connections\n2. Click "Connect Outlook"\n3. Sign in with your Microsoft account\n4. Authorize the required permissions\n5. Outlook events sync automatically (Violet = Outlook)\n\nUse "Overlay" mode to see all calendars merged, or "Toggle" mode to switch between providers.`,
        },
        {
          title: 'Email Connection',
          body: `Connect your email to send estimates, invoices, and communications directly from CT1.\n\n1. Go to Settings → Email Connections\n2. Choose Google or Outlook as your email provider\n3. Authenticate and grant email send permissions\n4. Your connected email will be used for all outgoing communications\n\nAll sent emails are logged in the Email History section for your records.`,
        },
      ],
    },
  },
  {
    id: 3,
    title: 'QuickBooks & Payments',
    icon: CreditCard,
    content: {
      heading: 'Financial Integrations',
      sections: [
        {
          title: 'QuickBooks Integration',
          body: `Sync your financials with QuickBooks Online for seamless accounting.\n\n1. Navigate to Settings → QuickBooks\n2. Click "Connect to QuickBooks"\n3. Sign in to your QuickBooks Online account\n4. Authorize the connection\n5. Map your CT1 categories to QuickBooks accounts\n\nOnce connected, invoices, payments, and expenses will sync automatically. You can view sync status in the Accounting section.`,
        },
        {
          title: 'Payment Setup (Finix)',
          body: `CT1 uses Finix as the payment processing provider for contractor-to-customer payments.\n\nProvisioning is managed by your CT1 administrator. Once provisioned:\n\n1. Go to Accounting → Financial Connections\n2. Verify your merchant status shows "Provisioned"\n3. You can now accept payments through estimates and invoices\n4. Supported methods: Credit/Debit cards, ACH transfers\n\nManual payment methods (Zelle, Cash, Check) can be configured in Settings → Payment Methods.`,
        },
        {
          title: 'Bank Account Connection',
          body: `Link your bank account for expense tracking and financial reporting.\n\n1. Go to Accounting → Banking\n2. Click "Connect Bank Account"\n3. Search for your bank and sign in securely\n4. Select the account(s) to link\n5. Transactions will sync for categorization and reporting`,
        },
      ],
    },
  },
  {
    id: 4,
    title: 'Voice AI (Coming Soon)',
    icon: Phone,
    content: {
      heading: 'Voice AI — Intelligent Call Management',
      sections: [
        {
          title: 'Overview',
          body: `CT1 Voice AI is an intelligent call answering and routing system designed to ensure you never miss a lead.\n\n⚠️ This feature is currently ON HOLD and will be available in a future release.\n\nWhen available, Voice AI will provide:\n\n• 24/7 automated call answering with AI\n• Lead capture from incoming calls\n• Intelligent call routing to your phone\n• AI-generated call summaries and transcriptions\n• Automatic booking of appointments\n• Custom greeting and business-hours configuration`,
        },
        {
          title: 'How It Will Work',
          body: `1. A dedicated phone number will be assigned to your account\n2. Incoming calls are first forwarded to your cell phone\n3. If you don't answer, AI takes over the conversation\n4. The AI captures caller information and schedules appointments\n5. You receive a notification with a call summary and any actions taken\n\nSetup will be available under Settings → Voice AI when the feature launches.`,
        },
      ],
    },
  },
  {
    id: 5,
    title: 'Leads & Job Management',
    icon: Briefcase,
    content: {
      heading: 'Lead Conversion & Job Management',
      sections: [
        {
          title: 'Creating & Managing Leads',
          body: `Leads are the starting point of your sales pipeline.\n\n1. Click "+ New Lead" from the Leads section\n2. Enter client name, contact info, project details, and source\n3. Lead statuses: New → Contacted → Qualified → Quoted\n4. Add notes and schedule follow-ups for each lead\n5. Attach estimates to leads as you build proposals\n\nLeads can be filtered, searched, and sorted by status, date, and value.`,
        },
        {
          title: 'Converting Leads to Jobs',
          body: `When a lead is ready to convert:\n\n1. Open the lead detail view\n2. Click "Convert to Job" (Briefcase icon)\n3. This automatically creates:\n   • A new Job record\n   • A new Customer record\n   • Links any existing estimates to the job\n4. You are navigated to the new job detail view\n5. Converted leads are filtered out of the active queue\n\nThe conversion flow: Lead → Job (auto-creates Customer) → Estimate updates to "Sold"`,
        },
        {
          title: 'Job Management',
          body: `Jobs track active projects from start to completion.\n\n• Set job status: Pending → In Progress → Completed\n• Assign crew members and track daily logs\n• Upload job photos and documents\n• Create change orders for scope modifications\n• Track materials, expenses, and profitability\n• Generate and send invoices directly from the job`,
        },
      ],
    },
  },
  {
    id: 6,
    title: 'Estimates & Invoicing',
    icon: Receipt,
    content: {
      heading: 'Estimating & Invoicing',
      sections: [
        {
          title: 'Creating Estimates',
          body: `Build professional estimates with line items, scope, and terms.\n\n1. Navigate to Estimates → New Estimate\n2. Select or create a customer\n3. Add line items (description, qty, unit, price)\n4. Include assumptions, exclusions, and warranty info\n5. Preview the estimate in the professional template\n6. Send via email with a public link for client review\n\nClients can view, sign, and pay deposits through the public estimate link.\n\nTip: Save common configurations as templates for faster estimating.`,
        },
        {
          title: 'Invoicing',
          body: `Create and manage invoices for your jobs.\n\n1. Go to a Job → Create Invoice, or navigate to Invoices → New\n2. Add line items or import from the job estimate\n3. Set payment terms and due dates\n4. Send the invoice via email\n5. Track payment status: Draft → Sent → Paid\n6. Partial payments and payment history are tracked automatically\n\nInvoice numbers are auto-generated (INV-XXXXXX) for professional consistency.`,
        },
      ],
    },
  },
  {
    id: 7,
    title: 'Reports & Financial Data',
    icon: PieChart,
    content: {
      heading: 'Reporting & Financial Overview',
      sections: [
        {
          title: 'Reports Dashboard',
          body: `Access comprehensive business reports from the Reports section.\n\nAvailable Reports:\n• Revenue by Month/Quarter/Year\n• Job Profitability Analysis\n• Lead Conversion Rates\n• Outstanding Invoices & Aging\n• Expense Breakdown by Category\n• Crew Utilization & Performance\n\nAll reports can be filtered by date range and exported for your records.`,
        },
        {
          title: 'Financial Data & Accounting',
          body: `The Accounting section provides a complete financial picture.\n\n• Track income, expenses, and profit in real-time\n• View connected bank transactions\n• Categorize expenses by job or category\n• Monitor payment collections vs. outstanding balances\n• QuickBooks sync ensures your books stay up to date\n\nUse the Financial Connections dropdown to check your Finix merchant status and bank account links.`,
        },
        {
          title: 'Need Help?',
          body: `CT1 Support is available to assist you:\n\n📧 Email: support@myct1.com\n📞 Phone: (855) CT1-HELP\n💬 In-App: Use the Help Center or Pocket Agent chatbot\n🌐 Web: help.myct1.com\n\nAccess the Help Center anytime from the dashboard sidebar for articles, tutorials, and FAQs.`,
        },
      ],
    },
  },
];

// Convert image to base64 for PDF embedding
function loadImageAsBase64(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No context');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = src;
  });
}

async function generatePDF() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Brand colors
  const CT1_RED = { r: 213, g: 10, b: 34 };
  const CT1_DARK = { r: 24, g: 24, b: 27 }; // zinc-900
  const CT1_ZINC_800 = { r: 39, g: 39, b: 42 };
  const SLATE_700 = { r: 0, g: 0, b: 0 };
  const SLATE_400 = { r: 148, g: 163, b: 184 };
  const SLATE_200 = { r: 226, g: 232, b: 240 };
  const SLATE_50 = { r: 248, g: 250, b: 252 };
  const WHITE = { r: 255, g: 255, b: 255 };

  // Load logo
  let logoBase64: string | null = null;
  try {
    logoBase64 = await loadImageAsBase64(ct1OnboardingLogo);
  } catch {
    console.warn('Could not load logo for PDF');
  }

  const drawPageChrome = (pageNum: number) => {
    // Top bar — zinc-900 with red accent stripe
    doc.setFillColor(CT1_DARK.r, CT1_DARK.g, CT1_DARK.b);
    doc.rect(0, 0, pageWidth, 22, 'F');

    // Red accent line at bottom of header
    doc.setFillColor(CT1_RED.r, CT1_RED.g, CT1_RED.b);
    doc.rect(0, 22, pageWidth, 1.5, 'F');

    // Logo in header
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin - 2, 2.5, 17, 17);
    }

    // Header text
    doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('MYCT1.COM', margin + 18, 10);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(SLATE_400.r, SLATE_400.g, SLATE_400.b);
    doc.text('New Contractor Onboarding & Training Manual', margin + 18, 15);

    // Page number in header
    doc.setFontSize(8);
    doc.setTextColor(SLATE_400.r, SLATE_400.g, SLATE_400.b);
    doc.text(`${pageNum} / ${PAGES.length + 1}`, pageWidth - margin, 12, { align: 'right' });

    // Footer bar
    doc.setFillColor(CT1_DARK.r, CT1_DARK.g, CT1_DARK.b);
    doc.rect(0, pageHeight - 18, pageWidth, 18, 'F');

    // Red accent on footer top
    doc.setFillColor(CT1_RED.r, CT1_RED.g, CT1_RED.b);
    doc.rect(0, pageHeight - 18, pageWidth, 1, 'F');

    // Footer content
    doc.setTextColor(SLATE_400.r, SLATE_400.g, SLATE_400.b);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('CT1 CORPORATE SUPPORT', pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('support@myct1.com  ·  (855) CT1-HELP  ·  www.myct1.com', pageWidth / 2, pageHeight - 7.5, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text('© CT1 Technology Corp. — Confidential. For authorized CT1 contractors only.', pageWidth / 2, pageHeight - 3.5, { align: 'center' });
  };

  // ═══════════════ COVER PAGE ═══════════════
  // Full dark background
  doc.setFillColor(CT1_DARK.r, CT1_DARK.g, CT1_DARK.b);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Subtle diagonal red accent band
  doc.setFillColor(CT1_RED.r, CT1_RED.g, CT1_RED.b);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Bottom red accent
  doc.setFillColor(CT1_RED.r, CT1_RED.g, CT1_RED.b);
  doc.rect(0, pageHeight - 5, pageWidth, 5, 'F');

  // Logo centered
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 25, 35, 50, 50);
  }

  // Brand name
  doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('MYCT1.COM', pageWidth / 2, 102, { align: 'center' });

  // Red line divider
  doc.setDrawColor(CT1_RED.r, CT1_RED.g, CT1_RED.b);
  doc.setLineWidth(1.2);
  doc.line(pageWidth / 2 - 40, 110, pageWidth / 2 + 40, 110);

  // Main title
  doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('NEW CONTRACTOR', pageWidth / 2, 128, { align: 'center' });
  doc.text('ONBOARDING & TRAINING', pageWidth / 2, 138, { align: 'center' });

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(SLATE_400.r, SLATE_400.g, SLATE_400.b);
  doc.text('Your complete step-by-step guide to the CT1 Hub & CRM platform', pageWidth / 2, 152, { align: 'center' });

  // Red horizontal rule
  doc.setDrawColor(CT1_RED.r, CT1_RED.g, CT1_RED.b);
  doc.setLineWidth(0.5);
  doc.line(margin + 20, 162, pageWidth - margin - 20, 162);

  // Table of Contents box
  const tocY = 172;
  doc.setFillColor(CT1_ZINC_800.r, CT1_ZINC_800.g, CT1_ZINC_800.b);
  doc.roundedRect(margin + 15, tocY - 6, contentWidth - 30, PAGES.length * 8 + 18, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(CT1_RED.r, CT1_RED.g, CT1_RED.b);
  doc.text('TABLE OF CONTENTS', pageWidth / 2, tocY + 2, { align: 'center' });

  doc.setFontSize(8.5);
  PAGES.forEach((p, i) => {
    const itemY = tocY + 12 + i * 8;
    // Number badge
    doc.setFillColor(CT1_RED.r, CT1_RED.g, CT1_RED.b);
    doc.roundedRect(margin + 22, itemY - 4, 8, 6, 1.5, 1.5, 'F');
    doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(`${p.id}`, margin + 26, itemY, { align: 'center' });

    // Title
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(SLATE_200.r, SLATE_200.g, SLATE_200.b);
    doc.text(p.title, margin + 34, itemY);

    // Dots
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6);
    const dotsX = margin + 34 + doc.getTextWidth(p.title) + 3;
    const endX = pageWidth - margin - 30;
    if (dotsX < endX) {
      const dots = '·'.repeat(Math.floor((endX - dotsX) / 1.5));
      doc.text(dots, dotsX, itemY);
    }

    // Page number
    doc.setTextColor(SLATE_400.r, SLATE_400.g, SLATE_400.b);
    doc.setFontSize(8);
    doc.text(`${p.id + 1}`, pageWidth - margin - 22, itemY, { align: 'right' });
  });

  // Cover footer
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('support@myct1.com  ·  (855) CT1-HELP  ·  www.myct1.com', pageWidth / 2, pageHeight - 12, { align: 'center' });

  // ═══════════════ CONTENT PAGES ═══════════════
  PAGES.forEach((page) => {
    doc.addPage();
    drawPageChrome(page.id + 1);

    let y = 30;

    // Section header card
    doc.setFillColor(SLATE_50.r, SLATE_50.g, SLATE_50.b);
    doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F');

    // Red left accent
    doc.setFillColor(CT1_RED.r, CT1_RED.g, CT1_RED.b);
    doc.roundedRect(margin, y, 4, 16, 2, 0, 'F');
    doc.rect(margin + 2, y, 2, 16, 'F');

    // Section badge
    doc.setFillColor(CT1_RED.r, CT1_RED.g, CT1_RED.b);
    doc.roundedRect(margin + 8, y + 2, 20, 5.5, 1.5, 1.5, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
    doc.text(`SECTION ${page.id}`, margin + 18, y + 6, { align: 'center' });

    // Section title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(CT1_DARK.r, CT1_DARK.g, CT1_DARK.b);
    doc.text(page.content.heading, margin + 8, y + 13.5);

    y += 22;

    // Red underline
    doc.setDrawColor(CT1_RED.r, CT1_RED.g, CT1_RED.b);
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin + 55, y);
    y += 6;

    const maxY = pageHeight - 24;

    page.content.sections.forEach((section, sIdx) => {
      if (y > maxY - 20) {
        doc.addPage();
        drawPageChrome(page.id + 1);
        y = 28;
      }

      // Section subtitle with red square bullet
      doc.setFillColor(CT1_RED.r, CT1_RED.g, CT1_RED.b);
      doc.roundedRect(margin, y - 2.5, 3, 3, 0.5, 0.5, 'F');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(CT1_DARK.r, CT1_DARK.g, CT1_DARK.b);
      doc.text(section.title, margin + 6, y);
      y += 2;

      // Subtle separator
      doc.setDrawColor(SLATE_200.r, SLATE_200.g, SLATE_200.b);
      doc.setLineWidth(0.3);
      doc.line(margin + 6, y, margin + 100, y);
      y += 4;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(SLATE_700.r, SLATE_700.g, SLATE_700.b);

      const lines = doc.splitTextToSize(section.body, contentWidth - 8);
      lines.forEach((line: string) => {
        if (y > maxY - 5) {
          doc.addPage();
          drawPageChrome(page.id + 1);
          y = 28;
        }
        const trimmed = line.trim();
        if (/^\d+\./.test(trimmed)) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(CT1_DARK.r, CT1_DARK.g, CT1_DARK.b);
        } else if (trimmed.startsWith('•')) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(SLATE_700.r, SLATE_700.g, SLATE_700.b);
        } else if (trimmed.startsWith('⚠️') || trimmed.startsWith('Tip:')) {
          doc.setFont('helvetica', 'bolditalic');
          doc.setTextColor(CT1_RED.r, CT1_RED.g, CT1_RED.b);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(SLATE_700.r, SLATE_700.g, SLATE_700.b);
        }
        doc.text(line, margin + 6, y);
        y += 3.8;
      });

      y += sIdx < page.content.sections.length - 1 ? 6 : 3;
    });
  });

  doc.save('CT1_Contractor_Onboarding_Manual.pdf');
  toast.success('PDF downloaded successfully');
}

export function ContractorOnboarding() {
  const [currentPage, setCurrentPage] = useState(0);
  const page = PAGES[currentPage];
  const PageIcon = page.icon;

  return (
    <div className="space-y-6">
      {/* Branded Header — mirrors website zinc-900 bar */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg shadow-black/20 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={ct1OnboardingLogo} alt="CT1" className="h-14 w-14 sm:h-16 sm:w-16 drop-shadow-lg" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                New Contractor Onboarding & Training
              </h1>
              <p className="text-sm text-zinc-400 mt-0.5">
                7-page setup guide  ·  CT1 Hub & CRM Platform
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => generatePDF()}
              className="border-zinc-600 text-zinc-200 hover:bg-zinc-800 hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button
              onClick={() => {
                generatePDF();
                toast.info('PDF generated — attach to email to send to contractor');
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4 mr-2" />
              Send to Contractor
            </Button>
          </div>
        </div>
        {/* Red accent bar at bottom */}
        <div className="mt-4 h-1 w-full bg-gradient-to-r from-primary via-primary/80 to-transparent rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table of Contents — dark sidebar style */}
        <Card className="lg:col-span-1 bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-300">
              <FileText className="h-4 w-4 text-primary" />
              Table of Contents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0.5 px-2 pb-3">
              {PAGES.map((p, i) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => setCurrentPage(i)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                      i === currentPage
                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                        : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{p.title}</span>
                    <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      i === currentPage
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {p.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Page Content */}
        <Card className="lg:col-span-3 border-border">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <PageIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-foreground">{page.content.heading}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Section {page.id} of {PAGES.length}
                  </p>
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">{page.title}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[60vh]">
              <div className="p-6 space-y-6">
                {page.content.sections.map((section, idx) => (
                  <div key={idx}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <h3 className="text-lg font-semibold text-primary">{section.title}</h3>
                    </div>
                    <div className="text-sm text-foreground whitespace-pre-line leading-relaxed pl-4 border-l-2 border-primary/15">
                      {section.body}
                    </div>
                    {idx < page.content.sections.length - 1 && <Separator className="mt-6" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          {/* Navigation */}
          <div className="border-t p-4 flex items-center justify-between bg-muted/20">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1.5">
              {PAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === currentPage ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === PAGES.length - 1}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Footer — branded support bar */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={ct1Logo} alt="CT1" className="h-8 w-8" />
            <div>
              <p className="text-sm font-semibold text-white">CT1 Corporate Support</p>
              <p className="text-xs text-zinc-400">
                📧 support@myct1.com  ·  📞 (855) CT1-HELP  ·  🌐 www.myct1.com
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            Also available in the Help Center on all CT1 Hub & CRM pages
          </p>
        </div>
      </div>
    </div>
  );
}
