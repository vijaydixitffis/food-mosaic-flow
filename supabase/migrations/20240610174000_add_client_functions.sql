-- Function to create a client with addresses in a transaction
CREATE OR REPLACE FUNCTION public.create_client_with_addresses(
  client_data JSONB,
  registered_office_address JSONB,
  bill_to_address JSONB DEFAULT NULL,
  ship_to_address JSONB DEFAULT NULL
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_id UUID;
  reg_address_id UUID;
  bill_address_id UUID;
  ship_address_id UUID;
  result JSONB;
BEGIN
  -- Start transaction
  BEGIN
    -- Insert registered office address
    INSERT INTO public.addresses (
      address_type,
      address_line1,
      address_line2,
      landmark,
      city,
      state,
      pincode
    ) VALUES (
      (registered_office_address->>'address_type')::address_type,
      registered_office_address->>'address_line1',
      registered_office_address->>'address_line2',
      registered_office_address->>'landmark',
      registered_office_address->>'city',
      registered_office_address->>'state',
      registered_office_address->>'pincode'
    ) RETURNING id INTO reg_address_id;

    -- Insert billing address if provided
    IF bill_to_address IS NOT NULL THEN
      INSERT INTO public.addresses (
        address_type,
        address_line1,
        address_line2,
        landmark,
        city,
        state,
        pincode
      ) VALUES (
        (bill_to_address->>'address_type')::address_type,
        bill_to_address->>'address_line1',
        bill_to_address->>'address_line2',
        bill_to_address->>'landmark',
        bill_to_address->>'city',
        bill_to_address->>'state',
        bill_to_address->>'pincode'
      ) RETURNING id INTO bill_address_id;
    END IF;

    -- Insert shipping address if provided and different from billing
    IF ship_to_address IS NOT NULL AND 
       (bill_to_address IS NULL OR 
        ship_to_address->>'address_line1' != bill_to_address->>'address_line1' OR
        ship_to_address->>'pincode' != bill_to_address->>'pincode') THEN
      INSERT INTO public.addresses (
        address_type,
        address_line1,
        address_line2,
        landmark,
        city,
        state,
        pincode
      ) VALUES (
        (ship_to_address->>'address_type')::address_type,
        ship_to_address->>'address_line1',
        ship_to_address->>'address_line2',
        ship_to_address->>'landmark',
        ship_to_address->>'city',
        ship_to_address->>'state',
        ship_to_address->>'pincode'
      ) RETURNING id INTO ship_address_id;
    ELSIF ship_to_address IS NOT NULL AND bill_to_address IS NOT NULL THEN
      -- If shipping address is same as billing, use billing address ID
      ship_address_id := bill_address_id;
    END IF;

    -- Insert client
    INSERT INTO public.clients (
      client_code,
      name,
      registered_office_address_id,
      bill_to_address_id,
      ship_to_address_id,
      gst_number,
      is_igst,
      company_registration_number,
      office_phone_number,
      contact_person1_name,
      contact_person1_phone,
      contact_person2_name,
      contact_person2_phone
    ) VALUES (
      client_data->>'client_code',
      client_data->>'name',
      reg_address_id,
      bill_address_id,
      COALESCE(ship_address_id, bill_address_id),
      client_data->>'gst_number',
      COALESCE((client_data->>'is_igst')::boolean, false),
      client_data->>'company_registration_number',
      client_data->>'office_phone_number',
      client_data->>'contact_person1_name',
      client_data->>'contact_person1_phone',
      client_data->>'contact_person2_name',
      client_data->>'contact_person2_phone'
    ) RETURNING id INTO client_id;

    -- Return the created client with addresses
    SELECT jsonb_build_object(
      'id', c.id,
      'client_code', c.client_code,
      'name', c.name,
      'gst_number', c.gst_number,
      'is_igst', c.is_igst,
      'company_registration_number', c.company_registration_number,
      'office_phone_number', c.office_phone_number,
      'contact_person1_name', c.contact_person1_name,
      'contact_person1_phone', c.contact_person1_phone,
      'contact_person2_name', c.contact_person2_name,
      'contact_person2_phone', c.contact_person2_phone,
      'registered_office_address', jsonb_build_object(
        'id', roa.id,
        'address_line1', roa.address_line1,
        'address_line2', roa.address_line2,
        'landmark', roa.landmark,
        'city', roa.city,
        'state', roa.state,
        'pincode', roa.pincode
      ),
      'bill_to_address', CASE WHEN c.bill_to_address_id IS NOT NULL THEN jsonb_build_object(
        'id', bta.id,
        'address_line1', bta.address_line1,
        'address_line2', bta.address_line2,
        'landmark', bta.landmark,
        'city', bta.city,
        'state', bta.state,
        'pincode', bta.pincode
      ) ELSE NULL END,
      'ship_to_address', CASE WHEN c.ship_to_address_id IS NOT NULL AND c.ship_to_address_id != c.bill_to_address_id THEN jsonb_build_object(
        'id', sta.id,
        'address_line1', sta.address_line1,
        'address_line2', sta.address_line2,
        'landmark', sta.landmark,
        'city', sta.city,
        'state', sta.state,
        'pincode', sta.pincode
      ) WHEN c.ship_to_address_id IS NOT NULL THEN 'SAME_AS_BILLING'::jsonb ELSE NULL END
    ) INTO result
    FROM clients c
    LEFT JOIN addresses roa ON c.registered_office_address_id = roa.id
    LEFT JOIN addresses bta ON c.bill_to_address_id = bta.id
    LEFT JOIN addresses sta ON c.ship_to_address_id = sta.id
    WHERE c.id = client_id;

    RETURN result;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback the transaction on error
      RAISE EXCEPTION 'Error creating client: %', SQLERRM;
  END;
END;
$$;

-- Function to update a client with addresses in a transaction
CREATE OR REPLACE FUNCTION public.update_client_with_addresses(
  client_id UUID,
  client_data JSONB,
  registered_office_address JSONB DEFAULT NULL,
  bill_to_address JSONB DEFAULT NULL,
  ship_to_address JSONB DEFAULT NULL
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reg_address_id UUID;
  bill_address_id UUID;
  ship_address_id UUID;
  current_client RECORD;
  result JSONB;
BEGIN
  -- Start transaction
  BEGIN
    -- Get current client data
    SELECT * INTO current_client FROM clients WHERE id = client_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Client not found';
    END IF;

    -- Update or insert registered office address
    IF registered_office_address IS NOT NULL THEN
      IF current_client.registered_office_address_id IS NOT NULL THEN
        -- Update existing address
        UPDATE public.addresses
        SET 
          address_line1 = registered_office_address->>'address_line1',
          address_line2 = registered_office_address->>'address_line2',
          landmark = registered_office_address->>'landmark',
          city = registered_office_address->>'city',
          state = registered_office_address->>'state',
          pincode = registered_office_address->>'pincode',
          updated_at = NOW()
        WHERE id = current_client.registered_office_address_id
        RETURNING id INTO reg_address_id;
      ELSE
        -- Insert new address
        INSERT INTO public.addresses (
          address_type,
          address_line1,
          address_line2,
          landmark,
          city,
          state,
          pincode
        ) VALUES (
          'REGD',
          registered_office_address->>'address_line1',
          registered_office_address->>'address_line2',
          registered_office_address->>'landmark',
          registered_office_address->>'city',
          registered_office_address->>'state',
          registered_office_address->>'pincode'
        ) RETURNING id INTO reg_address_id;
      END IF;
    ELSE
      reg_address_id := current_client.registered_office_address_id;
    END IF;

    -- Handle billing address
    IF bill_to_address IS NOT NULL THEN
      IF current_client.bill_to_address_id IS NOT NULL THEN
        -- Update existing billing address
        UPDATE public.addresses
        SET 
          address_line1 = bill_to_address->>'address_line1',
          address_line2 = bill_to_address->>'address_line2',
          landmark = bill_to_address->>'landmark',
          city = bill_to_address->>'city',
          state = bill_to_address->>'state',
          pincode = bill_to_address->>'pincode',
          updated_at = NOW()
        WHERE id = current_client.bill_to_address_id
        RETURNING id INTO bill_address_id;
      ELSE
        -- Insert new billing address
        INSERT INTO public.addresses (
          address_type,
          address_line1,
          address_line2,
          landmark,
          city,
          state,
          pincode
        ) VALUES (
          'BILLTO',
          bill_to_address->>'address_line1',
          bill_to_address->>'address_line2',
          bill_to_address->>'landmark',
          bill_to_address->>'city',
          bill_to_address->>'state',
          bill_to_address->>'pincode'
        ) RETURNING id INTO bill_address_id;
      END IF;
    ELSE
      bill_address_id := current_client.bill_to_address_id;
    END IF;

    -- Handle shipping address
    IF ship_to_address IS NOT NULL THEN
      -- If shipping address is same as billing, use billing address ID
      IF bill_to_address IS NOT NULL AND 
         ship_to_address->>'address_line1' = bill_to_address->>'address_line1' AND
         ship_to_address->>'pincode' = bill_to_address->>'pincode' THEN
        ship_address_id := bill_address_id;
      ELSIF current_client.ship_to_address_id IS NOT NULL AND 
            current_client.ship_to_address_id != current_client.bill_to_address_id THEN
        -- Update existing shipping address
        UPDATE public.addresses
        SET 
          address_line1 = ship_to_address->>'address_line1',
          address_line2 = ship_to_address->>'address_line2',
          landmark = ship_to_address->>'landmark',
          city = ship_to_address->>'city',
          state = ship_to_address->>'state',
          pincode = ship_to_address->>'pincode',
          updated_at = NOW()
        WHERE id = current_client.ship_to_address_id
        RETURNING id INTO ship_address_id;
      ELSE
        -- Insert new shipping address
        INSERT INTO public.addresses (
          address_type,
          address_line1,
          address_line2,
          landmark,
          city,
          state,
          pincode
        ) VALUES (
          'SHIPTO',
          ship_to_address->>'address_line1',
          ship_to_address->>'address_line2',
          ship_to_address->>'landmark',
          ship_to_address->>'city',
          ship_to_address->>'state',
          ship_to_address->>'pincode'
        ) RETURNING id INTO ship_address_id;
      END IF;
    ELSE
      -- If shipping address was same as billing before and billing was updated, update shipping too
      IF current_client.ship_to_address_id = current_client.bill_to_address_id AND 
         bill_to_address IS NOT NULL THEN
        ship_address_id := bill_address_id;
      ELSE
        ship_address_id := current_client.ship_to_address_id;
      END IF;
    END IF;

    -- Update client
    UPDATE public.clients
    SET 
      name = COALESCE(client_data->>'name', name),
      registered_office_address_id = reg_address_id,
      bill_to_address_id = bill_address_id,
      ship_to_address_id = COALESCE(ship_address_id, bill_address_id),
      gst_number = COALESCE(client_data->>'gst_number', gst_number),
      is_igst = COALESCE((client_data->>'is_igst')::boolean, is_igst),
      company_registration_number = COALESCE(client_data->>'company_registration_number', company_registration_number),
      office_phone_number = COALESCE(client_data->>'office_phone_number', office_phone_number),
      contact_person1_name = COALESCE(client_data->>'contact_person1_name', contact_person1_name),
      contact_person1_phone = COALESCE(client_data->>'contact_person1_phone', contact_person1_phone),
      contact_person2_name = COALESCE(client_data->>'contact_person2_name', contact_person2_name),
      contact_person2_phone = COALESCE(client_data->>'contact_person2_phone', contact_person2_phone),
      updated_at = NOW()
    WHERE id = client_id
    RETURNING id INTO client_id;

    -- Return the updated client with addresses
    SELECT jsonb_build_object(
      'id', c.id,
      'client_code', c.client_code,
      'name', c.name,
      'gst_number', c.gst_number,
      'is_igst', c.is_igst,
      'company_registration_number', c.company_registration_number,
      'office_phone_number', c.office_phone_number,
      'contact_person1_name', c.contact_person1_name,
      'contact_person1_phone', c.contact_person1_phone,
      'contact_person2_name', c.contact_person2_name,
      'contact_person2_phone', c.contact_person2_phone,
      'registered_office_address', jsonb_build_object(
        'id', roa.id,
        'address_line1', roa.address_line1,
        'address_line2', roa.address_line2,
        'landmark', roa.landmark,
        'city', roa.city,
        'state', roa.state,
        'pincode', roa.pincode
      ),
      'bill_to_address', CASE WHEN c.bill_to_address_id IS NOT NULL THEN jsonb_build_object(
        'id', bta.id,
        'address_line1', bta.address_line1,
        'address_line2', bta.address_line2,
        'landmark', bta.landmark,
        'city', bta.city,
        'state', bta.state,
        'pincode', bta.pincode
      ) ELSE NULL END,
      'ship_to_address', CASE 
        WHEN c.ship_to_address_id IS NULL THEN NULL
        WHEN c.ship_to_address_id = c.bill_to_address_id THEN 'SAME_AS_BILLING'::jsonb
        ELSE jsonb_build_object(
          'id', sta.id,
          'address_line1', sta.address_line1,
          'address_line2', sta.address_line2,
          'landmark', sta.landmark,
          'city', sta.city,
          'state', sta.state,
          'pincode', sta.pincode
        )
      END
    ) INTO result
    FROM clients c
    LEFT JOIN addresses roa ON c.registered_office_address_id = roa.id
    LEFT JOIN addresses bta ON c.bill_to_address_id = bta.id
    LEFT JOIN addresses sta ON c.ship_to_address_id = sta.id
    WHERE c.id = client_id;

    RETURN result;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback the transaction on error
      RAISE EXCEPTION 'Error updating client: %', SQLERRM;
  END;
END;
$$;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.create_client_with_addresses(JSONB, JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_client_with_addresses(UUID, JSONB, JSONB, JSONB, JSONB) TO authenticated;
