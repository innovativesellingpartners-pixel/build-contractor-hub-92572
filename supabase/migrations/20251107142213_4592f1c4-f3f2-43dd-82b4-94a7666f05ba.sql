-- Add lead_id to jobs table to track which lead converted to this job
ALTER TABLE jobs ADD COLUMN lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;

-- Add job_id to customers table to track which job converted to this customer
ALTER TABLE customers ADD COLUMN job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

-- Add conversion tracking fields
ALTER TABLE leads ADD COLUMN converted_to_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN converted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE jobs ADD COLUMN converted_to_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE jobs ADD COLUMN converted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better query performance
CREATE INDEX idx_jobs_lead_id ON jobs(lead_id);
CREATE INDEX idx_customers_job_id ON customers(job_id);
CREATE INDEX idx_leads_converted_to_job ON leads(converted_to_job_id);
CREATE INDEX idx_jobs_converted_to_customer ON jobs(converted_to_customer_id);