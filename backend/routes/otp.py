import datetime
import random
from flask import Blueprint, request, jsonify
from db import team_otps_col
from utils.mail import send_smtp_email

otp_bp = Blueprint('otp', __name__)

@otp_bp.route('/send-team-otp', methods=['POST'])
def send_team_otp():
    data = request.json or {}
    email = data.get('email')
    
    if not email:
        return jsonify({"error": "Missing required email parameter."}), 400
    
    email = email.lower().strip()
    
    # Generate 6-digit verification code
    otp = str(random.randint(100000, 999999))
    
    # TTL validation: valid for 5 minutes
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
    
    # Update or insert OTP record for this email
    team_otps_col.update_one(
        {"email": email},
        {"$set": {
            "otp": otp,
            "created_at": datetime.datetime.utcnow().isoformat(),
            "expires_at": expires_at.isoformat()
        }},
        upsert=True
    )
    
    # Prepare secure body
    subject = "ProtoSync Verification: Join Team Workspace"
    body = f"""Hello,

You have been invited to join a collaborative workspace on ProtoSync!

Your security verification OTP code is:
---------------------------------------------------
VERIFICATION OTP: {otp}
---------------------------------------------------

This OTP is code is valid for 5 minutes. Do not share this code.

Regards,
The ProtoSync Automation Engine
    """
    
    success, mail_msg = send_smtp_email(email, subject, body)
    
    return jsonify({
        "message": "OTP Sent Successfully",
        "email": email,
        "simulated": "SMTP" not in mail_msg,
        "otp_debug": otp # Included for easy demo to sir if SMTP not set up
    }), 200
