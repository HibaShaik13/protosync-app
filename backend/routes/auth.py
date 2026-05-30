import jwt
import datetime
import bcrypt
from flask import Blueprint, request, jsonify, g
from functools import wraps
from bson.objectid import ObjectId
import os

from db import users_col, workspaces_col

auth_bp = Blueprint('auth', __name__)

JWT_SECRET = os.getenv("JWT_SECRET", "protosync_jwt_super_secret_998273")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({"error": "Token is missing!"}), 401
        
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            current_user = users_col.find_one({"_id": ObjectId(data["user_id"])})
            if not current_user:
                return jsonify({"error": "User session not found"}), 401
            
            # Put currently logged-in user context in g global context
            g.user_id = str(current_user["_id"])
            g.user_email = current_user["email"]
            g.user_name = current_user.get("name", "User")
        except Exception as e:
            return jsonify({"error": "Token is invalid or expired!", "details": str(e)}), 401
        
        return f(*args, **kwargs)
    return decorated

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json or {}
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400
    
    email = email.lower().strip()
    
    # Check if user already exists
    if users_col.find_one({"email": email}):
        return jsonify({"error": "User with this email already exists"}), 409
    
    # Securely hash password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create user record
    new_user = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    
    user_id = users_col.insert_one(new_user).inserted_id
    
    # Automatically create a default personal workspace for them
    default_workspace = {
        "name": "My Workspace",
        "description": "Default personal workspace",
        "owner_id": str(user_id),
        "status": "active",
        "members": [
            {
                "user_id": str(user_id),
                "name": name,
                "email": email,
                "role": "OWNER",
                "join_date": datetime.datetime.utcnow().isoformat()
            }
        ],
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    workspaces_col.insert_one(default_workspace)
    
    return jsonify({
        "message": "User registered successfully", 
        "user_id": str(user_id)
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    
    email = email.lower().strip()
    user = users_col.find_one({"email": email})
    
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({"error": "Invalid email or password"}), 401
    
    # Generate JWT containing user_id and email
    token = jwt.encode({
        "user_id": str(user["_id"]),
        "email": user["email"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, JWT_SECRET, algorithm="HS256")
    
    return jsonify({
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"]
        },
        "message": "Logged in successfully"
    }), 200
