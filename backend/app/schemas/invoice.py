from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class InvoiceOut(BaseModel):
    id: int
    booking_id: int
    issued_at: datetime
    pdf_path: str
    download_url: Optional[str] = None

    class Config:
        from_attributes = True
