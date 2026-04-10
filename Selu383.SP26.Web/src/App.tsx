import { useEffect, useRef, useState } from 'react';
import './App.css';

type MenuCustomizationOption = {
    name: string;
    priceModifier: number;
};

type MenuCustomizationGroup = {
    name: string;
    isRequired: boolean;
    options: MenuCustomizationOption[];
};

type MenuItem = {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    imageUrl?: string | null;
    calories?: number | null;
    sugarGrams?: number | null;
    customizations?: MenuCustomizationGroup[];
};

type NutritionItem = {
    name: string;
    calories?: number | null;
    sugarGrams?: number | null;
};

type TableItem = {
    id: number;
    locationId: number;
    label: string;
    seats: number;
    status: string;
};

type ReservationItem = {
    id: number;
    tableId: number;
    locationId: number;
    reservedFor: string;
    partySize: number;
    name: string;
    status: string;
};

type CurrentUser = {
    id: number;
    userName: string;
    roles: string[];
    byteBalance: number;
};

type CheckoutSelectionPayload = {
    groupName: string;
    optionName: string;
};

type CartItem = {
    menuItemId: number;
    name: string;
    price: number;
    customizations?: string[];
    selectedOptions: CheckoutSelectionPayload[];
};

type OrderHistorySelection = {
    groupName: string;
    optionName: string;
    priceModifier: number;
};

type OrderHistoryItem = {
    menuItemId: number;
    name: string;
    basePrice: number;
    finalPrice: number;
    selections: OrderHistorySelection[];
};

type OrderHistoryOrder = {
    id: number;
    createdAt: string;
    subtotal: number;
    discountAmount: number;
    total: number;
    bytesRedeemed: number;
    bytesEarned: number;
    status: string;
    items: OrderHistoryItem[];
};

type CheckoutResult = {
    order: OrderHistoryOrder;
    newByteBalance: number;
    byteDollarValue: number;
};

const PROMOS = [
    '📱 App Exclusive: 20% off your first mobile order!',
    '☕ Double Bytes Happy Hour: 2PM - 4PM',
    '✨ Try the new Iced Cyan Macchiato today!'
];

const LOCATION_ID = 1;
const BYTES_PER_DOLLAR_SPENT = 5;
const MAX_DISCOUNT_PERCENT = 0.10;

function App() {
    const [activeTab, setActiveTab] = useState('Home');
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [toastMessage, setToastMessage] = useState('');

    const [activeOrder, setActiveOrder] = useState<{ itemCount: number; waitTime: number } | null>(null);
    const [reservation, setReservation] = useState<ReservationItem | null>(null);

    const [resDate, setResDate] = useState(() => {
        const now = new Date();
        return now.toISOString().split('T')[0];
    });
    const [resTime, setResTime] = useState('');
    const [selectedTable, setSelectedTable] = useState<number | null>(null);
    const [partySize, setPartySize] = useState(2);
    const [reservationName, setReservationName] = useState('');

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [nutritionItems, setNutritionItems] = useState<NutritionItem[]>([]);
    const [menuLoading, setMenuLoading] = useState(true);
    const [menuError, setMenuError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const [tables, setTables] = useState<TableItem[]>([]);
    const [tablesLoading, setTablesLoading] = useState(true);
    const [tablesError, setTablesError] = useState('');

    const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
    const [selectedCustomizations, setSelectedCustomizations] = useState<Record<string, string>>({});

    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [authBusy, setAuthBusy] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

    const [loginUserName, setLoginUserName] = useState('bob');
    const [loginPassword, setLoginPassword] = useState('Password123!');

    const [signupUserName, setSignupUserName] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

    const [applyRewards, setApplyRewards] = useState(false);
    const [checkoutBusy, setCheckoutBusy] = useState(false);

    const [orderHistory, setOrderHistory] = useState<OrderHistoryOrder[]>([]);
    const [orderHistoryLoading, setOrderHistoryLoading] = useState(false);

    const [reservationSaving, setReservationSaving] = useState(false);
    const [reservationCancelling, setReservationCancelling] = useState(false);

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        try {
            const saved = localStorage.getItem('theme');
            if (saved === 'light' || saved === 'dark') return saved;
        } catch (error) {
            console.error('Failed to read saved theme.', error);
        }

        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }

        return 'dark';
    });

    const [promoIndex, setPromoIndex] = useState(0);
    const [showAppPrefs, setShowAppPrefs] = useState(false);

    const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);
    const maxRedeemableBytes = currentUser
        ? Math.min(currentUser.byteBalance, Math.floor(cartTotal * 100 * MAX_DISCOUNT_PERCENT))
        : 0;
    const bytesToRedeemNow = applyRewards && currentUser ? maxRedeemableBytes : 0;
    const rewardsDiscountPreview = bytesToRedeemNow / 100;
    const finalTotalPreview = Math.max(cartTotal - rewardsDiscountPreview, 0);
    const availableByteDollarValue = (currentUser?.byteBalance ?? 0) / 100;

    const categories = Array.from(new Set(menuItems.map((item) => item.category))).sort();
    const displayCategories =
        selectedCategory === 'All'
            ? categories
            : categories.includes(selectedCategory)
                ? [selectedCategory]
                : [];

    const todaysSpecials = menuItems.filter((item) => item.category === 'Drinks').slice(0, 2);

    const timeInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setPromoIndex((prev) => (prev + 1) % PROMOS.length);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

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
        } catch (error) {
            console.error('Failed to save theme preference.', error);
        }
    }, [theme]);

    useEffect(() => {
        loadMenuData();
        loadCurrentUser();
    }, []);

    useEffect(() => {
        loadTablesData();
    }, [resDate, resTime]);

    useEffect(() => {
        if (currentUser) {
            loadOrderHistory();
        } else {
            setOrderHistory([]);
            setApplyRewards(false);
        }
    }, [currentUser?.id]);

    useEffect(() => {
        if (selectedTable && !tables.some((table) => table.id === selectedTable && table.status !== 'occupied')) {
            setSelectedTable(null);
        }
    }, [tables, selectedTable]);

    async function loadCurrentUser() {
        try {
            setAuthLoading(true);

            const response = await fetch('/api/authentication/me');

            if (response.status === 401 || response.status === 403) {
                setCurrentUser(null);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to load current user.');
            }

            const user: CurrentUser = await response.json();
            setCurrentUser(user);
        } catch (error) {
            console.error(error);
            setCurrentUser(null);
        } finally {
            setAuthLoading(false);
        }
    }

    async function loadOrderHistory() {
        try {
            setOrderHistoryLoading(true);

            const response = await fetch('/api/orders/my');

            if (response.status === 401 || response.status === 403) {
                setOrderHistory([]);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to load order history.');
            }

            const orders: OrderHistoryOrder[] = await response.json();
            setOrderHistory(orders);
        } catch (error) {
            console.error(error);
            setOrderHistory([]);
        } finally {
            setOrderHistoryLoading(false);
        }
    }

    async function loadMenuData() {
        try {
            setMenuLoading(true);
            setMenuError('');

            const [menuResponse, nutritionResponse] = await Promise.all([
                fetch('/api/menu/items'),
                fetch('/api/menu/nutrition')
            ]);

            if (!menuResponse.ok) {
                throw new Error('Failed to load menu items.');
            }

            if (!nutritionResponse.ok) {
                throw new Error('Failed to load nutrition information.');
            }

            const menuData: MenuItem[] = await menuResponse.json();
            const nutritionData: NutritionItem[] = await nutritionResponse.json();

            setMenuItems(menuData);
            setNutritionItems(nutritionData);
        } catch (error) {
            console.error(error);
            setMenuError('Could not load menu data from the backend.');
        } finally {
            setMenuLoading(false);
        }
    }

    async function loadTablesData() {
        try {
            setTablesLoading(true);
            setTablesError('');

            const queryParts = [`locationId=${LOCATION_ID}`];
            const reservedFor = buildReservationDateTimeString(resDate, resTime);

            if (reservedFor) {
                queryParts.push(`reservedFor=${encodeURIComponent(reservedFor)}`);
            }

            const response = await fetch(`/api/tables?${queryParts.join('&')}`);

            if (!response.ok) {
                throw new Error('Failed to load tables.');
            }

            const tableData: TableItem[] = await response.json();
            setTables(tableData);
        } catch (error) {
            console.error(error);
            setTablesError('Could not load tables from the backend.');
        } finally {
            setTablesLoading(false);
        }
    }

    async function handleLogin() {
        try {
            setAuthBusy(true);

            const response = await fetch('/api/authentication/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userName: loginUserName,
                    password: loginPassword
                })
            });

            if (!response.ok) {
                throw new Error('Login failed.');
            }

            const user: CurrentUser = await response.json();
            setCurrentUser(user);
            setToastMessage(`Logged in as ${user.userName}.`);
            setTimeout(() => setToastMessage(''), 3000);
        } catch (error) {
            console.error(error);
            setToastMessage('Login failed.');
            setTimeout(() => setToastMessage(''), 3000);
        } finally {
            setAuthBusy(false);
        }
    }

    async function handleSignup() {
        if (!signupUserName.trim()) {
            setToastMessage('Please enter a username.');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }

        if (!signupPassword) {
            setToastMessage('Please enter a password.');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }

        if (signupPassword !== signupConfirmPassword) {
            setToastMessage('Passwords do not match.');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }

        try {
            setAuthBusy(true);

            const response = await fetch('/api/authentication/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userName: signupUserName,
                    password: signupPassword
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Sign up failed.');
            }

            const user: CurrentUser = await response.json();
            setCurrentUser(user);
            setAuthMode('login');
            setSignupUserName('');
            setSignupPassword('');
            setSignupConfirmPassword('');
            setLoginUserName(user.userName);
            setLoginPassword('');
            setToastMessage(`Account created. Signed in as ${user.userName}.`);
            setTimeout(() => setToastMessage(''), 3000);
        } catch (error) {
            console.error(error);
            setToastMessage(error instanceof Error ? error.message : 'Sign up failed.');
            setTimeout(() => setToastMessage(''), 3500);
        } finally {
            setAuthBusy(false);
        }
    }

    async function handleLogout() {
        try {
            setAuthBusy(true);

            const response = await fetch('/api/authentication/logout', {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Logout failed.');
            }

            setCurrentUser(null);
            setOrderHistory([]);
            setApplyRewards(false);
            setToastMessage('Logged out.');
            setTimeout(() => setToastMessage(''), 3000);
        } catch (error) {
            console.error(error);
            setToastMessage('Logout failed.');
            setTimeout(() => setToastMessage(''), 3000);
        } finally {
            setAuthBusy(false);
        }
    }

    const handleOrder = (
        menuItemId: number,
        itemName: string,
        price: number,
        customStrings?: string[],
        selectedOptions: CheckoutSelectionPayload[] = []
    ) => {
        setCartItems((prev) => [
            ...prev,
            {
                menuItemId,
                name: itemName,
                price,
                customizations: customStrings,
                selectedOptions
            }
        ]);

        setToastMessage(`Added ${itemName} to cart!`);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const openCustomization = (item: MenuItem) => {
        setCustomizingItem(item);

        const initialSelections: Record<string, string> = {};
        item.customizations?.forEach((group) => {
            if (group.isRequired && group.options.length > 0) {
                initialSelections[group.name] = group.options[0].name;
            }
        });

        setSelectedCustomizations(initialSelections);
    };

    const handleAddMenuItem = (item: MenuItem) => {
        if (item.customizations && item.customizations.length > 0) {
            openCustomization(item);
            return;
        }

        handleOrder(item.id, item.name, item.price, [], []);
    };

    const handleConfirmCustomizedOrder = () => {
        if (!customizingItem) return;

        let finalPrice = customizingItem.price;
        const customStrings: string[] = [];
        const selectedOptions: CheckoutSelectionPayload[] = [];

        for (const group of customizingItem.customizations ?? []) {
            const selectedOptionName = selectedCustomizations[group.name];

            if (group.isRequired && !selectedOptionName) {
                setToastMessage(`Please choose an option for ${group.name}.`);
                setTimeout(() => setToastMessage(''), 3000);
                return;
            }

            if (selectedOptionName) {
                const option = group.options.find((o) => o.name === selectedOptionName);
                if (option) {
                    finalPrice += option.priceModifier;
                    customStrings.push(`${group.name}: ${option.name}`);
                    selectedOptions.push({
                        groupName: group.name,
                        optionName: option.name
                    });
                }
            }
        }

        handleOrder(customizingItem.id, customizingItem.name, finalPrice, customStrings, selectedOptions);
        setCustomizingItem(null);
        setSelectedCustomizations({});
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            return;
        }

        try {
            setCheckoutBusy(true);

            const response = await fetch('/api/orders/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    items: cartItems.map((item) => ({
                        menuItemId: item.menuItemId,
                        selectedOptions: item.selectedOptions
                    })),
                    bytesToRedeem: bytesToRedeemNow
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Checkout failed.');
            }

            const result: CheckoutResult = await response.json();

            const minWait = cartItems.length * 2;
            const maxWait = cartItems.length * 5;
            const estimatedWait = Math.floor(Math.random() * (maxWait - minWait + 1)) + minWait;

            setActiveOrder({
                itemCount: result.order.items.length,
                waitTime: estimatedWait
            });

            setCartItems([]);
            setApplyRewards(false);

            if (currentUser) {
                setCurrentUser({
                    ...currentUser,
                    byteBalance: result.newByteBalance
                });
            }

            await loadOrderHistory();

            setToastMessage(
                `Order placed! Total: $${result.order.total.toFixed(2)} • Earned ${result.order.bytesEarned} Bytes`
            );

            setTimeout(() => {
                setToastMessage('');
                setActiveTab('Home');
            }, 3000);
        } catch (error) {
            console.error(error);
            setToastMessage(error instanceof Error ? error.message : 'Checkout failed.');
            setTimeout(() => setToastMessage(''), 3500);
        } finally {
            setCheckoutBusy(false);
        }
    };

    const handleReserve = async () => {
        if (cartItems.length === 0) {
            setToastMessage('You must add items to your cart to reserve a table!');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }

        if (reservation) {
            setToastMessage('You already have an active reservation. Cancel it first if needed.');
            setTimeout(() => setToastMessage(''), 3500);
            return;
        }

        if (!selectedTable) {
            setToastMessage('Please select an available table from the map!');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }

        if (!resDate) {
            setToastMessage('Please select a date.');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }

        if (!resTime) {
            setToastMessage('Please select a time!');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }

        if (!reservationName.trim()) {
            setToastMessage('Please enter a name for the reservation.');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }

        const selectedTableRecord = tables.find((table) => table.id === selectedTable);

        if (!selectedTableRecord) {
            setToastMessage('That table could not be found.');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }

        if (selectedTableRecord.status === 'occupied') {
            setToastMessage('That table is no longer available.');
            setTimeout(() => setToastMessage(''), 3000);
            await loadTablesData();
            return;
        }

        if (partySize > selectedTableRecord.seats) {
            setToastMessage('Party size exceeds the selected table capacity.');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }

        const reservedFor = buildReservationDateTimeString(resDate, resTime);

        if (!reservedFor) {
            setToastMessage('Please select a valid date and time.');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }

        const reserveDate = buildReservationDate(resDate, resTime);
        const diffInMinutes = (reserveDate.getTime() - new Date().getTime()) / (1000 * 60);

        if (diffInMinutes < 120) {
            setToastMessage('Reservations must be made at least 2 hours in advance.');
            setTimeout(() => setToastMessage(''), 3500);
            return;
        }

        try {
            setReservationSaving(true);

            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tableId: selectedTableRecord.id,
                    locationId: LOCATION_ID,
                    reservedFor,
                    partySize,
                    name: reservationName.trim()
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to create reservation.');
            }

            const createdReservation: ReservationItem = await response.json();

            setReservation(createdReservation);
            setSelectedTable(null);
            setToastMessage(
                `Reservation confirmed for ${selectedTableRecord.label} at ${formatDisplayDateTime(createdReservation.reservedFor)}.`
            );
            setActiveTab('Home');

            await loadTablesData();

            setTimeout(() => setToastMessage(''), 3500);
        } catch (error) {
            console.error(error);
            setToastMessage(error instanceof Error ? error.message : 'Could not create reservation.');
            setTimeout(() => setToastMessage(''), 3500);
        } finally {
            setReservationSaving(false);
        }
    };

    const handleCancelReservation = async () => {
        if (!reservation) {
            return;
        }

        try {
            setReservationCancelling(true);

            const response = await fetch(`/api/reservations/${reservation.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to cancel reservation.');
            }

            setReservation(null);
            setToastMessage('Reservation cancelled.');
            await loadTablesData();
            setTimeout(() => setToastMessage(''), 3000);
        } catch (error) {
            console.error(error);
            setToastMessage('Could not cancel reservation.');
            setTimeout(() => setToastMessage(''), 3000);
        } finally {
            setReservationCancelling(false);
        }
    };

    const openTimePicker = () => {
        const el = timeInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
        if (!el) return;

        if (typeof el.showPicker === 'function') {
            try {
                el.showPicker();
                return;
            } catch (error) {
                console.error('showPicker is not supported here.', error);
            }
        }

        el.focus();
    };

    function buildReservationDate(dateString: string, time: string) {
        const [year, month, day] = dateString.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);

        return new Date(year, month - 1, day, hours, minutes, 0, 0);
    }

    function buildReservationDateTimeString(dateString: string, time: string) {
        if (!dateString || !time) {
            return '';
        }

        const date = buildReservationDate(dateString, time);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }

    function formatDisplayDateTime(dateTimeString: string) {
        const date = new Date(dateTimeString);

        if (Number.isNaN(date.getTime())) {
            return dateTimeString;
        }

        return date.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    function getTableLabelById(tableId: number) {
        return tables.find((table) => table.id === tableId)?.label ?? `Table ${tableId}`;
    }

    const renderMenuCard = (item: MenuItem) => (
        <div key={item.id} className="coffee-card regular-outline">
            <div className="coffee-info">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <span className="price">${item.price.toFixed(2)}</span>
            </div>
            <button className="order-btn" onClick={() => handleAddMenuItem(item)}>
                + Add
            </button>
        </div>
    );

    return (
        <div className="app-container">
            {toastMessage && <div className="toast-notification">{toastMessage}</div>}

            {customizingItem && (
                <div className="modal-overlay">
                    <div className="modal-content regular-outline">
                        <h2>Customize {customizingItem.name}</h2>

                        {customizingItem.customizations?.map((group) => (
                            <div key={group.name} className="customization-group">
                                <label className="group-label">
                                    {group.name} {group.isRequired && <span style={{ color: '#ff4444' }}>*</span>}
                                </label>

                                <div className="options-list">
                                    {group.options.map((option) => (
                                        <button
                                            key={option.name}
                                            className={`option-btn ${selectedCustomizations[group.name] === option.name ? 'selected-option' : ''}`}
                                            onClick={() =>
                                                setSelectedCustomizations((prev) => ({
                                                    ...prev,
                                                    [group.name]: option.name
                                                }))
                                            }
                                        >
                                            {option.name}
                                            {option.priceModifier > 0 && ` (+$${option.priceModifier.toFixed(2)})`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="modal-actions" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button
                                className="action-btn secondary-action"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    setCustomizingItem(null);
                                    setSelectedCustomizations({});
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="action-btn primary-action"
                                style={{ flex: 1 }}
                                onClick={handleConfirmCustomizedOrder}
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="promo-banner">
                <span key={promoIndex} className="animated-promo">
                    {PROMOS[promoIndex]}
                </span>
            </div>

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
                                        <button className="text-btn" onClick={() => setActiveOrder(null)}>
                                            Mark as Picked Up
                                        </button>
                                    </div>
                                )}

                                {reservation && (
                                    <div className="status-card regular-outline">
                                        <div className="status-header">
                                            <h3>🪑 Table Reserved</h3>
                                            <span className="wait-time">{formatDisplayDateTime(reservation.reservedFor)}</span>
                                        </div>
                                        <p>{getTableLabelById(reservation.tableId)} • {reservation.partySize} guest(s)</p>
                                        <button className="text-btn" onClick={handleCancelReservation} disabled={reservationCancelling}>
                                            {reservationCancelling ? 'Cancelling...' : 'Cancel Reservation'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="quick-actions">
                            <button className="action-btn primary-action" onClick={() => setActiveTab('Menu')}>
                                ☕ Full Menu
                            </button>
                            <button className="action-btn secondary-action" onClick={() => setActiveTab('Reservations')}>
                                🪑 Reserve
                            </button>
                        </div>

                        <h2 className="section-title">Today's Specials</h2>

                        {menuLoading && <p>Loading menu...</p>}
                        {menuError && <p style={{ color: '#ff6b6b' }}>{menuError}</p>}

                        {!menuLoading && !menuError && (
                            <div className="menu-grid">
                                {todaysSpecials.length > 0 ? todaysSpecials.map(renderMenuCard) : <p>No specials available right now.</p>}
                            </div>
                        )}
                    </main>
                </>
            )}

            {activeTab === 'Menu' && (
                <>
                    <header
                        className="header"
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px' }}
                    >
                        <div>
                            <h1>Full Menu</h1>
                            <p>Handcrafted drinks & fresh pastries.</p>
                        </div>

                        <button
                            className="text-btn"
                            style={{ fontSize: '12px', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}
                            onClick={() => setActiveTab('Nutrition')}
                        >
                            Nutrition Info
                        </button>
                    </header>

                    <main className="menu-container">
                        <div className="category-filters">
                            <button
                                className={`filter-pill ${selectedCategory === 'All' ? 'active' : ''}`}
                                onClick={() => setSelectedCategory('All')}
                            >
                                All
                            </button>

                            {categories.map((category) => (
                                <button
                                    key={category}
                                    className={`filter-pill ${selectedCategory === category ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(category)}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        {menuLoading && <p>Loading menu...</p>}
                        {menuError && <p style={{ color: '#ff6b6b' }}>{menuError}</p>}

                        {!menuLoading &&
                            !menuError &&
                            displayCategories.map((category) => (
                                <div key={category}>
                                    <h2 className="section-title" style={{ marginTop: '8px' }}>
                                        {category}
                                    </h2>

                                    <div className="menu-grid">
                                        {menuItems.filter((item) => item.category === category).map(renderMenuCard)}
                                    </div>
                                </div>
                            ))}
                    </main>
                </>
            )}

            {activeTab === 'Nutrition' && (
                <>
                    <header className="header">
                        <button className="text-btn" style={{ marginBottom: '12px', padding: 0 }} onClick={() => setActiveTab('Menu')}>
                            ← Back to Menu
                        </button>
                        <h1>Nutrition Facts</h1>
                        <p>Standard dietary information for our items.</p>
                    </header>

                    <main className="menu-container">
                        <div className="reservation-card regular-outline">
                            {menuLoading && <p>Loading nutrition info...</p>}
                            {menuError && <p style={{ color: '#ff6b6b' }}>{menuError}</p>}

                            {!menuLoading && !menuError && (
                                <>
                                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                                <th style={{ padding: '8px 0' }}>Item</th>
                                                <th style={{ padding: '8px 0' }}>Calories</th>
                                                <th style={{ padding: '8px 0' }}>Sugar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {nutritionItems.length > 0 ? (
                                                nutritionItems.map((item) => (
                                                    <tr key={item.name} style={{ borderBottom: '1px solid var(--border)' }}>
                                                        <td style={{ padding: '8px 0' }}>{item.name}</td>
                                                        <td style={{ padding: '8px 0' }}>{item.calories ?? '-'}</td>
                                                        <td style={{ padding: '8px 0' }}>
                                                            {item.sugarGrams != null ? `${item.sugarGrams}g` : '-'}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td style={{ padding: '8px 0', opacity: 0.7 }} colSpan={3}>
                                                        No nutrition information available yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>

                                    <p style={{ fontSize: '12px', color: '#888', marginTop: '16px', lineHeight: '1.4' }}>
                                        Note: Customizations like alternative milks and syrups will alter the nutritional values.
                                    </p>
                                </>
                            )}
                        </div>
                    </main>
                </>
            )}

            {activeTab === 'Reservations' && (
                <>
                    <header className="header">
                        <h1>Book a Table</h1>
                        <p>Select your table from the map below.</p>
                    </header>

                    <main className="menu-container">
                        <div className="reservation-card regular-outline">
                            <label>Your Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={reservationName}
                                onChange={(e) => setReservationName(e.target.value)}
                                placeholder="Enter reservation name"
                            />

                            <label>Party Size</label>
                            <div className="party-size-selector">
                                {[1, 2, 3, 4, 5, 6].map((size) => (
                                    <button
                                        key={size}
                                        className={`party-btn ${partySize === size ? 'active-party' : ''}`}
                                        onClick={() => setPartySize(size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>

                            <label>Reservation Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={resDate}
                                onChange={(e) => setResDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />

                            <label style={{ marginTop: '16px' }}>Time</label>
                            <div onClick={openTimePicker} style={{ display: 'block', marginBottom: '16px' }}>
                                <input
                                    type="time"
                                    className="form-input"
                                    ref={timeInputRef}
                                    value={resTime}
                                    onChange={(e) => setResTime(e.target.value)}
                                />
                            </div>

                            <div className="map-legend">
                                <span className="legend-item">
                                    <div className="color-box available"></div> Available
                                </span>
                                <span className="legend-item">
                                    <div className="color-box selected"></div> Selected
                                </span>
                                <span className="legend-item">
                                    <div className="color-box occupied"></div> Occupied
                                </span>
                            </div>

                            {tablesLoading && <p>Loading tables...</p>}
                            {tablesError && <p style={{ color: '#ff6b6b', marginBottom: '16px' }}>{tablesError}</p>}

                            {!tablesLoading && !tablesError && (
                                <>
                                    <div className="table-grid">
                                        {tables.map((table) => {
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
                                                            {Array.from({ length: topChairs }).map((_, i) => (
                                                                <div key={`top-${table.id}-${i}`} className="chair"></div>
                                                            ))}
                                                        </div>

                                                        <div className={`table-core ${isCircle ? 'circle' : ''}`}>{table.label}</div>

                                                        <div className="chair-row">
                                                            {Array.from({ length: bottomChairs }).map((_, i) => (
                                                                <div key={`bottom-${table.id}-${i}`} className="chair"></div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <span className="table-seats">{table.seats} Seats</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {tables.length === 0 && (
                                        <p style={{ opacity: 0.8, marginBottom: '16px' }}>No tables found for this location.</p>
                                    )}
                                </>
                            )}

                            <button
                                className="action-btn primary-action"
                                style={{ width: '100%', marginTop: '24px' }}
                                onClick={handleReserve}
                                disabled={tablesLoading || !!tablesError || reservationSaving}
                            >
                                {reservationSaving ? 'Saving Reservation...' : 'Confirm Reservation'}
                            </button>
                        </div>
                    </main>
                </>
            )}

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
                                    <div key={`${item.name}-${index}`} style={{ marginBottom: '12px' }}>
                                        <div className="receipt-item">
                                            <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                                            <span>${item.price.toFixed(2)}</span>
                                        </div>

                                        {item.customizations?.map((customStr, i) => (
                                            <div
                                                key={`${customStr}-${i}`}
                                                style={{ fontSize: '12px', color: 'var(--text)', opacity: 0.7, marginLeft: '8px' }}
                                            >
                                                - {customStr}
                                            </div>
                                        ))}
                                    </div>
                                ))}

                                <div className="receipt-divider"></div>

                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '12px'
                                    }}
                                >
                                    <label
                                        style={{
                                            fontSize: '14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: currentUser ? 'pointer' : 'not-allowed',
                                            opacity: currentUser ? 1 : 0.6
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={applyRewards}
                                            disabled={!currentUser || currentUser.byteBalance <= 0}
                                            onChange={(e) => setApplyRewards(e.target.checked)}
                                            style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                                        />
                                        Use Byte Rewards
                                    </label>
                                    <span style={{ fontSize: '12px', color: '#888' }}>Max 10% off</span>
                                </div>

                                {!currentUser && (
                                    <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
                                        Sign in on the Profile tab to earn and redeem Bytes.
                                    </p>
                                )}

                                {currentUser && (
                                    <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
                                        Balance: {currentUser.byteBalance} Bytes (${availableByteDollarValue.toFixed(2)})
                                    </p>
                                )}

                                <div className="receipt-item">
                                    <span>Subtotal</span>
                                    <span>${cartTotal.toFixed(2)}</span>
                                </div>

                                {bytesToRedeemNow > 0 && (
                                    <div className="receipt-item" style={{ color: '#4ade80' }}>
                                        <span>Byte Discount</span>
                                        <span>- ${rewardsDiscountPreview.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="receipt-divider"></div>

                                <div className="receipt-item total-row">
                                    <span>Total</span>
                                    <span className="price">${finalTotalPreview.toFixed(2)}</span>
                                </div>

                                <button
                                    className="action-btn primary-action checkout-btn glowing-outline"
                                    style={{ background: '#635BFF', color: 'white', border: 'none' }}
                                    onClick={handleCheckout}
                                    disabled={checkoutBusy || cartItems.length === 0}
                                >
                                    {checkoutBusy
                                        ? 'Processing Checkout...'
                                        : `Checkout with Stripe • $${finalTotalPreview.toFixed(2)}`}
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

            {activeTab === 'Profile' && (
                <>
                    <header className="header">
                        <h1>Your Profile</h1>
                        <p>Manage your account and rewards.</p>
                    </header>

                    <main className="menu-container">
                        {authLoading ? (
                            <div className="reservation-card regular-outline">
                                <p>Loading profile...</p>
                            </div>
                        ) : currentUser ? (
                            <>
                                <div className="profile-header">
                                    <div className="avatar glowing-outline">
                                        {currentUser.userName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="profile-info">
                                        <h2>{currentUser.userName}</h2>
                                        <p>{currentUser.roles.join(', ') || 'User'}</p>
                                    </div>
                                </div>

                                <div className="rewards-card glowing-outline">
                                    <h3>Byte Rewards</h3>
                                    <div className="points-display">
                                        <span className="points-number">{currentUser.byteBalance}</span>
                                        <span className="points-label">Bytes Earned</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${Math.min((currentUser.byteBalance / 500) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <p style={{ fontSize: '13px', color: '#888', marginTop: '12px' }}>
                                        Value: ${availableByteDollarValue.toFixed(2)} • Earn {BYTES_PER_DOLLAR_SPENT} Bytes per $1 spent
                                    </p>
                                </div>

                                <h2 className="section-title" style={{ marginTop: '32px' }}>
                                    Recent Orders
                                </h2>

                                <div className="settings-list" style={{ marginBottom: '24px' }}>
                                    {orderHistoryLoading ? (
                                        <div className="reservation-card regular-outline">
                                            <p>Loading order history...</p>
                                        </div>
                                    ) : orderHistory.length > 0 ? (
                                        orderHistory.slice(0, 5).map((order) => (
                                            <div key={order.id} className="reservation-card regular-outline">
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: '10px'
                                                    }}
                                                >
                                                    <strong>Order #{order.id}</strong>
                                                    <span className="wait-time">{formatDisplayDateTime(order.createdAt)}</span>
                                                </div>
                                                <p style={{ marginBottom: '10px' }}>
                                                    {order.items.length} item(s) • Total ${order.total.toFixed(2)}
                                                </p>
                                                <p style={{ fontSize: '12px', opacity: 0.8 }}>
                                                    Earned {order.bytesEarned} Bytes
                                                    {order.bytesRedeemed > 0 ? ` • Redeemed ${order.bytesRedeemed} Bytes` : ''}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="reservation-card regular-outline">
                                            <p>No orders yet.</p>
                                        </div>
                                    )}
                                </div>

                                <h2 className="section-title">Settings</h2>
                                <div className="settings-list">
                                    <button className="settings-btn regular-outline">Payment Methods</button>
                                    <button className="settings-btn regular-outline">Order History</button>
                                    <button className="settings-btn regular-outline" onClick={() => setShowAppPrefs((prev) => !prev)}>
                                        App Preferences
                                        <span style={{ opacity: 0.85, marginLeft: 8 }}>{showAppPrefs ? '▾' : '▸'}</span>
                                    </button>

                                    {showAppPrefs && (
                                        <div className="reservation-card regular-outline" style={{ marginTop: '12px' }}>
                                            <label>Theme</label>
                                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                                <button
                                                    className={`action-btn ${theme === 'light' ? 'primary-action' : ''}`}
                                                    onClick={() => setTheme('light')}
                                                >
                                                    Light
                                                </button>
                                                <button
                                                    className={`action-btn ${theme === 'dark' ? 'primary-action' : ''}`}
                                                    onClick={() => setTheme('dark')}
                                                >
                                                    Dark
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <button className="action-btn secondary-action" onClick={handleLogout} disabled={authBusy}>
                                        {authBusy ? 'Working...' : 'Log Out'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="reservation-card regular-outline">
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                        <button
                                            className={`action-btn ${authMode === 'login' ? 'primary-action' : 'secondary-action'}`}
                                            style={{ flex: 1 }}
                                            onClick={() => setAuthMode('login')}
                                        >
                                            Log In
                                        </button>
                                        <button
                                            className={`action-btn ${authMode === 'signup' ? 'primary-action' : 'secondary-action'}`}
                                            style={{ flex: 1 }}
                                            onClick={() => setAuthMode('signup')}
                                        >
                                            Sign Up
                                        </button>
                                    </div>

                                    {authMode === 'login' ? (
                                        <>
                                            <h2 style={{ marginBottom: '12px' }}>Log In</h2>
                                            <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>
                                                Sign in to earn and redeem Bytes.
                                            </p>

                                            <label>User Name</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={loginUserName}
                                                onChange={(e) => setLoginUserName(e.target.value)}
                                            />

                                            <label style={{ marginTop: '16px' }}>Password</label>
                                            <input
                                                type="password"
                                                className="form-input"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                            />

                                            <button
                                                className="action-btn primary-action"
                                                style={{ width: '100%', marginTop: '20px' }}
                                                onClick={handleLogin}
                                                disabled={authBusy}
                                            >
                                                {authBusy ? 'Signing In...' : 'Log In'}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <h2 style={{ marginBottom: '12px' }}>Create Account</h2>
                                            <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>
                                                Make an account to save orders and earn Bytes.
                                            </p>

                                            <label>User Name</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={signupUserName}
                                                onChange={(e) => setSignupUserName(e.target.value)}
                                                placeholder="Choose a username"
                                            />

                                            <label style={{ marginTop: '16px' }}>Password</label>
                                            <input
                                                type="password"
                                                className="form-input"
                                                value={signupPassword}
                                                onChange={(e) => setSignupPassword(e.target.value)}
                                                placeholder="Create a password"
                                            />

                                            <label style={{ marginTop: '16px' }}>Confirm Password</label>
                                            <input
                                                type="password"
                                                className="form-input"
                                                value={signupConfirmPassword}
                                                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                                                placeholder="Re-enter password"
                                            />

                                            <button
                                                className="action-btn primary-action"
                                                style={{ width: '100%', marginTop: '20px' }}
                                                onClick={handleSignup}
                                                disabled={authBusy}
                                            >
                                                {authBusy ? 'Creating Account...' : 'Sign Up'}
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="rewards-card glowing-outline" style={{ marginTop: '24px' }}>
                                    <h3>Byte Rewards</h3>
                                    <div className="points-display">
                                        <span className="points-number">0</span>
                                        <span className="points-label">Guest Mode</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: '#888', marginTop: '12px' }}>
                                        Earn {BYTES_PER_DOLLAR_SPENT} Bytes per $1 spent • 1 Byte = $0.01 • Max {MAX_DISCOUNT_PERCENT * 100}% off
                                    </p>
                                </div>

                                <h2 className="section-title" style={{ marginTop: '32px' }}>
                                    Settings
                                </h2>
                                <div className="settings-list">
                                    <button className="settings-btn regular-outline" onClick={() => setShowAppPrefs((prev) => !prev)}>
                                        App Preferences
                                        <span style={{ opacity: 0.85, marginLeft: 8 }}>{showAppPrefs ? '▾' : '▸'}</span>
                                    </button>

                                    {showAppPrefs && (
                                        <div className="reservation-card regular-outline" style={{ marginTop: '12px' }}>
                                            <label>Theme</label>
                                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                                <button
                                                    className={`action-btn ${theme === 'light' ? 'primary-action' : ''}`}
                                                    onClick={() => setTheme('light')}
                                                >
                                                    Light
                                                </button>
                                                <button
                                                    className={`action-btn ${theme === 'dark' ? 'primary-action' : ''}`}
                                                    onClick={() => setTheme('dark')}
                                                >
                                                    Dark
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </main>
                </>
            )}

            <nav className="bottom-nav regular-outline-top">
                <button className={`nav-btn ${activeTab === 'Home' ? 'active' : ''}`} onClick={() => setActiveTab('Home')}>
                    Home
                </button>
                <button className={`nav-btn ${activeTab === 'Menu' ? 'active' : ''}`} onClick={() => setActiveTab('Menu')}>
                    Menu
                </button>
                <button
                    className={`nav-btn ${activeTab === 'Reservations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Reservations')}
                >
                    Tables
                </button>
                <button className={`nav-btn ${activeTab === 'Cart' ? 'active' : ''}`} onClick={() => setActiveTab('Cart')}>
                    Cart {cartItems.length > 0 && <span className="cart-badge">{cartItems.length}</span>}
                </button>
                <button className={`nav-btn ${activeTab === 'Profile' ? 'active' : ''}`} onClick={() => setActiveTab('Profile')}>
                    Profile
                </button>
            </nav>
        </div>
    );
}

export default App;