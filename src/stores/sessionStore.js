import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import menu from '../mocks/menu.json';
import orderMock from '../mocks/order.json';
import initialCart from '../mocks/cart.json';
import { endCurrentSession } from '../api/session';

// 손님 폰(/, /voice, /menu, /confirm, /status)과 매장 화면(/boss)이
// 같은 브라우저의 다른 탭에서도 같은 주문을 보도록 localStorage 에 저장해요.
const STORAGE_KEY = 'tello-session';

export const MARKS = orderMock.marks;
export const MODE_LABELS = orderMock.modes;
export const STATUS_LABELS = orderMock.statusLabels;

const NEXT_STATUS = { new: 'prep', prep: 'ready', ready: 'gone' };

export const OPTIONS = menu.options;
// 옵션을 묻는 순서: 크기 → 온도 → 얼음
const OPTION_ORDER = ['size', 'temperature', 'ice'];

export const findItem = (id) => menu.items.find((item) => item.id === id);

export const getChoiceLabel = (key, id) =>
    OPTIONS[key]?.choices.find((c) => c.id === id)?.label ?? '';

// 이 메뉴에서 다음에 물어볼 옵션 (얼음은 아이스일 때만). 다 골랐으면 null
export const nextOption = (item, picked = {}) =>
    OPTION_ORDER.find(
        (key) =>
            item.options?.includes(key) &&
            picked[key] == null &&
            (key !== 'ice' || picked.temperature === 'ice'),
    ) ?? null;

// { size: 'large', temperature: 'ice', ice: 'less' } → "아이스 · 큰 사이즈 · 얼음 적게"
export const getOptionLabel = (options = {}) =>
    [
        options.temperature && getChoiceLabel('temperature', options.temperature),
        options.size && getChoiceLabel('size', options.size),
        options.ice && `얼음 ${getChoiceLabel('ice', options.ice)}`,
    ]
        .filter(Boolean)
        .join(' · ');

// 아이스를 고르면 아이스 그림이 있는 메뉴는 그림도 바꿔요
export const getItemIcon = (item, options = {}) =>
    options.temperature === 'ice' && item.iceIcon ? item.iceIcon : item.icon;

const sizeExtra = (size) =>
    OPTIONS.size.choices.find((c) => c.id === size)?.extra ?? 0;

// 메뉴에 없는 옵션은 빼고 저장 (DB 필드: size / temperature / ice)
const cleanOptions = (item, options = {}) =>
    Object.fromEntries(
        OPTION_ORDER.filter(
            (key) =>
                item.options?.includes(key) &&
                options[key] != null &&
                (key !== 'ice' || options.temperature === 'ice'),
        ).map((key) => [key, options[key]]),
    );

// 같은 메뉴·같은 옵션이면 같은 줄로 묶는 열쇠
const lineKey = (id, picked) => [id, ...OPTION_ORDER.map((k) => picked[k] ?? '')].join('|');

export const getCartCount = (cart) =>
    cart.reduce((sum, line) => sum + line.qty, 0);

export const getCartTotal = (cart) =>
    cart.reduce((sum, line) => sum + line.qty * line.price, 0);

export const getCartText = (cart) =>
    cart
        .map((line) => `${line.name}${line.opt ? ` ${line.opt}` : ''} ${line.qty}개`)
        .join(', ');

const markFor = (no) =>
    MARKS[(((no - orderMock.firstNo) % MARKS.length) + MARKS.length) % MARKS.length];

const sampleOrders = () =>
    orderMock.sampleOrders.map((o) => ({
        no: o.no,
        mark: MARKS[o.markIndex],
        mode: o.mode,
        items: o.items,
        status: o.status,
        createdAt: Date.now() - o.minutesAgo * 60000,
        sample: true,
    }));

const initialState = () => ({
    from: 'voice', // 마지막으로 쓴 주문 방법: 'voice' | 'menu'
    cart: [...initialCart],
    messages: [],
    voiceStep: 0,
    failCount: 0,
    orders: sampleOrders(),
    calls: [],
    myOrder: null,
    nextNo: orderMock.firstNo,
    soundOn: true,
    bigText: false, // 큰 글씨 모드(X1.5)
});

const safeStorage = () => {
    try {
        return window.localStorage;
    } catch {
        // 저장소를 쓸 수 없는 환경이면 메모리로만 동작
        return undefined;
    }
};

export const useSessionStore = create(
    persist(
        (set, get) => ({
            ...initialState(),

            setFrom: (from) => set({ from }),
            toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
            toggleBigText: () => set((s) => ({ bigText: !s.bigText })),

            // ---------- 담은 메뉴 ----------
            // options: { size, temperature, ice } — 옵션 없는 메뉴는 생략 / qty: 담을 개수
            addItem: (id, options = {}, qty = 1) =>
                set((s) => {
                    const item = findItem(id);
                    if (!item) return {};
                    const picked = cleanOptions(item, options);
                    const key = lineKey(id, picked);
                    const exists = s.cart.find((line) => line.key === key);
                    if (exists) {
                        return {
                            cart: s.cart.map((line) =>
                                line.key === key
                                    ? { ...line, qty: line.qty + qty }
                                    : line,
                            ),
                        };
                    }
                    return {
                        cart: [
                            ...s.cart,
                            {
                                key,
                                id,
                                name: item.name,
                                options: picked,
                                opt: getOptionLabel(picked),
                                icon: getItemIcon(item, picked),
                                price: item.price + sizeExtra(picked.size),
                                qty,
                            },
                        ],
                    };
                }),

            changeQty: (key, delta) =>
                set((s) => ({
                    cart: s.cart
                        .map((line) =>
                            line.key === key
                                ? { ...line, qty: line.qty + delta }
                                : line,
                        )
                        .filter((line) => line.qty > 0),
                })),

            // 서버 장바구니를 화면 장바구니로 바꿔요 (서버가 기준)
            // 서버는 담을 때마다 항목(itemId)을 새로 만들어서, 같은 메뉴·옵션은 한 줄로 묶고
            // 서버 항목들은 parts: [{ itemId, qty }]에 기억해 둬요 → [−][+]할 때 써요
            setCartFromServer: (items = []) =>
                set(() => {
                    const lines = [];
                    items.forEach((it) => {
                        const item = findItem(it.menuId);
                        if (!item) return;
                        const picked = cleanOptions(item, it.selectedOptions ?? {});
                        const key = lineKey(it.menuId, picked);
                        const part = { itemId: it.itemId, qty: it.quantity };
                        const line = lines.find((l) => l.key === key);
                        if (line) {
                            line.qty += it.quantity;
                            line.parts.push(part);
                            return;
                        }
                        lines.push({
                            key,
                            id: it.menuId,
                            name: item.name,
                            options: picked,
                            opt: getOptionLabel(picked),
                            icon: getItemIcon(item, picked),
                            price: it.unitPrice ?? item.price + sizeExtra(picked.size),
                            qty: it.quantity,
                            parts: [part],
                        });
                    });
                    return { cart: lines };
                }),

            // ---------- 말로 주문 대화 ----------
            pushMessage: (message) =>
                set((s) => ({
                    messages: [
                        ...s.messages,
                        { id: `${Date.now()}-${s.messages.length}`, ...message },
                    ],
                })),
            setVoiceStep: (voiceStep) => set({ voiceStep }),
            setFailCount: (failCount) => set({ failCount }),

            // ---------- 주문 ----------
            placeOrder: () => {
                const s = get();
                if (!s.cart.length) return null;
                const no = orderMock.firstNo; // 주문 번호는 27번으로 통일
                const order = {
                    no,
                    mark: markFor(no),
                    mode: s.from === 'voice' ? 'voice' : 'touch',
                    // 백엔드로 보낼 때: menuId + size / temperature / ice
                    items: s.cart.map((line) => ({
                        menuId: line.id,
                        name: line.name,
                        qty: line.qty,
                        opt: line.opt,
                        ...line.options,
                    })),
                    status: 'new',
                    createdAt: Date.now(),
                };
                set({ orders: [order, ...s.orders.filter((o) => o.no !== no)], myOrder: order });
                return order;
            },

            advanceOrder: (no) =>
                set((s) => ({
                    orders: s.orders
                        .map((o) =>
                            o.no === no ? { ...o, status: NEXT_STATUS[o.status] } : o,
                        )
                        .filter((o) => o.status !== 'gone'),
                })),

            setOrderStatus: (no, status) =>
                set((s) => ({
                    orders: s.orders.map((o) => (o.no === no ? { ...o, status } : o)),
                })),

            // ---------- 직원 부르기 ----------
            callStaff: (reason, orderNo = null) =>
                set((s) => ({
                    calls: [
                        ...s.calls,
                        { id: `${Date.now()}`, reason, orderNo, createdAt: Date.now() },
                    ],
                })),
            ackCall: (id) =>
                set((s) => ({ calls: s.calls.filter((c) => c.id !== id) })),

            // ---------- 처음으로 / 시연 초기화 ----------
            startOver: () => {
                endCurrentSession(); // 서버 세션도 닫아서 이전 장바구니가 남지 않게
                set({
                    cart: [],
                    messages: [],
                    voiceStep: 0,
                    failCount: 0,
                    myOrder: null,
                    from: 'voice',
                });
            },
            resetDemo: () => set(initialState()),
        }),
        {
            name: STORAGE_KEY,
            storage: createJSONStorage(safeStorage),
            // 메뉴 DB·대본 구조가 바뀌면 version 을 올려서 예전 장바구니·대화를 비워요
            version: 3,
            migrate: () => initialState(),
        },
    ),
);

// 다른 탭(예: 매장 화면)에서 바뀐 주문 상태를 바로 반영
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) useSessionStore.persist.rehydrate();
    });
}