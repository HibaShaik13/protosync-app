import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_smtp_email(to_email, subject, body_text):
    """
    Sends an email using standard SMTP.
    Works either natively via smtplib using credentials from env.
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    sender_email = os.getenv("SMTP_FROM_EMAIL", smtp_user)

    if not smtp_user or not smtp_pass:
        print("[EMAIL SIMULATION] No credentials configured. Simulated email body:")
        print(body_text)
        return True, "Simulated dispatch success"

    msg = MIMEMultipart()
    msg['From'] = f"ProtoSync Team <{sender_email}>"
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body_text, 'plain'))

    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        return True, "Email sent successfully"
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send SMTP: {str(e)}")
        return False, str(e)
