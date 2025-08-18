import sqlite3

conn = sqlite3.connect('hackathon_platform.db')
cursor = conn.cursor()

print("Users in database:")
cursor.execute("SELECT id, email, full_name FROM users")
users = cursor.fetchall()
for user in users:
    print(f"- {user[0]} - {user[1]} - {user[2]}")

print("\n" + "="*50 + "\n")

print("Team registration for event 86e9acb3-e309-4329-8915-dcd0a6930079:")
cursor.execute("""
    SELECT u.email, u.full_name, t.name, tm.role
    FROM users u
    JOIN team_members tm ON u.id = tm.user_id  
    JOIN teams t ON tm.team_id = t.id
    WHERE t.event_id = '86e9acb3-e309-4329-8915-dcd0a6930079'
""")
registered_users = cursor.fetchall()

if registered_users:
    for reg_user in registered_users:
        print(f"- {reg_user[0]} ({reg_user[1]}) - Team: {reg_user[2]} - Role: {reg_user[3]}")
else:
    print("No users registered for this event")

conn.close()
