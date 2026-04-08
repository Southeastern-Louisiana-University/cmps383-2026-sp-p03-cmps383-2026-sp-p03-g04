import { useState, useEffect, useRef } from 'react';
import './App.css';
import { menuData, type MenuItem } from './data/menu';

type CartItem = { name: string; price: number; customizations?: string[] };
type CurrentUser = { id: number; userName: string; roles: string[] };

const PROMOS = [
    '📱 App Exclusive: 20% off your first mobile order!',
    '☕ Double Bytes Happy Hour: 2PM - 4PM',
    '✨ Try the new Iced Cyan Macchiato today!'
];

function App() {
    const [activeTab, setActiveTab] = useState('Home');
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [toastMessage, setToastMessage] = useState('');
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [authLoading, setAuthLoading] = useState(false);

    const [activeOrder, setActiveOrder] = useState<{ itemCount: number; waitTime: number } | null>(null);
    const [reservation, setReservation] = useState<{ tableId: number; time: string } | null>(null);
    const [pendingReservation, setPendingReservation] = useState<{ tableId: number; time: string } | null>(null);

    const [resTime, setResTime] = useState('');
    const [selectedTable, setSelectedTable] = useState<number | null>(null);

    // --- NEW FILTER STATE ---
    const [selectedCategory, setSelectedCategory] = useState('All');
    const categoryOptions = ['All', 'Drinks', 'Bagels', 'Savory Crepes', 'Sweet Crepes'];

    const [tables] = useState(() => {
        const randomStatus = () => Math.random() > 0.4 ? 'available' : 'occupied';
        return [
            { id: 1, label: 'T1', seats: 2, status: randomStatus() },
            { id: 2, label: 'T2', seats: 2, status: randomStatus() },
            { id: 3, label: 'T3', seats: 4, status: randomStatus() },
            { id: 4, label: 'T4', seats: 4, status: randomStatus() },
            { id: 5, label: 'T5', seats: 6, status: randomStatus() },
            { id: 6, label: 'T6', seats: 2, status: randomStatus() },
        ];
    });

    const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
    const [selectedCustomizations, setSelectedCustomizations] = useState<Record<string, string>>({});

    const [applyRewards, setApplyRewards] = useState(false);

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        try {
            const saved = localStorage.getItem('theme');
            if (saved === 'light' || saved === 'dark') return saved;
        } catch (e) {}
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
        return 'dark';
    });

    const [promoIndex, setPromoIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPromoIndex((prev) => (prev + 1) % PROMOS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // If we've just returned from an external auth redirect, refresh "me".
        const params = new URLSearchParams(window.location.search);
        if (params.get('auth') === 'success' || params.get('auth') === 'error') {
            params.delete('auth');
            const next = params.toString();
            const nextUrl = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`;
            window.history.replaceState({}, '', nextUrl);
        }

        const loadMe = async () => {
            setAuthLoading(true);
            try {
                const resp = await fetch('/api/authentication/me', { credentials: 'include' });
                if (resp.ok) {
                    const me = (await resp.json()) as CurrentUser;
                    setCurrentUser(me);
                } else {
                    setCurrentUser(null);
                }
            } catch {
                setCurrentUser(null);
            } finally {
                setAuthLoading(false);
            }
        };

        void loadMe();
    }, []);

    const beginExternalAuth = (provider: 'Google' | 'Facebook') => {
        const returnUrl = `${window.location.pathname}${window.location.search}${window.location.hash}` || '/';
        window.location.href = `/api/authentication/external/${provider}?returnUrl=${encodeURIComponent(returnUrl)}`;
    };

    const logout = async () => {
        setAuthLoading(true);
        try {
            const resp = await fetch('/api/authentication/logout', { method: 'POST', credentials: 'include' });
            if (resp.ok) {
                setCurrentUser(null);
                setToastMessage('Logged out.');
                setTimeout(() => setToastMessage(''), 2000);
            } else {
                setToastMessage('Logout failed.');
                setTimeout(() => setToastMessage(''), 2500);
            }
        } catch {
            setToastMessage('Logout failed.');
            setTimeout(() => setToastMessage(''), 2500);
        } finally {
            setAuthLoading(false);
        }
    };

    useEffect(() => {
        try {
            if (theme === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
                document.documentElement.setAttribute('data-user-theme', 'light');
            } else {
                document.documentElement.removeAttribute('data-theme');
                document.documentElement.removeAttribute('data-user-theme');
            }
            localStorage.setItem('theme', theme);
        } catch (e) {}
    }, [theme]);

    const [showAppPrefs, setShowAppPrefs] = useState(false);

    const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);
    const rewardsDiscount = applyRewards ? cartTotal * 0.10 : 0; 
    const finalTotal = cartTotal - rewardsDiscount;

    const handleOrder = (itemName: string, price: number, customStrings?: string[]) => {
        setCartItems((prev) => [...prev, { name: itemName, price, customizations: customStrings }]);
        setToastMessage(`Added ${itemName} to cart!`);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const openCustomization = (item: MenuItem) => {
        setCustomizingItem(item);
        const initialSelections: Record<string, string> = {};
        item.customizations?.forEach(group => {
            if (group.isRequired && group.options.length > 0) {
                initialSelections[group.name] = group.options[0].name;
            }
        });
        setSelectedCustomizations(initialSelections);
    };

    const handleConfirmCustomizedOrder = () => {
        if (!customizingItem) return;

        let finalPrice = customizingItem.price;
        const customStrings: string[] = [];

        customizingItem.customizations?.forEach(group => {
            const selectedOptionName = selectedCustomizations[group.name];
            if (selectedOptionName) {
                const option = group.options.find(o => o.name === selectedOptionName);
                if (option) {
                    finalPrice += option.priceModifier;
                    customStrings.push(`${group.name}: ${option.name}`);
                }
            }
        });

        handleOrder(customizingItem.name, finalPrice, customStrings);
        setCustomizingItem(null);
    };

    const handleCheckout = () => {
        const minWait = cartItems.length * 2;
        const maxWait = cartItems.length * 5;
        const estimatedWait = Math.floor(Math.random() * (maxWait - minWait + 1)) + minWait;

        setActiveOrder({ itemCount: cartItems.length, waitTime: estimatedWait });
        
        if (pendingReservation) {
            setReservation(pendingReservation);
            setPendingReservation(null);
        }

        setToastMessage('Payment processed via Stripe! Order sent to barista.');
        setCartItems([]);
        setApplyRewards(false);
        setTimeout(() => {
            setToastMessage('');
            setActiveTab('Home');
        }, 2500);
    };

    const handleReserve = () => {
        if (cartItems.length === 0) {
            setToastMessage('You must add items to your cart to reserve a table!');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }

        if (!selectedTable) {
            setToastMessage('Please select an available table from the map!');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }

        if (!resTime) {
            setToastMessage('Please select a time!');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }

        const now = new Date();
        const [hours, minutes] = resTime.split(':').map(Number);
        const reserveDate = new Date();
        reserveDate.setHours(hours, minutes, 0, 0);
        const diffInMinutes = (reserveDate.getTime() - now.getTime()) / (1000 * 60);

        if (diffInMinutes < 120) {
            setToastMessage('Reservations must be made at least 2 hours in advance.');
            setTimeout(() => setToastMessage(''), 3500);
            return;
        }

        setPendingReservation({ tableId: selectedTable, time: resTime });
        setToastMessage(`Table T${selectedTable} added to cart! Proceed to checkout.`);
        
        setTimeout(() => {
            setToastMessage('');
            setActiveTab('Cart');
        }, 1500);
    };

    const timeInputRef = useRef<HTMLInputElement | null>(null);
    const openTimePicker = () => {
        const el = timeInputRef.current as any;
        if (!el) return;
        if (typeof el.showPicker === 'function') {
            try { el.showPicker(); return; } catch (e) {}
        }
        el.focus();
    };

    // Determine which categories to loop through based on the filter
    const displayCategories = selectedCategory === 'All' 
        ? ['Drinks', 'Bagels', 'Savory Crepes', 'Sweet Crepes'] 
        : [selectedCategory];

    return (
        <div className="app-container">
            {toastMessage && <div className="toast-notification">{toastMessage}</div>}

            {customizingItem && (
                <div className="modal-overlay">
                    <div className="modal-content regular-outline">
                        <h2>Customize {customizingItem.name}</h2>
                        
                        {customizingItem.customizations?.map(group => (
                            <div key={group.name} className="customization-group">
                                <label className="group-label">
                                    {group.name} {group.isRequired && <span style={{color: '#ff4444'}}>*</span>}
                                </label>
                                <div className="options-list">
                                    {group.options.map(option => (
                                        <button
                                            key={option.name}
                                            className={`option-btn ${selectedCustomizations[group.name] === option.name ? 'selected-option' : ''}`}
                                            onClick={() => setSelectedCustomizations(prev => ({ ...prev, [group.name]: option.name }))}
                                        >
                                            {option.name} 
                                            {option.priceModifier > 0 && ` (+$${option.priceModifier.toFixed(2)})`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="modal-actions" style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
                            <button className="action-btn secondary-action" style={{flex: 1}} onClick={() => setCustomizingItem(null)}>Cancel</button>
                            <button className="action-btn primary-action" style={{flex: 1}} onClick={handleConfirmCustomizedOrder}>Add to Cart</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="promo-banner">
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
                                            <span className="wait-time">Today, {reservation.time}</span>
                                        </div>
                                        <p>Table T{reservation.tableId} • 📍 Campus Branch</p>
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
                        
                        {/* Applied menu-grid here so it looks good on laptops! */}
                        <div className="menu-grid">
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
                        </div>
                    </main>
                </>
            )}

            {/* --- MENU TAB --- */}
            {activeTab === 'Menu' && (
                <>
                    <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px' }}>
                        <div>
                            <h1>Full Menu</h1>
                            <p>Handcrafted drinks & fresh pastries.</p>
                        </div>
                        <button className="text-btn" style={{ fontSize: '12px', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} onClick={() => setActiveTab('Nutrition')}>
                            Nutrition Info
                        </button>
                    </header>
                    <main className="menu-container">
                        
                        {/* CATEGORY FILTER PILLS */}
                        <div className="category-filters">
                            {categoryOptions.map(cat => (
                                <button 
                                    key={cat} 
                                    className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {displayCategories.map(category => (
                            <div key={category}>
                                <h2 className="section-title" style={{marginTop: '8px'}}>{category}</h2>
                                {/* Applied menu-grid here so laptops show 2 columns! */}
                                <div className="menu-grid">
                                    {menuData.filter(item => item.category === category).map(item => (
                                        <div key={item.id} className="coffee-card regular-outline">
                                            <div className="coffee-info">
                                                <h3>{item.name}</h3>
                                                <p>{item.description}</p>
                                                <span className="price">${item.price.toFixed(2)}</span>
                                            </div>
                                            <button 
                                                className="order-btn" 
                                                onClick={() => {
                                                    if (item.customizations) {
                                                        openCustomization(item);
                                                    } else {
                                                        handleOrder(item.name, item.price);
                                                    }
                                                }}
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </main>
                </>
            )}

            {/* --- NUTRITION FACTS TAB --- */}
            {activeTab === 'Nutrition' && (
                <>
                    <header className="header">
                        <button className="text-btn" style={{ marginBottom: '12px', padding: 0 }} onClick={() => setActiveTab('Menu')}>← Back to Menu</button>
                        <h1>Nutrition Facts</h1>
                        <p>Standard dietary information for our items.</p>
                    </header>
                    <main className="menu-container">
                        <div className="reservation-card regular-outline">
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ padding: '8px 0' }}>Item</th>
                                        <th style={{ padding: '8px 0' }}>Calories</th>
                                        <th style={{ padding: '8px 0' }}>Sugar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '8px 0' }}>Iced Latte (Whole Milk)</td>
                                        <td style={{ padding: '8px 0' }}>130</td>
                                        <td style={{ padding: '8px 0' }}>11g</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '8px 0' }}>Shaken Lemonade</td>
                                        <td style={{ padding: '8px 0' }}>120</td>
                                        <td style={{ padding: '8px 0' }}>27g</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '8px 0' }}>Breakfast Bagel</td>
                                        <td style={{ padding: '8px 0' }}>450</td>
                                        <td style={{ padding: '8px 0' }}>4g</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px 0', opacity: 0.7 }} colSpan={3}>*More items coming soon...</td>
                                    </tr>
                                </tbody>
                            </table>
                            <p style={{ fontSize: '12px', color: '#888', marginTop: '16px', lineHeight: '1.4' }}>
                                Note: Customizations like alternative milks and syrups will alter the nutritional values.
                            </p>
                        </div>
                    </main>
                </>
            )}

            {/* --- RESERVATIONS TAB --- */}
            {activeTab === 'Reservations' && (
                <>
                    <header className="header">
                        <h1>Book a Table</h1>
                        <p>Select your table from the map below.</p>
                    </header>
                    <main className="menu-container">
                        <div className="reservation-card regular-outline">
                            
                            <div className="map-legend">
                                <span className="legend-item"><div className="color-box available"></div> Available</span>
                                <span className="legend-item"><div className="color-box selected"></div> Selected</span>
                                <span className="legend-item"><div className="color-box occupied"></div> Occupied</span>
                            </div>

                            <div className="table-grid">
                                {tables.map(table => {
                                    const topChairs = Math.ceil(table.seats / 2);
                                    const bottomChairs = Math.floor(table.seats / 2);
                                    const isCircle = table.seats === 2;

                                    return (
                                        <button
                                            key={table.id}
                                            className={`table-btn ${selectedTable === table.id ? 'selected-table' : ''} ${table.status === 'occupied' ? 'occupied-table' : ''}`}
                                            onClick={() => table.status !== 'occupied' && setSelectedTable(table.id)}
                                            disabled={table.status === 'occupied'}
                                        >
                                            <div className="table-setup">
                                                <div className="chair-row">
                                                    {Array.from({ length: topChairs }).map((_, i) => <div key={`top-${i}`} className="chair"></div>)}
                                                </div>
                                                <div className={`table-core ${isCircle ? 'circle' : ''}`}>
                                                    {table.label}
                                                </div>
                                                <div className="chair-row">
                                                    {Array.from({ length: bottomChairs }).map((_, i) => <div key={`bot-${i}`} className="chair"></div>)}
                                                </div>
                                            </div>
                                            <span className="table-seats">{table.seats} Seats</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <label style={{ marginTop: '8px' }}>Time Today</label>
                            <div onClick={openTimePicker} style={{ display: 'block' }}>
                                <input
                                    type="time"
                                    className="form-input"
                                    ref={timeInputRef}
                                    value={resTime}
                                    onChange={(e) => setResTime(e.target.value)}
                                />
                            </div>

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
                        {cartItems.length > 0 || pendingReservation ? (
                            <div className="receipt-card regular-outline">
                                
                                {pendingReservation && (
                                    <>
                                        <div className="receipt-item" style={{ color: 'var(--primary)', alignItems: 'flex-start' }}>
                                            <div>
                                                <span style={{ fontWeight: 'bold' }}>🪑 Table T{pendingReservation.tableId} Reservation</span>
                                                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>Today at {pendingReservation.time}</div>
                                            </div>
                                            <button className="text-btn" style={{ fontSize: '12px', color: '#ff4444', padding: 0 }} onClick={() => setPendingReservation(null)}>Remove</button>
                                        </div>
                                        <div className="receipt-divider"></div>
                                    </>
                                )}

                                {cartItems.map((item, index) => (
                                    <div key={index} style={{marginBottom: '12px'}}>
                                        <div className="receipt-item">
                                            <span style={{fontWeight: 'bold'}}>{item.name}</span>
                                            <span>${item.price.toFixed(2)}</span>
                                        </div>
                                        {item.customizations?.map((customStr, i) => (
                                            <div key={i} style={{fontSize: '12px', color: 'var(--text)', opacity: 0.7, marginLeft: '8px'}}>
                                                - {customStr}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                
                                {cartItems.length > 0 && <div className="receipt-divider"></div>}
                                
                                {cartItems.length > 0 && (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={applyRewards} 
                                                    onChange={(e) => setApplyRewards(e.target.checked)} 
                                                    style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                                                />
                                                Use Byte Rewards
                                            </label>
                                            <span style={{ fontSize: '12px', color: '#888' }}>Max 10% off</span>
                                        </div>

                                        <div className="receipt-item">
                                            <span>Subtotal</span>
                                            <span>${cartTotal.toFixed(2)}</span>
                                        </div>
                                        
                                        {applyRewards && (
                                            <div className="receipt-item" style={{ color: '#4ade80' }}>
                                                <span>Byte Discount (10%)</span>
                                                <span>-${rewardsDiscount.toFixed(2)}</span>
                                            </div>
                                        )}

                                        <div className="receipt-divider"></div>
                                    </>
                                )}

                                <div className="receipt-item total-row">
                                    <span>Total</span>
                                    <span className="price">${finalTotal.toFixed(2)}</span>
                                </div>
                                
                                <button 
                                    className="action-btn primary-action checkout-btn glowing-outline" 
                                    style={{ background: '#635BFF', color: 'white', border: 'none' }}
                                    onClick={handleCheckout}
                                    disabled={cartItems.length === 0}
                                >
                                    {cartItems.length === 0 ? 'Add Food to Checkout' : `Checkout with Stripe • $${finalTotal.toFixed(2)}`}
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
                        {currentUser ? (
                            <div className="profile-header">
                                <div className="avatar glowing-outline">
                                    {currentUser.userName.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="profile-info">
                                    <h2>{currentUser.userName}</h2>
                                    <p>{currentUser.roles.length ? currentUser.roles.join(', ') : 'No roles'}</p>
                                </div>
                                <button
                                    className="action-btn secondary-action"
                                    style={{ marginLeft: 'auto' }}
                                    onClick={logout}
                                    disabled={authLoading}
                                >
                                    {authLoading ? 'Working…' : 'Logout'}
                                </button>
                            </div>
                        ) : (
                            <div className="reservation-card regular-outline" style={{ marginBottom: 16 }}>
                                <h3 style={{ marginTop: 0 }}>Sign in</h3>
                                <p style={{ marginTop: 8, opacity: 0.85 }}>Continue with a provider to create or access your account.</p>
                                <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                                    <button
                                        className="action-btn primary-action"
                                        onClick={() => beginExternalAuth('Google')}
                                        disabled={authLoading}
                                    >
                                        Continue with Google
                                    </button>
                                    <button
                                        className="action-btn secondary-action"
                                        onClick={() => beginExternalAuth('Facebook')}
                                        disabled={authLoading}
                                    >
                                        Continue with Facebook
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="rewards-card glowing-outline">
                            <h3>Byte Rewards</h3>
                            <div className="points-display">
                                <span className="points-number">1,024</span>
                                <span className="points-label">Bytes Earned</span>
                            </div>
                            <div className="progress-bar-bg">
                                <div className="progress-bar-fill" style={{ width: '75%' }}></div>
                            </div>
                            <p style={{ fontSize: '13px', color: '#888', marginTop: '12px' }}>256 Bytes away from a free coffee!</p>
                        </div>

                        <h2 className="section-title" style={{ marginTop: '32px' }}>Settings</h2>
                        <div className="settings-list">
                            <button className="settings-btn regular-outline">Payment Methods</button>
                            <button className="settings-btn regular-outline">Order History</button>
                            <button className="settings-btn regular-outline" onClick={() => setShowAppPrefs(prev => !prev)}>
                                App Preferences
                                <span style={{ opacity: 0.85, marginLeft: 8 }}>{showAppPrefs ? '▾' : '▸'}</span>
                            </button>

                            {showAppPrefs && (
                                <div className="reservation-card regular-outline" style={{ marginTop: '12px' }}>
                                    <label>Theme</label>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                        <button className={`action-btn ${theme === 'light' ? 'primary-action' : ''}`} onClick={() => setTheme('light')}>Light</button>
                                        <button className={`action-btn ${theme === 'dark' ? 'primary-action' : ''}`} onClick={() => setTheme('dark')}>Dark</button>
                                    </div>
                                </div>
                            )}
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
                    Cart {(cartItems.length > 0 || pendingReservation) && <span className="cart-badge">{cartItems.length + (pendingReservation ? 1 : 0)}</span>}
                </button>
                <button className={`nav-btn ${activeTab === 'Profile' ? 'active' : ''}`} onClick={() => setActiveTab('Profile')}>Profile</button>
            </nav>
        </div>
    );
}

export default App;