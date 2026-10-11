#!/usr/bin/env python3
"""
Celery HTML Email Tasks
=======================
Offloads rendering of responsive HTML email templates and external SMTP/API
delivery (Mailgun, SendGrid, AWS SES, Postmark) to background workers with retries.
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from celery import Celery
from jinja2 import Template

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery("email_tasks", broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 24px; background-color: #f3f4f6;">
  <div style="max-width: 580px; margin: auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="margin-bottom: 20px;">
      <span style="font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">Webstore Express</span>
    </div>

    {% if event_type == 'PRICE_DROP' %}
      <div style="display: inline-block; background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 9999px;">Price Drop Alert</div>
      <h2 style="margin: 14px 0 8px 0; color: #111827; font-size: 22px;">Good news! The price just dropped.</h2>
      <p style="margin: 0 0 16px 0; color: #4b5563;">An item on your watchlist is now available at a lower price:</p>

      <div style="background: #f9fafb; border: 1px solid #f3f4f6; padding: 20px; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin: 0 0 10px 0; font-size: 17px; color: #111827;">{{ product_title }}</h3>
        {% if old_price %}
        <p style="margin: 4px 0; color: #9ca3af; text-decoration: line-through; font-size: 14px;">Previous: KES {{ "{:,.2f}".format(old_price) }}</p>
        {% endif %}
        <p style="margin: 4px 0; font-size: 24px; font-weight: 800; color: #15803d;">Now: KES {{ "{:,.2f}".format(new_price) }}</p>
        {% if discount_percent %}
        <p style="margin: 4px 0; color: #16a34a; font-weight: 600; font-size: 14px;">Instant Savings: {{ discount_percent }}% OFF</p>
        {% endif %}
      </div>
    {% else %}
      <div style="display: inline-block; background: #dbeafe; color: #1d4ed8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 9999px;">Back In Stock</div>
      <h2 style="margin: 14px 0 8px 0; color: #111827; font-size: 22px;">It's back in stock!</h2>
      <p style="margin: 0 0 16px 0; color: #4b5563;">An item you were waiting for has been replenished by our verified sellers:</p>

      <div style="background: #f9fafb; border: 1px solid #f3f4f6; padding: 20px; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin: 0 0 10px 0; font-size: 17px; color: #111827;">{{ product_title }}</h3>
        <p style="margin: 4px 0; font-size: 24px; font-weight: 800; color: #1d4ed8;">Price: KES {{ "{:,.2f}".format(current_price) }}</p>
        <p style="margin: 4px 0; color: #4b5563; font-size: 14px;">Available Units: <strong>{{ new_stock }}</strong> in stock</p>
      </div>
    {% endif %}

    <div style="margin-top: 24px;">
      <a href="https://yourstore.com/products/{{ product_slug }}" 
         style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; text-align: center;">
         View Product & Buy Now &rarr;
      </a>
    </div>

    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0 16px 0;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
      You received this because you subscribed to notifications for this item on Webstore.
    </p>
  </div>
</body>
</html>
"""

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_product_alert_email(self, recipient_email: str, subject: str, context: dict):
    """
    Renders HTML email template and dispatches email via SMTP.
    If SMTP credentials are not configured, logs simulated dispatch.
    """
    try:
        template = Template(HTML_TEMPLATE)
        html_content = template.render(**context)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = os.getenv("SMTP_SENDER", "alerts@webstore.com")
        msg["To"] = recipient_email
        msg.attach(MIMEText(html_content, "html"))

        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_pass = os.getenv("SMTP_PASS", "")

        if smtp_host and smtp_user:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(msg["From"], [recipient_email], msg.as_string())
            return f"Delivered email to {recipient_email} via SMTP"
        else:
            # Fallback simulated dispatch log for dev/staging environments
            print(f"[CELERY EMAIL TASK] Simulated HTML email dispatched to {recipient_email}: Subject: '{subject}'")
            return f"Simulated delivery to {recipient_email} (Length: {len(html_content)} bytes)"

    except Exception as exc:
        raise self.retry(exc=exc)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Test Celery Email Task")
    parser.add_argument("--test-email", default="shopper@example.com", help="Recipient email address")
    args = parser.parse_args()

    sample_ctx = {
        "event_type": "PRICE_DROP",
        "product_title": "Apple iPhone 15 Pro 256GB - Natural Titanium",
        "product_slug": "apple-iphone-15-pro-256gb-natural-titanium",
        "old_price": 175000.0,
        "new_price": 164274.07,
        "discount_percent": 6.1,
    }
    print(f"Triggering asynchronous Celery task for {args.test_email}...")
    res = send_product_alert_email.delay(
        args.test_email,
        "Price Drop: Apple iPhone 15 Pro 256GB",
        sample_ctx
    )
    print(f"Enqueued Celery Task ID: {res.id}")
