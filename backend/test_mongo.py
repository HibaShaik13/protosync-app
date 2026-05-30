# test_mongo.py

from pymongo import MongoClient

uri = "mongodb+srv://admin:ProtoSync123@cluster0.ccvaits.mongodb.net/?appName=Cluster0"

client = MongoClient(uri)

try:
    client.admin.command("ping")
    print("MongoDB Connected Successfully")
except Exception as e:
    print(e)