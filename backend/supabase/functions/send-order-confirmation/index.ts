import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  orderId: string;
  type: 'confirmation' | 'status_update' | 'shipped' | 'delivered';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase admin client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const emailData: EmailRequest = await req.json();

    if (!emailData.orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch order details with user and items
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        users (
          id,
          name,
          email
        ),
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
      .eq('id', emailData.orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate email content based on type
    let subject = '';
    let htmlContent = '';
    let textContent = '';

    const baseUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3000';
    const orderUrl = `${baseUrl}/dashboard/user/orders/${order.id}`;

    switch (emailData.type) {
      case 'confirmation':
        subject = `Order Confirmation - ${order.order_number}`;
        htmlContent = generateConfirmationEmail(order, orderUrl);
        textContent = generateConfirmationTextEmail(order, orderUrl);
        break;
      
      case 'status_update':
        subject = `Order Update - ${order.order_number}`;
        htmlContent = generateStatusUpdateEmail(order, orderUrl);
        textContent = generateStatusUpdateTextEmail(order, orderUrl);
        break;
      
      case 'shipped':
        subject = `Your Order Has Shipped - ${order.order_number}`;
        htmlContent = generateShippedEmail(order, orderUrl);
        textContent = generateShippedTextEmail(order, orderUrl);
        break;
      
      case 'delivered':
        subject = `Order Delivered - ${order.order_number}`;
        htmlContent = generateDeliveredEmail(order, orderUrl);
        textContent = generateDeliveredTextEmail(order, orderUrl);
        break;
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid email type' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }

    // For demo purposes, we'll log the email instead of actually sending it
    // In production, you would integrate with an email service like SendGrid, Mailgun, etc.
    const emailLog = {
      to: order.users.email,
      subject,
      htmlContent,
      textContent,
      orderId: order.id,
      orderNumber: order.order_number,
      type: emailData.type,
      timestamp: new Date().toISOString(),
    };

    console.log('Email to be sent:', JSON.stringify(emailLog, null, 2));

    // Simulate email sending (replace with actual email service integration)
    const emailSent = await simulateEmailSending(emailLog);

    if (!emailSent) {
      throw new Error('Failed to send email');
    }

    // Log email sent event
    await supabaseClient
      .from('email_logs')
      .insert({
        user_id: order.user_id,
        order_id: order.id,
        email_type: emailData.type,
        recipient: order.users.email,
        subject,
        sent_at: new Date().toISOString(),
        status: 'sent'
      })
      .then(() => {
        console.log('Email log created successfully');
      })
      .catch((error) => {
        console.error('Failed to create email log:', error);
      });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: 'Email sent successfully',
          orderId: order.id,
          orderNumber: order.order_number,
          recipient: order.users.email,
          type: emailData.type,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in send-order-confirmation function:', error);
    
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

// Email template functions
function generateConfirmationEmail(order: any, orderUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Order Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .order-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .item { border-bottom: 1px solid #eee; padding: 10px 0; }
            .total { font-weight: bold; font-size: 18px; color: #3b82f6; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Order Confirmation</h1>
                <p>Thank you for your order!</p>
            </div>
            <div class="content">
                <h2>Hello ${order.users.name},</h2>
                <p>We've received your order and are preparing it for shipment. Here are your order details:</p>
                
                <div class="order-details">
                    <h3>Order #${order.order_number}</h3>
                    <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> ${order.status}</p>
                    
                    <h4>Items Ordered:</h4>
                    ${order.order_items.map((item: any) => `
                        <div class="item">
                            <strong>${item.products.name}</strong><br>
                            Quantity: ${item.quantity} × $${item.price.toFixed(2)} = $${item.total_price.toFixed(2)}
                        </div>
                    `).join('')}
                    
                    <div class="item">
                        <p><strong>Subtotal:</strong> $${order.subtotal.toFixed(2)}</p>
                        <p><strong>Tax:</strong> $${order.tax_amount.toFixed(2)}</p>
                        <p><strong>Shipping:</strong> $${order.shipping_amount.toFixed(2)}</p>
                        <p class="total"><strong>Total: $${order.total_amount.toFixed(2)}</strong></p>
                    </div>
                </div>
                
                <a href="${orderUrl}" class="button">Track Your Order</a>
                
                <p>We'll send you another email when your order ships.</p>
                
                <p>Thank you for shopping with Nubiago!</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateConfirmationTextEmail(order: any, orderUrl: string): string {
  return `
Order Confirmation - Thank you for your order!

Hello ${order.users.name},

We've received your order and are preparing it for shipment.

Order Details:
Order #${order.order_number}
Order Date: ${new Date(order.created_at).toLocaleDateString()}
Status: ${order.status}

Items Ordered:
${order.order_items.map((item: any) => 
  `${item.products.name} - Quantity: ${item.quantity} × $${item.price.toFixed(2)} = $${item.total_price.toFixed(2)}`
).join('\n')}

Subtotal: $${order.subtotal.toFixed(2)}
Tax: $${order.tax_amount.toFixed(2)}
Shipping: $${order.shipping_amount.toFixed(2)}
Total: $${order.total_amount.toFixed(2)}

Track your order: ${orderUrl}

We'll send you another email when your order ships.

Thank you for shopping with Nubiago!
  `;
}

function generateStatusUpdateEmail(order: any, orderUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Order Status Update</title>
    </head>
    <body>
        <div class="container">
            <h1>Order Status Update</h1>
            <p>Hello ${order.users.name},</p>
            <p>Your order #${order.order_number} status has been updated to: <strong>${order.status}</strong></p>
            <a href="${orderUrl}">View Order Details</a>
        </div>
    </body>
    </html>
  `;
}

function generateStatusUpdateTextEmail(order: any, orderUrl: string): string {
  return `
Order Status Update

Hello ${order.users.name},

Your order #${order.order_number} status has been updated to: ${order.status}

View order details: ${orderUrl}
  `;
}

function generateShippedEmail(order: any, orderUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Your Order Has Shipped</title>
    </head>
    <body>
        <div class="container">
            <h1>Your Order Has Shipped!</h1>
            <p>Hello ${order.users.name},</p>
            <p>Great news! Your order #${order.order_number} has shipped.</p>
            ${order.tracking_number ? `<p>Tracking Number: <strong>${order.tracking_number}</strong></p>` : ''}
            <a href="${orderUrl}">Track Your Package</a>
        </div>
    </body>
    </html>
  `;
}

function generateShippedTextEmail(order: any, orderUrl: string): string {
  return `
Your Order Has Shipped!

Hello ${order.users.name},

Great news! Your order #${order.order_number} has shipped.
${order.tracking_number ? `Tracking Number: ${order.tracking_number}` : ''}

Track your package: ${orderUrl}
  `;
}

function generateDeliveredEmail(order: any, orderUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Order Delivered</title>
    </head>
    <body>
        <div class="container">
            <h1>Order Delivered!</h1>
            <p>Hello ${order.users.name},</p>
            <p>Your order #${order.order_number} has been delivered.</p>
            <p>We hope you love your purchase! Please consider leaving a review.</p>
            <a href="${orderUrl}">View Order & Leave Review</a>
        </div>
    </body>
    </html>
  `;
}

function generateDeliveredTextEmail(order: any, orderUrl: string): string {
  return `
Order Delivered!

Hello ${order.users.name},

Your order #${order.order_number} has been delivered.

We hope you love your purchase! Please consider leaving a review.

View order & leave review: ${orderUrl}
  `;
}

// Simulate email sending (replace with actual email service)
async function simulateEmailSending(emailLog: any): Promise<boolean> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Simulate 95% success rate
  return Math.random() > 0.05;
} 