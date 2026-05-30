import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load directory environment configurations
load_dotenv()

mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/protosync")
client = MongoClient(mongo_uri)

# Retrieve MongoDB database instance
db = client.get_database("protosync")

# Collections
users_col = db["users"]
teams_col = db["teams"]
team_otps_col = db["team_otps"]
workspaces_col = db["workspaces"]
collections_col = db["collections"]
requests_col = db["requests"]
history_col = db["history"]
env_vars_col = db["env_vars"]
mock_apis_col = db["mock_apis"]
analytics_col = db["analytics"]
