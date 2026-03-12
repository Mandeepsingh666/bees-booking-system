import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Optional
from app.config import settings


def send_email(to: str, subject: str, body: str, attachment_path: Optional[str] = None) -> bool:
    """Send an email via Gmail SMTP. Returns True on success, False on failure."""
    if not settings.GMAIL_USER or not settings.GMAIL_APP_PASSWORD:
        print(f"[EMAIL SKIPPED] No Gmail credentials. To: {to} | Subject: {subject}")
        return False

    try:
        msg = MIMEMultipart()
        msg["From"] = f"Shelbee's Suites <{settings.GMAIL_USER}>"
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))

        if attachment_path and os.path.exists(attachment_path):
            with open(attachment_path, "rb") as f:
                part = MIMEApplication(f.read(), Name=os.path.basename(attachment_path))
                part["Content-Disposition"] = f'attachment; filename="{os.path.basename(attachment_path)}"'
                msg.attach(part)

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.GMAIL_USER, settings.GMAIL_APP_PASSWORD)
            server.sendmail(settings.GMAIL_USER, to, msg.as_string())

        print(f"[EMAIL SENT] To: {to} | Subject: {subject}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


def booking_confirmation_guest(guest_name: str, booking_id: int, room_name: str,
                                check_in: str, check_out: str, total: str,
                                payment_method: str) -> str:
    return f"""
    <html><body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width:600px; margin:0 auto; border:1px solid #ddd; border-radius:8px; overflow:hidden;">
      <div style="background:#0a0a0a; padding:24px; text-align:center;">
        <h1 style="color:#c9a84c; margin:0;">Shelbee's Suites</h1>
        <p style="color:#94a3b8; margin:4px 0 0;">Booking Confirmation</p>
      </div>
      <div style="padding:24px;">
        <p>Dear <strong>{guest_name}</strong>,</p>
        <p>Your booking has been confirmed. Here are your details:</p>
        <table style="width:100%; border-collapse:collapse; margin:16px 0;">
          <tr style="border-bottom:1px solid #eee;"><td style="padding:8px; color:#666;">Booking ID</td><td style="padding:8px;"><strong>#{booking_id}</strong></td></tr>
          <tr style="border-bottom:1px solid #eee;"><td style="padding:8px; color:#666;">Room</td><td style="padding:8px;">{room_name}</td></tr>
          <tr style="border-bottom:1px solid #eee;"><td style="padding:8px; color:#666;">Check-In</td><td style="padding:8px;">{check_in}</td></tr>
          <tr style="border-bottom:1px solid #eee;"><td style="padding:8px; color:#666;">Check-Out</td><td style="padding:8px;">{check_out}</td></tr>
          <tr style="border-bottom:1px solid #eee;"><td style="padding:8px; color:#666;">Total</td><td style="padding:8px;"><strong>GYD ${total}</strong></td></tr>
          <tr><td style="padding:8px; color:#666;">Payment</td><td style="padding:8px;">{payment_method.title()}</td></tr>
        </table>
        <p>Your invoice is attached to this email. We look forward to welcoming you!</p>
        <p style="color:#666; font-size:14px;">Shelbee's Suites &mdash; Where Luxury Meets Comfort</p>
      </div>
    </div>
    </body></html>
    """


def booking_alert_owner(guest_name: str, booking_id: int, room_name: str,
                          check_in: str, check_out: str, total: str,
                          employee_name: str) -> str:
    return f"""
    <html><body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width:600px; margin:0 auto;">
      <div style="background:#0a0a0a; padding:24px;"><h1 style="color:#c9a84c; margin:0;">New Booking Alert</h1></div>
      <div style="padding:24px;">
        <p>A new booking has been created by <strong>{employee_name}</strong>.</p>
        <ul>
          <li>Booking #: <strong>{booking_id}</strong></li>
          <li>Guest: <strong>{guest_name}</strong></li>
          <li>Room: {room_name}</li>
          <li>Check-In: {check_in} &rarr; Check-Out: {check_out}</li>
          <li>Total: <strong>GYD ${total}</strong></li>
        </ul>
      </div>
    </div>
    </body></html>
    """


def cancellation_guest(guest_name: str, booking_id: int, room_name: str,
                        check_in: str, reason: str) -> str:
    return f"""
    <html><body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width:600px; margin:0 auto; border:1px solid #ddd; border-radius:8px; overflow:hidden;">
      <div style="background:#0a0a0a; padding:24px; text-align:center;">
        <h1 style="color:#c9a84c; margin:0;">Shelbee's Suites</h1>
        <p style="color:#94a3b8; margin:4px 0 0;">Booking Cancellation</p>
      </div>
      <div style="padding:24px;">
        <p>Dear <strong>{guest_name}</strong>,</p>
        <p>Your booking has been <strong style="color:#dc2626;">cancelled</strong>.</p>
        <ul>
          <li>Booking #: {booking_id}</li>
          <li>Room: {room_name}</li>
          <li>Check-In: {check_in}</li>
          <li>Reason: {reason}</li>
        </ul>
        <p>If you have questions, please contact us directly.</p>
      </div>
    </div>
    </body></html>
    """


def cancellation_alert_owner(guest_name: str, booking_id: int, room_name: str,
                               check_in: str, reason: str, employee_name: str) -> str:
    return f"""
    <html><body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width:600px; margin:0 auto;">
      <div style="background:#0a0a0a; padding:24px;"><h1 style="color:#c9a84c; margin:0;">Cancellation Alert</h1></div>
      <div style="padding:24px;">
        <p>Booking #{booking_id} for <strong>{guest_name}</strong> has been cancelled by <strong>{employee_name}</strong>.</p>
        <ul>
          <li>Room: {room_name}</li>
          <li>Check-In: {check_in}</li>
          <li>Reason: {reason}</li>
        </ul>
      </div>
    </div>
    </body></html>
    """


def maintenance_alert_owner(location: str, description: str, priority: str,
                              reporter_name: str, issue_id: int) -> str:
    return f"""
    <html><body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width:600px; margin:0 auto;">
      <div style="background:#0a0a0a; padding:24px;"><h1 style="color:#c9a84c; margin:0;">Urgent Maintenance Issue</h1></div>
      <div style="padding:24px;">
        <p>A new <strong style="color:#dc2626;">URGENT</strong> maintenance issue has been reported.</p>
        <ul>
          <li>Issue #: {issue_id}</li>
          <li>Location: {location}</li>
          <li>Priority: {priority.upper()}</li>
          <li>Reported by: {reporter_name}</li>
          <li>Description: {description}</li>
        </ul>
      </div>
    </div>
    </body></html>
    """
