-- Fix security warnings by setting search_path on trigger functions

CREATE OR REPLACE FUNCTION update_job_payment_totals()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.jobs
    SET 
      payments_collected = COALESCE((
        SELECT SUM(net_amount)
        FROM public.payments
        WHERE job_id = OLD.job_id AND status = 'succeeded'
      ), 0),
      profit = payments_collected - expenses_total
    WHERE id = OLD.job_id;
    
    -- Update customer lifetime value
    IF OLD.customer_id IS NOT NULL THEN
      UPDATE public.customers
      SET lifetime_value = COALESCE((
        SELECT SUM(net_amount)
        FROM public.payments
        WHERE customer_id = OLD.customer_id AND status = 'succeeded'
      ), 0)
      WHERE id = OLD.customer_id;
    END IF;
    
    RETURN OLD;
  ELSE
    UPDATE public.jobs
    SET 
      payments_collected = COALESCE((
        SELECT SUM(net_amount)
        FROM public.payments
        WHERE job_id = NEW.job_id AND status = 'succeeded'
      ), 0),
      profit = payments_collected - expenses_total
    WHERE id = NEW.job_id;
    
    -- Update customer lifetime value
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE public.customers
      SET lifetime_value = COALESCE((
        SELECT SUM(net_amount)
        FROM public.payments
        WHERE customer_id = NEW.customer_id AND status = 'succeeded'
      ), 0)
      WHERE id = NEW.customer_id;
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION update_job_expense_totals()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.job_id IS NOT NULL THEN
      UPDATE public.jobs
      SET 
        expenses_total = COALESCE((
          SELECT SUM(amount)
          FROM public.expenses
          WHERE job_id = OLD.job_id
        ), 0),
        profit = payments_collected - expenses_total
      WHERE id = OLD.job_id;
    END IF;
    RETURN OLD;
  ELSE
    IF NEW.job_id IS NOT NULL THEN
      UPDATE public.jobs
      SET 
        expenses_total = COALESCE((
          SELECT SUM(amount)
          FROM public.expenses
          WHERE job_id = NEW.job_id
        ), 0),
        profit = payments_collected - expenses_total
      WHERE id = NEW.job_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION update_job_change_order_totals()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.jobs
    SET 
      change_orders_total = COALESCE((
        SELECT SUM(additional_cost)
        FROM public.change_orders
        WHERE job_id = OLD.job_id AND status = 'approved'
      ), 0),
      total_contract_value = contract_value + change_orders_total
    WHERE id = OLD.job_id;
    RETURN OLD;
  ELSE
    UPDATE public.jobs
    SET 
      change_orders_total = COALESCE((
        SELECT SUM(additional_cost)
        FROM public.change_orders
        WHERE job_id = NEW.job_id AND status = 'approved'
      ), 0),
      total_contract_value = contract_value + change_orders_total
    WHERE id = NEW.job_id;
    RETURN NEW;
  END IF;
END;
$$;