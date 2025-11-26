# CT1 Data Pipeline Summary

## Database Changes

### New Tables Created
1. **payments**
   - `contractor_id`, `customer_id`, `job_id`, `estimate_id`
   - `stripe_payment_intent_id`, `amount`, `fee_amount`, `net_amount`
   - `status` (pending, succeeded, failed), `paid_at`
   - Triggers automatic updates to job and customer totals

2. **expenses**
   - `contractor_id`, `job_id`, `category`, `date`, `amount`
   - `description`, `receipt_url`, `notes`, `plaid_transaction_id`
   - Triggers automatic updates to job expense totals

### Extended Existing Tables
1. **leads**
   - Added `customer_id`, `converted_to_customer`

2. **customers**
   - Added `lifetime_value` (auto-calculated from payments)

3. **estimates**
   - Added `lead_id`, `job_id` for relationship tracking

4. **jobs**
   - Added `original_estimate_id`, `contract_value`
   - Added `change_orders_total`, `total_contract_value`
   - Added `payments_collected`, `expenses_total`, `profit`

## Backend Functions

### Edge Functions
1. **convert-lead-to-customer**
   - Creates customer from lead contact info
   - Updates lead with `customer_id` and `converted_to_customer = true`
   - Updates any estimates linked to the lead

2. **convert-estimate-to-job**
   - Creates job when estimate status is "sold"
   - Sets `contract_value` from estimate `grand_total`
   - Initializes all financial tracking fields
   - Links job back to estimate via `job_id`

3. **process-payment-webhook**
   - Handles Stripe webhooks (checkout.session.completed, payment_intent.succeeded/failed)
   - Creates payment records with contractor/customer/job/estimate references
   - Updates estimate and invoice status automatically
   - Triggers cascade update job and customer totals

### Database Triggers
1. **update_job_payment_totals()**
   - Fires on payments INSERT/UPDATE/DELETE
   - Recalculates `job.payments_collected`
   - Recalculates `job.profit`
   - Updates `customer.lifetime_value`

2. **update_job_expense_totals()**
   - Fires on expenses INSERT/UPDATE/DELETE
   - Recalculates `job.expenses_total`
   - Recalculates `job.profit`

3. **update_job_change_order_totals()**
   - Fires on change_orders INSERT/UPDATE/DELETE
   - Recalculates `job.change_orders_total`
   - Recalculates `job.total_contract_value`

## Complete Workflow Example

### 1. New Lead Created
- Contractor creates lead with contact info and estimated value
- Lead status: "new"

### 2. Estimate Created for Lead
- Contractor creates estimate
- Sets `estimate.lead_id` to link to lead
- Estimate status: "draft"

### 3. Lead Converted to Customer
- Contractor clicks "Convert to Customer"
- Calls `convert-lead-to-customer` edge function
- Customer record created with lead contact info
- Lead updated with `customer_id` and `converted_to_customer = true`
- All estimates for this lead updated with `customer_id`

### 4. Estimate Sent and Accepted
- Contractor sends estimate to customer via email
- Customer reviews and accepts estimate
- Estimate status: "accepted"

### 5. Estimate Converted to Job (Sold)
- Contractor marks estimate as "sold"
- Calls `convert-estimate-to-job` edge function
- Job created with:
  - `original_estimate_id` linking back to estimate
  - `contract_value` = estimate `grand_total`
  - `total_contract_value` = `contract_value` (initially)
  - `payments_collected` = 0
  - `expenses_total` = 0
  - `profit` = 0
- Estimate updated with `job_id`
- Opportunity (if exists) updated to "close" stage

### 6. Payment Received via Stripe
- Customer pays deposit or full amount via Stripe payment link
- Stripe sends webhook to `process-payment-webhook`
- Payment record created with:
  - `contractor_id` from session metadata
  - `customer_id`, `job_id`, `estimate_id` from metadata
  - `amount`, `fee_amount`, `net_amount`
  - `status` = "succeeded"
  - `paid_at` = current timestamp
- **Trigger fires**: `update_job_payment_totals()`
  - Job `payments_collected` updated to SUM of all succeeded payments
  - Job `profit` recalculated as `payments_collected - expenses_total`
  - Customer `lifetime_value` updated to SUM of all succeeded payment `net_amount`s

### 7. Expenses Added
- Contractor adds expense (materials, labor, etc.)
- Expense record created with:
  - `contractor_id`, `job_id`, `category`, `amount`
- **Trigger fires**: `update_job_expense_totals()`
  - Job `expenses_total` updated to SUM of all expenses
  - Job `profit` recalculated as `payments_collected - expenses_total`

### 8. Real-time Job Financials
- Job detail page shows:
  - **Contract Value**: $10,000 (from estimate)
  - **Change Orders**: $1,500
  - **Total Contract Value**: $11,500
  - **Payments Collected**: $6,000
  - **Expenses**: $4,200
  - **Profit**: $1,800
  - **Profit Margin**: 15.65%

### 9. Accounting Dashboard Shows
- **Cash Balance**: Sum of all payments - expenses
- **Monthly Income**: Sum of payments this month
- **Monthly Expenses**: Sum of expenses this month
- **Monthly Profit**: Income - Expenses
- **Outstanding Invoices**: Invoices with balance_due > 0
- **Customer Lifetime Value**: Auto-updated from payments

## Multi-Tenant Security

All queries are scoped by `contractor_id` from authenticated session:
- Never accept contractor/user IDs from client requests
- All database queries filter by `auth.uid()` or stored `contractor_id`
- RLS policies enforce contractor isolation
- Edge functions validate user auth before processing

## UI Integration

### Lead Detail Page
- Shows linked customer if converted
- Lists all estimates for this lead with status and totals
- "Convert to Customer" button if not yet converted

### Customer Detail Page
- Shows `lifetime_value` (auto-calculated)
- Lists all jobs with `total_contract_value`
- Shows total `payments_collected` across all jobs
- Shows outstanding balance

### Estimate Detail Page
- Shows linked lead and customer
- Shows linked job if status is "sold"
- Financial summary matches job `contract_value`
- "Convert to Job" button if status is "sold" and no job yet

### Job Detail Page
- Shows `original_estimate_id` and estimate total
- Lists all payments with date, amount, status
- Shows `payments_collected` total
- Lists all expenses with category, date, amount
- Shows `expenses_total`
- Shows `profit` and profit margin percentage
- All totals update automatically via triggers

### Accounting Module
- Payments Center shows estimates and invoices with payment links
- Banking shows Plaid-linked accounts with transactions
- Expenses auto-imported from Plaid, can be tagged to jobs
- Job Costing shows per-job financials with real-time updates
- Reports aggregate data across all jobs and customers