-- Seed residential roofing templates
INSERT INTO public.estimate_templates (id, user_id, name, trade, description, tags, scope_summary, visibility, line_items, created_at, updated_at)
VALUES 
  -- Template 1: Asphalt Shingle Tear Off and Replace
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Asphalt Shingle Tear Off and Replace - 25 Squares',
    'Roofing - Residential',
    'Standard residential tear off and replacement of architectural shingles on a typical 25 square roof.',
    ARRAY['roofing', 'residential', 'shingle', 'tear off', 'replacement'],
    'Remove existing roofing down to deck, inspect and repair deck as needed, install underlayment and ice barrier, install architectural shingles, flashings, vents, and clean up.',
    'account',
    '[
      {"id": "1", "description": "Remove existing shingles and underlayment, load into dumpster, dispose off site", "quantity": 25, "unit": "SQ", "unit_price": 0, "item_code": "TEAR-01"},
      {"id": "2", "description": "Replace damaged or rotten decking as needed, allowance only", "quantity": 5, "unit": "SHEET", "unit_price": 0, "item_code": "DECK-01"},
      {"id": "3", "description": "Install synthetic underlayment and ice dam protection at eaves and valleys", "quantity": 25, "unit": "SQ", "unit_price": 0, "item_code": "UND-01"},
      {"id": "4", "description": "Install new architectural asphalt shingles including starter and field shingles", "quantity": 25, "unit": "SQ", "unit_price": 0, "item_code": "SHIN-01"},
      {"id": "5", "description": "Install hip and ridge cap shingles at ridges and hips", "quantity": 150, "unit": "LF", "unit_price": 0, "item_code": "CAP-01"},
      {"id": "6", "description": "Install metal edge at eaves and rakes", "quantity": 200, "unit": "LF", "unit_price": 0, "item_code": "EDGE-01"},
      {"id": "7", "description": "Install pipe boots, vents, step flashing, and counter flashing as needed", "quantity": 1, "unit": "LS", "unit_price": 0, "item_code": "ACC-01"},
      {"id": "8", "description": "Jobsite clean up, magnetic nail sweep, debris hauling and disposal", "quantity": 1, "unit": "LS", "unit_price": 0, "item_code": "CLN-01"}
    ]'::jsonb,
    now(),
    now()
  ),
  -- Template 2: Low Slope Roof - Modified Bitumen
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Low Slope Roof - Modified Bitumen 10 Squares',
    'Roofing - Residential',
    'Low slope residential roof replacement using modified bitumen roofing for a 10 square area.',
    ARRAY['roofing', 'residential', 'low slope', 'modified bitumen'],
    'Remove existing low slope roofing, prepare deck, install base sheet and modified bitumen membrane, flash penetrations, and manage drainage.',
    'account',
    '[
      {"id": "1", "description": "Remove existing membrane and insulation down to deck where required", "quantity": 10, "unit": "SQ", "unit_price": 0, "item_code": "REM-01"},
      {"id": "2", "description": "Allowance for replacement of damaged deck material", "quantity": 3, "unit": "SHEET", "unit_price": 0, "item_code": "DECK-02"},
      {"id": "3", "description": "Install roofing base sheet over prepared deck", "quantity": 10, "unit": "SQ", "unit_price": 0, "item_code": "BASE-01"},
      {"id": "4", "description": "Install modified bitumen membrane with proper laps and fastening", "quantity": 10, "unit": "SQ", "unit_price": 0, "item_code": "BIT-01"},
      {"id": "5", "description": "Flash parapets, curbs, and penetrations, install termination bars and sealants", "quantity": 1, "unit": "LS", "unit_price": 0, "item_code": "FLASH-01"},
      {"id": "6", "description": "Rework or replace drains and scuppers as needed", "quantity": 1, "unit": "AL", "unit_price": 0, "item_code": "DRAIN-01"},
      {"id": "7", "description": "Daily clean up and final debris removal", "quantity": 1, "unit": "LS", "unit_price": 0, "item_code": "CLN-02"}
    ]'::jsonb,
    now(),
    now()
  ),
  -- Template 3: Roof Repair Service Call
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Roof Repair Service Call',
    'Roofing - Residential',
    'Service call for troubleshooting and repairing small residential roof leaks.',
    ARRAY['roofing', 'residential', 'repair', 'service'],
    'Inspect roof at reported leak area, perform minor repairs, and provide basic report to the client.',
    'account',
    '[
      {"id": "1", "description": "Travel to site, rooftop inspection, leak investigation", "quantity": 1, "unit": "LS", "unit_price": 0, "item_code": "SVC-01"},
      {"id": "2", "description": "Patch, seal, or adjust roofing materials at leak location", "quantity": 2, "unit": "HR", "unit_price": 0, "item_code": "LAB-01"},
      {"id": "3", "description": "Shingles, sealants, flashings, fasteners for small repair", "quantity": 1, "unit": "AL", "unit_price": 0, "item_code": "MAT-01"},
      {"id": "4", "description": "Provide photos and a short written summary to client", "quantity": 1, "unit": "LS", "unit_price": 0, "item_code": "DOC-01"}
    ]'::jsonb,
    now(),
    now()
  )
ON CONFLICT DO NOTHING;