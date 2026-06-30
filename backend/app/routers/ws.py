from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.websocket.manager import connect, disconnect, subscribe_and_forward
from app.utils.security import decode_token
import asyncio

router = APIRouter(tags=["websocket"])


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str = Query(...)):
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub", 0))
    except Exception:
        await ws.close(code=4001)
        return

    await connect(user_id, ws)
    try:
        # Run Redis subscriber in background
        sub_task = asyncio.create_task(subscribe_and_forward(user_id, ws))
        # Keep connection alive — wait for client messages or disconnect
        while True:
            try:
                await ws.receive_text()
            except WebSocketDisconnect:
                break
    finally:
        sub_task.cancel()
        disconnect(user_id, ws)
