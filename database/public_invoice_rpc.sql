CREATE OR REPLACE FUNCTION get_public_invoice(p_invoice_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'invoice', i,
    'client', c,
    'items', (SELECT json_agg(item) FROM invoice_items item WHERE item.invoice_id = i.id),
    'profile', p
  ) INTO result
  FROM invoices i
  JOIN clients c ON i.client_id = c.id
  JOIN profiles p ON i.user_id = p.id
  WHERE i.id = p_invoice_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
