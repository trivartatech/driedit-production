from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum

# Enums
class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class ReturnStatus(str, Enum):
    NONE = "none"
    REQUESTED = "requested"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"

class PaymentMethod(str, Enum):
    RAZORPAY = "razorpay"
    COD = "cod"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

# User Models
class User(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    password: Optional[str] = None  # Hashed password (null for Google users)
    picture: Optional[str] = None
    auth_provider: str = "email"  # "email" or "google"
    role: UserRole = UserRole.USER
    is_verified: bool = False
    wishlist: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Category Models
class Category(BaseModel):
    category_id: str
    name: str
    slug: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CategoryCreate(BaseModel):
    name: str
    slug: str

# Product Models
class Product(BaseModel):
    product_id: str
    title: str
    category_id: str
    category_name: str
    regular_price: float
    discounted_price: float
    sizes: List[str]
    stock: int
    images: List[str]
    description: str
    sales_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    title: str
    category_id: str
    regular_price: float
    discounted_price: float
    sizes: List[str]
    stock: int
    images: List[str]
    description: str

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    category_id: Optional[str] = None
    regular_price: Optional[float] = None
    discounted_price: Optional[float] = None
    sizes: Optional[List[str]] = None
    stock: Optional[int] = None
    images: Optional[List[str]] = None
    description: Optional[str] = None

# Order Models
class OrderItem(BaseModel):
    product_id: str
    product_title: str
    product_image: str
    size: str
    quantity: int
    price: float
    subtotal: float

class Order(BaseModel):
    order_id: str
    user_id: str
    items: List[OrderItem]
    subtotal: float
    gst_amount: float
    shipping_charge: float
    total: float
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    order_status: OrderStatus = OrderStatus.PENDING
    tracking_id: Optional[str] = None
    courier: Optional[str] = None
    return_status: ReturnStatus = ReturnStatus.NONE
    return_reason: Optional[str] = None
    return_image: Optional[str] = None
    delivery_address: dict
    pincode: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    items: List[OrderItem]
    payment_method: PaymentMethod
    delivery_address: dict
    pincode: str

# Review Models
class Review(BaseModel):
    review_id: str
    product_id: str
    user_id: str
    user_name: str
    rating: int = Field(ge=1, le=5)
    review_text: str
    verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReviewCreate(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    review_text: str

# Pincode Models
class Pincode(BaseModel):
    pincode: str
    shipping_charge: float
    cod_available: bool
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PincodeCreate(BaseModel):
    pincode: str
    shipping_charge: float
    cod_available: bool

# GST Settings
class GSTSettings(BaseModel):
    gst_percentage: float = 18.0
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Hero Banner Models
class HeroBanner(BaseModel):
    banner_id: str
    image: str
    button_text: str
    redirect_url: str
    active: bool = True
    order_position: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class HeroBannerCreate(BaseModel):
    image: str
    button_text: str
    redirect_url: str
    active: bool = True
    order_position: int

# Popup Models
class Popup(BaseModel):
    popup_id: str
    title: str
    description: str
    image: Optional[str] = None
    button_text: str
    redirect_url: str
    active: bool = True
    display_type: str = "once_per_session"  # once_per_session, every_visit, after_seconds
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PopupCreate(BaseModel):
    title: str
    description: str
    image: Optional[str] = None
    button_text: str
    redirect_url: str
    active: bool = True
    display_type: str = "once_per_session"

# Return Request Models
class ReturnItemDetail(BaseModel):
    product_id: str
    product_title: str
    product_image: str
    size: str
    quantity: int

class ReturnRequest(BaseModel):
    request_id: str
    order_id: str
    user_id: str
    items: List[ReturnItemDetail] = []
    reason: str
    comments: Optional[str] = None
    images: List[str] = []
    status: ReturnStatus = ReturnStatus.REQUESTED
    admin_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ReturnRequestCreate(BaseModel):
    order_id: str
    items: List[ReturnItemDetail]
    reason: str
    comments: Optional[str] = None
    images: List[str] = []

# Cart Models
class CartItem(BaseModel):
    product_id: str
    size: str
    quantity: int

class Cart(BaseModel):
    cart_id: str
    user_id: str
    items: List[CartItem] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CartItemAdd(BaseModel):
    product_id: str
    size: str
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int
