# app.py
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID, JSONB, INTERVAL
from datetime import datetime, timedelta
import uuid
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import jwt
import os
from flask_cors import CORS  # Import CORS
from flask_migrate import Migrate


app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://vimbegood:12345@localhost/spacer4"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "your-secret-key"  # Change this to a secure secret key


UPLOAD_FOLDER = "static/profile_pictures"
SPACE_UPLOAD_FOLDER = "static/space_images"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}


# Enable CORS for all routes
CORS(app)

db = SQLAlchemy(app)

migrate = Migrate(app, db)


# Models
class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey("roles.role_id"))
    profile_picture = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    role = db.relationship("Role", back_populates="users")
    bookings = db.relationship("Booking", back_populates="user")
    reviews = db.relationship("Review", back_populates="user")


class Role(db.Model):
    __tablename__ = "roles"

    role_id = db.Column(db.Integer, primary_key=True)
    role_name = db.Column(db.String(80), nullable=False)
    permissions = db.Column(JSONB)

    # Relationships
    users = db.relationship("User", back_populates="role")


class Space(db.Model):
    __tablename__ = "spaces"

    space_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    location = db.Column(db.String(255))
    hourly_rate = db.Column(db.Numeric(10, 2))
    type = db.Column(db.String(50), nullable=False)
    day_rate = db.Column(db.Numeric(10, 2))
    capacity = db.Column(db.Integer)
    status = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    bookings = db.relationship("Booking", back_populates="space")
    reviews = db.relationship("Review", back_populates="space")
    images = db.relationship("SpaceImage", back_populates="space")


class Booking(db.Model):
    __tablename__ = "bookings"

    booking_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.user_id"))
    space_id = db.Column(UUID(as_uuid=True), db.ForeignKey("spaces.space_id"))
    start_datetime = db.Column(db.DateTime, nullable=False)
    end_datetime = db.Column(db.DateTime, nullable=False)
    duration = db.Column(INTERVAL)
    total_amount = db.Column(db.Numeric(10, 2))
    status = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship("User", back_populates="bookings")
    space = db.relationship("Space", back_populates="bookings")
    payments = db.relationship("Payment", back_populates="booking")
    agreement = db.relationship("Agreement", back_populates="booking", uselist=False)


class Payment(db.Model):
    __tablename__ = "payments"

    payment_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = db.Column(UUID(as_uuid=True), db.ForeignKey("bookings.booking_id"))
    amount = db.Column(db.Numeric(10, 2))
    status = db.Column(db.String(20))
    payment_method = db.Column(db.String(50))
    transaction_id = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    booking = db.relationship("Booking", back_populates="payments")


class Agreement(db.Model):
    __tablename__ = "agreements"

    agreement_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = db.Column(UUID(as_uuid=True), db.ForeignKey("bookings.booking_id"))
    terms = db.Column(db.Text)
    signed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    booking = db.relationship("Booking", back_populates="agreement")


class Review(db.Model):
    __tablename__ = "reviews"

    review_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.user_id"))
    space_id = db.Column(UUID(as_uuid=True), db.ForeignKey("spaces.space_id"))
    rating = db.Column(db.Integer)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship("User", back_populates="reviews")
    space = db.relationship("Space", back_populates="reviews")


class SpaceImage(db.Model):
    __tablename__ = "space_images"

    image_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    space_id = db.Column(UUID(as_uuid=True), db.ForeignKey("spaces.space_id"))
    image_filename = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    space = db.relationship("Space", back_populates="images")


# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"message": "Token is missing"}), 401
        try:
            data = jwt.decode(
                token.split(" ")[1], app.config["SECRET_KEY"], algorithms=["HS256"]
            )
            current_user = User.query.filter_by(user_id=data["user_id"]).first()
        except:
            return jsonify({"message": "Token is invalid"}), 401
        return f(current_user, *args, **kwargs)

    return decorated


# Admin middleware
def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"message": "Token is missing"}), 401
        try:
            data = jwt.decode(
                token.split(" ")[1], app.config["SECRET_KEY"], algorithms=["HS256"]
            )
            current_user = User.query.filter_by(user_id=data["user_id"]).first()
            if current_user.role_id != 1:  # Check if user is admin
                return jsonify({"message": "Admin privileges required"}), 403
        except:
            return jsonify({"message": "Token is invalid"}), 401
        return f(current_user, *args, **kwargs)

    return decorated


# User routes
@app.route("/auth/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        print(data)

        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"message": "Email already exists"}), 400

        if User.query.filter_by(username=data["name"]).first():
            return jsonify({"message": "Username already exists"}), 400

        hashed_password = generate_password_hash(data["password"])
        new_user = User(
            username=data["name"],
            email=data["email"],
            password=hashed_password,
            role_id=data.get("role_id", 3),  # Default to regular user role
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify(
            {"message": "User created successfully", "user_id": str(new_user.user_id)}
        ), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error creating user", "error": str(e)}), 400


@app.route("/auth/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        user = User.query.filter_by(email=data["email"]).first()

        if user and check_password_hash(user.password, data["password"]):
            token = jwt.encode(
                {
                    "user_id": str(user.user_id),
                    "role_id": user.role_id,
                    "exp": datetime.utcnow() + timedelta(hours=24),
                },
                app.config["SECRET_KEY"],
            )
            return jsonify(
                {
                    "token": token,
                    "user": {
                        "user_id": str(user.user_id),
                        "username": user.username,
                        "email": user.email,
                        "role": user.role.role_name,
                    },
                }
            )

        return jsonify({"message": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"message": "Login failed", "error": str(e)}), 400


@app.route("/profile", methods=["GET"])
@token_required
def get_user_profile(current_user):
    try:
        return jsonify(
            {
                "user_id": str(current_user.user_id),
                "username": current_user.username,
                "email": current_user.email,
                "role": current_user.role.role_name,
                "profile_picture": current_user.profile_picture,
            }
        )
    except Exception as e:
        return jsonify({"message": "Error fetching user profile", "error": str(e)}), 400


@app.route("/profile", methods=["PUT"])
@token_required
def update_user_profile(current_user):
    try:
        data = request.form.to_dict()
        file = request.files.get("profile_picture")
        print(file)

        # Only update the profile picture if a new file is provided
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.root_path, UPLOAD_FOLDER, filename))
            data["profile_picture"] = f"/static/profile_pictures/{filename}"
        else:
            # If no new profile picture is uploaded, keep the existing one
            data["profile_picture"] = current_user.profile_picture

        current_user.username = data.get("username", current_user.username)
        current_user.email = data.get("email", current_user.email)
        current_user.profile_picture = data.get(
            "profile_picture", current_user.profile_picture
        )

        db.session.commit()

        return jsonify(
            {
                "message": "User profile updated successfully",
                "user": {
                    "user_id": str(current_user.user_id),
                    "username": current_user.username,
                    "email": current_user.email,
                    "profile_picture": current_user.profile_picture,
                },
            }
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error updating user profile", "error": str(e)}), 400


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# Space routes
@app.route("/spaces", methods=["GET"])
def get_spaces():
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)

        query = Space.query

        # Apply filters if provided
        location = request.args.get("location")
        if location:
            query = query.filter(Space.location.ilike(f"%{location}%"))

        space_type = request.args.get("type")  # Added type filter
        if space_type:
            query = query.filter(Space.type == space_type)

        min_capacity = request.args.get("min_capacity", type=int)
        if min_capacity:
            query = query.filter(Space.capacity >= min_capacity)

        max_rate = request.args.get("max_hourly_rate", type=float)
        if max_rate:
            query = query.filter(Space.hourly_rate <= max_rate)

        spaces = query.paginate(page=page, per_page=per_page)

        return jsonify(
            {
                "spaces": [
                    {
                        "space_id": str(space.space_id),
                        "name": space.name,
                        "description": space.description,
                        "location": space.location,
                        "type": space.type,  # Added type field
                        "hourly_rate": float(space.hourly_rate),
                        "day_rate": float(space.day_rate),
                        "capacity": space.capacity,
                        "status": space.status,
                        "images": [
                            {
                                "image_id": str(img.image_id),
                                "url": f"/static/space_images/{img.image_filename}",
                            }
                            for img in space.images
                        ],
                        "average_rating": db.session.query(db.func.avg(Review.rating))
                        .filter(Review.space_id == space.space_id)
                        .scalar()
                        or 0,
                    }
                    for space in spaces.items
                ],
                "total": spaces.total,
                "pages": spaces.pages,
                "current_page": spaces.page,
            }
        )
    except Exception as e:
        return jsonify({"message": "Error fetching spaces", "error": str(e)}), 400


@app.route("/spaces/<space_id>", methods=["GET"])
def get_space(space_id):
    try:
        space = Space.query.get_or_404(space_id)
        reviews = Review.query.filter_by(space_id=space_id).all()

        return jsonify(
            {
                "space_id": str(space.space_id),
                "name": space.name,
                "description": space.description,
                "location": space.location,
                "type": space.type,  # Added type field
                "hourly_rate": float(space.hourly_rate),
                "day_rate": float(space.day_rate),
                "capacity": space.capacity,
                "status": space.status,
                "images": [
                    {"image_id": str(img.image_id), "filename": img.image_filename}
                    for img in space.images
                ],
                "reviews": [
                    {
                        "review_id": str(review.review_id),
                        "rating": review.rating,
                        "comment": review.comment,
                        "user": review.user.username,
                        "created_at": review.created_at.isoformat(),
                    }
                    for review in reviews
                ],
                "average_rating": sum(r.rating for r in reviews) / len(reviews)
                if reviews
                else 0,
            }
        )
    except Exception as e:
        return jsonify({"message": "Error fetching space", "error": str(e)}), 400


@app.route("/spaces", methods=["POST"])
@token_required
def create_space(current_user):
    try:
        # Check if user has permission to create spaces
        if "create" not in current_user.role.permissions.get("spaces", []):
            return jsonify({"message": "Unauthorized - Insufficient permissions"}), 403

        data = request.form.to_dict()
        files = request.files.getlist("image")

        new_space = Space(
            name=data["name"],
            description=data["description"],
            location=data["location"],
            type=data["type"],  # Added type field
            hourly_rate=data["hourly_rate"],
            day_rate=data["day_rate"],
            capacity=data["capacity"],
            status="available",
        )

        # Save space images
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.root_path, SPACE_UPLOAD_FOLDER, filename))
                new_image = SpaceImage(image_filename=filename)
                new_space.images.append(new_image)

        db.session.add(new_space)
        db.session.commit()

        return jsonify(
            {
                "message": "Space created successfully",
                "space_id": str(new_space.space_id),
            }
        ), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error creating space", "error": str(e)}), 400


@app.route("/admin/spaces", methods=["POST"])
@token_required
def admin_create_space(current_user):
    try:
        # Check if user has permission to create spaces
        if "create" not in current_user.role.permissions.get("spaces", []):
            return jsonify({"message": "Unauthorized - Insufficient permissions"}), 403

        data = request.get_json()
        print(data)
        files = request.files.getlist("image")

        new_space = Space(
            name=data["name"],
            description=data["description"],
            location=data["location"],
            hourly_rate=data["hourly_rate"],
            day_rate=data["day_rate"],
            capacity=data["capacity"],
            type=data["type"],
            status="available",
        )

        # Save space images
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.root_path, SPACE_UPLOAD_FOLDER, filename))
                new_image = SpaceImage(image_filename=filename)
                new_space.images.append(new_image)

        db.session.add(new_space)
        db.session.commit()

        return jsonify(
            {
                "message": "Space created successfully",
                "space_id": str(new_space.space_id),
            }
        ), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error creating space", "error": str(e)}), 400


# Booking routes
@app.route("/bookings", methods=["POST"])
@token_required
def create_booking(current_user):
    try:
        data = request.get_json()

        # Check space availability
        space = Space.query.get_or_404(data["space_id"])
        if space.status != "available":
            return jsonify({"message": "Space is not available"}), 400

        # Check for booking conflicts
        start_datetime = datetime.fromisoformat(data["start_datetime"])
        end_datetime = datetime.fromisoformat(data["end_datetime"])

        conflicting_booking = Booking.query.filter(
            Booking.space_id == data["space_id"],
            Booking.status != "cancelled",
            db.or_(
                db.and_(
                    Booking.start_datetime <= start_datetime,
                    Booking.end_datetime > start_datetime,
                ),
                db.and_(
                    Booking.start_datetime < end_datetime,
                    Booking.end_datetime >= end_datetime,
                ),
            ),
        ).first()

        if conflicting_booking:
            return jsonify(
                {"message": "Space is already booked for this time period"}
            ), 400

        # Calculate duration and total amount
        duration = end_datetime - start_datetime
        hours = duration.total_seconds() / 3600
        days = duration.days

        # Calculate total amount based on hourly or daily rate
        total_amount = (
            float(space.day_rate) * days
            if days >= 1
            else float(space.hourly_rate) * hours
        )

        new_booking = Booking(
            user_id=current_user.user_id,
            space_id=data["space_id"],
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            duration=duration,
            total_amount=total_amount,
            status="pending",
        )

        # Create agreement if terms provided
        if "terms" in data:
            agreement = Agreement(terms=data["terms"], signed=False)
            new_booking.agreement = agreement

        db.session.add(new_booking)
        db.session.commit()

        return jsonify(
            {
                "message": "Booking created successfully",
                "booking_id": str(new_booking.booking_id),
                "total_amount": float(total_amount),
            }
        ), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error creating booking", "error": str(e)}), 400


# Verify Booking Endpoint
@app.route("/bookings/<booking_id>/verify", methods=["POST"])
@token_required
def verify_booking(current_user, booking_id):
    try:
        print("this is booking_id", booking_id)
        booking = Booking.query.get_or_404(booking_id)

        # Check if user has permission to verify this booking
        if (
            booking.user_id != current_user.user_id
            and "update" not in current_user.role.permissions.get("bookings", [])
        ):
            return jsonify({"message": "Unauthorized"}), 403

        # Create a new payment
        payment = Payment(
            booking_id=booking.booking_id,
            amount=booking.total_amount,
            status="paid",
            payment_method="paystack",
            transaction_id=str(uuid.uuid4()),
        )

        # Update the booking status to "confirmed"
        booking.status = "confirmed"

        # Create an agreement if terms are provided
        if not booking.agreement:
            agreement = Agreement(
                booking_id=booking.booking_id,
                terms="Default terms and conditions",
                signed=True,
            )
            db.session.add(agreement)

        db.session.add(payment)
        db.session.commit()

        return jsonify(
            {
                "message": "Booking verified successfully",
                "payment_id": str(payment.payment_id),
            }
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error verifying booking", "error": str(e)}), 400


# Admin Bookings Management
@app.route("/admin/bookings", methods=["GET"])
@admin_required
def admin_get_bookings(current_user):
    try:
        # Get query parameters for filtering
        status = request.args.get("status")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        # Base query
        query = Booking.query

        # Apply filters if provided
        if status:
            query = query.filter(Booking.status == status)
        if start_date:
            query = query.filter(
                Booking.start_datetime >= datetime.fromisoformat(start_date)
            )
        if end_date:
            query = query.filter(
                Booking.end_datetime <= datetime.fromisoformat(end_date)
            )

        # Get all bookings with filters applied
        bookings = query.order_by(Booking.created_at.desc()).all()

        return jsonify(
            {
                "bookings": [
                    {
                        "booking_id": str(booking.booking_id),
                        "user": {
                            "user_id": str(booking.user.user_id),
                            "username": booking.user.username,
                            "email": booking.user.email,
                        },
                        "space": {
                            "space_id": str(booking.space.space_id),
                            "name": booking.space.name,
                            "location": booking.space.location,
                            "type": booking.space.type,
                        },
                        "start_datetime": booking.start_datetime.isoformat(),
                        "end_datetime": booking.end_datetime.isoformat(),
                        "duration": str(booking.duration),
                        "total_amount": float(booking.total_amount),
                        "status": booking.status,
                        "created_at": booking.created_at.isoformat(),
                        "agreement": {
                            "signed": booking.agreement.signed,
                            "terms": booking.agreement.terms,
                        }
                        if booking.agreement
                        else None,
                        "payments": [
                            {
                                "payment_id": str(payment.payment_id),
                                "amount": float(payment.amount),
                                "status": payment.status,
                                "payment_method": payment.payment_method,
                                "created_at": payment.created_at.isoformat(),
                            }
                            for payment in booking.payments
                        ],
                    }
                    for booking in bookings
                ]
            }
        )
    except Exception as e:
        return jsonify({"message": "Error fetching bookings", "error": str(e)}), 400


# User Bookings
@app.route("/bookings/my-bookings", methods=["GET"])
@token_required
def get_my_bookings(current_user):
    try:
        # Get query parameters for filtering
        status = request.args.get("status")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        # Base query filtered by current user
        query = Booking.query.filter_by(user_id=current_user.user_id)

        # Apply additional filters if provided
        if status:
            query = query.filter(Booking.status == status)
        if start_date:
            query = query.filter(
                Booking.start_datetime >= datetime.fromisoformat(start_date)
            )
        if end_date:
            query = query.filter(
                Booking.end_datetime <= datetime.fromisoformat(end_date)
            )

        # Get user's bookings with filters applied
        bookings = query.order_by(Booking.created_at.desc()).all()

        return jsonify(
            {
                "bookings": [
                    {
                        "booking_id": str(booking.booking_id),
                        "space": {
                            "space_id": str(booking.space.space_id),
                            "name": booking.space.name,
                            "location": booking.space.location,
                            "type": booking.space.type,
                        },
                        "start_datetime": booking.start_datetime.isoformat(),
                        "end_datetime": booking.end_datetime.isoformat(),
                        "duration": str(booking.duration),
                        "total_amount": float(booking.total_amount),
                        "status": booking.status,
                        "created_at": booking.created_at.isoformat(),
                        "agreement": {
                            "signed": booking.agreement.signed,
                            "terms": booking.agreement.terms,
                        }
                        if booking.agreement
                        else None,
                        "payments": [
                            {
                                "payment_id": str(payment.payment_id),
                                "amount": float(payment.amount),
                                "status": payment.status,
                                "payment_method": payment.payment_method,
                                "created_at": payment.created_at.isoformat(),
                            }
                            for payment in booking.payments
                        ],
                    }
                    for booking in bookings
                ]
            }
        )
    except Exception as e:
        return jsonify({"message": "Error fetching bookings", "error": str(e)}), 400


@app.route("/bookings/<booking_id>", methods=["GET"])
@token_required
def get_booking(current_user, booking_id):
    try:
        booking = Booking.query.get_or_404(booking_id)

        # Check if user has permission to view this booking
        if (
            booking.user_id != current_user.user_id
            and "read" not in current_user.role.permissions.get("bookings", [])
        ):
            return jsonify({"message": "Unauthorized"}), 403

        return jsonify(
            {
                "booking_id": str(booking.booking_id),
                "space": {
                    "space_id": str(booking.space.space_id),
                    "name": booking.space.name,
                    "location": booking.space.location,
                },
                "start_datetime": booking.start_datetime.isoformat(),
                "end_datetime": booking.end_datetime.isoformat(),
                "duration": str(booking.duration),
                "total_amount": float(booking.total_amount),
                "status": booking.status,
                "agreement": {
                    "signed": booking.agreement.signed,
                    "terms": booking.agreement.terms,
                }
                if booking.agreement
                else None,
                "payments": [
                    {
                        "payment_id": str(payment.payment_id),
                        "amount": float(payment.amount),
                        "status": payment.status,
                        "payment_method": payment.payment_method,
                        "created_at": payment.created_at.isoformat(),
                    }
                    for payment in booking.payments
                ],
            }
        )
    except Exception as e:
        return jsonify({"message": "Error fetching booking", "error": str(e)}), 400


# Payment routes
@app.route("/payments", methods=["POST"])
@token_required
def create_payment(current_user):
    try:
        data = request.get_json()

        booking = Booking.query.get_or_404(data["booking_id"])
        if booking.user_id != current_user.user_id:
            return jsonify({"message": "Unauthorized"}), 403

        new_payment = Payment(
            booking_id=booking.booking_id,
            amount=data["amount"],
            payment_method=data["payment_method"],
            status="pending",
            transaction_id=str(uuid.uuid4()),
        )

        db.session.add(new_payment)
        db.session.commit()

        return jsonify(
            {
                "message": "Payment created successfully",
                "payment_id": str(new_payment.payment_id),
            }
        ), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error creating payment", "error": str(e)}), 400


# Review routes
@app.route("/spaces/<space_id>/reviews", methods=["POST"])
@token_required
def create_review(current_user, space_id):
    try:
        data = request.get_json()

        # Check if user has booked this space
        booking = Booking.query.filter_by(
            user_id=current_user.user_id, space_id=space_id, status="completed"
        ).first()

        if not booking:
            return jsonify(
                {"message": "You can only review spaces you have booked"}
            ), 403

        # Check if user has already reviewed this space
        existing_review = Review.query.filter_by(
            user_id=current_user.user_id, space_id=space_id
        ).first()

        if existing_review:
            return jsonify({"message": "You have already reviewed this space"}), 400

        new_review = Review(
            user_id=current_user.user_id,
            space_id=space_id,
            rating=data["rating"],
            comment=data["comment"],
        )

        db.session.add(new_review)
        db.session.commit()

        return jsonify(
            {
                "message": "Review created successfully",
                "review_id": str(new_review.review_id),
            }
        ), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error creating review", "error": str(e)}), 400


# Role Management routes
@app.route("/roles", methods=["POST"])
@token_required
def create_role(current_user):
    # Check if user has admin privileges
    if current_user.role_id != 1:  # Assuming 1 is admin role
        return jsonify({"message": "Unauthorized - Admin access required"}), 403

    data = request.get_json()
    new_role = Role(role_name=data["role_name"], permissions=data["permissions"])

    db.session.add(new_role)
    db.session.commit()

    return jsonify(
        {"message": "Role created successfully", "role_id": new_role.role_id}
    ), 201


@app.route("/roles", methods=["GET"])
def get_roles():
    roles = Role.query.all()
    return jsonify(
        [
            {
                "role_id": role.role_id,
                "role_name": role.role_name,
                "permissions": role.permissions,
            }
            for role in roles
        ]
    )


@app.route("/roles/<int:role_id>", methods=["PUT"])
@token_required
def update_role(current_user, role_id):
    if current_user.role_id != 1:  # Assuming 1 is admin role
        return jsonify({"message": "Unauthorized - Admin access required"}), 403

    role = Role.query.get_or_404(role_id)
    data = request.get_json()

    role.role_name = data.get("role_name", role.role_name)
    role.permissions = data.get("permissions", role.permissions)

    db.session.commit()

    return jsonify(
        {
            "message": "Role updated successfully",
            "role": {
                "role_id": role.role_id,
                "role_name": role.role_name,
                "permissions": role.permissions,
            },
        }
    )


# Admin Space Management
@app.route("/admin/spaces", methods=["GET"])
@admin_required
def admin_get_spaces(current_user):
    try:
        spaces = Space.query.all()
        return jsonify(
            {
                "spaces": [
                    {
                        "space_id": str(space.space_id),
                        "name": space.name,
                        "description": space.description,
                        "location": space.location,
                        "type": space.type,  # Added type field
                        "hourly_rate": float(space.hourly_rate),
                        "day_rate": float(space.day_rate),
                        "capacity": space.capacity,
                        "status": space.status,
                        "created_at": space.created_at.isoformat(),
                        "updated_at": space.updated_at.isoformat(),
                        "bookings_count": len(space.bookings),
                        "average_rating": db.session.query(db.func.avg(Review.rating))
                        .filter(Review.space_id == space.space_id)
                        .scalar()
                        or 0,
                        "images": [
                            {
                                "image_id": str(img.image_id),
                                "url": f"/static/space_images/{img.image_filename}",
                            }
                            for img in space.images
                        ],
                    }
                    for space in spaces
                ]
            }
        )
    except Exception as e:
        return jsonify({"message": "Error fetching spaces", "error": str(e)}), 400


@app.route("/admin/spaces/<space_id>", methods=["PUT"])
@admin_required
def admin_update_space(current_user, space_id):
    try:
        space = Space.query.get_or_404(space_id)
        data = request.get_json()
        files = request.files.getlist("images")

        # Update space details
        space.name = data.get("name", space.name)
        space.description = data.get("description", space.description)
        space.location = data.get("location", space.location)
        space.type = data.get("type", space.type)  # Added type field
        space.hourly_rate = data.get("hourly_rate", space.hourly_rate)
        space.day_rate = data.get("day_rate", space.day_rate)
        space.capacity = data.get("capacity", space.capacity)
        space.status = data.get("status", space.status)

        # Update images
        if files:
            SpaceImage.query.filter_by(space_id=space_id).delete()
            for file in files:
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    file.save(
                        os.path.join(app.root_path, SPACE_UPLOAD_FOLDER, filename)
                    )
                    new_image = SpaceImage(image_filename=filename, space_id=space_id)
                    db.session.add(new_image)

        db.session.commit()
        return jsonify({"message": "Space updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error updating space", "error": str(e)}), 400


# Admin User Management
@app.route("/admin/users", methods=["GET"])
@admin_required
def admin_get_users(current_user):
    try:
        users = User.query.all()
        return jsonify(
            {
                "users": [
                    {
                        "user_id": str(user.user_id),
                        "username": user.username,
                        "email": user.email,
                        "role": {
                            "role_id": user.role.role_id,
                            "role_name": user.role.role_name,
                        },
                        "created_at": user.created_at.isoformat(),
                        "bookings_count": len(user.bookings),
                        "reviews_count": len(user.reviews),
                    }
                    for user in users
                ]
            }
        )
    except Exception as e:
        return jsonify({"message": "Error fetching users", "error": str(e)}), 400


@app.route("/admin/users", methods=["POST"])
@admin_required
def admin_create_user(current_user):
    try:
        data = request.get_json()

        # Check if user already exists
        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"message": "Email already exists"}), 400

        if User.query.filter_by(username=data["username"]).first():
            return jsonify({"message": "Username already exists"}), 400

        # Create new user
        hashed_password = generate_password_hash(data["password"])
        new_user = User(
            username=data["username"],
            email=data["email"],
            password=hashed_password,
            role_id=data["role_id"],
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify(
            {"message": "User created successfully", "user_id": str(new_user.user_id)}
        ), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error creating user", "error": str(e)}), 400


# Admin User Management
@app.route("/admin/users/<user_id>", methods=["DELETE"])
@admin_required
def admin_delete_user(current_user, user_id):
    try:
        user = User.query.get_or_404(user_id)
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "User deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error deleting user", "error": str(e)}), 400


# Admin Space Management
@app.route("/admin/spaces/<space_id>", methods=["DELETE"])
@admin_required
def admin_delete_space(current_user, space_id):
    try:
        space = Space.query.get_or_404(space_id)

        # Delete associated images
        SpaceImage.query.filter_by(space_id=space_id).delete()

        # Delete the space
        db.session.delete(space)
        db.session.commit()

        return jsonify({"message": "Space deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error deleting space", "error": str(e)}), 400


@app.route("/admin/users/<user_id>", methods=["PUT"])
@admin_required
def admin_update_user(current_user, user_id):
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()

        # Update user details
        if "username" in data:
            # Check if new username is already taken
            existing_user = User.query.filter_by(username=data["username"]).first()
            if existing_user and existing_user.user_id != user.user_id:
                return jsonify({"message": "Username already exists"}), 400
            user.username = data["username"]

        if "email" in data:
            # Check if new email is already taken
            existing_user = User.query.filter_by(email=data["email"]).first()
            if existing_user and existing_user.user_id != user.user_id:
                return jsonify({"message": "Email already exists"}), 400
            user.email = data["email"]

        if "password" in data:
            user.password = generate_password_hash(data["password"])

        if "role_id" in data:
            # Verify role exists
            role = Role.query.get(data["role_id"])
            if not role:
                return jsonify({"message": "Invalid role ID"}), 400
            user.role_id = data["role_id"]

        db.session.commit()
        return jsonify(
            {
                "message": "User updated successfully",
                "user": {
                    "user_id": str(user.user_id),
                    "username": user.username,
                    "email": user.email,
                    "role": {
                        "role_id": user.role.role_id,
                        "role_name": user.role.role_name,
                    },
                },
            }
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error updating user", "error": str(e)}), 400


# Add this function to create initial roles
def create_initial_roles():
    # Check if roles already exist
    if Role.query.first() is not None:
        return

    # Define initial roles
    initial_roles = [
        {
            "role_name": "Admin",
            "permissions": {
                "users": ["create", "read", "update", "delete"],
                "roles": ["create", "read", "update", "delete"],
                "spaces": ["create", "read", "update", "delete"],
                "bookings": ["create", "read", "update", "delete"],
                "payments": ["create", "read", "update", "delete"],
            },
        },
        {
            "role_name": "Space Manager",
            "permissions": {
                "spaces": ["create", "read", "update"],
                "bookings": ["read", "update"],
                "payments": ["read"],
            },
        },
        {
            "role_name": "User",
            "permissions": {
                "spaces": ["read"],
                "bookings": ["create", "read"],
                "payments": ["create", "read"],
            },
        },
    ]

    # Create roles
    for role_data in initial_roles:
        role = Role(
            role_name=role_data["role_name"], permissions=role_data["permissions"]
        )
        db.session.add(role)

    db.session.commit()


# Modify the main block to include role initialization
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        create_initial_roles()
    app.run(debug=True)
