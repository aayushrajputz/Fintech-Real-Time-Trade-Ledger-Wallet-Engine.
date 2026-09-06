import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '10s', target: 200 },  // Ramp up to 200 VUs
        { duration: '20s', target: 1000 }, // Peak at 1,000 Virtual Users
        { duration: '10s', target: 0 },    // Ramp down
    ],
};

export default function () {
    const url = 'http://localhost/api/v1/order/place';

    const sides = ['BUY', 'SELL'];
    const randomSide = sides[Math.floor(Math.random() * sides.length)];

    const payload = JSON.stringify({
        symbol: 'BTC_USDT',
        type: 'LIMIT',
        side: randomSide,
        quantity: 1,
        price: 50000,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `k6-key-${__VU}-${__ITER}-${Date.now()}`,
            'Authorization': 'Bearer test-token'
        },
    };

    const res = http.post(url, payload, params);

    const passed = check(res, {
        'status is 201 or 202 or 200': (r) => r.status === 201 || r.status === 202 || r.status === 200,
    });

    if (!passed) {
        console.log(`Failed status: ${res.status}, body: ${res.body}`);
    }

    sleep(0.05);
}
