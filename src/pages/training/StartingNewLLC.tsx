import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, X, ChevronRight, ChevronDown, ArrowLeft, Printer, RotateCcw, CheckCircle2, Circle, Info, AlertTriangle, AlertCircle, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { states, overviewSteps, type StateData } from "@/data/llcStateData";
import ct1Logo from "@/assets/ct1-round-logo-new.png";

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

// ============ STATE CARD ============
function StateCard({ state, onClick }: { state: StateData; onClick: (s: StateData) => void }) {
  return (
    <button
      onClick={() => onClick(state)}
      className="w-full text-left bg-card rounded-xl border border-border p-5 transition-all duration-200 hover:border-[#CC0000] hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CC0000]"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-xs font-extrabold text-[#CC0000] tracking-widest">{state.abbr}</div>
          <div className="text-base font-bold text-foreground">{state.name}</div>
        </div>
        <div className="text-sm font-bold text-[#CC0000] whitespace-nowrap">{state.llcFee}</div>
      </div>
      <div className="flex gap-1.5 flex-wrap mb-2.5">
        {state.statewide ? (
          <Badge className="bg-[#CC0000] text-white text-[10px] px-2 py-0.5 hover:bg-[#CC0000]">State License</Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">Local Only</Badge>
        )}
        {state.nascla && (
          <Badge className="bg-green-700 text-white text-[10px] px-2 py-0.5 hover:bg-green-700">NASCLA</Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{state.licReq}</p>
    </button>
  );
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
    <div className="my-4 p-4 bg-red-50 dark:bg-red-950/30 border-l-4 border-[#CC0000] rounded-r-lg">
      <div className="flex gap-2 items-start">
        <AlertCircle className="h-5 w-5 text-[#CC0000] mt-0.5 shrink-0" />
        <div className="text-sm text-red-900 dark:text-red-200 leading-relaxed font-medium">{children}</div>
      </div>
    </div>
  );
}

function RuleBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 p-4 bg-red-50 dark:bg-red-950/30 border-l-4 border-[#CC0000] rounded-r-lg">
      <div className="flex gap-2 items-start">
        <AlertCircle className="h-5 w-5 text-[#CC0000] mt-0.5 shrink-0" />
        <div className="text-sm text-red-900 dark:text-red-200 leading-relaxed font-bold">{children}</div>
      </div>
    </div>
  );
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#CC0000] font-semibold underline underline-offset-2 hover:text-[#990000] inline-flex items-center gap-1">
      {children}<ExternalLink className="h-3 w-3" />
    </a>
  );
}

// ============ WALKTHROUGH STEP CONTENT ============
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
          <>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Go to your state's Department of Revenue website</li>
              <li>Register your LLC for state taxes</li>
              <li>Selling materials (not just labor)? Apply for a sales tax permit</li>
              <li>Hiring employees? Register for withholding tax + unemployment insurance</li>
              <li>Save your state tax ID number</li>
            </ol>
          </>
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
              <p className="text-xs font-bold text-[#CC0000] uppercase tracking-wide mb-1">Requirements</p>
              <p className="text-sm">{state.licReq}</p>
            </div>
            {state.notes && (
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-xs font-bold text-[#CC0000] uppercase tracking-wide mb-1">Notes</p>
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
              <p className="text-xs font-bold text-[#CC0000] uppercase tracking-wide">Required</p>
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

// ============ WALKTHROUGH ============
function StateWalkthrough({ state, onBack }: { state: StateData; onBack: () => void }) {
  const [progress, setProgress] = useState(() => loadProgress(state.abbr));
  const [openStep, setOpenStep] = useState<number | null>(() => {
    // Open the first incomplete step
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

    // Find next incomplete step
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
      const cleared: Record<string, boolean> = {};
      setProgress(cleared);
      saveProgress(state.abbr, cleared);
      setOpenStep(1);
    }
  };

  const handlePrint = () => window.print();

  // Quick reference table
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
      {/* Back button */}
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#CC0000] hover:text-[#990000] mb-5 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to all states
      </button>

      {/* State header */}
      <div className="rounded-2xl overflow-hidden border border-border mb-6">
        <div className="bg-gradient-to-r from-[#1A1A1A] to-[#333] p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <div className="text-xs font-extrabold text-[#CC0000] tracking-[0.15em] mb-1">{state.abbr}</div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">{state.name}</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold text-[#CC0000]">{state.llcFee}</span>
              {state.statewide ? (
                <Badge className="bg-[#CC0000] text-white hover:bg-[#CC0000]">State License</Badge>
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
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{completedCount} of {TOTAL_STEPS} steps complete</span>
                  <div className="flex items-center gap-3">
                    <button onClick={handlePrint} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <Printer className="h-3.5 w-3.5" /> Print Checklist
                    </button>
                    <button onClick={resetProgress} className="text-xs text-muted-foreground hover:text-[#CC0000] flex items-center gap-1">
                      <RotateCcw className="h-3.5 w-3.5" /> Reset
                    </button>
                  </div>
                </div>
                <Progress value={(completedCount / TOTAL_STEPS) * 100} className="h-2.5 [&>div]:bg-[#CC0000]" />
              </div>

              {/* Celebration */}
              {allDone && (
                <div className="mb-6 p-6 bg-green-600 text-white rounded-xl text-center relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute animate-bounce"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 2}s`,
                          animationDuration: `${1 + Math.random() * 2}s`,
                          fontSize: `${10 + Math.random() * 14}px`,
                        }}
                      >
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
                    <div
                      key={num}
                      ref={el => { stepRefs.current[num] = el; }}
                      className={`border rounded-xl overflow-hidden transition-colors ${isDone ? "border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20" : "border-border"}`}
                    >
                      <button
                        onClick={() => setOpenStep(isOpen ? null : num)}
                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors min-h-[52px]"
                      >
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isDone ? "bg-green-600 text-white" : "bg-[#CC0000]/10 text-[#CC0000]"}`}>
                          {isDone ? <CheckCircle2 className="h-5 w-5" /> : num}
                        </div>
                        <span className={`flex-1 font-semibold text-sm ${isDone ? "line-through text-muted-foreground" : ""}`}>
                          {content.title}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-0 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
                          <div className="ml-11 space-y-4 mt-4">
                            <div>
                              <h4 className="text-xs font-bold text-[#CC0000] uppercase tracking-wide mb-1">What this is</h4>
                              <p className="text-sm leading-relaxed">{content.whatThisIs}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-[#CC0000] uppercase tracking-wide mb-1">What you need</h4>
                              {typeof content.whatYouNeed === "string" ? (
                                <p className="text-sm leading-relaxed">{content.whatYouNeed}</p>
                              ) : content.whatYouNeed}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-[#CC0000] uppercase tracking-wide mb-1">Do this now</h4>
                              {content.doThisNow}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">How you know you are done</h4>
                              <p className="text-sm leading-relaxed">{content.doneWhen}</p>
                            </div>
                            {!isDone && (
                              <Button
                                onClick={(e) => { e.stopPropagation(); markComplete(num); }}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Mark Complete ✓
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Print-only content */}
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
                          {link ? (
                            <a href={link as string} target="_blank" rel="noopener noreferrer" className="text-[#CC0000] font-semibold hover:underline">{value}</a>
                          ) : value || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-[#CC0000] uppercase tracking-wide mb-2">License Requirements</h4>
                  <p className="text-sm leading-relaxed">{state.licReq}</p>
                </div>
                {state.notes && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-[#CC0000] rounded-r-lg">
                    <h4 className="text-xs font-bold text-[#CC0000] uppercase tracking-wide mb-1">Notes</h4>
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
  const [showSteps, setShowSteps] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  // Hash-based state selection
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-[#1A1A1A] border-b-[3px] border-[#CC0000]">
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

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1A1A1A] via-[#2a0000] to-[#1A1A1A] py-12 md:py-16 px-4 print:hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#CC0000]" />
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#CC0000]/70">Training Module</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3 tracking-tight">Starting a New LLC</h1>
          <p className="text-base md:text-lg text-white/60 max-w-2xl mb-1">A State-by-State Training Course for Trades, Construction, and Home Improvement Professionals</p>
          <p className="text-sm text-white/40 max-w-2xl mb-8">Your step-by-step guide to forming an LLC, getting licensed, and launching your contracting business. Covers all 50 states + D.C.</p>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedState(null); }}
              placeholder="Search by state, abbreviation, license type, or keyword..."
              className="w-full py-3.5 pl-12 pr-10 text-sm bg-white/10 border-2 border-white/15 rounded-xl text-white placeholder:text-white/40 outline-none focus:border-[#CC0000] backdrop-blur-md transition-colors"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); searchRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25"
              >
                <X className="h-3.5 w-3.5 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        {/* 8-step overview */}
        {!selectedState && (
          <div className="mb-8 print:hidden">
            <button
              onClick={() => setShowSteps(!showSteps)}
              className="flex items-center gap-2 text-xs font-bold text-[#CC0000] uppercase tracking-wide mb-4 hover:text-[#990000]"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${showSteps ? "rotate-90" : ""}`} />
              {showSteps ? "Hide" : "Show"} Formation Steps
            </button>
            {showSteps && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {overviewSteps.map(s => (
                  <Card key={s.num} className="border border-border">
                    <CardContent className="p-4 flex gap-3 items-start">
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-[#CC0000]/10 flex items-center justify-center text-sm font-extrabold text-[#CC0000]">{s.num}</div>
                      <div>
                        <div className="text-sm font-bold mb-0.5">{s.title}</div>
                        <div className="text-xs text-muted-foreground leading-relaxed">{s.desc}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedState ? (
          <StateWalkthrough state={selectedState} onBack={() => setSelectedState(null)} />
        ) : (
          <>
            {/* Filter tabs */}
            <div className="flex gap-2 mb-5 flex-wrap print:hidden">
              {filterBtns.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border min-h-[44px] ${
                    filter === f.key
                      ? "bg-[#CC0000] text-white border-[#CC0000]"
                      : "bg-card text-muted-foreground border-border hover:border-[#CC0000]/50"
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

            {/* State grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(s => (
                <StateCard key={s.abbr} state={s} onClick={setSelectedState} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-[#1A1A1A] border-t-[3px] border-[#CC0000] print:hidden">
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
              <a href="https://myct1.com" target="_blank" rel="noopener noreferrer" className="text-xs text-[#CC0000] font-semibold hover:underline">myct1.com</a>
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
