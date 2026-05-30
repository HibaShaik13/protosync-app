import datetime
from flask import Blueprint, request, jsonify, g
from bson.objectid import ObjectId

from db import teams_col, workspaces_col, team_otps_col, users_col
from routes.auth import token_required

team_bp = Blueprint('team', __name__)

# Verification helper to dynamically check member roles before editing
def get_user_role_in_workspace(user_id, workspace_id):
    try:
        ws = workspaces_col.find_one({"_id": ObjectId(workspace_id)})
    except Exception:
        return None
    
    if not ws:
        return None
    
    for member in ws.get("members", []):
        if member.get("user_id") == user_id:
            return member.get("role")  # OWNER, EDITOR, VIEWER
            
    return None

@team_bp.route('/create-team', methods=['POST'])
@token_required
def create_team_workspace():
    """
    1. Create Team Workspace (equivalent to create team / create collaborative workspace)
    """
    data = request.json or {}
    team_name = data.get("team_name")
    description = data.get("description", "Collaborative Team Workspace")
    
    if not team_name:
        return jsonify({"error": "team_name parameter is required"}), 400
        
    new_team_ws = {
        "name": team_name,
        "description": description,
        "owner_id": g.user_id,
        "status": "active",  # active or inactive
        "members": [
            {
                "user_id": g.user_id,
                "name": g.user_name,
                "email": g.user_email,
                "role": "OWNER",
                "join_date": datetime.datetime.utcnow().isoformat()
            }
        ],
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    
    inserted_id = workspaces_col.insert_one(new_team_ws).inserted_id
    
    return jsonify({
        "message": "Collaborative Team Workspace created successfully",
        "workspace_id": str(inserted_id),
        "team_name": team_name
    }), 201

@team_bp.route('/verify-team-otp', methods=['POST'])
@token_required
def verify_team_otp_and_join():
    """
    Verifies Email OTP and adds caller to workspace members.
    """
    data = request.json or {}
    email = data.get("email")
    otp = data.get("otp")
    workspace_id = data.get("workspace_id")
    role = data.get("role", "EDITOR") # OWNER, EDITOR, VIEWER. Default to EDITOR
    
    if not email or not otp or not workspace_id:
        return jsonify({"error": "Missing email, otp, or workspace_id"}), 400
        
    email = email.lower().strip()
    
    # Verify OTP against DB
    record = team_otps_col.find_one({"email": email})
    if not record or record.get("otp") != otp:
        return jsonify({"error": "Invalid or expired OTP verification code"}), 400
        
    # Check expiry
    expires_at_str = record.get("expires_at")
    if expires_at_str:
        expires_at = datetime.datetime.fromisoformat(expires_at_str)
        if expires_at < datetime.datetime.utcnow():
            return jsonify({"error": "OTP has expired. Please request a new one."}), 400
            
    # Purge verified OTP
    team_otps_col.delete_one({"_id": record["_id"]})
    
    # Try loading the workspace
    try:
        workspace = workspaces_col.find_one({"_id": ObjectId(workspace_id)})
    except Exception:
        return jsonify({"error": "Invalid workspace database reference."}), 400
        
    if not workspace:
        return jsonify({"error": "Target collaborative workspace not found"}), 404
        
    # Prevent multi-joining
    for member in workspace.get("members", []):
        if member.get("email") == email:
            return jsonify({"message": "Joined Team Successfully", "already_member": True}), 200
            
    # Resolve joining human name from users collection
    user_record = users_col.find_one({"email": email})
    member_name = user_record.get("name", "New Teammate") if user_record else "New Teammate"
    member_user_id = str(user_record["_id"]) if user_record else ""
    
    # Append the member
    new_member = {
        "user_id": member_user_id,
        "name": member_name,
        "email": email,
        "role": role, # Default joining role
        "join_date": datetime.datetime.utcnow().isoformat()
    }
    
    workspaces_col.update_one(
        {"_id": ObjectId(workspace_id)},
        {"$push": {"members": new_member}}
    )
    
    return jsonify({
        "message": "Joined Team Successfully",
        "workspace_id": workspace_id,
        "role": role
    }), 200

@team_bp.route('/workspaces', methods=['GET'])
@token_required
def get_user_workspaces():
    """
    Get Workspaces list belonging/accessible to current user.
    Hides inactive workspaces from VIEWERS/EDITORS unless they are the OWNER!
    """
    all_ws = list(workspaces_col.find({}))
    accessible = []
    
    for ws in all_ws:
        role = None
        for member in ws.get("members", []):
            if member.get("user_id") == g.user_id or member.get("email") == g.user_email:
                role = member.get("role")
                break
                
        if role:
            # If workspace stopped/inactive and they are not owner, hide it entirely!
            if ws.get("status") == "inactive" and role != "OWNER":
                continue
            
            # Format bson
            ws["_id"] = str(ws["_id"])
            accessible.append(ws)
            
    return jsonify({
        "workspaces": accessible
    }), 200

@team_bp.route('/workspaces/<workspace_id>/members', methods=['PUT'])
@token_required
def change_member_role(workspace_id):
    """
    Only workspace OWNER can change visual roles!
    """
    caller_role = get_user_role_in_workspace(g.user_id, workspace_id)
    if caller_role != "OWNER":
        return jsonify({"error": "Forbidden: Only workspace owners can change member roles."}), 403
        
    data = request.json or {}
    member_email = data.get("email")
    new_role = data.get("role") # OWNER, EDITOR, VIEWER
    
    if not member_email or not new_role:
        return jsonify({"error": "Both email and role parameters are required"}), 400
        
    member_email = member_email.lower().strip()
    if new_role not in ["OWNER", "EDITOR", "VIEWER"]:
        return jsonify({"error": "Invalid role value."}), 400
        
    # Perform database updates
    workspaces_col.update_one(
        {"_id": ObjectId(workspace_id), "members.email": member_email},
        {"$set": {"members.$.role": new_role}}
    )
    
    return jsonify({"message": f"Successfully updated member {member_email} role to {new_role}"}), 200

@team_bp.route('/workspaces/<workspace_id>/members', methods=['DELETE'])
@token_required
def remove_member(workspace_id):
    """
    Only OWNER can remove members!
    """
    caller_role = get_user_role_in_workspace(g.user_id, workspace_id)
    if caller_role != "OWNER":
        return jsonify({"error": "Forbidden: Only workspace owners can remove team members."}), 403
        
    member_email = request.args.get("email")
    if not member_email:
        return jsonify({"error": "Missing email address filter"}), 400
        
    member_email = member_email.lower().strip()
    
    # Prevent self eviction from owner
    ws = workspaces_col.find_one({"_id": ObjectId(workspace_id)})
    if ws and ws.get("owner_id") == g.user_id:
        target_member = next((m for m in ws.get("members", []) if m.get("email") == member_email), None)
        if target_member and target_member.get("user_id") == g.user_id:
            return jsonify({"error": "Owner cannot evict themselves from workspace"}), 400
            
    workspaces_col.update_one(
        {"_id": ObjectId(workspace_id)},
        {"$pull": {"members": {"email": member_email}}}
    )
    
    return jsonify({"message": "Member removed from team workspace successfully"}), 200

@team_bp.route('/workspaces/<workspace_id>/stop', methods=['POST'])
@token_required
def stop_workspace(workspace_id):
    """
    Only OWNER can stop/deactivate a workspace!
    """
    caller_role = get_user_role_in_workspace(g.user_id, workspace_id)
    if caller_role != "OWNER":
        return jsonify({"error": "Forbidden: Only workspace owners can pause workloads."}), 403
        
    workspaces_col.update_one(
        {"_id": ObjectId(workspace_id)},
        {"$set": {"status": "inactive"}}
    )
    
    return jsonify({"message": "Workspace has been stopped. Non-owners will lose access."}), 200

@team_bp.route('/workspaces/<workspace_id>/restore', methods=['POST'])
@token_required
def restore_workspace(workspace_id):
    """
    Only OWNER can restore/reactivate a workspace!
    """
    caller_role = get_user_role_in_workspace(g.user_id, workspace_id)
    if caller_role != "OWNER":
        return jsonify({"error": "Forbidden: Only workspace owners can activate workloads."}), 403
        
    workspaces_col.update_one(
        {"_id": ObjectId(workspace_id)},
        {"$set": {"status": "active"}}
    )
    
    return jsonify({"message": "Workspace re-activated successfully."}), 200

@team_bp.route('/workspaces/<workspace_id>', methods=['DELETE'])
@token_required
def delete_workspace(workspace_id):
    """
    Only OWNER can completely delete a workspace!
    """
    caller_role = get_user_role_in_workspace(g.user_id, workspace_id)
    if caller_role != "OWNER":
        return jsonify({"error": "Forbidden: Only workspace owners can destroy database schemas."}), 403
        
    workspaces_col.delete_one({"_id": ObjectId(workspace_id)})
    
    return jsonify({"message": f"Successfully deleted workspace {workspace_id} permanently."}), 200
