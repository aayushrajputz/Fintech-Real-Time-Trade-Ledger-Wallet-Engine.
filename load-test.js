import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '15s', target: 500 },  // Ramp up to 500 VUs
        { duration: '30s', target: 4000 }, // Peak at 3,000 Virtual Users
        { duration: '15s', target: 0 },    // Ramp down
    ],
};

export default function () {
    const url = 'http://localhost/api/v1/order/place';

    const payload = JSON.stringify({
        symbol: 'BTC_USDT',
        type: 'LIMIT',
        side: 'BUY',
        quantity: 1,
        price: 50000,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `k6-1k-${Math.random()}`,
            'Authorization': 'Bearer test-token'
        },
    };

    const res = http.post(url, payload, params);

    check(res, {
        'status is 202 or 401 or 429': (r) => r.status === 202 || r.status === 401 || r.status === 429,
    });

    sleep(0.05);
}
