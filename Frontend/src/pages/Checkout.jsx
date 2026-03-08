import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

export default function Checkout({ cartItems, setCartItems }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        flatHouse: '',
        areaStreet: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India',
        phone: ''
    });

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [locationLoading, setLocationLoading] = useState(false);
    const [shipping, setShipping] = useState(null);
    const [shippingLoading, setShippingLoading] = useState(true);
    const [destCoords, setDestCoords] = useState(null);

    const subtotal = (cartItems || []).reduce(
        (sum, item) => sum + (item.product?.price || 0) * item.qty,
        0
    );
    const shippingCharge = shipping?.shippingCharge || 0;
    const total = subtotal + shippingCharge;

    /* =====================================
       1️⃣ Load Saved Profile Address & Location
    ===================================== */
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;

            try {
                const { data } = await API.get('/users/profile');

                if (data?.address) {
                    setForm(prev => ({
                        ...prev,
                        ...data.address
                    }));
                }

                // Use saved profile location coords for shipping calculation
                if (data?.location?.lat && data?.location?.lng) {
                    setDestCoords({ lat: data.location.lat, lng: data.location.lng });
                }
            } catch (err) {
                console.log("No saved profile address");
            }

            setLocationLoading(false);
        };

        fetchProfile();
    }, [user]);

    /* =====================================
       1.5️⃣ Fetch Shipping Cost (based on saved profile coordinates)
    ===================================== */
    useEffect(() => {
        if (!user || !destCoords) return;
        const fetchShipping = async () => {
            setShippingLoading(true);
            try {
                const params = destCoords.lat && destCoords.lng
                    ? `?lat=${destCoords.lat}&lng=${destCoords.lng}`
                    : '';
                const { data } = await API.get(`/orders/shipping${params}`);
                setShipping(data);
            } catch (err) {
                console.log('Shipping calc error:', err);
                setShipping(null);
            }
            setShippingLoading(false);
        };
        fetchShipping();
    }, [user, destCoords]);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.areaStreet || !form.city || !form.state || !form.zipCode) {
            setError('Please fill in all address fields');
            return;
        }

        setLoading(true);

        try {
            // Place Order
            await API.post('/orders', {
                shippingAddress: form,
                paymentMethod,
                destLat: destCoords?.lat,
                destLng: destCoords?.lng
            });

            // Save address to profile
            await API.put('/users/address', form);

            setCartItems([]);
            navigate('/orders');

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to place order');
        }

        setLoading(false);
    };

    // ✅ Check if smart location is enabled (GPS + address must be set)
    const isLocationEnabled =
        user?.location?.lat && user?.location?.lng &&
        user?.address?.areaStreet && user?.address?.city;

    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="page container">
                <div className="empty-state">
                    <div className="icon">🛒</div>
                    <h3>No items to checkout</h3>
                    <p>Add items to your cart first</p>
                </div>
            </div>
        );
    }

    /* 🔒 Block checkout if Smart Location is disabled */
    if (!isLocationEnabled) {
        return (
            <div className="page container">
                <div className="page-header">
                    <h1 className="page-title">Checkout</h1>
                    <p className="page-subtitle">Complete your order</p>
                </div>
                <div className="empty-state" style={{ textAlign: 'center' }}>
                    <div className="icon">🔒</div>
                    <h3>Smart Location Required</h3>
                    <p style={{ marginBottom: '10px' }}>
                        Please enable Smart Location and fill your address in your Profile before placing an order.
                    </p>
                    <a href="/profile" className="btn btn-primary">
                        📍 Go to Profile & Enable Location
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="page container">
            <div className="page-header">
                <h1 className="page-title">Checkout</h1>
                <p className="page-subtitle">Complete your order</p>
            </div>

            {locationLoading && (
                <div className="alert alert-info">
                    📍 Detecting your location...
                </div>
            )}

            <div className="checkout-layout">
                <form className="checkout-form" onSubmit={handleSubmit}>
                    {error && <div className="alert alert-error">{error}</div>}

                    <div className="checkout-section">
                        <h3>📍 Shipping Address</h3>

                        <div className="form-group">
                            <label>Flat, House no., Building, Company, Apartment</label>
                            <input
                                type="text"
                                name="flatHouse"
                                className="form-input"
                                placeholder="e.g. Flat 101, ABC Building"
                                value={form.flatHouse}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Area, Street, Sector, Village</label>
                            <input
                                type="text"
                                name="areaStreet"
                                className="form-input"
                                placeholder="e.g. MG Road, Sector 5"
                                value={form.areaStreet}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>City</label>
                                <input
                                    type="text"
                                    name="city"
                                    className="form-input"
                                    placeholder="Mumbai"
                                    value={form.city}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>State</label>
                                <input
                                    type="text"
                                    name="state"
                                    className="form-input"
                                    placeholder="Maharashtra"
                                    value={form.state}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>ZIP Code</label>
                                <input
                                    type="text"
                                    name="zipCode"
                                    className="form-input"
                                    placeholder="400001"
                                    value={form.zipCode}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    className="form-input"
                                    value={form.country}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>📞 Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                className="form-input"
                                placeholder="e.g. 9876543210"
                                value={form.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="checkout-section">
                        <h3>💳 Payment Method</h3>

                        <div className="payment-options">
                            <label className={`payment-option ${paymentMethod === 'COD' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="COD"
                                    checked={paymentMethod === 'COD'}
                                    onChange={() => setPaymentMethod('COD')}
                                />
                                <span className="payment-icon">🏠</span>
                                <div>
                                    <strong>Cash on Delivery</strong>
                                    <p>Pay when you receive</p>
                                </div>
                            </label>

                            <label className={`payment-option ${paymentMethod === 'Online' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value="Online"
                                    checked={paymentMethod === 'Online'}
                                    onChange={() => setPaymentMethod('Online')}
                                />
                                <span className="payment-icon">💳</span>
                                <div>
                                    <strong>Online Payment</strong>
                                    <p>Scan QR & pay via UPI</p>
                                </div>
                            </label>
                        </div>

                        {/* QR Code for Online Payment */}
                        {paymentMethod === 'Online' && (
                            <div className="qr-payment-section">
                                <div className="qr-card">
                                    <h4>📱 Scan to Pay</h4>
                                    <img
                                        src="/images/payment-qr.png"
                                        alt="PhonePe Payment QR Code"
                                        className="qr-image"
                                    />
                                    <p className="qr-instruction">
                                        Scan this QR code with <strong>PhonePe</strong>, <strong>Google Pay</strong>, or any UPI app
                                    </p>
                                    <a
                                        href={`upi://pay?pa=9356829889@ybl&pn=Buyzera&am=${total}&cu=INR&tn=Buyzera+Order+Payment`}
                                        className="btn btn-primary"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '12px 28px',
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            borderRadius: '12px',
                                            marginTop: '10px',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        💰 Pay: <strong>₹{total.toLocaleString()}</strong>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                        disabled={loading || shippingLoading || (shipping && !shipping.deliverable)}
                    >
                        {loading
                            ? 'Placing Order...'
                            : (shipping && !shipping.deliverable)
                                ? `❌ Cannot Deliver — ${shipping.distance} km away`
                                : `Place Order — ₹${total.toLocaleString()}`}
                    </button>
                </form>

                <div className="checkout-summary card">
                    <h3>Order Summary</h3>

                    {cartItems.map(item => (
                        <div key={item._id} className="checkout-item">
                            <img
                                src={item.product?.image}
                                alt=""
                                className="checkout-item-img"
                            />
                            <div className="checkout-item-info">
                                <span>{item.product?.name}</span>
                                <span className="checkout-item-qty">
                                    Qty: {item.qty}
                                </span>
                            </div>
                            <span className="checkout-item-price">
                                ₹{((item.product?.price || 0) * item.qty).toLocaleString()}
                            </span>
                        </div>
                    ))}

                    <hr />

                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toLocaleString()}</span>
                    </div>

                    <div className="summary-row">
                        <span>🚚 Shipping</span>
                        <span style={{ color: shipping && !shipping.deliverable ? '#dc2626' : '#059669', fontWeight: 600 }}>
                            {shippingLoading ? 'Calculating...' :
                                shipping ? (shipping.deliverable ? `₹${shipping.shippingCharge.toLocaleString()}` : 'Not Available') : 'N/A'
                            }
                        </span>
                    </div>

                    {shipping && !shipping.deliverable && (
                        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, marginTop: '8px' }}>
                            ⚠️ This item cannot be shipped to your selected delivery location. Please choose a different delivery location.
                        </div>
                    )}

                    <div className="summary-row summary-total">
                        <span>Total</span>
                        <span>₹{total.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}