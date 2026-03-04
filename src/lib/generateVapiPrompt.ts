/**
 * Vapi Assistant Sync Controller — Structured Prompt Generator
 * 
 * Generates a Vapi-compatible system prompt from contractor AI profile fields.
 * All required sections are always present and cannot be removed by contractors.
 */

export interface VapiPromptInput {
  business_name: string;
  trade: string;
  service_description?: string | null;
  services_offered?: string[] | null;
  services_not_offered?: string[] | null;
  service_area?: string[] | null;
  business_hours?: Record<string, string> | null;
  emergency_availability?: boolean | null;
  allow_pricing?: boolean | null;
  pricing_rules?: string | null;
  calendar_email?: string | null;
  contractor_phone?: string | null;
  qualification_instructions?: string | null;
}

export function generateVapiPrompt(input: VapiPromptInput): string {
  const {
    business_name = '[Business Name]',
    trade = '[Trade]',
    service_description,
    services_offered,
    services_not_offered,
    service_area,
    business_hours,
    emergency_availability,
    allow_pricing,
    pricing_rules,
    calendar_email,
    contractor_phone,
    qualification_instructions,
  } = input;

  const servicesText = services_offered?.length
    ? services_offered.join(', ')
    : 'General services';

  const notOfferedText = services_not_offered?.length
    ? services_not_offered.join(', ')
    : 'None specified';

  const serviceAreaText = service_area?.length
    ? service_area.join(', ')
    : 'Not specified';

  const hoursText = business_hours
    ? typeof business_hours === 'string'
      ? business_hours
      : Object.entries(business_hours)
          .map(([day, hours]) => `${day}: ${hours}`)
          .join(', ')
    : 'Standard business hours';

  const pricingSection = allow_pricing
    ? `Provide pricing information when requested.${pricing_rules ? ` Reference: ${pricing_rules}` : ''}`
    : 'Never give exact prices. Instead say the contractor will confirm pricing.';

  const emergencySection = emergency_availability
    ? `If caller describes an urgent situation related to ${trade}, escalate immediately. Offer 24/7 emergency availability.`
    : `If caller describes an urgent situation related to ${trade}, take their information and confirm someone will follow up as soon as possible.`;

  const calendarSection = calendar_email
    ? `Offer to schedule an appointment. Calendar is connected at ${calendar_email}.`
    : 'Take caller information for scheduling — calendar is not yet connected.';

  const qualificationSection = qualification_instructions
    ? qualification_instructions
    : 'Ask about the scope of work, timeline, and budget range when qualifying new leads.';

  const sections = [
    // Identity
    `You are Sarah, the professional receptionist for ${business_name}, a ${trade} contractor.`,

    // Business Context
    `\n## Business Overview\n${service_description || `${business_name} provides professional ${trade} services.`}`,

    `\n## Services Offered\n${servicesText}`,

    `\n## Services NOT Offered\n${notOfferedText}`,

    `\n## Service Area\n${serviceAreaText}`,

    `\n## Hours of Operation\n${hoursText}`,

    // Call Handling Behavior
    `\n## Your Role\n- Answer inbound calls professionally.\n- Gather caller name, phone number, and reason for calling.\n- Qualify new leads.\n- ${calendarSection}\n- ${emergencySection}`,

    // Tone Rules
    `\n## Tone & Style\n- Warm\n- Confident\n- Professional\n- Clear and concise\n- Never robotic\n- Never say "hold on"\n- Never mention you are AI`,

    // Qualification Logic
    `\n## Lead Qualification\n${qualificationSection}`,

    // Pricing
    `\n## Pricing\n${pricingSection}`,

    // Transfer / Escalation Rules
    `\n## Transfer Rules\n- If caller requests a human, transfer politely.${contractor_phone ? `\n- Contractor phone: ${contractor_phone}` : ''}`,

    // Guardrails
    `\n## Guardrails\n- Never provide legal advice.\n- Never guess pricing.\n- Do not fabricate availability.\n- Keep responses under 20 words unless gathering information.`,
  ];

  return sections.join('\n');
}

export function generateFirstMessage(business_name: string): string {
  return `Hi, this is Sarah with ${business_name || '[Business Name]'}.`;
}
