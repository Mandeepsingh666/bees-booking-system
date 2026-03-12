"""
Seed script — creates the owner account and sample rooms.
Run once after alembic upgrade head:
  python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import User, UserRole, Room
from app.services.auth import hash_password
from app.config import settings


def seed():
    db = SessionLocal()
    try:
        # Owner account
        existing = db.query(User).filter(User.username == settings.OWNER_USERNAME).first()
        if not existing:
            owner = User(
                username=settings.OWNER_USERNAME,
                email=settings.OWNER_EMAIL_DEFAULT,
                hashed_password=hash_password(settings.OWNER_PASSWORD),
                role=UserRole.owner,
                is_active=True,
            )
            db.add(owner)
            print(f"✓ Owner created: username={settings.OWNER_USERNAME}")
        else:
            print("Owner already exists — skipping.")

        # Sample rooms
        rooms = [
            Room(name="Suite 1A", type="Standard", description="Cozy standard suite with garden view.", price_per_night=15000, capacity=2, amenities="WiFi\nAir Conditioning\nFlat Screen TV\nMini Fridge", is_active=True),
            Room(name="Suite 2B", type="Deluxe", description="Spacious deluxe suite with ocean view balcony.", price_per_night=28000, capacity=3, amenities="WiFi\nAir Conditioning\nFlat Screen TV\nMini Bar\nBalcony\nJacuzzi", is_active=True),
            Room(name="Suite 3C", type="Deluxe", description="Elegant deluxe suite with city view.", price_per_night=25000, capacity=2, amenities="WiFi\nAir Conditioning\nFlat Screen TV\nMini Bar\nWork Desk", is_active=True),
            Room(name="Penthouse PH1", type="Penthouse", description="Luxury penthouse with panoramic views and private terrace.", price_per_night=75000, capacity=4, amenities="WiFi\nAir Conditioning\nFlat Screen TV\nFull Bar\nPrivate Terrace\nJacuzzi\nButler Service\nKitchenette", is_active=True),
        ]
        for room in rooms:
            existing_room = db.query(Room).filter(Room.name == room.name).first()
            if not existing_room:
                db.add(room)
                print(f"✓ Room created: {room.name}")
            else:
                print(f"Room {room.name} already exists — skipping.")

        db.commit()
        print("\nSeed complete.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
