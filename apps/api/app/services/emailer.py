"""Best-effort email sending for the contact form.

Sends via SMTP when SMTP_HOST/SMTP_USER/SMTP_PASS are configured (e.g. Gmail
app password). Without configuration it silently skips the send — the message
is still stored in the database and visible in the dashboard.
"""
import logging
import smtplib
from email.mime.text import MIMEText

from app.core.config import settings

log = logging.getLogger(__name__)


async def send_contact_email(name: str, topic: str, email: str, message: str) -> bool:
    if not (settings.smtp_host and settings.smtp_user and settings.smtp_pass):
        log.info("SMTP not configured — contact message stored only (to: %s)", settings.owner_email)
        return False
    if not settings.owner_email:
        return False
    subject = f"[PulseOps] Contact request: {topic or 'General'} from {name}"
    body = (
        f"New contact request from your dashboard:\n\n"
        f"Name: {name}\nEmail: {email}\nTopic: {topic or '—'}\n\n{message}"
    )
    try:
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = settings.smtp_from or settings.smtp_user
        msg["To"] = settings.owner_email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_pass)
            server.send_message(msg)
        return True
    except Exception:  # noqa: BLE001 - never break the request because email failed
        log.exception("Failed to send contact email")
        return False
