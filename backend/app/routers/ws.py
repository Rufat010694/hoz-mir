from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.websocket.manager import connect, disconnect, subscribe_and_forward
from app.websocket.catalog_manager import catalog_connect, catalog_disconnect, catalog_subscribe
from app.utils.security import decode_token
from app.database import get_db
from app.models.user import User
import asyncio

router = APIRouter(tags=["websocket"])


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str = Query(...)):
    """WebSocket для продавца — уведомления о заказах."""
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub", 0))
    except Exception:
        await ws.close(code=4001)
        return

    await connect(user_id, ws)
    try:
        sub_task = asyncio.create_task(subscribe_and_forward(user_id, ws))
        while True:
            try:
                await ws.receive_text()
            except WebSocketDisconnect:
                break
    finally:
        sub_task.cancel()
        disconnect(user_id, ws)


@router.websocket("/ws/catalog/{slug}")
async def catalog_websocket(ws: WebSocket, slug: str):
    """WebSocket для клиентского каталога — обновления цен и наличия."""
    await catalog_connect(slug, ws)
    try:
        sub_task = asyncio.create_task(catalog_subscribe(slug, ws))
        while True:
            try:
                await ws.receive_text()
            except WebSocketDisconnect:
                break
    finally:
        sub_task.cancel()
        catalog_disconnect(slug, ws)


@router.websocket("/ws/order/{order_id}")
async def order_status_websocket(ws: WebSocket, order_id: int):
    """WebSocket для клиента — статус конкретного заказа."""
    channel = f"order:{order_id}"
    await catalog_connect(channel, ws)
    try:
        sub_task = asyncio.create_task(catalog_subscribe(channel, ws))
        while True:
            try:
                await ws.receive_text()
            except WebSocketDisconnect:
                break
    finally:
        sub_task.cancel()
        catalog_disconnect(channel, ws)
