import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, X, ChevronRight, ChevronDown, ArrowLeft, Printer, RotateCcw, CheckCircle2, Info, AlertTriangle, AlertCircle, Sparkles, ExternalLink, Shield, DollarSign, FileText, Building2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { states, overviewSteps, type StateData } from "@/data/llcStateData";
import ct1Logo from "@/assets/ct1-round-logo-new.png";
import heroBg from "@/assets/llc-hero-bg.jpg";

const TOTAL_STEPS = 10;

function getStorageKey(abbr: string) {
  return `ct1_llc_${abbr.toLowerCase()}`;
}
function loadProgress(abbr: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(getStorageKey(abbr));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveProgress(abbr: string, progress: Record<string, boolean>) {
  localStorage.setItem(getStorageKey(abbr), JSON.stringify(progress));
}

// ============ CALLOUT BOXES ============
function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 p-4 bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 rounded-r-lg">
      <div className="flex gap-2 items-start">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 p-4 bg-yellow-50 dark:bg-yellow-950/30 border-l-4 border-yellow-500 rounded-r-lg">
      <div className="flex gap-2 items-start">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
        <div className="text-sm text-yellow-900 dark:text-yellow-200 leading-relaxed font-medium">{children}</div>
      </div>
    </div>
  );
}
function AlertBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 p-4 bg-red-50 dark:bg-red-950/30 border-l-4 border-primary rounded-r-lg">
      <div className="flex gap-2 items-start">
        <AlertCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-red-900 dark:text-red-200 leading-relaxed font-medium">{children}</div>
      </div>
    </div>
  );
}
function RuleBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 p-4 bg-red-50 dark:bg-red-950/30 border-l-4 border-primary rounded-r-lg">
      <div className="flex gap-2 items-start">
        <AlertCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-red-900 dark:text-red-200 leading-relaxed font-bold">{children}</div>
      </div>
    </div>
  );
}
function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-1">
      {children}<ExternalLink className="h-3 w-3" />
    </a>
  );
}

// ============ Q&A CHECK ============
function QuizCheck({ question, correctAnswer, explanation }: { question: string; correctAnswer: boolean; explanation: string }) {
  const [answered, setAnswered] = useState<boolean | null>(null);
  const isCorrect = answered === correctAnswer;

  return (
    <div className="my-4 p-4 bg-muted/50 border border-border rounded-xl">
      <div className="flex items-start gap-2 mb-3">
        <HelpCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <p className="text-sm font-semibold">{question}</p>
      </div>
      {answered === null ? (
        <div className="flex gap-2 ml-7">
          <button onClick={() => setAnswered(true)} className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-muted transition-colors min-h-[44px]">Yes</button>
          <button onClick={() => setAnswered(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-muted transition-colors min-h-[44px]">No</button>
        </div>
      ) : (
        <div className={`ml-7 p-3 rounded-lg text-sm ${isCorrect ? "bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200" : "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-200"}`}>
          <p className="font-bold mb-1">{isCorrect ? "✓ Correct!" : "✗ Not quite."}</p>
          <p className="leading-relaxed">{explanation}</p>
          {!isCorrect && <button onClick={() => setAnswered(null)} className="mt-2 text-xs underline">Try again</button>}
        </div>
      )}
    </div>
  );
}

// ============ STEP CONTENT ============
function getStepContent(stepNum: number, state: StateData) {
  switch (stepNum) {
    case 1:
      return {
        title: "Check if Your Business Name is Available",
        whatThisIs: `Make sure nobody else in ${state.name} already uses the name you want.`,
        whatYouNeed: 'Your desired business name. It must end with "LLC" or "Limited Liability Company."',
        doThisNow: (
          <>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Go to <ExtLink href={state.sosUrl}>{state.sos}</ExtLink></li>
              <li>Find "Business Name Search" or "Entity Search"</li>
              <li>Type your name</li>
              <li>If it is taken, try a different name</li>
              <li>If it is available, write it down exactly</li>
            </ol>
            <TipBox>Your name must include "LLC" at the end. Example: "Smith Roofing LLC" or "Johnson Construction Services LLC"</TipBox>
            <QuizCheck question="Does your business name end with 'LLC'?" correctAnswer={true} explanation="Every LLC must have 'LLC' or 'Limited Liability Company' at the end. This is required by law in all 50 states." />
          </>
        ),
        doneWhen: "You searched and confirmed the name is available.",
      };
    case 2:
      return {
        title: "Choose Your Registered Agent",
        whatThisIs: `A registered agent is a person or company that gets legal mail for your business. This is required by law in ${state.name}.`,
        whatYouNeed: `A person with a physical street address (not a P.O. Box) in ${state.name} who is available during business hours.`,
        doThisNow: (
          <>
            <p className="text-sm mb-3">Pick one option:</p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li><strong>Option A:</strong> Be your own agent (free, but your address becomes public record)</li>
              <li><strong>Option B:</strong> Hire an agent service ($50-$300 per year, keeps your address private)</li>
            </ul>
            <p className="text-sm mt-3">Write down the agent's full name and street address.</p>
            <QuizCheck question="Can a P.O. Box be used as a registered agent address?" correctAnswer={false} explanation="No. A registered agent must have a physical street address, not a P.O. Box. The state needs to be able to deliver legal documents in person." />
          </>
        ),
        doneWhen: "You have a registered agent name and a physical address ready.",
      };
    case 3:
      return {
        title: `File Your ${state.formationDocName}`,
        whatThisIs: `The official form that creates your LLC. Once approved, your LLC is real.`,
        whatYouNeed: `LLC name (Step 1), registered agent info (Step 2), photo ID, and a credit or debit card for ${state.llcFee}.`,
        doThisNow: (
          <>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Go to <ExtLink href={state.sosUrl}>{state.sos}</ExtLink></li>
              <li>Find "Start a Business," "File LLC," or "Form New Entity"</li>
              <li>Select "Limited Liability Company"</li>
              <li>Fill in:
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li><strong>LLC Name:</strong> your name from Step 1</li>
                  <li><strong>Registered Agent:</strong> name + address from Step 2</li>
                  <li><strong>Principal Address:</strong> your business or home address</li>
                  <li><strong>Management:</strong> select "Member-Managed" (this means you run the business)</li>
                  <li><strong>Purpose:</strong> type "To engage in any lawful business activity"</li>
                </ul>
              </li>
              <li>Pay: {state.llcFee}</li>
              <li>Submit</li>
              <li>SAVE your confirmation page and number. Print or screenshot it.</li>
            </ol>
            <WarningBox>Do NOT close the page until you see a confirmation. Save the confirmation number. You need this for your bank account.</WarningBox>
            {state.requiresPublication && (
              <AlertBox>{state.name} requires you to publish a notice of your LLC in a local newspaper. Do not skip this. See Step 10 for details.</AlertBox>
            )}
          </>
        ),
        doneWhen: `You got a confirmation number or email. Your LLC shows "Active" or "Pending" on the filing website.`,
      };
    case 4:
      return {
        title: "Get Your EIN",
        whatThisIs: "An EIN is a tax ID number for your business. Think of it like a Social Security number, but for your LLC. It is free from the IRS.",
        whatYouNeed: "LLC name, your filing confirmation, your Social Security number, and your LLC address.",
        doThisNow: (
          <>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Go to <ExtLink href="https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online">IRS EIN Online Application</ExtLink></li>
              <li>Click "Apply Online Now"</li>
              <li>Select "Limited Liability Company (LLC)"</li>
              <li>Number of members: enter your count</li>
              <li>State: {state.name}</li>
              <li>Why applying: "Started new business"</li>
              <li>Enter your LLC name, address, and personal info</li>
              <li>Submit. Your EIN appears on screen right away.</li>
              <li>PRINT THIS PAGE. Save the PDF. You need this number for everything.</li>
            </ol>
            <QuizCheck question="Does getting an EIN cost money?" correctAnswer={false} explanation="No! An EIN is completely free from the IRS. If a website charges you for an EIN, it is a third-party service. Go directly to irs.gov." />
          </>
        ),
        doneWhen: "You have a 9-digit EIN (format: XX-XXXXXXX) printed and saved.",
      };
    case 5:
      return {
        title: "Open a Business Bank Account",
        whatThisIs: "A bank account ONLY for your business. Never mix personal and business money.",
        whatYouNeed: (
          <>
            <p className="text-sm mb-2">Bring these to the bank:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>{state.formationDocName} (printed or on your phone)</li>
              <li>EIN letter (Step 4)</li>
              <li>Photo ID</li>
              <li>Operating Agreement (Step 6 - some banks want this, some do not)</li>
            </ul>
          </>
        ),
        doThisNow: (
          <>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Call your bank: "I need to open a business checking account for my new LLC"</li>
              <li>Ask what documents they need</li>
              <li>Go in with everything listed above</li>
              <li>Open the account</li>
              <li>Deposit starting funds</li>
              <li>Order checks or a debit card</li>
              <li>Set up online banking</li>
            </ol>
            <RuleBox>NEVER pay personal bills from this account. NEVER put business money in your personal account. Keep them 100% separate. Always.</RuleBox>
          </>
        ),
        doneWhen: "Business checking account is open in your LLC name with the EIN on file.",
      };
    case 6:
      return {
        title: "Write Your Operating Agreement",
        whatThisIs: "A document that says how your LLC works. Who owns it, who decides things, how money is split. You need one even if you are the only owner.",
        whatYouNeed: "LLC name, member names, ownership percentages.",
        doThisNow: (
          <>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Only one owner? Use a Single-Member Operating Agreement template</li>
              <li>Partners? Use a Multi-Member template</li>
              <li>Fill in: LLC name, state, member names, ownership %, management type ("Member-Managed"), profit/loss split, what happens if someone leaves</li>
              <li>All members sign and date it</li>
              <li>Keep it with your business files. You do NOT file this with the state.</li>
            </ol>
            <TipBox>Search "free LLC operating agreement template {state.name}" or visit <ExtLink href="https://www.sba.gov">SBA.gov</ExtLink> for help.</TipBox>
          </>
        ),
        doneWhen: "Signed operating agreement saved with your LLC docs.",
      };
    case 7:
      return {
        title: "Register for State Taxes",
        whatThisIs: `Tell ${state.name} your business exists so you can pay taxes the right way.`,
        whatYouNeed: "EIN, LLC name and address, your filing confirmation.",
        doThisNow: (
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Go to your state's Department of Revenue website</li>
            <li>Register your LLC for state taxes</li>
            <li>Selling materials (not just labor)? Apply for a sales tax permit</li>
            <li>Hiring employees? Register for withholding tax + unemployment insurance</li>
            <li>Save your state tax ID number</li>
          </ol>
        ),
        doneWhen: "You have a state tax registration number.",
      };
    case 8:
      return {
        title: "Get Your Contractor License",
        whatThisIs: `Depending on ${state.name}, you may need a license before doing any construction work.`,
        whatYouNeed: "This varies by state. Read the details below.",
        doThisNow: state.statewide ? (
          <>
            <AlertBox><strong>{state.name} REQUIRES a state contractor license.</strong></AlertBox>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              {state.licUrl && <li>Go to <ExtLink href={state.licUrl}>{state.licAuth}</ExtLink></li>}
              {state.licPhone && <li>Call {state.licPhone}: "I am a new contractor with a new LLC. What license do I need for [your trade]?"</li>}
              <li>Fill out the license application</li>
              <li>Gather documents (typically): proof of experience, proof of insurance, financial statement, background check</li>
              <li>Study for and pass any required exams</li>
              <li>Post surety bond if required</li>
              <li>Pay the license fee</li>
              <li>Receive your license number</li>
            </ol>
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Requirements</p>
              <p className="text-sm">{state.licReq}</p>
            </div>
            {state.notes && (
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm">{state.notes}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="p-3 bg-muted rounded-lg mb-3">
              <p className="text-sm font-semibold">{state.name} does NOT have a statewide contractor license. Licensing is handled by your city or county.</p>
            </div>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Look up the building department for your city or county</li>
              <li>Call them: "I am a new contractor with an LLC. What do I need?"</li>
              <li>Complete any local registration</li>
              <li>Get project permits as needed</li>
              <li>Even without a state license, you still need insurance before starting work</li>
            </ol>
            <TipBox>If you do electrical, plumbing, or HVAC work, you likely need a SEPARATE state specialty license. {state.licPhone ? `Contact ${state.licPhone}` : "Check your state's professional licensing board"}.</TipBox>
          </>
        ),
        doneWhen: "You have your license number (or local registration) and it is active.",
      };
    case 9:
      return {
        title: "Get Insurance",
        whatThisIs: "Protection if something goes wrong on a job. Most clients and general contractors require proof of insurance before you start.",
        whatYouNeed: "Your LLC info, EIN, and a phone to call an insurance broker.",
        doThisNow: (
          <>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Call a contractor insurance broker (search "contractor insurance {state.name}")</li>
              <li>Get these policies:</li>
            </ol>
            <div className="mt-3 space-y-2">
              <p className="text-xs font-bold text-primary uppercase tracking-wide">Required</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>General Liability:</strong> covers property damage and injuries. Minimum $1M per incident / $2M total.</li>
                <li><strong>Workers' Comp:</strong> required in most states if you have any employees. Some states require it for the owner too.</li>
              </ul>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mt-3">Recommended</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Commercial Auto:</strong> if you use a truck or van for work</li>
                <li><strong>Tools/Equipment Coverage:</strong> covers stolen or damaged tools</li>
                <li><strong>Surety Bond:</strong> required for licensing in many states ($5K-$25K)</li>
              </ul>
            </div>
            <ol start={3} className="list-decimal pl-5 space-y-2 text-sm mt-3">
              <li>Get your Certificate of Insurance (COI). This is the proof document you show clients.</li>
              <li>Save digital and printed copies.</li>
            </ol>
            <QuizCheck question="Can you start working jobs before you have insurance?" correctAnswer={false} explanation="No. Working without insurance puts your personal assets at risk and most general contractors and clients will not hire you without proof of insurance (a COI)." />
          </>
        ),
        doneWhen: "Active policies in place. You have a COI ready to show.",
      };
    case 10:
      return {
        title: "Final Setup",
        whatThisIs: "Last tasks to make your LLC fully ready to work.",
        whatYouNeed: "All your documents from Steps 1-9.",
        doThisNow: (
          <>
            {state.requiresPublication && (
              <AlertBox>
                <strong>PUBLICATION REQUIRED:</strong> {state.publicationDetails} File your affidavit of publication with {state.sos} after completing it. Keep proof in your records.
              </AlertBox>
            )}
            <p className="text-sm font-semibold mb-2">Final tasks (every state):</p>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Set up bookkeeping (QuickBooks, Wave, or a spreadsheet)</li>
              <li>Calendar reminder: annual report deadline ({state.annualReport})</li>
              <li>Calendar reminder: quarterly IRS payments - Apr 15, Jun 15, Sep 15, Jan 15</li>
              <li>Create a business email (yourname@yourbusiness.com)</li>
              <li>Order business cards with your LLC name + license number + phone</li>
              <li>Store all documents in one folder (physical + digital):
                <ul className="list-disc pl-5 mt-1 space-y-0.5 text-xs text-muted-foreground">
                  <li>{state.formationDocName}</li>
                  <li>EIN Letter</li>
                  <li>Operating Agreement</li>
                  <li>Insurance Policies</li>
                  <li>Contractor License</li>
                  <li>Tax Registration</li>
                  <li>Bank Account Info</li>
                </ul>
              </li>
            </ol>
          </>
        ),
        doneWhen: "All documents organized. Calendar reminders set. You are ready to work.",
      };
    default:
      return { title: "", whatThisIs: "", whatYouNeed: "", doThisNow: null, doneWhen: "" };
  }
}

// ============ STATE WALKTHROUGH ============
function StateWalkthrough({ state, onBack }: { state: StateData; onBack: () => void }) {
  const [progress, setProgress] = useState(() => loadProgress(state.abbr));
  const [openStep, setOpenStep] = useState<number | null>(() => {
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      if (!loadProgress(state.abbr)[`step${i}`]) return i;
    }
    return null;
  });

  const stepRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const completedCount = Object.values(progress).filter(Boolean).length;
  const allDone = completedCount === TOTAL_STEPS;

  const markComplete = useCallback((stepNum: number) => {
    const updated = { ...progress, [`step${stepNum}`]: true };
    setProgress(updated);
    saveProgress(state.abbr, updated);
    let next: number | null = null;
    for (let i = stepNum + 1; i <= TOTAL_STEPS; i++) {
      if (!updated[`step${i}`]) { next = i; break; }
    }
    if (!next) {
      for (let i = 1; i < stepNum; i++) {
        if (!updated[`step${i}`]) { next = i; break; }
      }
    }
    setOpenStep(next);
    if (next && stepRefs.current[next]) {
      setTimeout(() => stepRefs.current[next!]?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    }
  }, [progress, state.abbr]);

  const resetProgress = () => {
    if (window.confirm("Reset all progress for " + state.name + "? This cannot be undone.")) {
      setProgress({});
      saveProgress(state.abbr, {});
      setOpenStep(1);
    }
  };

  const quickRefRows = [
    ["LLC Filing Agency", state.sos, null],
    ["Filing Website", state.sosUrl, state.sosUrl],
    ["Phone", state.sosPhone, null],
    ["Formation Fee", state.llcFee, null],
    ["Annual Report", state.annualReport, null],
    ["License Authority", state.licAuth, null],
    ["License Website", state.licUrl, state.licUrl?.startsWith("http") ? state.licUrl : null],
    ["License Phone", state.licPhone, null],
  ];

  return (
    <div className="animate-in fade-in duration-300">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80 mb-5 group min-h-[44px]">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to all states
      </button>

      {/* State header */}
      <div className="rounded-2xl overflow-hidden border border-border mb-6">
        <div className="bg-gradient-to-r from-[hsl(var(--ct1-dark))] to-[hsl(0,0%,20%)] p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <div className="text-xs font-extrabold text-primary tracking-[0.15em] mb-1">{state.abbr}</div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">{state.name}</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold text-primary">{state.llcFee}</span>
              {state.statewide ? (
                <Badge className="bg-primary text-primary-foreground hover:bg-primary">State License</Badge>
              ) : (
                <Badge variant="secondary">Local Only</Badge>
              )}
              {state.nascla && <Badge className="bg-green-700 text-white hover:bg-green-700">NASCLA</Badge>}
            </div>
          </div>
        </div>

        <div className="bg-card p-4 md:p-6">
          <Tabs defaultValue="walkthrough">
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="walkthrough" className="text-sm">Step-by-Step Guide</TabsTrigger>
              <TabsTrigger value="reference" className="text-sm">Quick Reference</TabsTrigger>
            </TabsList>

            <TabsContent value="walkthrough">
              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{completedCount} of {TOTAL_STEPS} steps complete</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => window.print()} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 min-h-[44px]">
                      <Printer className="h-3.5 w-3.5" /> Print Checklist
                    </button>
                    <button onClick={resetProgress} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 min-h-[44px]">
                      <RotateCcw className="h-3.5 w-3.5" /> Reset
                    </button>
                  </div>
                </div>
                <Progress value={(completedCount / TOTAL_STEPS) * 100} className="h-2.5 [&>div]:bg-primary" />
              </div>

              {/* Celebration */}
              {allDone && (
                <div className="mb-6 p-6 bg-green-600 text-white rounded-xl text-center relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="absolute animate-bounce" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, animationDuration: `${1 + Math.random() * 2}s`, fontSize: `${10 + Math.random() * 14}px` }}>
                        {["🎉", "⭐", "🎊", "✨"][Math.floor(Math.random() * 4)]}
                      </div>
                    ))}
                  </div>
                  <Sparkles className="h-8 w-8 mx-auto mb-3" />
                  <h3 className="text-xl font-extrabold mb-2">Congratulations!</h3>
                  <p className="text-sm opacity-90 mb-4">You did it. Your LLC is formed, licensed, insured, and ready for work. You are a business owner in {state.name}.</p>
                  <a href="https://myct1.com" target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" className="font-bold">Explore myCT1 Tools →</Button>
                  </a>
                </div>
              )}

              {/* Steps */}
              <div className="space-y-3 print:space-y-4">
                {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((num) => {
                  const isOpen = openStep === num;
                  const isDone = !!progress[`step${num}`];
                  const content = getStepContent(num, state);
                  return (
                    <div key={num} ref={el => { stepRefs.current[num] = el; }} className={`border rounded-xl overflow-hidden transition-colors ${isDone ? "border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20" : "border-border"}`}>
                      <button onClick={() => setOpenStep(isOpen ? null : num)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors min-h-[52px]">
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isDone ? "bg-green-600 text-white" : "bg-primary/10 text-primary"}`}>
                          {isDone ? <CheckCircle2 className="h-5 w-5" /> : num}
                        </div>
                        <span className={`flex-1 font-semibold text-sm ${isDone ? "line-through text-muted-foreground" : ""}`}>{content.title}</span>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-0 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
                          <div className="ml-11 space-y-4 mt-4">
                            <div>
                              <h4 className="text-xs font-bold text-primary uppercase tracking-wide mb-1">What this is</h4>
                              <p className="text-sm leading-relaxed">{content.whatThisIs}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-primary uppercase tracking-wide mb-1">What you need</h4>
                              {typeof content.whatYouNeed === "string" ? <p className="text-sm leading-relaxed">{content.whatYouNeed}</p> : content.whatYouNeed}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Do this now</h4>
                              {content.doThisNow}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">How you know you are done</h4>
                              <p className="text-sm leading-relaxed">{content.doneWhen}</p>
                            </div>
                            {!isDone && (
                              <Button onClick={(e) => { e.stopPropagation(); markComplete(num); }} className="bg-green-600 hover:bg-green-700 text-white font-bold">
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete ✓
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="hidden print:block px-4 pb-4">
                        <div className="ml-11">
                          <p className="text-sm">{content.whatThisIs}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {isDone ? <span className="text-xs text-green-700">✓ Complete</span> : <span className="text-xs text-muted-foreground">☐ Not complete</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="reference">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {quickRefRows.map(([label, value, link], i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                        <td className="p-3 font-bold text-muted-foreground w-[35%] border-b border-border/50">{label}</td>
                        <td className="p-3 border-b border-border/50">
                          {link ? <a href={link as string} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">{value}</a> : value || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wide mb-2">License Requirements</h4>
                  <p className="text-sm leading-relaxed">{state.licReq}</p>
                </div>
                {state.notes && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-primary rounded-r-lg">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Notes</h4>
                    <p className="text-sm leading-relaxed">{state.notes}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function StartingNewLLC() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1).toLowerCase();
    if (hash) {
      const found = states.find(s => s.name.toLowerCase().replace(/\s+/g, "-") === hash || s.abbr.toLowerCase() === hash);
      if (found) setSelectedState(found);
    }
  }, []);

  useEffect(() => {
    if (selectedState) {
      window.location.hash = selectedState.name.toLowerCase().replace(/\s+/g, "-");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      if (window.location.hash) history.replaceState(null, "", window.location.pathname);
    }
  }, [selectedState]);

  const filtered = useMemo(() => {
    let list = states;
    if (filter === "statewide") list = list.filter(s => s.statewide);
    if (filter === "local") list = list.filter(s => !s.statewide);
    if (filter === "nascla") list = list.filter(s => s.nascla);
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.abbr.toLowerCase() === q ||
        s.licReq.toLowerCase().includes(q) ||
        s.licAuth.toLowerCase().includes(q) ||
        s.notes.toLowerCase().includes(q) ||
        s.llcFee.toLowerCase().includes(q)
      );
    }
    return list;
  }, [query, filter]);

  const filterBtns = [
    { key: "all", label: "All States", count: states.length },
    { key: "statewide", label: "State License", count: states.filter(s => s.statewide).length },
    { key: "local", label: "Local Only", count: states.filter(s => !s.statewide).length },
    { key: "nascla", label: "NASCLA", count: states.filter(s => s.nascla).length },
  ];

  return (
    <div className="min-h-screen bg-background touch-pan-y">
      {/* Header */}
      <div className="bg-[hsl(var(--ct1-dark))] border-b-[3px] border-primary">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={ct1Logo} alt="CT1" className="h-9 w-9" />
            <div>
              <div className="text-sm font-bold text-white">myct1.com</div>
              <div className="text-[11px] text-gray-400">Getting Started</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 hidden sm:inline">(419) 827-4285</span>
            <div className="flex gap-3">
              <a href="https://myct1.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-[11px] text-gray-500 hover:text-gray-300">Privacy</a>
              <a href="https://myct1.com/legal/terms" target="_blank" rel="noopener noreferrer" className="text-[11px] text-gray-500 hover:text-gray-300">Terms</a>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-muted/50 border-b border-border print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto">
            <Link to="/dashboard" className="hover:text-foreground whitespace-nowrap">Contractor Hub</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link to="/dashboard/training" className="hover:text-foreground whitespace-nowrap">5-Star Training</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="whitespace-nowrap">Getting Started</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-foreground font-medium whitespace-nowrap">Starting a New LLC</span>
          </nav>
        </div>
      </div>

      {/* Hero with background image */}
      <div className="relative overflow-hidden print:hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(0,0%,4%)/0.95] via-[hsl(0,0%,6%)/0.88] to-[hsl(0,0%,4%)/0.95]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-14 md:py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary/80">Training Module</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3 tracking-tight leading-tight">Starting a New LLC</h1>
            <p className="text-base md:text-lg text-white/70 mb-1 leading-relaxed">A State-by-State Guide for Trades & Construction Professionals</p>
            <p className="text-sm text-white/45 mb-8">Step-by-step instructions for all 50 states + D.C. Written in plain English.</p>

            {/* Search */}
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedState(null); }}
                placeholder="Search by state name or abbreviation..."
                className="w-full py-3.5 pl-12 pr-10 text-sm bg-white/10 border-2 border-white/15 rounded-xl text-white placeholder:text-white/40 outline-none focus:border-primary backdrop-blur-md transition-colors"
              />
              {query && (
                <button onClick={() => { setQuery(""); searchRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 min-h-[44px] min-w-[44px]">
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Why LLC? Section - only show on landing */}
      {!selectedState && (
        <div className="bg-muted/30 border-b border-border print:hidden">
          <div className="max-w-6xl mx-auto px-4 py-10">
            <h2 className="text-xl font-extrabold text-foreground mb-2">Why Do You Need an LLC?</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-2xl">An LLC (Limited Liability Company) protects your personal belongings — your house, car, and savings — if something goes wrong on a job. Here's why every contractor needs one.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Shield, title: "Protect Your Assets", desc: "If someone sues your business, they can't take your personal stuff. Your home and savings stay safe." },
                { icon: DollarSign, title: "Pay Less in Taxes", desc: "LLCs can save you money on taxes. You only pay taxes once, not twice like some other business types." },
                { icon: Building2, title: "Look Professional", desc: "Clients and general contractors trust businesses with 'LLC' in the name. It shows you are serious." },
                { icon: FileText, title: "Get Bigger Jobs", desc: "Most GCs and commercial clients require you to have an LLC and insurance before they hire you." },
              ].map((item, i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        {selectedState ? (
          <StateWalkthrough state={selectedState} onBack={() => setSelectedState(null)} />
        ) : (
          <>
            {/* Collapsible 10-step overview */}
            <details className="mb-8 print:hidden group">
              <summary className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wide cursor-pointer hover:opacity-80 list-none min-h-[44px]">
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                View the 10-Step Formation Process
              </summary>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
                {overviewSteps.map(s => (
                  <div key={s.num} className="bg-card rounded-lg border border-border p-3 flex gap-2.5 items-start">
                    <div className="shrink-0 w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-xs font-extrabold text-primary">{s.num}</div>
                    <div>
                      <div className="text-xs font-bold leading-snug">{s.title}</div>
                      <div className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </details>

            {/* Intro text */}
            <div className="mb-6">
              <h2 className="text-lg font-extrabold mb-1">Choose Your State</h2>
              <p className="text-sm text-muted-foreground">Select your state below to get a personalized step-by-step guide with links, fees, and requirements.</p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-5 flex-wrap print:hidden">
              {filterBtns.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border min-h-[44px] ${
                    filter === f.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {f.label} <span className="opacity-70 ml-1">{f.count}</span>
                </button>
              ))}
            </div>

            {/* Results count */}
            <div className="text-xs text-muted-foreground mb-4">
              {filtered.length === 0 ? "No states match your search." : `Showing ${filtered.length} state${filtered.length !== 1 ? "s" : ""}`}
              {query && ` for "${query}"`}
            </div>

            {/* State grid - compact list style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(s => (
                <button
                  key={s.abbr}
                  onClick={() => setSelectedState(s)}
                  className="w-full text-left bg-card rounded-xl border border-border p-4 transition-all duration-200 hover:border-primary hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-primary tracking-wider">{s.abbr}</span>
                      <span className="text-sm font-bold text-foreground">{s.name}</span>
                    </div>
                    <span className="text-xs font-bold text-primary whitespace-nowrap">{s.llcFee}</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {s.statewide ? (
                      <Badge className="bg-primary/10 text-primary text-[10px] px-2 py-0 border-0 hover:bg-primary/10">State License</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] px-2 py-0">Local Only</Badge>
                    )}
                    {s.nascla && <Badge className="bg-green-100 text-green-800 text-[10px] px-2 py-0 border-0 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300">NASCLA</Badge>}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-[hsl(var(--ct1-dark))] border-t-[3px] border-primary print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src={ct1Logo} alt="CT1" className="h-8 w-8" />
              <div>
                <div className="text-sm font-bold text-white">ConstrucTeam One</div>
                <div className="text-xs text-gray-500">(419) 827-4285</div>
              </div>
            </div>
            <div className="flex gap-5">
              <a href="https://myct1.com" target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-semibold hover:underline">myct1.com</a>
              <a href="https://myct1.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-300">Privacy</a>
              <a href="https://myct1.com/legal/terms" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-300">Terms</a>
            </div>
          </div>
          <p className="text-[11px] text-gray-600 mt-4 text-center md:text-left">
            This training is for informational purposes only. Verify current requirements with your state's Secretary of State and contractor licensing board.
          </p>
        </div>
      </div>
    </div>
  );
}
