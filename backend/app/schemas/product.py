from pydantic import BaseModel, field_validator
from decimal import Decimal
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str
    parent_id: int | str | None = None
    sort_order: int = 0


class CategoryResponse(BaseModel):
    id: str
    name: str
    parent_id: str | None
    sort_order: int

    model_config = {"from_attributes": True}

    @field_validator("id", "parent_id", mode="before")
    @classmethod
    def to_str(cls, v):
        return str(v) if v is not None else None


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    price: Decimal
    stock: int = 0
    category_id: int | str | None = None
    is_active: bool = True

    @field_validator("category_id", mode="before")
    @classmethod
    def coerce_category(cls, v):
        return int(v) if v is not None else None


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    stock: int | None = None
    category_id: int | str | None = None
    is_active: bool | None = None

    @field_validator("category_id", mode="before")
    @classmethod
    def coerce_category(cls, v):
        return int(v) if v is not None else None


class ProductResponse(BaseModel):
    id: str
    name: str
    description: str | None
    price: Decimal
    stock: int
    category_id: str | None
    is_active: bool
    photos: list
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("id", "category_id", mode="before")
    @classmethod
    def to_str(cls, v):
        return str(v) if v is not None else None


class BulkPriceUpdate(BaseModel):
    product_ids: list[int | str] | None = None  # None = all products
    action: str  # "percent" | "fixed"
    value: Decimal


class BulkImportRow(BaseModel):
    name: str
    category: str | None = None
    price: Decimal
    stock: int = 0
    description: str | None = None
