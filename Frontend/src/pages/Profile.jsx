import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import './Profile.css';

export default function Profile() {
    const { user, updateProfile } = useAuth();
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [addressSaving, setAddressSaving] = useState(false);

    useEffect(() => {
        API.get('/auth/profile')
            .then(res => {
                setProfile(res.data);
                setForm({
                    name: res.data.name || '',
                    phone: res.data.phone || '',
                    flatHouse: res.data.address?.flatHouse || '',
                    areaStreet: res.data.address?.areaStreet || '',
                    city: res.data.address?.city || '',
                    state: res.data.address?.state || '',
                    zipCode: res.data.address?.zipCode || '',
                    country: res.data.address?.country || 'India'
                });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    // 🔥 GET CURRENT LOCATION (GPS)
    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation not supported");
            return;
        }

        setGettingLocation(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;

                    // Reverse Geocoding (OpenStreetMap Free API)
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();

                    const address = data.address;

                    const addressData = {
                        flatHouse: address.house_number || '',
                        areaStreet: address.road || address.suburb || address.neighbourhood || address.village || '',
                        city: address.city || address.town || address.village || '',
                        state: address.state || '',
                        zipCode: address.postcode || '',
                        country: address.country || 'India'
                    };

                    setForm(prev => ({
                        ...prev,
                        ...addressData
                    }));

                    // Save location + address to backend
                    await updateProfile({
                        location: { latitude, longitude },
                        address: addressData
                    });

                    // Refresh profile to update location status
                    const profileRes = await API.get('/auth/profile');
                    setProfile(profileRes.data);

                    setMessage("✅ Location & address detected successfully!");
                    setTimeout(() => setMessage(''), 3000);

                } catch (error) {
                    setMessage("❌ Failed to detect location");
                    setTimeout(() => setMessage(''), 3000);
                } finally {
                    setGettingLocation(false);
                }
            },
            () => {
                setGettingLocation(false);
                setMessage("❌ Location permission denied. Please allow location access or type your address manually.");
                setTimeout(() => setMessage(''), 5000);
            }
        );
    };

    // ✏️ SAVE MANUALLY TYPED ADDRESS (text only — GPS sets coordinates)
    const handleSaveAddress = async () => {
        if (!form.areaStreet || !form.city || !form.state || !form.zipCode) {
            setMessage("⚠️ Please fill in Area/Street, City, State, and ZIP Code");
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setAddressSaving(true);

        try {
            const addressData = {
                flatHouse: form.flatHouse,
                areaStreet: form.areaStreet,
                city: form.city,
                state: form.state,
                zipCode: form.zipCode,
                country: form.country
            };

            // Save address text only (do NOT overwrite GPS coordinates)
            await updateProfile({ address: addressData });
            await API.put('/users/address', addressData);

            // Refresh profile
            const profileRes = await API.get('/auth/profile');
            setProfile(profileRes.data);

            const hasCoords = profileRes.data?.location?.lat && profileRes.data?.location?.lng;
            if (hasCoords) {
                setMessage("✅ Address saved successfully!");
            } else {
                setMessage("✅ Address saved! Now tap 📍 Use Current Location above to set your delivery coordinates for accurate shipping.");
            }
            setTimeout(() => setMessage(''), 5000);

        } catch (error) {
            setMessage("❌ Failed to save address");
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setAddressSaving(false);
        }
    };

    // Save personal info (name, phone)
    const handleSave = async () => {
        try {
            await updateProfile({
                name: form.name,
                phone: form.phone
            });

            setMessage('✅ Profile updated successfully!');
            setEditing(false);
            setTimeout(() => setMessage(''), 3000);
        } catch {
            setMessage('❌ Failed to update profile');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const hasLocation = profile?.location?.lat && profile?.location?.lng;

    if (loading)
        return <div className="page container"><div className="spinner"></div></div>;

    return (
        <div className="page container">
            <div className="page-header">
                <h1 className="page-title">My Profile</h1>
                <p className="page-subtitle">Manage your account details</p>
            </div>

            {message && (
                <div className={`alert ${message.includes('✅') ? 'alert-success' : message.includes('⚠️') ? 'alert-warning' : 'alert-error'}`}>
                    {message}
                </div>
            )}

            <div className="profile-layout">
                <div className="profile-card card">
                    <div className="profile-avatar">
                        <div className="avatar-circle">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2>{profile?.name}</h2>
                            <p>{profile?.email}</p>
                            <span className="badge badge-success">User</span>
                        </div>
                    </div>
                    <p className="profile-joined">
                        Joined {(() => {
                            const val = profile?.createdAt;
                            if (!val) return '—';
                            if (val._seconds || val.seconds) {
                                return new Date((val._seconds || val.seconds) * 1000).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                            }
                            const d = new Date(val);
                            return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                        })()}
                    </p>

                    {/* Location Status */}
                    <div className="location-status-card" style={{ marginTop: '16px' }}>
                        {hasLocation ? (
                            <>
                                <div className="location-badge location-badge-active">
                                    <span>📍</span> Location Set
                                </div>
                                <p className="location-coords">
                                    {profile.location.lat.toFixed(4)}, {profile.location.lng.toFixed(4)}
                                </p>
                            </>
                        ) : (
                            <div className="location-badge location-badge-inactive">
                                <span>⚠️</span> Location Not Set
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-sections">
                    {/* Personal Information Section */}
                    <div className="profile-details card">
                        <div className="profile-details-header">
                            <h3>👤 Personal Information</h3>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setEditing(!editing)}
                            >
                                {editing ? 'Cancel' : '✏️ Edit'}
                            </button>
                        </div>

                        <div className="profile-fields">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" name="name" className="form-input"
                                    value={form.name} onChange={handleChange} disabled={!editing} />
                            </div>

                            <div className="form-group">
                                <label>Phone</label>
                                <input type="tel" name="phone" className="form-input"
                                    value={form.phone} onChange={handleChange} disabled={!editing} />
                            </div>

                            {editing && (
                                <button className="btn btn-primary" onClick={handleSave}>
                                    Save Changes
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Address & Location Section */}
                    <div className="profile-details card">
                        <div className="profile-details-header">
                            <h3>📍 Address & Location</h3>
                        </div>

                        {/* Address Method Selector */}
                        <div className="address-method-section">
                            <p className="address-method-desc">
                                Set your delivery address using one of the methods below.
                                <strong> GPS is recommended</strong> for accurate shipping distance.
                            </p>

                            <div className="address-methods">
                                <button
                                    className="address-method-btn gps-btn"
                                    onClick={handleUseCurrentLocation}
                                    disabled={gettingLocation}
                                >
                                    <span className="method-icon">📍</span>
                                    <div className="method-info">
                                        <strong>{gettingLocation ? 'Detecting...' : 'Use Current Location'} <span className="recommended-tag">✓ Recommended</span></strong>
                                        <p>Most accurate — auto-detects via GPS</p>
                                    </div>
                                    {gettingLocation && <div className="spinner-small"></div>}
                                </button>
                            </div>

                            <div className="address-divider">
                                <span>or type your address below (approximate location)</span>
                            </div>
                        </div>

                        {/* Address Fields (always editable) */}
                        <div className="profile-fields">
                            <div className="form-group">
                                <label>Flat, House no., Building, Company, Apartment</label>
                                <input type="text" name="flatHouse" className="form-input"
                                    placeholder="e.g. Flat 101, ABC Building"
                                    value={form.flatHouse} onChange={handleChange} />
                            </div>

                            <div className="form-group">
                                <label>Area, Street, Sector, Village <span className="required">*</span></label>
                                <input type="text" name="areaStreet" className="form-input"
                                    placeholder="e.g. MG Road, Sector 5"
                                    value={form.areaStreet} onChange={handleChange} />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>City <span className="required">*</span></label>
                                    <input type="text" name="city" className="form-input"
                                        placeholder="e.g. Bhiwandi"
                                        value={form.city} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>State <span className="required">*</span></label>
                                    <input type="text" name="state" className="form-input"
                                        placeholder="e.g. Maharashtra"
                                        value={form.state} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>ZIP Code <span className="required">*</span></label>
                                    <input type="text" name="zipCode" className="form-input"
                                        placeholder="e.g. 421302"
                                        value={form.zipCode} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Country</label>
                                    <input type="text" name="country" className="form-input"
                                        value={form.country} onChange={handleChange} />
                                </div>
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={handleSaveAddress}
                                disabled={addressSaving}
                                style={{ marginTop: '8px' }}
                            >
                                {addressSaving ? '💾 Saving...' : '💾 Save Address'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}