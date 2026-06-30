from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.database import get_db
from app.models.user import User
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.client import Client
from app.services.deps import get_current_user
from datetime import datetime, date, timedelta
from decimal import Decimal
from sqlalchemy import cast, Numeric

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())

    # Products count
    prod_count = await db.execute(
        select(func.count(Product.id)).where(Product.user_id == current_user.id, Product.is_active == True)
    )

    # Today orders
    today_orders = await db.execute(
        select(func.count(Order.id)).where(
            Order.user_id == current_user.id,
            Order.created_at >= today_start,
        )
    )

    # New orders
    new_orders = await db.execute(
        select(func.count(Order.id)).where(
            Order.user_id == current_user.id,
            Order.status == OrderStatus.new,
        )
    )

    # Today revenue
    today_revenue = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), Decimal(0))).where(
            Order.user_id == current_user.id,
            Order.created_at >= today_start,
            Order.status != OrderStatus.cancelled,
        )
    )

    # Recent orders
    recent_q = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .limit(5)
    )
    recent_orders = recent_q.scalars().all()

    # Top products (by order item quantity)
    top_q = await db.execute(
        select(Product.name, func.sum(OrderItem.quantity).label("sold"))
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.user_id == current_user.id)
        .group_by(Product.id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
    )
    top_products = [{"name": r[0], "sold": r[1]} for r in top_q.fetchall()]

    # Client debts
    debts_q = await db.execute(
        select(Client.full_name, Client.total_debt)
        .where(Client.user_id == current_user.id, Client.total_debt > 0)
        .order_by(Client.total_debt.desc())
        .limit(5)
    )
    debts = [{"name": r[0], "debt": float(r[1])} for r in debts_q.fetchall()]

    return {
        "products_count": prod_count.scalar(),
        "today_orders": today_orders.scalar(),
        "new_orders": new_orders.scalar(),
        "today_revenue": float(today_revenue.scalar() or 0),
        "recent_orders": [
            {
                "id": o.id,
                "client_name": o.client_name,
                "total_amount": float(o.total_amount),
                "status": o.status,
                "payment_method": o.payment_method,
                "created_at": o.created_at.strftime("%H:%M"),
            }
            for o in recent_orders
        ],
        "top_products": top_products,
        "client_debts": debts,
    }


@router.get("/sales")
async def get_sales_report(
    period: str = Query("day", regex="^(day|week|month|year)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = datetime.utcnow()
    if period == "day":
        start = today.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start = today - timedelta(days=7)
    elif period == "month":
        start = today - timedelta(days=30)
    else:
        start = today - timedelta(days=365)

    result = await db.execute(
        select(
            func.date(Order.created_at).label("date"),
            func.count(Order.id).label("orders"),
            func.coalesce(func.sum(Order.total_amount), Decimal(0)).label("revenue"),
        )
        .where(
            Order.user_id == current_user.id,
            Order.created_at >= start,
            Order.status != OrderStatus.cancelled,
        )
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )
    rows = result.fetchall()
    return [{"date": str(r[0]), "orders": r[1], "revenue": float(r[2])} for r in rows]
