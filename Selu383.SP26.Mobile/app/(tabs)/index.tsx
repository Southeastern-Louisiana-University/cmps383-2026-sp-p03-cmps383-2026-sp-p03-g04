import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';

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
};

type RedemptionChoice = 'none' | 'ten' | 'twentyfive' | 'fifty' | 'full';
type MobileTab = 'Home' | 'Menu' | 'Nutrition' | 'Reservations' | 'Cart' | 'Profile' | 'Orders';

const API_BASE_URL = 'https://cmps383-2026-sp-p03-g04.azurewebsites.net';
const LOCATION_ID = 1;
const BYTES_PER_DOLLAR_SPENT = 5;

const PROMOS = [
    '📱 Caffeinated Lions App Exclusive: 20% off your first mobile order!',
    '🦁 Caffeinated Lions Happy Hour: 2PM - 4PM',
    '✨ Try the featured Caffeinated Lions special today!',
];

export default function MobileCaffeinatedLionsScreen() {
    const [activeTab, setActiveTab] = useState<MobileTab>('Home');
    const [darkMode, setDarkMode] = useState(true);
    const theme = useMemo(() => getTheme(darkMode), [darkMode]);

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [toastMessage, setToastMessage] = useState('');
    const [promoIndex, setPromoIndex] = useState(0);

    const [activeOrder, setActiveOrder] = useState<{ itemCount: number; waitTime: number } | null>(null);
    const [reservation, setReservation] = useState<ReservationItem | null>(null);

    const [resDate, setResDate] = useState(() => getLocalDateInputValue());
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

    const [redemptionChoice, setRedemptionChoice] = useState<RedemptionChoice>('none');
    const [checkoutBusy, setCheckoutBusy] = useState(false);

    const [orderHistory, setOrderHistory] = useState<OrderHistoryOrder[]>([]);
    const [orderHistoryLoading, setOrderHistoryLoading] = useState(false);

    const [reservationSaving, setReservationSaving] = useState(false);
    const [reservationCancelling, setReservationCancelling] = useState(false);

    const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);
    const subtotalCents = Math.round(cartTotal * 100);
    const requestedBytes = getRequestedBytes(redemptionChoice, subtotalCents);
    const canRedeemChoice = !!currentUser && currentUser.byteBalance >= requestedBytes;
    const bytesToRedeemNow = canRedeemChoice ? requestedBytes : 0;
    const rewardsDiscountPreview = bytesToRedeemNow / 100;
    const finalTotalPreview = Math.max(cartTotal - rewardsDiscountPreview, 0);

    const categories = Array.from(new Set(menuItems.map((item) => item.category))).sort();
    const displayCategories =
        selectedCategory === 'All'
            ? categories
            : categories.includes(selectedCategory)
                ? [selectedCategory]
                : [];

    const todaysSpecials = menuItems.filter((item) => item.category === 'Drinks').slice(0, 2);

    useEffect(() => {
        const interval = setInterval(() => {
            setPromoIndex((prev) => (prev + 1) % PROMOS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

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
            setRedemptionChoice('none');
        }
    }, [currentUser?.id]);

    useEffect(() => {
        if (selectedTable && !tables.some((table) => table.id === selectedTable && table.status !== 'occupied')) {
            setSelectedTable(null);
        }
    }, [tables, selectedTable]);

    useEffect(() => {
        if (redemptionChoice !== 'none' && (!currentUser || currentUser.byteBalance < requestedBytes)) {
            setRedemptionChoice('none');
        }
    }, [currentUser, requestedBytes, redemptionChoice]);

    function showToast(message: string) {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 2500);
    }

    async function apiFetch(path: string, options?: RequestInit) {
        return fetch(`${API_BASE_URL}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(options?.headers ?? {}),
            },
            credentials: 'include',
            ...options,
        });
    }

    async function loadCurrentUser() {
        try {
            setAuthLoading(true);
            const response = await apiFetch('/api/authentication/me');

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
            const response = await apiFetch('/api/orders/my');

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
                apiFetch('/api/menu/items'),
                apiFetch('/api/menu/nutrition'),
            ]);

            if (!menuResponse.ok) {
                throw new Error('Failed to load menu items.');
            }

            if (!nutritionResponse.ok) {
                throw new Error('Failed to load nutrition info.');
            }

            const menuData: MenuItem[] = await menuResponse.json();
            const nutritionData: NutritionItem[] = await nutritionResponse.json();

            setMenuItems(menuData);
            setNutritionItems(nutritionData);
        } catch (error) {
            console.error(error);
            setMenuError('Could not load menu from the backend.');
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

            const response = await apiFetch(`/api/tables?${queryParts.join('&')}`);

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

            const response = await apiFetch('/api/authentication/login', {
                method: 'POST',
                body: JSON.stringify({
                    userName: loginUserName,
                    password: loginPassword,
                }),
            });

            if (!response.ok) {
                throw new Error('Login failed.');
            }

            const user: CurrentUser = await response.json();
            setCurrentUser(user);
            showToast(`Logged in as ${user.userName}.`);
        } catch (error) {
            console.error(error);
            showToast('Login failed.');
        } finally {
            setAuthBusy(false);
        }
    }

    async function handleSignup() {
        if (!signupUserName.trim()) {
            showToast('Please enter a username.');
            return;
        }

        if (!signupPassword) {
            showToast('Please enter a password.');
            return;
        }

        if (signupPassword !== signupConfirmPassword) {
            showToast('Passwords do not match.');
            return;
        }

        try {
            setAuthBusy(true);

            const response = await apiFetch('/api/authentication/register', {
                method: 'POST',
                body: JSON.stringify({
                    userName: signupUserName,
                    password: signupPassword,
                }),
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
            showToast(`Account created. Signed in as ${user.userName}.`);
        } catch (error) {
            console.error(error);
            showToast(error instanceof Error ? error.message : 'Sign up failed.');
        } finally {
            setAuthBusy(false);
        }
    }

    async function handleLogout() {
        try {
            setAuthBusy(true);

            const response = await apiFetch('/api/authentication/logout', {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Logout failed.');
            }

            setCurrentUser(null);
            setOrderHistory([]);
            setRedemptionChoice('none');
            showToast('Logged out.');
        } catch (error) {
            console.error(error);
            showToast('Logout failed.');
        } finally {
            setAuthBusy(false);
        }
    }

    function openCustomization(item: MenuItem) {
        setCustomizingItem(item);

        const initialSelections: Record<string, string> = {};
        item.customizations?.forEach((group) => {
            if (group.isRequired && group.options.length > 0) {
                initialSelections[group.name] = group.options[0].name;
            }
        });

        setSelectedCustomizations(initialSelections);
    }

    function handleAddMenuItem(item: MenuItem) {
        if (item.customizations && item.customizations.length > 0) {
            openCustomization(item);
            return;
        }

        addToCart(item.id, item.name, item.price, [], []);
    }

    function addToCart(
        menuItemId: number,
        itemName: string,
        price: number,
        customStrings?: string[],
        selectedOptions: CheckoutSelectionPayload[] = []
    ) {
        setCartItems((prev) => [
            ...prev,
            {
                menuItemId,
                name: itemName,
                price,
                customizations: customStrings,
                selectedOptions,
            },
        ]);

        showToast(`Added ${itemName} to cart!`);
    }

    function handleConfirmCustomizedOrder() {
        if (!customizingItem) return;

        let finalPrice = customizingItem.price;
        const customStrings: string[] = [];
        const selectedOptions: CheckoutSelectionPayload[] = [];

        for (const group of customizingItem.customizations ?? []) {
            const selectedOptionName = selectedCustomizations[group.name];

            if (group.isRequired && !selectedOptionName) {
                showToast(`Please choose an option for ${group.name}.`);
                return;
            }

            if (selectedOptionName) {
                const option = group.options.find((o) => o.name === selectedOptionName);
                if (option) {
                    finalPrice += option.priceModifier;
                    customStrings.push(`${group.name}: ${option.name}`);
                    selectedOptions.push({
                        groupName: group.name,
                        optionName: option.name,
                    });
                }
            }
        }

        addToCart(customizingItem.id, customizingItem.name, finalPrice, customStrings, selectedOptions);
        setCustomizingItem(null);
        setSelectedCustomizations({});
    }

    async function handleCheckout() {
        if (cartItems.length === 0) {
            return;
        }

        try {
            setCheckoutBusy(true);

            const response = await apiFetch('/api/orders/checkout', {
                method: 'POST',
                body: JSON.stringify({
                    items: cartItems.map((item) => ({
                        menuItemId: item.menuItemId,
                        selectedOptions: item.selectedOptions,
                    })),
                    redemptionChoice,
                }),
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
                waitTime: estimatedWait,
            });

            setCartItems([]);
            setRedemptionChoice('none');

            if (currentUser) {
                setCurrentUser({
                    ...currentUser,
                    byteBalance: result.newByteBalance,
                });
            }

            await loadOrderHistory();
            showToast(`Order placed! Total: $${result.order.total.toFixed(2)} • Earned ${result.order.bytesEarned} Bytes`);
            setActiveTab('Home');
        } catch (error) {
            console.error(error);
            showToast(error instanceof Error ? error.message : 'Checkout failed.');
        } finally {
            setCheckoutBusy(false);
        }
    }

    async function handleReserve() {
        if (cartItems.length === 0) {
            showToast('You must add items to your cart to reserve a table.');
            return;
        }

        if (reservation) {
            showToast('You already have an active reservation.');
            return;
        }

        if (!selectedTable) {
            showToast('Please select an available table.');
            return;
        }

        if (!resDate || !resTime || !reservationName.trim()) {
            showToast('Please enter reservation name, date, and time.');
            return;
        }

        const selectedTableRecord = tables.find((table) => table.id === selectedTable);

        if (!selectedTableRecord) {
            showToast('That table could not be found.');
            return;
        }

        if (selectedTableRecord.status === 'occupied') {
            showToast('That table is no longer available.');
            await loadTablesData();
            return;
        }

        if (partySize > selectedTableRecord.seats) {
            showToast('Party size exceeds the selected table capacity.');
            return;
        }

        const reservedFor = buildReservationDateTimeString(resDate, resTime);

        if (!reservedFor) {
            showToast('Please select a valid date and time.');
            return;
        }

        const reserveDate = buildReservationDate(resDate, resTime);
        const diffInMinutes = (reserveDate.getTime() - new Date().getTime()) / (1000 * 60);

        if (diffInMinutes < 120) {
            showToast('Reservations must be made at least 2 hours in advance.');
            return;
        }

        try {
            setReservationSaving(true);

            const response = await apiFetch('/api/reservations', {
                method: 'POST',
                body: JSON.stringify({
                    tableId: selectedTableRecord.id,
                    locationId: LOCATION_ID,
                    reservedFor,
                    partySize,
                    name: reservationName.trim(),
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to create reservation.');
            }

            const createdReservation: ReservationItem = await response.json();

            setReservation(createdReservation);
            setSelectedTable(null);
            showToast(`Reservation confirmed for ${selectedTableRecord.label} at ${formatDisplayDateTime(createdReservation.reservedFor)}.`);
            setActiveTab('Home');
            await loadTablesData();
        } catch (error) {
            console.error(error);
            showToast(error instanceof Error ? error.message : 'Could not create reservation.');
        } finally {
            setReservationSaving(false);
        }
    }

    async function handleCancelReservation() {
        if (!reservation) {
            return;
        }

        try {
            setReservationCancelling(true);

            const response = await apiFetch(`/api/reservations/${reservation.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to cancel reservation.');
            }

            setReservation(null);
            showToast('Reservation cancelled.');
            await loadTablesData();
        } catch (error) {
            console.error(error);
            showToast('Could not cancel reservation.');
        } finally {
            setReservationCancelling(false);
        }
    }

    function renderMenuCard(item: MenuItem) {
        return (
            <View key={item.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Image
                    source={{ uri: getMenuImageSrc(item) }}
                    resizeMode="cover"
                    style={styles.menuImage}
                />
                <Text style={[styles.cardTitle, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.cardDescription, { color: theme.muted }]}>{item.description}</Text>
                <Text style={[styles.priceText, { color: theme.text }]}>${item.price.toFixed(2)}</Text>

                <Pressable
                    onPress={() => handleAddMenuItem(item)}
                    style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                >
                    <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>+ Add</Text>
                </Pressable>
            </View>
        );
    }

    function renderHome() {
        return (
            <>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Caffeinated Lions</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.muted }]}>Skip the line, order ahead.</Text>
                </View>

                {(activeOrder || reservation) && (
                    <View style={styles.stack}>
                        {activeOrder && (
                            <View style={[styles.statusCard, { backgroundColor: theme.card, borderColor: theme.primary }]}>
                                <View style={styles.rowBetween}>
                                    <Text style={[styles.sectionTitleSmall, { color: theme.text }]}>🛍️ Preparing Order</Text>
                                    <Text style={[styles.badge, { backgroundColor: theme.badgeBg, color: theme.text }]}>
                                        {activeOrder.waitTime} min
                                    </Text>
                                </View>
                                <Text style={[styles.mutedText, { color: theme.muted }]}>
                                    {activeOrder.itemCount} item(s) • Pick up at the counter
                                </Text>
                                <Pressable onPress={() => setActiveOrder(null)}>
                                    <Text style={[styles.linkText, { color: theme.primary }]}>Mark as Picked Up</Text>
                                </Pressable>
                            </View>
                        )}

                        {reservation && (
                            <View style={[styles.statusCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <View style={styles.rowBetween}>
                                    <Text style={[styles.sectionTitleSmall, { color: theme.text }]}>🪑 Table Reserved</Text>
                                    <Text style={[styles.badge, { backgroundColor: theme.badgeBg, color: theme.text }]}>
                                        {formatDisplayDateTime(reservation.reservedFor)}
                                    </Text>
                                </View>
                                <Text style={[styles.mutedText, { color: theme.muted }]}>
                                    {getTableLabelById(reservation.tableId)} • {reservation.partySize} guest(s)
                                </Text>
                                <Pressable onPress={handleCancelReservation} disabled={reservationCancelling}>
                                    <Text style={[styles.linkText, { color: theme.primary }]}>
                                        {reservationCancelling ? 'Cancelling...' : 'Cancel Reservation'}
                                    </Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.row}>
                    <Pressable
                        onPress={() => setActiveTab('Menu')}
                        style={[styles.primaryButton, styles.flexOne, { backgroundColor: theme.primary }]}
                    >
                        <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>☕ Full Menu</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => setActiveTab('Reservations')}
                        style={[styles.secondaryButton, styles.flexOne, { borderColor: theme.border, backgroundColor: theme.card }]}
                    >
                        <Text style={[styles.secondaryButtonText, { color: theme.text }]}>🪑 Reserve</Text>
                    </Pressable>
                </View>

                <Text style={[styles.sectionHeader, { color: theme.text }]}>Today's Specials</Text>

                {menuLoading && <ActivityIndicator color={theme.primary} />}
                {!!menuError && <Text style={[styles.errorText, { color: theme.error }]}>{menuError}</Text>}

                <View style={styles.stack}>
                    {!menuLoading && !menuError && todaysSpecials.map(renderMenuCard)}
                </View>
            </>
        );
    }

    function renderMenu() {
        return (
            <>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Full Menu</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.muted }]}>Handcrafted drinks & fresh pastries.</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    <Pressable
                        onPress={() => setSelectedCategory('All')}
                        style={[
                            styles.filterPill,
                            {
                                backgroundColor: selectedCategory === 'All' ? theme.primary : theme.card,
                                borderColor: theme.border,
                            },
                        ]}
                    >
                        <Text style={{ color: selectedCategory === 'All' ? theme.buttonText : theme.text }}>All</Text>
                    </Pressable>

                    {categories.map((category) => (
                        <Pressable
                            key={category}
                            onPress={() => setSelectedCategory(category)}
                            style={[
                                styles.filterPill,
                                {
                                    backgroundColor: selectedCategory === category ? theme.primary : theme.card,
                                    borderColor: theme.border,
                                },
                            ]}
                        >
                            <Text style={{ color: selectedCategory === category ? theme.buttonText : theme.text }}>{category}</Text>
                        </Pressable>
                    ))}
                </ScrollView>

                <Pressable onPress={() => setActiveTab('Nutrition')}>
                    <Text style={[styles.linkText, { color: theme.primary, marginBottom: 14 }]}>Nutrition Info</Text>
                </Pressable>

                {menuLoading && <ActivityIndicator color={theme.primary} />}
                {!!menuError && <Text style={[styles.errorText, { color: theme.error }]}>{menuError}</Text>}

                {!menuLoading && !menuError && (
                    <View style={styles.stack}>
                        {displayCategories.map((category) => (
                            <View key={category} style={styles.stack}>
                                <Text style={[styles.sectionHeader, { color: theme.text }]}>{category}</Text>
                                {menuItems.filter((item) => item.category === category).map(renderMenuCard)}
                            </View>
                        ))}
                    </View>
                )}
            </>
        );
    }

    function renderNutrition() {
        return (
            <>
                <View style={styles.header}>
                    <Pressable onPress={() => setActiveTab('Menu')}>
                        <Text style={[styles.linkText, { color: theme.primary }]}>← Back to Menu</Text>
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: theme.text, marginTop: 8 }]}>Nutrition Facts</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.muted }]}>Standard dietary information.</Text>
                </View>

                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {menuLoading && <ActivityIndicator color={theme.primary} />}
                    {!menuLoading && nutritionItems.map((item) => (
                        <View key={item.name} style={[styles.rowBetween, styles.tableRow, { borderBottomColor: theme.border }]}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text style={[styles.cardTitle, { color: theme.text, fontSize: 15 }]}>{item.name}</Text>
                            </View>
                            <Text style={[styles.smallText, { color: theme.text }]}>{item.calories ?? '-'}</Text>
                            <Text style={[styles.smallText, { color: theme.text, width: 56, textAlign: 'right' }]}>
                                {item.sugarGrams != null ? `${item.sugarGrams}g` : '-'}
                            </Text>
                        </View>
                    ))}

                    <Text style={[styles.smallMuted, { color: theme.muted }]}>
                        Note: customizations like alternative milks and syrups can change nutritional values.
                    </Text>
                </View>
            </>
        );
    }

    function renderReservations() {
        return (
            <>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Book a Table</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.muted }]}>Reserve a table and order ahead.</Text>
                </View>

                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.label, { color: theme.text }]}>Reservation Name</Text>
                    <TextInput
                        value={reservationName}
                        onChangeText={setReservationName}
                        placeholder="Enter reservation name"
                        placeholderTextColor={theme.muted}
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBg }]}
                    />

                    <Text style={[styles.label, { color: theme.text }]}>Party Size</Text>
                    <View style={styles.rowWrap}>
                        {[1, 2, 3, 4, 5, 6].map((size) => (
                            <Pressable
                                key={size}
                                onPress={() => setPartySize(size)}
                                style={[
                                    styles.smallChoice,
                                    {
                                        backgroundColor: partySize === size ? theme.primary : theme.inputBg,
                                        borderColor: theme.border,
                                    },
                                ]}
                            >
                                <Text style={{ color: partySize === size ? theme.buttonText : theme.text }}>{size}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={[styles.label, { color: theme.text }]}>Date (YYYY-MM-DD)</Text>
                    <TextInput
                        value={resDate}
                        onChangeText={setResDate}
                        placeholder="2026-04-25"
                        placeholderTextColor={theme.muted}
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBg }]}
                    />

                    <Text style={[styles.label, { color: theme.text }]}>Time (HH:MM)</Text>
                    <TextInput
                        value={resTime}
                        onChangeText={setResTime}
                        placeholder="18:30"
                        placeholderTextColor={theme.muted}
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBg }]}
                    />

                    <Text style={[styles.label, { color: theme.text }]}>Tables</Text>

                    {tablesLoading && <ActivityIndicator color={theme.primary} />}
                    {!!tablesError && <Text style={[styles.errorText, { color: theme.error }]}>{tablesError}</Text>}

                    <View style={styles.rowWrap}>
                        {!tablesLoading && tables.map((table) => {
                            const selected = selectedTable === table.id;
                            const occupied = table.status === 'occupied';

                            return (
                                <Pressable
                                    key={table.id}
                                    disabled={occupied}
                                    onPress={() => setSelectedTable(table.id)}
                                    style={[
                                        styles.tableButton,
                                        {
                                            backgroundColor: occupied
                                                ? theme.occupied
                                                : selected
                                                    ? theme.primary
                                                    : theme.inputBg,
                                            borderColor: theme.border,
                                        },
                                    ]}
                                >
                                    <Text style={{ color: selected ? theme.buttonText : theme.text, fontWeight: '700' }}>
                                        {table.label}
                                    </Text>
                                    <Text style={{ color: selected ? theme.buttonText : theme.muted, fontSize: 12 }}>
                                        {table.seats} seats
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <Pressable
                        onPress={handleReserve}
                        disabled={reservationSaving}
                        style={[styles.primaryButton, { backgroundColor: theme.primary, marginTop: 12 }]}
                    >
                        <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
                            {reservationSaving ? 'Saving Reservation...' : 'Confirm Reservation'}
                        </Text>
                    </Pressable>
                </View>
            </>
        );
    }

    function renderCart() {
        return (
            <>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Your Cart</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.muted }]}>Review before checkout.</Text>
                </View>

                {cartItems.length === 0 ? (
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>Your cart is empty</Text>
                        <Text style={[styles.cardDescription, { color: theme.muted }]}>Looks like you haven't added anything yet.</Text>
                    </View>
                ) : (
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        {cartItems.map((item, index) => (
                            <View key={`${item.name}-${index}`} style={styles.itemBlock}>
                                <View style={styles.rowBetween}>
                                    <Text style={[styles.cardTitle, { color: theme.text, fontSize: 16 }]}>{item.name}</Text>
                                    <Text style={[styles.cardTitle, { color: theme.text, fontSize: 16 }]}>${item.price.toFixed(2)}</Text>
                                </View>

                                {item.customizations?.map((customStr, i) => (
                                    <Text key={`${customStr}-${i}`} style={[styles.smallMuted, { color: theme.muted }]}>
                                        - {customStr}
                                    </Text>
                                ))}
                            </View>
                        ))}

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        <Text style={[styles.label, { color: theme.text }]}>Use Bytes</Text>
                        <View style={styles.rowWrap}>
                            {[
                                { key: 'none', label: 'None' },
                                { key: 'ten', label: '10%' },
                                { key: 'twentyfive', label: '25%' },
                                { key: 'fifty', label: '50%' },
                                { key: 'full', label: 'Pay in Full' },
                            ].map((option) => {
                                const key = option.key as RedemptionChoice;
                                const required = getRequestedBytes(key, subtotalCents);
                                const disabled = key !== 'none' && (!currentUser || currentUser.byteBalance < required);

                                return (
                                    <Pressable
                                        key={key}
                                        disabled={disabled}
                                        onPress={() => setRedemptionChoice(key)}
                                        style={[
                                            styles.smallChoice,
                                            {
                                                backgroundColor: redemptionChoice === key ? theme.primary : theme.inputBg,
                                                borderColor: theme.border,
                                                opacity: disabled ? 0.45 : 1,
                                            },
                                        ]}
                                    >
                                        <Text style={{ color: redemptionChoice === key ? theme.buttonText : theme.text }}>{option.label}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {!currentUser && (
                            <Text style={[styles.smallMuted, { color: theme.muted }]}>
                                Sign in on Profile to earn and redeem Bytes.
                            </Text>
                        )}

                        {!!currentUser && (
                            <Text style={[styles.smallMuted, { color: theme.muted }]}>
                                Balance: {currentUser.byteBalance} Bytes
                            </Text>
                        )}

                        <View style={styles.rowBetween}>
                            <Text style={[styles.cardDescription, { color: theme.text }]}>Subtotal</Text>
                            <Text style={[styles.cardDescription, { color: theme.text }]}>${cartTotal.toFixed(2)}</Text>
                        </View>

                        {bytesToRedeemNow > 0 && (
                            <View style={styles.rowBetween}>
                                <Text style={[styles.cardDescription, { color: theme.success }]}>Byte Discount</Text>
                                <Text style={[styles.cardDescription, { color: theme.success }]}>- ${rewardsDiscountPreview.toFixed(2)}</Text>
                            </View>
                        )}

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        <View style={styles.rowBetween}>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>Total</Text>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>${finalTotalPreview.toFixed(2)}</Text>
                        </View>

                        <Pressable
                            onPress={handleCheckout}
                            disabled={checkoutBusy}
                            style={[styles.primaryButton, { backgroundColor: theme.primary, marginTop: 12 }]}
                        >
                            <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
                                {checkoutBusy ? 'Processing Checkout...' : `Checkout • $${finalTotalPreview.toFixed(2)}`}
                            </Text>
                        </Pressable>
                    </View>
                )}
            </>
        );
    }

    function renderOrders() {
        return (
            <>
                <View style={styles.header}>
                    <Pressable onPress={() => setActiveTab('Profile')}>
                        <Text style={[styles.linkText, { color: theme.primary }]}>← Back to Profile</Text>
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: theme.text, marginTop: 8 }]}>Order History</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.muted }]}>All past orders.</Text>
                </View>

                {!currentUser ? (
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.cardDescription, { color: theme.text }]}>You need to sign in to view order history.</Text>
                    </View>
                ) : orderHistoryLoading ? (
                    <ActivityIndicator color={theme.primary} />
                ) : orderHistory.length > 0 ? (
                    <View style={styles.stack}>
                        {orderHistory.map((order) => (
                            <View key={order.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <View style={styles.rowBetween}>
                                    <Text style={[styles.cardTitle, { color: theme.text }]}>Order #{order.id}</Text>
                                    <Text style={[styles.smallText, { color: theme.muted }]}>{formatDisplayDateTime(order.createdAt)}</Text>
                                </View>

                                {order.items.map((item, index) => (
                                    <View key={`${order.id}-${item.menuItemId}-${index}`} style={styles.itemBlock}>
                                        <View style={styles.rowBetween}>
                                            <Text style={[styles.cardDescription, { color: theme.text }]}>{item.name}</Text>
                                            <Text style={[styles.cardDescription, { color: theme.text }]}>{item.finalPrice.toFixed(2)}</Text>
                                        </View>
                                        {item.selections.map((selection, i) => (
                                            <Text key={`${selection.groupName}-${selection.optionName}-${i}`} style={[styles.smallMuted, { color: theme.muted }]}>
                                                - {selection.groupName}: {selection.optionName}
                                            </Text>
                                        ))}
                                    </View>
                                ))}

                                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                                <Text style={[styles.smallText, { color: theme.text }]}>Subtotal: ${order.subtotal.toFixed(2)}</Text>
                                {order.discountAmount > 0 && (
                                    <Text style={[styles.smallText, { color: theme.success }]}>Discount: - ${order.discountAmount.toFixed(2)}</Text>
                                )}
                                <Text style={[styles.cardTitle, { color: theme.text, marginTop: 6 }]}>Total: ${order.total.toFixed(2)}</Text>
                                <Text style={[styles.smallMuted, { color: theme.muted }]}>
                                    Earned {order.bytesEarned} Bytes{order.bytesRedeemed > 0 ? ` • Redeemed ${order.bytesRedeemed} Bytes` : ''}
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.cardDescription, { color: theme.text }]}>No orders yet.</Text>
                    </View>
                )}
            </>
        );
    }

    function renderProfile() {
        return (
            <>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Your Profile</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.muted }]}>Manage account and rewards.</Text>
                </View>

                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.rowBetween}>
                        <Text style={[styles.label, { color: theme.text }]}>Theme</Text>
                        <Switch value={!darkMode ? false : true} onValueChange={setDarkMode} />
                    </View>
                </View>

                {authLoading ? (
                    <ActivityIndicator color={theme.primary} />
                ) : currentUser ? (
                    <View style={styles.stack}>
                        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>{currentUser.userName}</Text>
                            <Text style={[styles.cardDescription, { color: theme.muted }]}>{currentUser.roles.join(', ') || 'User'}</Text>
                        </View>

                        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.primary }]}>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>Caffeinated Lions Rewards</Text>
                            <Text style={[styles.bigNumber, { color: theme.text }]}>{currentUser.byteBalance}</Text>
                            <Text style={[styles.cardDescription, { color: theme.muted }]}>Bytes Earned</Text>
                            <Text style={[styles.smallMuted, { color: theme.muted }]}>
                                Earn {BYTES_PER_DOLLAR_SPENT} Bytes per $1 spent
                            </Text>
                        </View>

                        <Pressable
                            onPress={() => setActiveTab('Orders')}
                            style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.card }]}
                        >
                            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>View Order History</Text>
                        </Pressable>

                        <Pressable
                            onPress={handleLogout}
                            disabled={authBusy}
                            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                        >
                            <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
                                {authBusy ? 'Working...' : 'Log Out'}
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={styles.row}>
                            <Pressable
                                onPress={() => setAuthMode('login')}
                                style={[
                                    styles.flexOne,
                                    styles.smallChoice,
                                    {
                                        backgroundColor: authMode === 'login' ? theme.primary : theme.inputBg,
                                        borderColor: theme.border,
                                    },
                                ]}
                            >
                                <Text style={{ color: authMode === 'login' ? theme.buttonText : theme.text }}>Log In</Text>
                            </Pressable>

                            <Pressable
                                onPress={() => setAuthMode('signup')}
                                style={[
                                    styles.flexOne,
                                    styles.smallChoice,
                                    {
                                        backgroundColor: authMode === 'signup' ? theme.primary : theme.inputBg,
                                        borderColor: theme.border,
                                    },
                                ]}
                            >
                                <Text style={{ color: authMode === 'signup' ? theme.buttonText : theme.text }}>Sign Up</Text>
                            </Pressable>
                        </View>

                        {authMode === 'login' ? (
                            <>
                                <Text style={[styles.label, { color: theme.text }]}>User Name</Text>
                                <TextInput
                                    value={loginUserName}
                                    onChangeText={setLoginUserName}
                                    placeholder="Username"
                                    placeholderTextColor={theme.muted}
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBg }]}
                                />

                                <Text style={[styles.label, { color: theme.text }]}>Password</Text>
                                <TextInput
                                    value={loginPassword}
                                    onChangeText={setLoginPassword}
                                    secureTextEntry
                                    placeholder="Password"
                                    placeholderTextColor={theme.muted}
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBg }]}
                                />

                                <Pressable
                                    onPress={handleLogin}
                                    disabled={authBusy}
                                    style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                                >
                                    <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
                                        {authBusy ? 'Signing In...' : 'Log In'}
                                    </Text>
                                </Pressable>
                            </>
                        ) : (
                            <>
                                <Text style={[styles.label, { color: theme.text }]}>User Name</Text>
                                <TextInput
                                    value={signupUserName}
                                    onChangeText={setSignupUserName}
                                    placeholder="Choose a username"
                                    placeholderTextColor={theme.muted}
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBg }]}
                                />

                                <Text style={[styles.label, { color: theme.text }]}>Password</Text>
                                <TextInput
                                    value={signupPassword}
                                    onChangeText={setSignupPassword}
                                    secureTextEntry
                                    placeholder="Create a password"
                                    placeholderTextColor={theme.muted}
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBg }]}
                                />

                                <Text style={[styles.label, { color: theme.text }]}>Confirm Password</Text>
                                <TextInput
                                    value={signupConfirmPassword}
                                    onChangeText={setSignupConfirmPassword}
                                    secureTextEntry
                                    placeholder="Re-enter password"
                                    placeholderTextColor={theme.muted}
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBg }]}
                                />

                                <Pressable
                                    onPress={handleSignup}
                                    disabled={authBusy}
                                    style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                                >
                                    <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>
                                        {authBusy ? 'Creating Account...' : 'Sign Up'}
                                    </Text>
                                </Pressable>
                            </>
                        )}
                    </View>
                )}
            </>
        );
    }

    function renderCustomizationModal() {
        if (!customizingItem) return null;

        return (
            <View style={styles.modalBackdrop}>
                <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Customize {customizingItem.name}</Text>

                    <ScrollView style={{ maxHeight: 320 }}>
                        {(customizingItem.customizations ?? []).map((group) => (
                            <View key={group.name} style={{ marginTop: 14 }}>
                                <Text style={[styles.label, { color: theme.text }]}>
                                    {group.name} {group.isRequired ? '*' : ''}
                                </Text>

                                <View style={styles.rowWrap}>
                                    {group.options.map((option) => (
                                        <Pressable
                                            key={option.name}
                                            onPress={() =>
                                                setSelectedCustomizations((prev) => ({
                                                    ...prev,
                                                    [group.name]: option.name,
                                                }))
                                            }
                                            style={[
                                                styles.smallChoice,
                                                {
                                                    backgroundColor: selectedCustomizations[group.name] === option.name ? theme.primary : theme.inputBg,
                                                    borderColor: theme.border,
                                                },
                                            ]}
                                        >
                                            <Text style={{ color: selectedCustomizations[group.name] === option.name ? theme.buttonText : theme.text }}>
                                                {option.name}
                                                {option.priceModifier > 0 ? ` (+$${option.priceModifier.toFixed(2)})` : ''}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.row}>
                        <Pressable
                            onPress={() => {
                                setCustomizingItem(null);
                                setSelectedCustomizations({});
                            }}
                            style={[styles.secondaryButton, styles.flexOne, { borderColor: theme.border, backgroundColor: theme.inputBg }]}
                        >
                            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Cancel</Text>
                        </Pressable>

                        <Pressable
                            onPress={handleConfirmCustomizedOrder}
                            style={[styles.primaryButton, styles.flexOne, { backgroundColor: theme.primary }]}
                        >
                            <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>Add to Cart</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    }

    function renderContent() {
        switch (activeTab) {
            case 'Menu':
                return renderMenu();
            case 'Nutrition':
                return renderNutrition();
            case 'Reservations':
                return renderReservations();
            case 'Cart':
                return renderCart();
            case 'Profile':
                return renderProfile();
            case 'Orders':
                return renderOrders();
            default:
                return renderHome();
        }
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
            <View style={[styles.appContainer, { backgroundColor: theme.bg }]}>
                <View style={[styles.promoBanner, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.promoText, { color: theme.buttonText }]}>{PROMOS[promoIndex]}</Text>
                </View>

                {!!toastMessage && (
                    <View style={[styles.toast, { backgroundColor: theme.primary }]}>
                        <Text style={[styles.toastText, { color: theme.buttonText }]}>{toastMessage}</Text>
                    </View>
                )}

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {renderContent()}
                </ScrollView>

                <View style={[styles.bottomNav, { backgroundColor: theme.navBg, borderTopColor: theme.border }]}>
                    {(['Home', 'Menu', 'Reservations', 'Cart', 'Profile'] as MobileTab[]).map((tab) => (
                        <Pressable
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={styles.navButton}
                        >
                            <Text style={{ color: activeTab === tab ? theme.primary : theme.muted, fontWeight: activeTab === tab ? '800' : '600' }}>
                                {tab}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {renderCustomizationModal()}
            </View>
        </SafeAreaView>
    );
}

function getTheme(darkMode: boolean) {
    if (darkMode) {
        return {
            bg: '#000000',
            card: '#0a0a0a',
            text: '#ffffff',
            muted: '#9a9a9a',
            primary: '#22d3ee',
            border: '#333333',
            buttonText: '#000000',
            navBg: '#000000',
            inputBg: '#121212',
            badgeBg: 'rgba(34, 211, 238, 0.12)',
            success: '#4ade80',
            error: '#ff6b6b',
            occupied: '#3a1d1d',
        };
    }

    return {
        bg: '#f7f7f7',
        card: '#ffffff',
        text: '#111111',
        muted: '#666666',
        primary: '#22d3ee',
        border: '#dddddd',
        buttonText: '#000000',
        navBg: '#ffffff',
        inputBg: '#ffffff',
        badgeBg: 'rgba(34, 211, 238, 0.12)',
        success: '#1f9d55',
        error: '#d9485f',
        occupied: '#ecd3d3',
    };
}

function getRequestedBytes(choice: RedemptionChoice, subtotalInCents: number) {
    switch (choice) {
        case 'ten':
            return Math.ceil(subtotalInCents * 0.1);
        case 'twentyfive':
            return Math.ceil(subtotalInCents * 0.25);
        case 'fifty':
            return Math.ceil(subtotalInCents * 0.5);
        case 'full':
            return subtotalInCents;
        default:
            return 0;
    }
}

function getLocalDateInputValue(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function buildReservationDate(dateString: string, time: string) {
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function buildReservationDateTimeString(dateString: string, time: string) {
    if (!dateString || !time) return '';
    const date = buildReservationDate(dateString, time);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function parseApiLocalDateTime(value: string) {
    const normalized = value.replace('Z', '');
    const [datePart, timePart = '00:00:00'] = normalized.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds = 0] = timePart.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes, seconds, 0);
}

function formatDisplayDateTime(dateTimeString: string) {
    const date = parseApiLocalDateTime(dateTimeString);

    if (Number.isNaN(date.getTime())) {
        return dateTimeString;
    }

    return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function getMenuImageSrc(item: MenuItem) {
    const base = API_BASE_URL;

    const imageMap: Record<string, string> = {
        'Iced Latte': `${base}/images/menu/iced-latte.jpg`,
        'Supernova': `${base}/images/menu/supernova-espresso.jpg`,
        'Roaring Frappe': `${base}/images/menu/roaring-frappe.jpg`,
        'Black & White Cold Brew': `${base}/images/menu/black-and-white-cold-brew.jpg`,
        'Strawberry Limeade': `${base}/images/menu/strawberry-lemonade.jpg`,
        'Shaken Lemonade': `${base}/images/menu/shaken-lemonade.jpg`,

        'Mannino Honey Crepe': `${base}/images/menu/mannino-honey-crepe.jpg`,
        'Downtowner': `${base}/images/menu/downtowner.jpg`,
        'Funky Monkey': `${base}/images/menu/funky-monkey.jpg`,
        "Le S'mores": `${base}/images/menu/le-smores.jpg`,
        'Strawberry Fields': `${base}/images/menu/strawberry-fields.jpg`,
        'Bonjour': `${base}/images/menu/bonjour.jpg`,
        'Banana Foster': `${base}/images/menu/banana-foster-crepe.jpg`,

        "Matt's Scrambled Eggs": `${base}/images/menu/matt's-scrambled-eggs.jpg`,
        'Meanie Mushroom': `${base}/images/menu/meanie-mushroom.jpg`,
        'Turkey Club': `${base}/images/menu/turkey-club.jpg`,
        'Green Machine': `${base}/images/menu/green-machine.jpg`,
        'Perfect Pair': `${base}/images/menu/perfect-pair.jpg`,
        'Crepe Fromage': `${base}/images/menu/crepe-fromage.jpg`,
        'Farmers Market Crepe': `${base}/images/menu/farmers-market-crepes.jpg`,

        'Travis Special': `${base}/images/menu/travis-special.jpg`,
        'Crème Brulagel': `${base}/images/menu/creme-brulagel.jpg`,
        'The Fancy One': `${base}/images/menu/the-fancy-one.jpg`,
        'Breakfast Bagel': `${base}/images/menu/breakfast-bagel.jpg`,
        'The Classic': `${base}/images/menu/the-classic.jpg`,
    };

    if (item.imageUrl && item.imageUrl.trim().length > 0) {
        if (item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://')) {
            return item.imageUrl;
        }

        return `${base}${item.imageUrl}`;
    }

    return imageMap[item.name] || `${base}/images/menu/breakfast-bagel.jpg`;
}

function getTableLabelByIdFromList(tableId: number, tables: TableItem[]) {
    return tables.find((table) => table.id === tableId)?.label ?? `Table ${tableId}`;
}

function getTableLabelById(this: never, tableId: number): string {
    return `Table ${tableId}`;
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    appContainer: {
        flex: 1,
    },
    promoBanner: {
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    promoText: {
        textAlign: 'center',
        fontWeight: '800',
        fontSize: 13,
    },
    toast: {
        marginHorizontal: 16,
        marginTop: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
    },
    toastText: {
        textAlign: 'center',
        fontWeight: '700',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 110,
    },
    header: {
        marginBottom: 14,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '900',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 12,
        marginTop: 4,
        textTransform: 'uppercase',
    },
    sectionTitleSmall: {
        fontSize: 16,
        fontWeight: '800',
    },
    stack: {
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    rowWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    flexOne: {
        flex: 1,
    },
    card: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
    },
    statusCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
    },
    menuImage: {
        width: '100%',
        height: 190,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#111',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 6,
    },
    cardDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 6,
    },
    priceText: {
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 10,
    },
    primaryButton: {
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontWeight: '800',
        fontSize: 15,
    },
    secondaryButton: {
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    secondaryButtonText: {
        fontWeight: '700',
        fontSize: 15,
    },
    badge: {
        fontSize: 12,
        fontWeight: '800',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
    },
    mutedText: {
        fontSize: 14,
        marginTop: 6,
        marginBottom: 10,
    },
    linkText: {
        fontWeight: '800',
        fontSize: 14,
    },
    filterRow: {
        gap: 8,
        paddingBottom: 10,
    },
    filterPill: {
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
    },
    tableRow: {
        paddingVertical: 8,
        borderBottomWidth: 1,
    },
    label: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 12,
        fontSize: 15,
    },
    smallChoice: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tableButton: {
        width: '30%',
        minWidth: 92,
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    itemBlock: {
        marginBottom: 10,
    },
    bigNumber: {
        fontSize: 40,
        fontWeight: '900',
        marginBottom: 6,
    },
    smallText: {
        fontSize: 13,
    },
    smallMuted: {
        fontSize: 12,
        marginTop: 4,
    },
    errorText: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10,
    },
    bottomNav: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        borderTopWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 14,
        paddingHorizontal: 8,
    },
    navButton: {
        paddingHorizontal: 4,
        alignItems: 'center',
    },
    modalBackdrop: {
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        padding: 16,
    },
    modalCard: {
        borderWidth: 1,
        borderRadius: 18,
        padding: 16,
        maxHeight: '84%',
    },
});