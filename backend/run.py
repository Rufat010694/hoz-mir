import os
import subprocess
import sys
import uvicorn

# Run migrations
result = subprocess.run(["alembic", "upgrade", "head"])
if result.returncode != 0:
    sys.exit(result.returncode)

# Start server
port = int(os.environ.get("PORT", 8000))
uvicorn.run("app.main:app", host="0.0.0.0", port=port)
