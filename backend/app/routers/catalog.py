"""Public catalog routes — no authentication required."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.order import Order
from app.models.client import Client
from app.schemas.product import ProductResponse, CategoryResponse
from app.schemas.order import OrderCreate, OrderResponse
from app.services.cache import cache_get, cache_set, TTL_SHORT, TTL_STORE
from decimal import Decimal

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/{slug}", response_model=dict)
async def get_store_info(slug: str, db: AsyncSession = Depends(get_db)):
    cache_key = f"catalog:{slug}:store"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    result = await db.execute(select(User).where(User.catalog_slug == slug, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Store not found")
    data = {"store_name": user.store_name or user.username, "slug": slug}
    await cache_set(cache_key, data, TTL_STORE)
    return data


@router.get("/{slug}/products", response_model=list[ProductResponse])
async def get_catalog_products(
    slug: str,
    category_id: int | None = Query(None),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    # Кэшируем только без поиска (поисковые запросы уникальны)
    cache_key = f"catalog:{slug}:products:{category_id or 'all'}" if not search else None
    if cache_key:
        cached = await cache_get(cache_key)
        if cached:
            return cached

    ur = await db.execute(select(User).where(User.catalog_slug == slug, User.is_active == True))
    user = ur.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Store not found")

    q = select(Product).where(Product.user_id == user.id, Product.is_active == True)
    if category_id:
        q = q.where(Product.category_id == category_id)
    if search:
        q = q.where(Product.name.ilike(f"%{search}%"))
    q = q.order_by(Product.name)
    result = await db.execute(q)
    products = result.scalars().all()

    if cache_key:
        from app.schemas.product import ProductResponse as PR
        await cache_set(cache_key, [PR.model_validate(p).model_dump() for p in products], TTL_SHORT)

    return products


@router.get("/{slug}/categories", response_model=list[CategoryResponse])
async def get_catalog_categories(slug: str, db: AsyncSession = Depends(get_db)):
    cache_key = f"catalog:{slug}:categories"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    ur = await db.execute(select(User).where(User.catalog_slug == slug, User.is_active == True))
    user = ur.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Store not found")

    result = await db.execute(
        select(Category).where(Category.user_id == user.id).order_by(Category.sort_order)
    )
    categories = result.scalars().all()

    from app.schemas.product import CategoryResponse as CR
    await cache_set(cache_key, [CR.model_validate(c).model_dump() for c in categories], TTL_STORE)
    return categories


@router.get("/{slug}/track/{order_number}")
async def track_order(slug: str, order_number: int, phone: str = Query(...), db: AsyncSession = Depends(get_db)):
    ur = await db.execute(select(User).where(User.catalog_slug == slug, User.is_active == True))
    seller = ur.scalar_one_or_none()
    if not seller:
        raise HTTPException(404, "Store not found")

    from app.models.order import OrderItem as OI
    res = await db.execute(
        select(Order).where(
            Order.user_id == seller.id,
            Order.order_number == order_number,
            Order.client_phone == phone,
        )
    )
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Заказ не найден. Проверьте номер и телефон.")

    items_res = await db.execute(select(OI).where(OI.order_id == order.id))
    items = items_res.scalars().all()

    return {
        "order_number": order.order_number,
        "status": order.status,
        "total_amount": float(order.total_amount),
        "payment_method": order.payment_method,
        "comment": order.comment,
        "created_at": order.created_at.isoformat(),
        "items": [
            {"product_name": i.product_name, "quantity": i.quantity, "price": float(i.price), "subtotal": float(i.subtotal)}
            for i in items
        ],
    }


@router.post("/{slug}/orders", response_model=dict, status_code=201)
async def place_catalog_order(
    slug: str,
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
):
    ur = await db.execute(select(User).where(User.catalog_slug == slug, User.is_active == True))
    seller = ur.scalar_one_or_none()
    if not seller:
        raise HTTPException(404, "Store not found")

    # Auto-create or find client by phone
    client = None
    if data.client_phone:
        cr = await db.execute(
            select(Client).where(Client.user_id == seller.id, Client.phone == data.client_phone)
        )
        client = cr.scalar_one_or_none()
        if not client:
            client = Client(
                user_id=seller.id,
                phone=data.client_phone,
                full_name=data.client_name,
                store_name=data.client_store,
            )
            db.add(client)
            await db.flush()

    num_res = await db.execute(
        select(func.coalesce(func.max(Order.order_number), 0)).where(Order.user_id == seller.id)
    )
    next_num = (num_res.scalar() or 0) + 1

    order = Order(
        user_id=seller.id,
        order_number=next_num,
        client_id=client.id if client else None,
        client_phone=data.client_phone,
        client_name=data.client_name,
        client_store=data.client_store,
        payment_method=data.payment_method,
        comment=data.comment,
        source="catalog",
        catalog_slug=slug,
    )
    db.add(order)
    await db.flush()

    from app.models.order import OrderItem
    total = Decimal("0")
    for item_data in data.items:
        pr = await db.execute(
            select(Product).where(Product.id == item_data.product_id, Product.user_id == seller.id)
        )
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
        db.add(item)

    order.total_amount = total
    await db.commit()

    from app.websocket.manager import publish_event
    await publish_event(seller.id, "new_order", {"order_id": order.id, "total": float(total), "source": "catalog"})

    return {
        "order_id": str(order.id),
        "order_number": order.order_number,
        "total": float(total),
        "message": "Заказ принят! Продавец свяжется с вами для подтверждения.",
    }
