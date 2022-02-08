import socket
import asyncio

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request
from starlette.websockets import WebSocket, WebSocketDisconnect
from starlette.templating import Jinja2Templates

from blokus.blokus import Blokus
from blokus.players import WebSocketPlayer, AIPlayer, TestPlayer

app = FastAPI()

templates = Jinja2Templates(directory="templates")
jinja_env = templates.env

app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)

que = list()


async def add_to_que(sock):
    que.append(sock)
    if len(que) >= 2:
        p1 = que[0]
        p2 = que[1]
        que.remove(p1)
        que.remove(p2)
        await start_game([p1, p2])


async def start_game(socks):
    sock1 = socks[0]
    sock2 = socks[1]
    sock1_cnn_status = await connection_succeeded(sock1)
    sock2_cnn_status = await connection_succeeded(sock2)
    if sock1_cnn_status and sock2_cnn_status:
        await start_game_helper(sock1, sock2)
    elif sock1_cnn_status:
        await send_connection_disconnected_message(sock1)
    elif sock2_cnn_status:
        await send_connection_disconnected_message(sock2)
    sock1.finish = True
    sock2.finish = True


async def start_game_helper(sock1, sock2):
    try:
        player1 = WebSocketPlayer(0, sock1)
        player2 = WebSocketPlayer(1, sock2)
        blokus = Blokus([player1, player2])
        await blokus.start()
    except:
        sock1_cnn_status = await connection_succeeded(sock1)
        sock2_cnn_status = await connection_succeeded(sock2)
        if sock1_cnn_status:
            await send_connection_disconnected_message(sock1)
            await sock1.close()
        if sock2_cnn_status:
            await send_connection_disconnected_message(sock2)
            await sock2.close()
    else:
        await sock1.close()
        await sock2.close()


async def connection_succeeded(sock):
    retval = True
    try:
        await send_test(sock)
    except:
        retval = False
    return retval


async def send_test(sock):
    await sock.send_json({
        "method": "test",
        "message": "Connection test...",
    })


async def send_connection_disconnected_message(sock):
    await sock.send_json({
        "method": "exception_occurred",
        "message": "The connection has been disconnected. Please reload.",
    })


def get_ip():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.connect(("8.8.8.8", 80))
    return sock.getsockname()[0]


# Return static page
@app.get('/')
async def index(request: Request):
    return templates.TemplateResponse("index.html", {
        "request": request,
        "ip": get_ip(),
        "port": 8000,
    })


@app.websocket("/ws")
async def websocket_endpoint(sock: WebSocket):
    await sock.accept()
    sock.finish = False
    await add_to_que(sock)
    while not sock.finish:
        await asyncio.sleep(3)
