"""add image_path to maintenance_issues

Revision ID: 002
Revises: 001
Create Date: 2026-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('maintenance_issues', sa.Column('image_path', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('maintenance_issues', 'image_path')
