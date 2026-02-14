"""
Email Service for DRIEDIT
Handles transactional emails: order confirmations, shipping updates, return notifications
"""
import os
import asyncio
import logging
import resend
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
BRAND_NAME = "DRIEDIT"
BRAND_COLOR = "#E10600"

def is_email_configured() -> bool:
    """Check if email service is properly configured."""
    return bool(os.environ.get('RESEND_API_KEY'))

async def send_email(to: str, subject: str, html_content: str) -> Optional[str]:
    """
    Send email using Resend API (non-blocking).
    Returns email_id on success, None on failure.
    Never raises exceptions - fails silently to not block main flow.
    """
    if not is_email_configured():
        logger.warning("Email service not configured - skipping email send")
        return None
    
    try:
        params = {
            "from": f"{BRAND_NAME} <{SENDER_EMAIL}>",
            "to": [to],
            "subject": subject,
            "html": html_content
        }
        
        # Run sync SDK in thread to keep FastAPI non-blocking
        result = await asyncio.to_thread(resend.Emails.send, params)
        email_id = result.get("id") if isinstance(result, dict) else getattr(result, 'id', None)
        logger.info(f"Email sent successfully to {to}: {email_id}")
        return email_id
        
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {str(e)}")
        return None

# ============================================
# EMAIL TEMPLATES
# ============================================

def get_base_template(content: str) -> str:
    """Wrap content in base email template with DRIEDIT branding."""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111111; border: 1px solid #333333;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px; border-bottom: 2px solid {BRAND_COLOR};">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 900; letter-spacing: 2px;">
                                <span style="color: {BRAND_COLOR};">D</span>RIEDIT
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px; color: #ffffff;">
                            {content}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; background-color: #0a0a0a; border-top: 1px solid #333333;">
                            <p style="margin: 0; color: #666666; font-size: 12px; text-align: center;">
                                © 2026 DRIEDIT. All rights reserved.<br>
                                <span style="color: #888888;">Streetwear for the bold.</span>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

def format_price(price: float) -> str:
    """Format price in INR."""
    return f"₹{price:,.2f}"

def format_date(date_str: str) -> str:
    """Format date string to readable format."""
    try:
        if isinstance(date_str, datetime):
            return date_str.strftime("%d %b %Y, %I:%M %p")
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return dt.strftime("%d %b %Y, %I:%M %p")
    except Exception:
        return str(date_str)

# ============================================
# ORDER CONFIRMATION EMAIL
# ============================================

async def send_order_confirmation(order: Dict[str, Any], user_email: str) -> Optional[str]:
    """Send order confirmation email after successful payment."""
    
    # Build items table
    items_html = ""
    for item in order.get("items", []):
        items_html += f"""
        <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #333333;">
                <table cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="width: 60px;">
                            <img src="{item.get('product_image', '')}" alt="{item.get('product_title', '')}" 
                                 style="width: 50px; height: 60px; object-fit: cover; border: 1px solid #333333;">
                        </td>
                        <td style="padding-left: 15px; color: #ffffff;">
                            <strong style="font-size: 14px;">{item.get('product_title', 'Product')}</strong><br>
                            <span style="color: #888888; font-size: 12px;">Size: {item.get('size', '-')} | Qty: {item.get('quantity', 1)}</span>
                        </td>
                        <td style="text-align: right; color: #ffffff; font-weight: bold;">
                            {format_price(item.get('subtotal', 0))}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        """
    
    # Shipping address
    address = order.get("delivery_address", {})
    address_html = f"""
        {address.get('name', '')}<br>
        {address.get('addressLine1', '')}<br>
        {address.get('addressLine2', '') + '<br>' if address.get('addressLine2') else ''}
        {address.get('city', '')}, {address.get('state', '')} - {order.get('pincode', '')}<br>
        Phone: {address.get('phone', '')}
    """
    
    content = f"""
    <h2 style="margin: 0 0 20px 0; color: {BRAND_COLOR}; font-size: 24px; font-weight: 900;">
        ORDER CONFIRMED 🔥
    </h2>
    
    <p style="color: #cccccc; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
        Thanks for shopping with us! Your order has been confirmed and will be shipped soon.
    </p>
    
    <table width="100%" style="background-color: #1a1a1a; padding: 15px; margin-bottom: 25px;">
        <tr>
            <td style="color: #888888; font-size: 12px;">ORDER ID</td>
            <td style="color: #ffffff; font-weight: bold; text-align: right;">{order.get('order_id', '')}</td>
        </tr>
        <tr>
            <td style="color: #888888; font-size: 12px;">DATE</td>
            <td style="color: #ffffff; text-align: right;">{format_date(order.get('created_at', ''))}</td>
        </tr>
        <tr>
            <td style="color: #888888; font-size: 12px;">PAYMENT</td>
            <td style="color: #00cc66; font-weight: bold; text-align: right;">{order.get('payment_method', 'PAID').upper()}</td>
        </tr>
    </table>
    
    <h3 style="color: #ffffff; font-size: 14px; margin-bottom: 15px; border-bottom: 1px solid #333333; padding-bottom: 10px;">
        ORDER ITEMS
    </h3>
    
    <table width="100%" cellpadding="0" cellspacing="0">
        {items_html}
    </table>
    
    <table width="100%" style="margin-top: 20px; background-color: #1a1a1a; padding: 15px;">
        <tr>
            <td style="color: #888888;">Subtotal</td>
            <td style="color: #ffffff; text-align: right;">{format_price(order.get('subtotal', 0))}</td>
        </tr>
        <tr>
            <td style="color: #888888;">GST ({order.get('gst_percentage', 18)}%)</td>
            <td style="color: #ffffff; text-align: right;">{format_price(order.get('gst_amount', 0))}</td>
        </tr>
        <tr>
            <td style="color: #888888;">Shipping</td>
            <td style="color: #ffffff; text-align: right;">{format_price(order.get('shipping_charge', 0)) if order.get('shipping_charge', 0) > 0 else 'FREE'}</td>
        </tr>
        <tr>
            <td style="color: #ffffff; font-weight: bold; font-size: 16px; padding-top: 10px; border-top: 1px solid #333333;">TOTAL</td>
            <td style="color: {BRAND_COLOR}; font-weight: bold; font-size: 18px; text-align: right; padding-top: 10px; border-top: 1px solid #333333;">
                {format_price(order.get('total', 0))}
            </td>
        </tr>
    </table>
    
    <h3 style="color: #ffffff; font-size: 14px; margin: 25px 0 15px 0; border-bottom: 1px solid #333333; padding-bottom: 10px;">
        SHIPPING ADDRESS
    </h3>
    
    <p style="color: #cccccc; font-size: 14px; line-height: 1.8; margin: 0;">
        {address_html}
    </p>
    
    <p style="color: #888888; font-size: 12px; margin-top: 30px; text-align: center;">
        Questions? Reply to this email or contact us at support@driedit.in
    </p>
    """
    
    html = get_base_template(content)
    subject = f"Order Confirmed – {order.get('order_id', '')} | DRIEDIT"
    
    return await send_email(user_email, subject, html)

# ============================================
# ORDER SHIPPED EMAIL
# ============================================

async def send_order_shipped(order: Dict[str, Any], user_email: str) -> Optional[str]:
    """Send email when order is shipped with tracking details."""
    
    tracking_id = order.get('tracking_id', '')
    courier = order.get('courier', 'Our courier partner')
    
    content = f"""
    <h2 style="margin: 0 0 20px 0; color: {BRAND_COLOR}; font-size: 24px; font-weight: 900;">
        YOUR ORDER IS ON THE WAY! 🚚
    </h2>
    
    <p style="color: #cccccc; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
        Great news! Your order has been shipped and is on its way to you.
    </p>
    
    <table width="100%" style="background-color: #1a1a1a; padding: 20px; margin-bottom: 25px;">
        <tr>
            <td style="color: #888888; font-size: 12px; padding-bottom: 10px;">ORDER ID</td>
            <td style="color: #ffffff; font-weight: bold; text-align: right; padding-bottom: 10px;">{order.get('order_id', '')}</td>
        </tr>
        <tr>
            <td style="color: #888888; font-size: 12px; padding-bottom: 10px;">COURIER</td>
            <td style="color: #ffffff; text-align: right; padding-bottom: 10px;">{courier}</td>
        </tr>
        <tr>
            <td style="color: #888888; font-size: 12px;">TRACKING ID</td>
            <td style="color: {BRAND_COLOR}; font-weight: bold; text-align: right; font-size: 16px;">{tracking_id if tracking_id else 'Will be updated soon'}</td>
        </tr>
    </table>
    
    <p style="color: #888888; font-size: 13px; text-align: center; margin-top: 30px;">
        Estimated delivery: 3-5 business days<br>
        <span style="color: #666666;">Delivery times may vary based on your location</span>
    </p>
    """
    
    html = get_base_template(content)
    subject = f"Your Order is Shipped! – {order.get('order_id', '')} | DRIEDIT"
    
    return await send_email(user_email, subject, html)

# ============================================
# ORDER DELIVERED EMAIL
# ============================================

async def send_order_delivered(order: Dict[str, Any], user_email: str) -> Optional[str]:
    """Send email when order is delivered."""
    
    content = f"""
    <h2 style="margin: 0 0 20px 0; color: #00cc66; font-size: 24px; font-weight: 900;">
        ORDER DELIVERED ✅
    </h2>
    
    <p style="color: #cccccc; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
        Your order <strong style="color: #ffffff;">{order.get('order_id', '')}</strong> has been delivered!<br>
        We hope you love your new gear.
    </p>
    
    <table width="100%" style="background-color: #1a1a1a; padding: 20px; margin-bottom: 25px; text-align: center;">
        <tr>
            <td>
                <p style="color: #888888; font-size: 13px; margin: 0 0 10px 0;">
                    Not satisfied? You have <strong style="color: #ffffff;">7 days</strong> to request a return.
                </p>
                <p style="color: #666666; font-size: 12px; margin: 0;">
                    Visit your orders page to initiate a return request.
                </p>
            </td>
        </tr>
    </table>
    
    <p style="color: #ffffff; font-size: 14px; text-align: center; margin-top: 30px;">
        Thank you for shopping with DRIEDIT! 🔥
    </p>
    """
    
    html = get_base_template(content)
    subject = f"Order Delivered! – {order.get('order_id', '')} | DRIEDIT"
    
    return await send_email(user_email, subject, html)

# ============================================
# RETURN STATUS EMAILS
# ============================================

async def send_return_approved(order_id: str, user_email: str, admin_notes: str = "") -> Optional[str]:
    """Send email when return request is approved."""
    
    notes_html = f"""
    <table width="100%" style="background-color: #1a3320; padding: 15px; margin: 20px 0;">
        <tr>
            <td style="color: #88cc88;">
                <strong>Admin Note:</strong> {admin_notes}
            </td>
        </tr>
    </table>
    """ if admin_notes else ""
    
    content = f"""
    <h2 style="margin: 0 0 20px 0; color: #00cc66; font-size: 24px; font-weight: 900;">
        RETURN APPROVED ✅
    </h2>
    
    <p style="color: #cccccc; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
        Your return request for order <strong style="color: #ffffff;">{order_id}</strong> has been approved.
    </p>
    
    {notes_html}
    
    <table width="100%" style="background-color: #1a1a1a; padding: 20px; margin-bottom: 25px;">
        <tr>
            <td style="color: #cccccc; font-size: 13px;">
                <strong style="color: #ffffff;">Next Steps:</strong><br><br>
                1. Pack the item(s) in original packaging<br>
                2. Our courier will pick up within 2-3 business days<br>
                3. Refund will be processed within 5-7 days after pickup
            </td>
        </tr>
    </table>
    """
    
    html = get_base_template(content)
    subject = f"Return Approved – {order_id} | DRIEDIT"
    
    return await send_email(user_email, subject, html)

async def send_return_rejected(order_id: str, user_email: str, reason: str = "") -> Optional[str]:
    """Send email when return request is rejected."""
    
    reason_html = f"""
    <table width="100%" style="background-color: #331a1a; padding: 15px; margin: 20px 0;">
        <tr>
            <td style="color: #cc8888;">
                <strong>Reason:</strong> {reason if reason else 'Item does not meet return policy requirements.'}
            </td>
        </tr>
    </table>
    """
    
    content = f"""
    <h2 style="margin: 0 0 20px 0; color: {BRAND_COLOR}; font-size: 24px; font-weight: 900;">
        RETURN REQUEST UPDATE
    </h2>
    
    <p style="color: #cccccc; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
        We've reviewed your return request for order <strong style="color: #ffffff;">{order_id}</strong>.
        Unfortunately, we're unable to process this return.
    </p>
    
    {reason_html}
    
    <p style="color: #888888; font-size: 13px; margin-top: 25px;">
        If you believe this is an error, please reply to this email with additional details.
    </p>
    """
    
    html = get_base_template(content)
    subject = f"Return Request Update – {order_id} | DRIEDIT"
    
    return await send_email(user_email, subject, html)
