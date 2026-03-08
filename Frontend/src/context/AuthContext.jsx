import { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// 🔑 Separate storage keys for admin vs customer
const CUSTOMER_KEY = 'buyzera_customer';
const ADMIN_KEY = 'buyzera_admin';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🔹 Load stored user on refresh — based on current URL path
    useEffect(() => {
        // 🧹 Clean up old shared key (from before session separation)
        localStorage.removeItem('buyzera_user');

        const isAdminPage = window.location.pathname.startsWith('/admin');
        const storageKey = isAdminPage ? ADMIN_KEY : CUSTOMER_KEY;

        const stored = localStorage.getItem(storageKey);
        if (stored) {
            const parsed = JSON.parse(stored);
            setUser(parsed.user);
            setToken(parsed.token);
            API.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
        }
        setLoading(false);
    }, []);

    // 🔥 LOCATION FUNCTION
    const requestUserLocation = async () => {
        if (!navigator.geolocation) {
            console.log("Geolocation not supported");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;

                    await API.put('/auth/profile', {
                        location: {
                            latitude,
                            longitude
                        },
                        locationUpdatedAt: new Date()
                    });

                    // ✅ Update local user state with normalized location
                    setUser(prev => ({
                        ...prev,
                        location: { lat: latitude, lng: longitude }
                    }));

                    // ✅ Update localStorage too (customer only)
                    const stored = localStorage.getItem(CUSTOMER_KEY);
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        parsed.user.location = { lat: latitude, lng: longitude };
                        localStorage.setItem(CUSTOMER_KEY, JSON.stringify(parsed));
                    }

                    console.log("✅ Location saved successfully");

                } catch (error) {
                    console.log("❌ Error saving location:", error.message);
                }
            },
            (error) => {
                console.log("❌ Location permission denied");
            }
        );
    };

    // 🔐 LOGIN
    const login = async (email, password, isAdmin = false) => {
        const endpoint = isAdmin ? '/auth/admin/login' : '/auth/login';

        const { data } = await API.post(endpoint, { email, password });

        const userData = {
            _id: data._id,
            name: data.name,
            email: data.email,
            role: data.role,
            location: data.location || null,
            address: data.address || null
        };

        setUser(userData);
        setToken(data.token);

        API.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

        // 🔑 Save to the correct storage key
        const storageKey = isAdmin ? ADMIN_KEY : CUSTOMER_KEY;
        localStorage.setItem(
            storageKey,
            JSON.stringify({ user: userData, token: data.token })
        );

        // 🔥 Ask location permission AFTER login success (customer only)
        if (!isAdmin) {
            requestUserLocation();
        }

        return userData;
    };

    // 📝 REGISTER
    const register = async (name, email, password, phone, isAdmin = false) => {
        const endpoint = isAdmin ? '/auth/admin/register' : '/auth/register';
        const { data } = await API.post(endpoint, { name, email, password, phone });
        return data;
    };

    // 🚪 LOGOUT
    const logout = () => {
        const isAdmin = user?.role === 'admin';
        setUser(null);
        setToken(null);
        delete API.defaults.headers.common['Authorization'];

        // 🔑 Remove only the correct session
        if (isAdmin) {
            localStorage.removeItem(ADMIN_KEY);
        } else {
            localStorage.removeItem(CUSTOMER_KEY);
        }
    };

    // 🔄 UPDATE PROFILE
    const updateProfile = async (profileData) => {
        const { data } = await API.put('/auth/profile', profileData);

        const userData = {
            _id: data._id,
            name: data.name,
            email: data.email,
            role: data.role,
            location: data.location || null,
            address: data.address || null
        };

        setUser(userData);

        // 🔑 Save to the correct storage key
        const isAdmin = userData.role === 'admin';
        const storageKey = isAdmin ? ADMIN_KEY : CUSTOMER_KEY;
        localStorage.setItem(
            storageKey,
            JSON.stringify({ user: userData, token })
        );

        return data;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                register,
                logout,
                updateProfile
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}