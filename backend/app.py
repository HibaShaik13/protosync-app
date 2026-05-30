import os
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from dotenv import load_dotenv
from bson.objectid import ObjectId

# Load local environment configurations
load_dotenv()

from db import collections_col, requests_col, history_col, workspaces_col
from routes.auth import auth_bp, token_required
from routes.otp import otp_bp
from routes.team import team_bp, get_user_role_in_workspace

app = Flask(__name__)

# Permissive CORS headers permitting local React and Postman-driven handshakes
CORS(app, resources={r"/*": {"origins": "*"}})

# Register Blueprint modules
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(otp_bp, url_prefix='/api/team')
app.register_blueprint(team_bp, url_prefix='/api/team')

# HEALTH CHECK ENDPOINT
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "engine": "ProtoSync Flask-MongoDB Core Engine",
        "timestamp": "2026-05-30"
    }), 200

# ----------------- DATA ISOLATION CRUD ENDPOINTS -----------------
# Every CRUD API verifies JWT token, parses user_id, and restricts access to and ownership of records.

def check_modify_permissions(user_id, workspace_id):
    """
    Check if user has Editor or Owner role to add/edit/delete within a workspace.
    """
    role = get_user_role_in_workspace(user_id, workspace_id)
    if role in ["OWNER", "EDITOR"]:
        return True
    return False

# 1. GET WORKSPACE RESOURCES (COLLECTIONS & REQUESTS)
@app.route('/api/collections', methods=['GET'])
@token_required
def get_collections():
    """
    Fetch only collections belonging to current user OR shared in a collaborative workspace they have access to.
    """
    workspace_id = request.args.get("workspace_id")
    
    if not workspace_id:
        # Default fallback to user's personal private collections where they are the owner
        cursor = collections_col.find({"user_id": g.user_id})
        collections = list(cursor)
    else:
        # Collaborative workspace flow
        role = get_user_role_in_workspace(g.user_id, workspace_id)
        if not role:
            return jsonify({"error": "Forbidden: You are not a member of this workspace"}), 403
            
        # Get collections associated with this workspace
        cursor = collections_col.find({"workspace_id": workspace_id})
        collections = list(cursor)
        
    for doc in collections:
        doc["_id"] = str(doc["_id"])
        
    return jsonify({"collections": collections}), 200

# 2. CREATE COLLECTION
@app.route('/api/collections', methods=['POST'])
@token_required
def create_collection():
    data = request.json or {}
    name = data.get("name", "New Collection")
    workspace_id = data.get("workspace_id") # optional, default to private personal workspace
    
    if workspace_id:
        if not check_modify_permissions(g.user_id, workspace_id):
            return jsonify({"error": "Forbidden: Viewers cannot create collections or add APIs"}), 403
            
    new_col = {
        "name": name,
        "user_id": g.user_id, # Ownership link
        "workspace_id": workspace_id,
        "requests": [],
        "created_at": "2026-05-30"
    }
    
    inserted_id = collections_col.insert_one(new_col).inserted_id
    new_col["_id"] = str(inserted_id)
    
    return jsonify({
        "success": True,
        "message": "Collection created successfully",
        "collection": new_col
    }), 201

# 3. DELETE COLLECTION
@app.route('/api/collections/<col_id>', methods=['DELETE'])
@token_required
def delete_collection(col_id):
    try:
        col = collections_col.find_one({"_id": ObjectId(col_id)})
    except Exception:
        return jsonify({"error": "Invalid collection database key"}), 400
        
    if not col:
        return jsonify({"error": "Collection not found"}), 404
        
    # Ownership or workspace editor validation check
    workspace_id = col.get("workspace_id")
    if workspace_id:
        if not check_modify_permissions(g.user_id, workspace_id):
            return jsonify({"error": "Forbidden: You do not have permissions to modify this workspace."}), 403
    else:
        if col.get("user_id") != g.user_id:
            return jsonify({"error": "Forbidden: You do not own this collection"}), 403
            
    collections_col.delete_one({"_id": ObjectId(col_id)})
    return jsonify({"success": True, "message": "Collection deleted successfully"}), 200

# 4. FETCH HISTORY LEDGER (USER ISOLATED)
@app.route('/api/history', methods=['GET'])
@token_required
def get_history_ledger():
    """
    Returns only requests history executed by the current logged-in user.
    """
    cursor = history_col.find({"user_id": g.user_id}).sort("timestamp", -1)
    history_items = list(cursor)
    
    for item in history_items:
        item["_id"] = str(item["_id"])
        
    return jsonify({"history": history_items}), 200

# 5. LOG TRANSACTION IN HISTORY
@app.route('/api/history', methods=['POST'])
@token_required
def log_history():
    data = request.json or {}
    endpoint = data.get("endpoint")
    method = data.get("method", "GET")
    status = data.get("status")
    latency = data.get("latency", 0)
    
    if not endpoint:
        return jsonify({"error": "endpoint is required"}), 400
        
    new_history = {
        "user_id": g.user_id, # Ownership isolated keyword mapping
        "endpoint": endpoint,
        "method": method,
        "status": status,
        "latency": latency,
        "timestamp": "2026-05-30"
    }
    
    inserted_id = history_col.insert_one(new_history).inserted_id
    new_history["_id"] = str(inserted_id)
    
    return jsonify({"success": True, "history_item": new_history}), 201

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
