import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import menu from '../mocks/menu.json';
import orderMock from '../mocks/order.json';
import initialCart from '../mocks/cart.json';

// 손님 폰(/, /voice, /menu, /confirm, /status)과 매장 화면(/boss)이
// 같은 브라우저의 다른 탭에서도 같은 주문을 보도록 localStorage 에 저장해요.
const STORAGE_KEY = 'tello-session';

export const MARKS = orderMock.marks;
export const MODE_LABELS = orderMock.modes;
export const STATUS_LABELS = orderMock.statusLabels;

const NEXT_STATUS = { new: 'prep', prep: 'ready', ready: 'gone' };

export const findItem = (id) => menu.items.find((item) => item.id === id);

const sizeExtra = (size) =>
    menu.sizes.find((s) => s.id === size)?.extra ?? 0;

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

            // ---------- 담은 메뉴 ----------
            addItem: (id, opt = '') =>
                set((s) => {
                    const item = findItem(id);
                    if (!item) return {};
                    const key = `${id}|${opt}`;
                    const exists = s.cart.find((line) => line.key === key);
                    if (exists) {
                        return {
                            cart: s.cart.map((line) =>
                                line.key === key
                                    ? { ...line, qty: line.qty + 1 }
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
                                opt,
                                icon: item.icon,
                                price: item.price + sizeExtra(opt),
                                qty: 1,
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
                const no = s.nextNo;
                const order = {
                    no,
                    mark: markFor(no),
                    mode: s.from === 'voice' ? 'voice' : 'touch',
                    items: s.cart.map((line) => ({
                        name: line.name,
                        qty: line.qty,
                        opt: line.opt,
                    })),
                    status: 'new',
                    createdAt: Date.now(),
                };
                set({ orders: [order, ...s.orders], myOrder: order, nextNo: no + 1 });
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
            startOver: () =>
                set({
                    cart: [],
                    messages: [],
                    voiceStep: 0,
                    failCount: 0,
                    myOrder: null,
                    from: 'voice',
                }),
            resetDemo: () => set(initialState()),
        }),
        {
            name: STORAGE_KEY,
            storage: createJSONStorage(safeStorage),
        },
    ),
);

// 다른 탭(예: 매장 화면)에서 바뀐 주문 상태를 바로 반영
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) useSessionStore.persist.rehydrate();
    });
}
