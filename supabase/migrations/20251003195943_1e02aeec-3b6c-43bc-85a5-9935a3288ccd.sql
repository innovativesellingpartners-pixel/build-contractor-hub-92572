-- Add category_id column to marketplace_services
ALTER TABLE marketplace_services
ADD COLUMN category_id uuid;

-- Add foreign key constraint
ALTER TABLE marketplace_services
ADD CONSTRAINT marketplace_services_category_id_fkey
FOREIGN KEY (category_id) REFERENCES marketplace_categories(id)
ON DELETE SET NULL;