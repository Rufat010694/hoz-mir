from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.client import Client
from app.schemas.order import OrderCreate, OrderResponse, OrderListResponse, OrderStatusUpdate, OrderPaymentUpdate
from app.services.deps import get_current_user
from app.websocket.manager import publish_event
from decimal import Decimal

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=list[OrderListResponse])
async def list_orders(
    status: str | None = Query(None),
    client_id: int | None = Query(None),
    search: str | None = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Order).where(Order.user_id == current_user.id)
    if status:
        q = q.where(Order.status == status)
    if client_id:
        q = q.where(Order.client_id == client_id)
    if search:
        q = q.where(
            Order.client_name.ilike(f"%{search}%") |
            Order.client_phone.ilike(f"%{search}%")
        )
    q = q.order_by(Order.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=OrderResponse, status_code=201)
async def create_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Resolve client info
    client_name = data.client_name
    client_phone = data.client_phone
    if data.client_id:
        cr = await db.execute(select(Client).where(Client.id == data.client_id, Client.user_id == current_user.id))
        client = cr.scalar_one_or_none()
        if client:
            client_name = client.full_name
            client_phone = client.phone

    order = Order(
        user_id=current_user.id,
        client_id=data.client_id,
        client_phone=client_phone,
        client_name=client_name,
        client_store=data.client_store,
        payment_method=data.payment_method,
        comment=data.comment,
        source=data.source,
        catalog_slug=data.catalog_slug,
    )
    db.add(order)
    await db.flush()

    total = Decimal("0")
    for item_data in data.items:
        pr = await db.execute(select(Product).where(Product.id == item_data.product_id))
        product = pr.scalar_one_or_none()
        if not product:
            raise HTTPException(400, f"Product {item_data.product_id} not found")
        subtotal = product.price * item_data.quantity
        total += subtotal
        item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            price=product.price,
            quantity=item_data.quantity,
            subtotal=subtotal,
        )
        # Decrease stock
        product.stock = max(0, product.stock - item_data.quantity)
        db.add(item)

    order.total_amount = total
    await db.commit()
    await db.refresh(order)

    # Notify via WebSocket
    await publish_event(current_user.id, "new_order", {"order_id": order.id, "total": float(total)})

    # Re-fetch with items
    r = await db.execute(
        select(Order).where(Order.id == order.id).options(selectinload(Order.items))
    )
    return r.scalar_one()


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.user_id == current_user.id)
        .options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    return order


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.user_id == current_user.id)
        .options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    order.status = data.status
    await db.commit()
    await db.refresh(order)
    await publish_event(current_user.id, "order_status_changed", {"order_id": order.id, "status": data.status})
    # Уведомляем клиента о смене статуса его заказа
    from app.websocket.catalog_manager import publish_order_event
    await publish_order_event(order.id, "status_changed", {"order_id": order.id, "status": data.status})
    return order


@router.patch("/{order_id}/payment", response_model=OrderResponse)
async def update_order_payment(
    order_id: int,
    data: OrderPaymentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.user_id == current_user.id)
        .options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    order.payment_method = data.payment_method
    await db.commit()
    await db.refresh(order)
    return order
