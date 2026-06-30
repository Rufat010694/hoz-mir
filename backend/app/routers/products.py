from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_
from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.price_history import PriceHistory
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, BulkPriceUpdate, CategoryCreate, CategoryResponse
from app.services.deps import get_current_user
from app.services.image import process_image, make_thumbnail
from app.services.storage import upload_image, delete_image
from app.services.cache import cache_invalidate_store
from decimal import Decimal
import openpyxl
from io import BytesIO
from fastapi.responses import StreamingResponse


async def _invalidate(user: User):
    """Сбрасываем кэш каталога после изменения товара/категории."""
    if user.catalog_slug:
        await cache_invalidate_store(user.catalog_slug)

router = APIRouter(prefix="/products", tags=["products"])


# ── Categories ────────────────────────────────────────────────────────────────

@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Category).where(Category.user_id == current_user.id).order_by(Category.sort_order)
    )
    return result.scalars().all()


@router.post("/categories", response_model=CategoryResponse, status_code=201)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat = Category(user_id=current_user.id, **data.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    await _invalidate(current_user)
    return cat


@router.delete("/categories/{cat_id}", status_code=204)
async def delete_category(
    cat_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Category).where(Category.id == cat_id, Category.user_id == current_user.id)
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(404, "Category not found")
    await db.delete(cat)
    await db.commit()
    await _invalidate(current_user)


# ── Products ──────────────────────────────────────────────────────────────────

@router.get("", response_model=list[ProductResponse])
async def list_products(
    search: str | None = Query(None),
    category_id: int | None = Query(None),
    is_active: bool | None = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Product).where(Product.user_id == current_user.id)
    if search:
        q = q.where(Product.name.ilike(f"%{search}%"))
    if category_id is not None:
        q = q.where(Product.category_id == category_id)
    if is_active is not None:
        q = q.where(Product.is_active == is_active)
    q = q.offset(skip).limit(limit).order_by(Product.name)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = Product(user_id=current_user.id, **data.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    await _invalidate(current_user)
    return product


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.user_id == current_user.id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(404, "Product not found")
    return product


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.user_id == current_user.id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(404, "Product not found")
    update_data = data.model_dump(exclude_unset=True)
    if "price" in update_data and update_data["price"] != product.price:
        ph = PriceHistory(product_id=product.id, old_price=product.price, new_price=update_data["price"])
        db.add(ph)
    price_changed = "price" in update_data
    for k, v in update_data.items():
        setattr(product, k, v)
    await db.commit()
    await db.refresh(product)
    await _invalidate(current_user)
    # Уведомляем клиентов каталога об изменении цены
    if price_changed and current_user.catalog_slug:
        from app.websocket.catalog_manager import publish_catalog_event
        await publish_catalog_event(current_user.catalog_slug, "price_updated", {
            "product_id": product.id,
            "price": float(product.price),
        })
    return product


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.user_id == current_user.id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(404, "Product not found")
    await db.delete(product)
    await db.commit()
    await _invalidate(current_user)


# ── Photo upload ──────────────────────────────────────────────────────────────

@router.post("/{product_id}/photos", response_model=ProductResponse)
async def upload_product_photo(
    product_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.user_id == current_user.id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(404, "Product not found")

    raw = await file.read()
    webp = process_image(raw)
    thumb = make_thumbnail(raw)

    main_info = await upload_image(webp, "image/webp")
    thumb_info = await upload_image(thumb, "image/webp")

    photos = list(product.photos or [])
    photos.append({"url": main_info["url"], "thumbnail_url": thumb_info["url"], "key": main_info["key"], "thumb_key": thumb_info["key"]})
    product.photos = photos
    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/{product_id}/photos/{photo_index}", response_model=ProductResponse)
async def delete_product_photo(
    product_id: int,
    photo_index: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.user_id == current_user.id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(404, "Product not found")
    photos = list(product.photos or [])
    if photo_index >= len(photos):
        raise HTTPException(400, "Invalid photo index")
    photo = photos.pop(photo_index)
    try:
        await delete_image(photo["key"])
        await delete_image(photo["thumb_key"])
    except Exception:
        pass
    product.photos = photos
    await db.commit()
    await db.refresh(product)
    return product


# ── Bulk price update ─────────────────────────────────────────────────────────

@router.post("/bulk/price", response_model=dict)
async def bulk_price_update(
    data: BulkPriceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Product).where(Product.user_id == current_user.id)
    if data.product_ids:
        q = q.where(Product.id.in_(data.product_ids))
    result = await db.execute(q)
    products = result.scalars().all()

    for product in products:
        old_price = product.price
        if data.action == "percent":
            new_price = round(float(old_price) * (1 + float(data.value) / 100), 2)
        else:
            new_price = float(old_price) + float(data.value)
        new_price = max(0, new_price)
        if new_price != float(old_price):
            ph = PriceHistory(product_id=product.id, old_price=old_price, new_price=Decimal(str(new_price)))
            db.add(ph)
            product.price = Decimal(str(new_price))

    await db.commit()
    return {"updated": len(products)}


# ── Export ────────────────────────────────────────────────────────────────────

@router.get("/export/xlsx")
async def export_products_xlsx(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Product).where(Product.user_id == current_user.id).order_by(Product.name)
    )
    products = result.scalars().all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Товары"
    ws.append(["ID", "Название", "Категория", "Цена", "Остаток", "Активен"])
    for p in products:
        ws.append([p.id, p.name, p.category_id or "", float(p.price), p.stock, p.is_active])

    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=products.xlsx"},
    )
