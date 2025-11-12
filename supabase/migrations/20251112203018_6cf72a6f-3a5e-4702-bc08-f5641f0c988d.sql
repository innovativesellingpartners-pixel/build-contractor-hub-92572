-- Add win/loss tracking fields to opportunities table
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS win_loss_reason TEXT,
ADD COLUMN IF NOT EXISTS win_loss_details TEXT,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance on closed opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_closed_at ON opportunities(closed_at);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage_closed ON opportunities(stage) WHERE stage IN ('close', 'psfu');

-- Add comments for documentation
COMMENT ON COLUMN opportunities.win_loss_reason IS 'Reason category for won/lost opportunities: price, timing, competition, budget, quality, scope, relationship, other';
COMMENT ON COLUMN opportunities.win_loss_details IS 'Additional details about why the opportunity was won or lost';
COMMENT ON COLUMN opportunities.closed_at IS 'Timestamp when the opportunity was marked as closed (won) or lost (psfu)';