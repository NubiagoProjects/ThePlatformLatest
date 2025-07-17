import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  productId: string;
  quantity: number;
}

interface OrderRequest {
  items: OrderItem[];
  shippingAddressId?: string;
  billingAddressId?: string;
  paymentMethod?: string;
  notes?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const orderData: OrderRequest = await req.json();

    if (!orderData.items || orderData.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No items in order' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Start a transaction-like process
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Validate and check inventory for all products
    const productIds = orderData.items.map(item => item.productId);
    
    const { data: products, error: productsError } = await adminClient
      .from('products')
      .select('id, name, price, quantity, track_quantity, is_active')
      .in('id', productIds);

    if (productsError) {
      throw new Error('Failed to fetch products: ' + productsError.message);
    }

    if (products.length !== orderData.items.length) {
      return new Response(
        JSON.stringify({ error: 'Some products not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check availability and calculate totals
    let subtotal = 0;
    const validatedItems = [];
    const inventoryUpdates = [];

    for (const orderItem of orderData.items) {
      const product = products.find(p => p.id === orderItem.productId);
      
      if (!product) {
        return new Response(
          JSON.stringify({ error: `Product not found: ${orderItem.productId}` }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!product.is_active) {
        return new Response(
          JSON.stringify({ error: `Product not available: ${product.name}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (product.track_quantity && product.quantity < orderItem.quantity) {
        return new Response(
          JSON.stringify({ 
            error: `Insufficient inventory for ${product.name}. Available: ${product.quantity}, Requested: ${orderItem.quantity}` 
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const itemTotal = product.price * orderItem.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product_id: product.id,
        quantity: orderItem.quantity,
        price: product.price,
        total_price: itemTotal,
      });

      if (product.track_quantity) {
        inventoryUpdates.push({
          id: product.id,
          new_quantity: product.quantity - orderItem.quantity,
        });
      }
    }

    // 2. Calculate tax and shipping
    const taxRate = 0.08; // 8% tax
    const shippingThreshold = 50.00;
    const shippingCost = 9.99;
    
    const taxAmount = subtotal * taxRate;
    const shippingAmount = subtotal >= shippingThreshold ? 0 : shippingCost;
    const totalAmount = subtotal + taxAmount + shippingAmount;

    // 3. Generate unique order number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const orderNumber = `ORD-${timestamp}-${random}`;

    // 4. Create the order
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        status: 'PENDING',
        payment_status: 'PENDING',
        subtotal: subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        total_amount: totalAmount,
        shipping_address_id: orderData.shippingAddressId,
        billing_address_id: orderData.billingAddressId,
        payment_method: orderData.paymentMethod,
        notes: orderData.notes,
      })
      .select()
      .single();

    if (orderError) {
      throw new Error('Failed to create order: ' + orderError.message);
    }

    // 5. Create order items
    const orderItemsToInsert = validatedItems.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: orderItemsError } = await adminClient
      .from('order_items')
      .insert(orderItemsToInsert);

    if (orderItemsError) {
      // Rollback: delete the order
      await adminClient.from('orders').delete().eq('id', order.id);
      throw new Error('Failed to create order items: ' + orderItemsError.message);
    }

    // 6. Update inventory
    for (const update of inventoryUpdates) {
      const { error: inventoryError } = await adminClient
        .from('products')
        .update({ quantity: update.new_quantity })
        .eq('id', update.id);

      if (inventoryError) {
        console.error('Failed to update inventory for product:', update.id, inventoryError);
        // Continue with other updates, but log the error
      }
    }

    // 7. Clear user's cart
    await adminClient
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .in('product_id', productIds);

    // 8. Fetch complete order data with items
    const { data: completeOrder, error: fetchError } = await adminClient
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price,
          total_price,
          products (
            id,
            name,
            slug,
            images
          )
        ),
        shipping_address:addresses!shipping_address_id (*),
        billing_address:addresses!billing_address_id (*)
      `)
      .eq('id', order.id)
      .single();

    if (fetchError) {
      throw new Error('Failed to fetch complete order: ' + fetchError.message);
    }

    // 9. Log the order creation
    console.log(`Order created: ${orderNumber} for user ${user.id} with total $${totalAmount}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          order: completeOrder,
          message: 'Order placed successfully',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in place-order function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}); 