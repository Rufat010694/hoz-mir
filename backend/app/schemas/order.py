from pydantic import BaseModel, field_validator
from decimal import Decimal
from datetime import datetime
from app.models.order import OrderStatus, PaymentMethod


class OrderItemCreate(BaseModel):
    product_id: int | str
    quantity: int

    @field_validator("product_id", mode="before")
    @classmethod
    def coerce_product(cls, v):
        return int(v) if v is not None else None


class OrderItemResponse(BaseModel):
    id: str
    product_id: str | None
    product_name: str
    price: Decimal
    quantity: int
    subtotal: Decimal

    model_config = {"from_attributes": True}

    @field_validator("id", "product_id", mode="before")
    @classmethod
    def to_str(cls, v):
        return str(v) if v is not None else None


class OrderCreate(BaseModel):
    client_id: int | str | None = None
    client_phone: str | None = None
    client_name: str | None = None
    client_store: str | None = None
    payment_method: PaymentMethod = PaymentMethod.cash
    comment: str | None = None
    items: list[OrderItemCreate]
    source: str = "direct"
    catalog_slug: str | None = None

    @field_validator("client_id", mode="before")
    @classmethod
    def coerce_client(cls, v):
        return int(v) if v is not None else None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderPaymentUpdate(BaseModel):
    payment_method: PaymentMethod


class OrderResponse(BaseModel):
    id: str
    client_id: str | None
    client_phone: str | None
    client_name: str | None
    client_store: str | None
    status: OrderStatus
    payment_method: PaymentMethod
    total_amount: Decimal
    comment: str | None
    source: str
    items: list[OrderItemResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("id", "client_id", mode="before")
    @classmethod
    def to_str(cls, v):
        return str(v) if v is not None else None


class OrderListResponse(BaseModel):
    id: str
    client_id: str | None
    client_name: str | None
    client_phone: str | None
    status: OrderStatus
    payment_method: PaymentMethod
    total_amount: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("id", "client_id", mode="before")
    @classmethod
    def to_str(cls, v):
        return str(v) if v is not None else None
