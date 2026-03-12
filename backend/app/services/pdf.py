import os
from datetime import date
from decimal import Decimal
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from app.config import settings


NAVY = colors.HexColor("#0a0a0a")
GOLD = colors.HexColor("#c9a84c")
LIGHT_GRAY = colors.HexColor("#f8fafc")
MID_GRAY = colors.HexColor("#e2e8f0")
DARK_GRAY = colors.HexColor("#64748b")


def generate_invoice_pdf(booking, room, promo_code=None) -> str:
    """Generate a ReportLab PDF invoice. Returns the file path."""
    os.makedirs(settings.PDF_DIR, exist_ok=True)
    pdf_path = os.path.join(settings.PDF_DIR, f"invoice_{booking.id}.pdf")

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    story = []

    # Header
    header_style = ParagraphStyle("header", fontSize=28, textColor=GOLD,
                                   fontName="Helvetica-Bold", alignment=TA_CENTER)
    sub_style = ParagraphStyle("sub", fontSize=11, textColor=DARK_GRAY,
                                fontName="Helvetica", alignment=TA_CENTER)
    story.append(Paragraph("Shelbee's Suites", header_style))
    story.append(Paragraph("Luxury Hotel &amp; Suites &bull; Georgetown, Guyana", sub_style))
    story.append(Spacer(1, 4 * mm))
    story.append(HRFlowable(width="100%", thickness=2, color=GOLD))
    story.append(Spacer(1, 4 * mm))

    # Invoice title
    title_style = ParagraphStyle("title", fontSize=18, textColor=NAVY,
                                  fontName="Helvetica-Bold", alignment=TA_CENTER)
    story.append(Paragraph("INVOICE", title_style))
    story.append(Spacer(1, 6 * mm))

    # Meta info
    issued_date = date.today().strftime("%B %d, %Y")
    meta_data = [
        ["Booking ID:", f"#{booking.id}", "Issued:", issued_date],
        ["Payment:", booking.payment_method.value.title(), "Status:", "CONFIRMED"],
    ]
    meta_table = Table(meta_data, colWidths=[35 * mm, 55 * mm, 30 * mm, 50 * mm])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (-1, -1), NAVY),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=MID_GRAY))
    story.append(Spacer(1, 6 * mm))

    # Guest info
    section_style = ParagraphStyle("section", fontSize=12, textColor=NAVY,
                                    fontName="Helvetica-Bold")
    story.append(Paragraph("Guest Information", section_style))
    story.append(Spacer(1, 3 * mm))

    guest_data = [
        ["Guest Name:", booking.guest_name],
        ["Email:", booking.guest_email],
        ["Phone:", booking.guest_phone],
    ]
    guest_table = Table(guest_data, colWidths=[40 * mm, 130 * mm])
    guest_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (-1, -1), NAVY),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(guest_table)
    story.append(Spacer(1, 6 * mm))

    # Booking details
    story.append(Paragraph("Booking Details", section_style))
    story.append(Spacer(1, 3 * mm))

    nights = (booking.check_out - booking.check_in).days
    price_per_night = float(room.price_per_night)
    subtotal = nights * price_per_night
    discount = float(booking.discount_applied or 0)
    total = float(booking.total_price)

    # Line items table
    items_header = [["Description", "Nights", "Rate (GYD)", "Amount (GYD)"]]
    items_data = [
        [room.name, str(nights), f"{price_per_night:,.2f}", f"{subtotal:,.2f}"],
    ]
    if discount > 0:
        promo_label = f"Promo: {promo_code.code}" if promo_code else "Discount"
        items_data.append([promo_label, "", "", f"-{discount:,.2f}"])

    items_data.append(["", "", "TOTAL", f"GYD ${total:,.2f}"])

    all_rows = items_header + items_data
    col_widths = [80 * mm, 20 * mm, 40 * mm, 40 * mm]
    items_table = Table(all_rows, colWidths=col_widths)

    row_count = len(all_rows)
    total_row = row_count - 1

    items_table.setStyle(TableStyle([
        # Header
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        # Body
        ("FONTNAME", (0, 1), (-1, -2), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 10),
        ("TEXTCOLOR", (0, 1), (-1, -1), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, LIGHT_GRAY]),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        # Total row
        ("BACKGROUND", (0, total_row), (-1, total_row), GOLD),
        ("TEXTCOLOR", (0, total_row), (-1, total_row), NAVY),
        ("FONTNAME", (0, total_row), (-1, total_row), "Helvetica-Bold"),
        ("FONTSIZE", (0, total_row), (-1, total_row), 11),
        ("GRID", (0, 0), (-1, -1), 0.25, MID_GRAY),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 8 * mm))

    # Stay details
    stay_data = [
        ["Check-In:", booking.check_in.strftime("%B %d, %Y"),
         "Check-Out:", booking.check_out.strftime("%B %d, %Y")],
        ["Room Type:", room.type, "Guests:", str(booking.num_guests)],
    ]
    stay_table = Table(stay_data, colWidths=[35 * mm, 55 * mm, 30 * mm, 50 * mm])
    stay_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTNAME", (3, 0), (3, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (-1, -1), NAVY),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(stay_table)
    story.append(Spacer(1, 8 * mm))

    # Footer
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD))
    story.append(Spacer(1, 4 * mm))
    footer_style = ParagraphStyle("footer", fontSize=9, textColor=DARK_GRAY,
                                   fontName="Helvetica", alignment=TA_CENTER)
    story.append(Paragraph("Thank you for choosing Shelbee's Suites. We hope to see you again!", footer_style))
    story.append(Paragraph("For enquiries: reservations@shelbeessuites.com | +592-000-0000", footer_style))

    doc.build(story)
    return pdf_path
