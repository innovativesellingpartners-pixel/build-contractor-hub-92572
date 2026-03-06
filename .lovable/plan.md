

## Add "Add to Job/Estimate" from Product Cards in Chat

### What we're building
Each product card in the chat will get a quantity selector and an "Add to Job/Estimate" button. The user picks a quantity, clicks the button, selects an existing job or estimate from a dropdown, and the product is appended as a line item.

### UI Changes to `ChatProductCard.tsx`

1. **Quantity input** — small number input (default 1) on each product card, next to the price area
2. **"Add to Job/Estimate" button** — replaces or sits alongside the "View on Retailer" button
3. **Job/Estimate picker dialog** — a small popover or inline selector that:
   - Fetches the user's open jobs and draft estimates via existing hooks (`useJobs`, `useEstimates`)
   - Shows them grouped (Jobs / Estimates) with name/number
   - On selection, appends the product as a line item

### Line Item Mapping

Product fields map to `EstimateLineItem`:
- `item_description` → product title (with brand, size_text, retailer)
- `quantity` → user-selected quantity
- `unitPrice` → product price
- `totalPrice` → quantity × price
- `category` → "Materials"
- `unit` → product unit_of_measure or "ea"
- `included` → true

### Adding to an Estimate
- Fetch the estimate's current `line_items` JSON array
- Append the new line item
- Recalculate `total_amount` (sum of all line totals + tax)
- Update via `supabase.from('estimates').update()`

### Adding to a Job
- Fetch the job's linked estimate (if any) and append there
- Or insert into the `materials` table using the existing `useMaterials` hook as a material record tied to the job

### Files to create/modify

| File | Change |
|------|--------|
| `src/components/contractor/ChatProductCard.tsx` | Add quantity input, "Add to Job/Estimate" button, picker popover |
| `src/components/contractor/AddProductToRecordDialog.tsx` | **New** — reusable dialog for selecting a job or estimate |

### Flow
1. User sees product card in chat
2. Sets quantity (defaults to 1)
3. Clicks "Add to Job/Estimate"
4. Dialog opens showing open jobs and draft estimates
5. User picks one → line item is appended → toast confirms success
6. No page navigation — stays in chat per existing UX pattern

