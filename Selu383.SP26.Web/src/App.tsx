import { useState, useEffect } from 'react';
import './App.css';

type CartItem = { name: string; price: number };

// The list of messages for our rotating banner

const PROMOS = [
    '📱 App Exclusive: 20% off your first mobile order!',
    '☕ Double Bits Happy Hour: 2PM - 4PM',
    '✨ Try the new Iced Cyan Macchiato today!'
];

function App() {
    const [activeTab, setActiveTab] = useState('Home');
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [toastMessage, setToastMessage] = useState('');

    const [activeOrder, setActiveOrder] = useState<{ itemCount: number; waitTime: number } | null>(null);
    const [reservation, setReservation] = useState<{ size: number; time: string } | null>(null);

    const [resSize, setResSize] = useState(2);
    const [resTime, setResTime] = useState('');

    //State for the rotating promo banner

    const [promoIndex, setPromoIndex] = useState(0);

    // Engine that rotates the banner every 4 seconds

    useEffect(() => {
        const interval = setInterval(() => {
            setPromoIndex((prev) => (prev + 1) % PROMOS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);

    const handleOrder = (itemName: string, price: number) => {
        setCartItems((prev) => [...prev, { name: itemName, price }]);
        setToastMessage(`Added ${itemName} to cart!`);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const handleCheckout = () => {
        const minWait = cartItems.length * 2;
        const maxWait = cartItems.length * 5;
        const estimatedWait = Math.floor(Math.random() * (maxWait - minWait + 1)) + minWait;

        setActiveOrder({ itemCount: cartItems.length, waitTime: estimatedWait });
        setToastMessage('Order sent to the barista!');
        setCartItems([]);
        setTimeout(() => {
            setToastMessage('');
            setActiveTab('Home');
        }, 2000);
    };

    const handleReserve = () => {
        if (!resTime) {
            setToastMessage('Please select a time!');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }
        setReservation({ size: resSize, time: resTime });
        setToastMessage('Table reserved!');
        setTimeout(() => {
            setToastMessage('');
            setActiveTab('Home');
        }, 2000);
    };

    return (
        <div className="app-container">
            {toastMessage && <div className="toast-notification">{toastMessage}</div>}

            {/* --- ANIMATED PROMO BANNER --- */}
            <div className="promo-banner">
                {/* The 'key' tells React to re-trigger the animation every time the index changes */}
                <span key={promoIndex} className="animated-promo">{PROMOS[promoIndex]}</span>
            </div>

            {/* --- HOME TAB --- */}
            {activeTab === 'Home' && (
                <>
                    <header className="header">
                        <h1>Brew & Byte</h1>
                        <p>Good morning! Skip the line, order ahead.</p>
                    </header>

                    <main className="menu-container">
                        {(activeOrder || reservation) && (
                            <div className="live-status-container">
                                {activeOrder && (
                                    <div className="status-card glowing-outline">
                                        <div className="status-header">
                                            <h3>🛍️ Preparing Order</h3>
                                            <span className="wait-time">{activeOrder.waitTime} min wait</span>
                                        </div>
                                        <p>{activeOrder.itemCount} item(s) • Pick up at the counter</p>
                                        <button className="text-btn" onClick={() => setActiveOrder(null)}>Mark as Picked Up</button>
                                    </div>
                                )}
                                {reservation && (
                                    <div className="status-card regular-outline">
                                        <div className="status-header">
                                            <h3>🪑 Table Reserved</h3>
                                            <span className="wait-time">Today, {resTime}</span>
                                        </div>
                                        <p>Party of {reservation.size} • 📍 Campus Branch</p>
                                        <button className="text-btn" onClick={() => setReservation(null)}>Cancel Reservation</button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="quick-actions">
                            <button className="action-btn primary-action" onClick={() => setActiveTab('Menu')}>☕ Full Menu</button>
                            <button className="action-btn secondary-action" onClick={() => setActiveTab('Reservations')}>🪑 Reserve</button>
                        </div>

                        <h2 className="section-title">Today's Specials</h2>
                        <div className="coffee-card regular-outline">
                            <div className="coffee-info">
                                <h3>Iced Cyan Macchiato</h3>
                                <p>Our signature espresso with a splash of blue curacao syrup and oat milk.</p>
                                <span className="price">$5.50</span>
                            </div>
                            <button className="order-btn" onClick={() => handleOrder('Iced Cyan Macchiato', 5.50)}>+ Add</button>
                        </div>
                        <div className="coffee-card regular-outline">
                            <div className="coffee-info">
                                <h3>Nitro Cold Brew</h3>
                                <p>Smooth, creamy, and heavily caffeinated. On tap.</p>
                                <span className="price">$4.75</span>
                            </div>
                            <button className="order-btn" onClick={() => handleOrder('Nitro Cold Brew', 4.75)}>+ Add</button>
                        </div>
                    </main>
                </>
            )}

            {/* --- MENU TAB --- */}
            {activeTab === 'Menu' && (
                <>
                    <header className="header">
                        <h1>Full Menu</h1>
                        <p>Handcrafted drinks & fresh pastries.</p>
                    </header>
                    <main className="menu-container">
                        <h2 className="section-title">Classics</h2>
                        <div className="coffee-card regular-outline">
                            <div className="coffee-info">
                                <h3>Caramel Macchiato</h3>
                                <p>Vanilla syrup, steamed milk, espresso, and caramel drizzle.</p>
                                <span className="price">$4.75</span>
                            </div>
                            <button className="order-btn" onClick={() => handleOrder('Caramel Macchiato', 4.75)}>+ Add</button>
                        </div>
                        <div className="coffee-card regular-outline">
                            <div className="coffee-info">
                                <h3>Pour Over</h3>
                                <p>Single-origin beans, slowly brewed to perfection.</p>
                                <span className="price">$3.50</span>
                            </div>
                            <button className="order-btn" onClick={() => handleOrder('Pour Over', 3.50)}>+ Add</button>
                        </div>
                    </main>
                </>
            )}

            {/* --- RESERVATIONS TAB --- */}
            {activeTab === 'Reservations' && (
                <>
                    <header className="header">
                        <h1>Book a Table</h1>
                        <p>Secure your spot for meetings or studying.</p>
                    </header>
                    <main className="menu-container">
                        <div className="reservation-card regular-outline">
                            <label>Party Size</label>
                            <div className="party-size-selector">
                                {[1, 2, 3, 4].map(size => (
                                    <button
                                        key={size}
                                        className={`party-btn ${resSize === size ? 'active-party' : ''}`}
                                        onClick={() => setResSize(size)}
                                    >
                                        {size}{size === 4 ? '+' : ''}
                                    </button>
                                ))}
                            </div>

                            <label>Time Today</label>
                            <input
                                type="time"
                                className="form-input"
                                value={resTime}
                                onChange={(e) => setResTime(e.target.value)}
                            />

                            <button className="action-btn primary-action" style={{ width: '100%', marginTop: '24px' }} onClick={handleReserve}>
                                Confirm Reservation
                            </button>
                        </div>
                    </main>
                </>
            )}

            {/* --- CART TAB --- */}
            {activeTab === 'Cart' && (
                <>
                    <header className="header">
                        <h1>Your Cart</h1>
                        <p>Review your order before checkout.</p>
                    </header>
                    <main className="menu-container">
                        {cartItems.length > 0 ? (
                            <div className="receipt-card regular-outline">
                                {cartItems.map((item, index) => (
                                    <div key={index} className="receipt-item">
                                        <span>{item.name}</span>
                                        <span>${item.price.toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="receipt-divider"></div>
                                <div className="receipt-item total-row">
                                    <span>Total</span>
                                    <span className="price">${cartTotal.toFixed(2)}</span>
                                </div>
                                <button className="action-btn primary-action checkout-btn glowing-outline" onClick={handleCheckout}>
                                    Pay ${cartTotal.toFixed(2)}
                                </button>
                            </div>
                        ) : (
                            <div className="empty-cart">
                                <h2 style={{ fontSize: '40px', marginBottom: '12px' }}>☕</h2>
                                <h3 style={{ color: '#fff', marginBottom: '8px' }}>Your cart is empty</h3>
                                <p style={{ color: '#888' }}>Looks like you haven't added any coffee yet!</p>
                            </div>
                        )}
                    </main>
                </>
            )}

            {/* --- PROFILE TAB --- */}
            {activeTab === 'Profile' && (
                <>
                    <header className="header">
                        <h1>Your Profile</h1>
                        <p>Manage your account and rewards.</p>
                    </header>
                    <main className="menu-container">
                        <div className="profile-header">
                            <div className="avatar glowing-outline">JM</div>
                            <div className="profile-info">
                                <h2>John M.</h2>
                                <p>@jmontz125</p>
                            </div>
                        </div>

                        <div className="rewards-card glowing-outline">
                            <h3>Byte Rewards</h3>
                            <div className="points-display">
                                <span className="points-number">1,024</span>
                                <span className="points-label">Bits Earned</span>
                            </div>
                            <div className="progress-bar-bg">
                                <div className="progress-bar-fill" style={{ width: '75%' }}></div>
                            </div>
                            <p style={{ fontSize: '13px', color: '#888', marginTop: '12px' }}>256 Bits away from a free coffee!</p>
                        </div>

                        <h2 className="section-title" style={{ marginTop: '32px' }}>Settings</h2>
                        <div className="settings-list">
                            <button className="settings-btn regular-outline">Payment Methods</button>
                            <button className="settings-btn regular-outline">Order History</button>
                            <button className="settings-btn regular-outline">App Preferences</button>
                        </div>
                    </main>
                </>
            )}

            {/* --- BOTTOM NAV --- */}
            <nav className="bottom-nav regular-outline-top">
                <button className={`nav-btn ${activeTab === 'Home' ? 'active' : ''}`} onClick={() => setActiveTab('Home')}>Home</button>
                <button className={`nav-btn ${activeTab === 'Menu' ? 'active' : ''}`} onClick={() => setActiveTab('Menu')}>Menu</button>
                <button className={`nav-btn ${activeTab === 'Reservations' ? 'active' : ''}`} onClick={() => setActiveTab('Reservations')}>Tables</button>
                <button className={`nav-btn ${activeTab === 'Cart' ? 'active' : ''}`} onClick={() => setActiveTab('Cart')}>
                    Cart {cartItems.length > 0 && <span className="cart-badge">{cartItems.length}</span>}
                </button>
                <button className={`nav-btn ${activeTab === 'Profile' ? 'active' : ''}`} onClick={() => setActiveTab('Profile')}>Profile</button>
            </nav>
        </div>
    );
}

export default App;