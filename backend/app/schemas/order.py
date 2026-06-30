from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from app.models.order import OrderStatus, PaymentMethod


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class OrderItemResponse(BaseModel):
    id: int
    product_id: int | None
    product_name: str
    price: Decimal
    quantity: int
    subtotal: Decimal

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    client_id: int | None = None
    client_phone: str | None = None
    client_name: str | None = None
    client_store: str | None = None
    payment_method: PaymentMethod = PaymentMethod.cash
    comment: str | None = None
    items: list[OrderItemCreate]
    source: str = "direct"
    catalog_slug: str | None = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderPaymentUpdate(BaseModel):
    payment_method: PaymentMethod


class OrderResponse(BaseModel):
    id: int
    client_id: int | None
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


class OrderListResponse(BaseModel):
    id: int
    client_id: int | None
    client_name: str | None
    client_phone: str | None
    status: OrderStatus
    payment_method: PaymentMethod
    total_amount: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}
