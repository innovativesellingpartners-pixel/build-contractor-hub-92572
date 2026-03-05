
-- Create ai_topic_rules table
CREATE TABLE public.ai_topic_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  custom_instructions TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_topic_rules ENABLE ROW LEVEL SECURITY;

-- Read policy: all authenticated users can read
CREATE POLICY "Authenticated users can read ai_topic_rules"
  ON public.ai_topic_rules FOR SELECT
  TO authenticated
  USING (true);

-- Write policies: only admins
CREATE POLICY "Admins can insert ai_topic_rules"
  ON public.ai_topic_rules FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can update ai_topic_rules"
  ON public.ai_topic_rules FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can delete ai_topic_rules"
  ON public.ai_topic_rules FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Updated_at trigger
CREATE TRIGGER update_ai_topic_rules_updated_at
  BEFORE UPDATE ON public.ai_topic_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Seed data: comprehensive contractor topics
INSERT INTO public.ai_topic_rules (topic_name, category, description, custom_instructions) VALUES
-- Trades/Technical
('Electrical Work', 'trades', 'Residential and commercial electrical systems, wiring, panels, code requirements', 'Do not recommend specific brand names. Focus on general best practices, NEC code references, and safety. Never provide advice that could lead to unsafe DIY electrical work without proper licensing.'),
('Plumbing', 'trades', 'Plumbing systems, piping, fixtures, water heaters, drainage', 'Focus on licensed plumber practices. Do not recommend specific product brands. Reference IPC/UPC codes where relevant.'),
('HVAC', 'trades', 'Heating, ventilation, air conditioning systems, ductwork, refrigeration', 'Do not recommend specific equipment brands. Focus on system design principles, efficiency ratings, and code compliance.'),
('Roofing', 'trades', 'Roof installation, repair, materials, waterproofing, gutters', 'Provide general material comparisons without brand endorsements. Include safety considerations for working at heights.'),
('Concrete & Masonry', 'trades', 'Concrete work, foundations, flatwork, block, brick, stone masonry', 'Focus on mix ratios, curing practices, and structural considerations. No brand-specific recommendations.'),
('Framing & Carpentry', 'trades', 'Wood and steel framing, rough carpentry, structural elements', 'Reference IRC/IBC building codes. Focus on load-bearing considerations and proper techniques.'),
('Drywall & Finishing', 'trades', 'Drywall installation, taping, mudding, texturing, finishing', 'Focus on techniques and best practices. No brand-specific compound or tool recommendations.'),
('Painting', 'trades', 'Interior and exterior painting, surface preparation, coatings', 'Discuss types of paint (latex, oil, etc.) without brand names. Focus on surface prep and application techniques.'),
('Flooring', 'trades', 'Hardwood, tile, carpet, vinyl, laminate installation', 'Compare material types generically. Focus on subfloor preparation and installation best practices.'),
('Landscaping & Hardscaping', 'trades', 'Landscape design, grading, retaining walls, pavers, irrigation', 'Focus on drainage, grading principles, and material selection without brand names.'),
('Siding & Exterior', 'trades', 'Siding installation, exterior trim, cladding systems', 'Compare siding types generically (vinyl, fiber cement, wood, etc.). Focus on weatherproofing and installation.'),
('Windows & Doors', 'trades', 'Window and door installation, replacement, weatherization', 'Discuss energy ratings and installation techniques. No brand-specific recommendations.'),
('Insulation', 'trades', 'Insulation types, installation, R-values, energy efficiency', 'Compare insulation types by R-value and application. No brand endorsements.'),
('Demolition', 'trades', 'Demolition procedures, hazmat considerations, waste disposal', 'Emphasize safety, permits, and proper disposal. Reference OSHA requirements.'),
('Excavation & Sitework', 'trades', 'Excavation, grading, utilities, site preparation', 'Focus on safety, utility locating (call 811), and soil considerations.'),
('Welding & Metal Fabrication', 'trades', 'Welding techniques, metal fabrication, structural steel', 'Focus on AWS standards, safety practices, and technique. No brand recommendations.'),

-- Estimating
('Material Takeoffs', 'estimating', 'Calculating material quantities from plans and specifications', 'Provide general formulas and waste factors. Do not reference proprietary takeoff software by name.'),
('Labor Costing', 'estimating', 'Estimating labor hours, crew productivity, labor burden rates', 'Use general industry production rates. Do not reference specific labor databases or paid services by name.'),
('Markup & Margin', 'estimating', 'Understanding markup vs margin, pricing strategies, overhead recovery', 'Provide formulas and general guidance. Do not prescribe specific markup percentages as universal.'),
('Bid Preparation', 'estimating', 'Preparing competitive bids, bid documents, proposal writing', 'Focus on best practices for professional proposals. Do not reference specific bid software by name.'),
('Change Order Pricing', 'estimating', 'Pricing change orders, scope changes, T&M vs fixed pricing', 'Discuss fair pricing practices and documentation requirements.'),

-- Project Management
('Scheduling', 'project_management', 'Project scheduling, critical path, milestone tracking, Gantt charts', 'Focus on scheduling principles. Do not recommend specific scheduling software by name.'),
('Crew Management', 'project_management', 'Managing crews, subcontractors, labor allocation, productivity', 'Focus on leadership, communication, and efficiency best practices.'),
('Subcontractor Coordination', 'project_management', 'Working with subs, scope coordination, scheduling conflicts', 'Focus on communication, contracts, and coordination best practices.'),
('Punch Lists & Quality Control', 'project_management', 'Quality inspections, punch list management, completion tracking', 'Focus on systematic QC processes and documentation.'),
('Inspections & Permitting', 'project_management', 'Building permits, code inspections, certificate of occupancy', 'Reference general IBC/IRC requirements. Remind users to check local jurisdiction requirements.'),
('Safety & OSHA Compliance', 'compliance', 'Jobsite safety, OSHA regulations, safety programs, PPE', 'Reference OSHA standards directly. Emphasize that this is general guidance and not legal advice.'),

-- Sales
('Sales Objection Handling', 'sales', 'Handling common customer objections, price negotiations', 'Provide general sales techniques. Do not reference specific sales training programs or methodologies by name.'),
('Closing Techniques', 'sales', 'Closing strategies for contractors, follow-up processes', 'Focus on value-based selling and relationship building. No branded sales methodology references.'),
('Proposal Presentation', 'sales', 'Presenting estimates professionally, in-person and virtual', 'Focus on communication skills and presentation best practices.'),
('Customer Follow-Up', 'sales', 'Follow-up strategies, timing, communication channels', 'Focus on systematic follow-up processes and CRM best practices.'),

-- Business Operations
('Business Licensing', 'business', 'Contractor licensing requirements, renewals, reciprocity', 'Remind users licensing varies by state/locality. Provide general guidance only.'),
('Insurance & Bonding', 'business', 'General liability, workers comp, surety bonds, insurance requirements', 'General guidance only. Recommend consulting with an insurance professional for specific coverage.'),
('Cash Flow Management', 'business', 'Managing cash flow, billing cycles, payment collection', 'Provide general financial management principles. Not financial advice.'),
('Scaling a Contracting Business', 'business', 'Growing a contractor business, hiring, systems, processes', 'Focus on general business growth principles applicable to contracting.'),
('Fleet & Equipment Management', 'business', 'Vehicle management, equipment maintenance, asset tracking', 'Focus on maintenance schedules and cost tracking. No brand recommendations.'),

-- Materials
('Building Materials & Specifications', 'materials', 'Material types, specifications, performance characteristics', 'Compare materials by type and performance. No brand endorsements. Reference ASTM standards where applicable.'),
('Building Codes', 'materials', 'IBC, IRC, NEC, IPC building codes and requirements', 'Reference code sections generally. Remind users to verify with local AHJ (Authority Having Jurisdiction).'),
('Material Cost Estimation', 'materials', 'General material pricing, cost trends, budgeting', 'Provide general cost ranges and factors. Prices vary by region and market conditions.'),

-- Customer Service
('Customer Communication', 'customer_service', 'Professional communication, setting expectations, updates', 'Focus on professional communication best practices and conflict prevention.'),
('Dispute Resolution', 'customer_service', 'Handling customer complaints, disputes, warranty claims', 'Provide general mediation and resolution guidance. Not legal advice.'),
('Online Reviews & Reputation', 'customer_service', 'Managing online reputation, responding to reviews, building referrals', 'Focus on professional response strategies and proactive reputation building.');
