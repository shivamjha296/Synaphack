import sqlite3

conn = sqlite3.connect('hackathon_platform.db')
cursor = conn.cursor()

# Get table names
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()

print("Tables in database:")
for table in tables:
    print(f"- {table[0]}")
    
print("\n" + "="*50 + "\n")

# Check if teams table exists
if any('teams' in table[0] for table in tables):
    print("Teams table structure:")
    cursor.execute("PRAGMA table_info(teams)")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  {col[1]} ({col[2]})")
        
    print("\nTeams in database:")
    cursor.execute("SELECT * FROM teams")
    teams = cursor.fetchall()
    for team in teams:
        print(f"  {team}")
else:
    print("Teams table not found!")

if any('team_members' in table[0] for table in tables):
    print("\nTeam Members table structure:")
    cursor.execute("PRAGMA table_info(team_members)")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  {col[1]} ({col[2]})")
        
    print("\nTeam Members in database:")
    cursor.execute("SELECT * FROM team_members")
    members = cursor.fetchall()
    for member in members:
        print(f"  {member}")
else:
    print("Team Members table not found!")

conn.close()
