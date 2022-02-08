import uvicorn
import threading
from controllers import app, get_ip


if __name__ == "__main__":
    uvicorn.run(app, host=get_ip(), port=8000)
