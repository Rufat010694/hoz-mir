"""add order_number column

Revision ID: a1b2c3d4e5f6
Revises: c54a8622dc88
Create Date: 2026-06-30

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'c54a8622dc88'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('orders', sa.Column('order_number', sa.Integer(), nullable=True))
    op.create_index('ix_orders_order_number', 'orders', ['order_number'])

    # Backfill existing orders: assign sequential numbers per user ordered by created_at
    conn = op.get_bind()
    conn.execute(text("""
        UPDATE orders o
        SET order_number = sub.rn
        FROM (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) AS rn
            FROM orders
        ) sub
        WHERE o.id = sub.id
    """))


def downgrade() -> None:
    op.drop_index('ix_orders_order_number', table_name='orders')
    op.drop_column('orders', 'order_number')
