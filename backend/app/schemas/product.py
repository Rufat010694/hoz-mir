from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str
    parent_id: int | None = None
    sort_order: int = 0


class CategoryResponse(BaseModel):
    id: int
    name: str
    parent_id: int | None
    sort_order: int

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    price: Decimal
    stock: int = 0
    category_id: int | None = None
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    stock: int | None = None
    category_id: int | None = None
    is_active: bool | None = None


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str | None
    price: Decimal
    stock: int
    category_id: int | None
    is_active: bool
    photos: list
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BulkPriceUpdate(BaseModel):
    product_ids: list[int] | None = None  # None = all products
    action: str  # "percent" | "fixed"
    value: Decimal


class BulkImportRow(BaseModel):
    name: str
    category: str | None = None
    price: Decimal
    stock: int = 0
    description: str | None = None
