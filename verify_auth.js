const http = require('http');

function request(path, method, body, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    const timestamp = Date.now();
    const user = {
        firstName: 'Test',
        lastName: 'User',
        email: `test${timestamp}@example.com`,
        password: 'password123',
        confirmPassword: 'password123'
    };

    console.log('Testing Signup...');
    try {
        const signupRes = await request('/api/auth/signup', 'POST', {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: user.password
        });
        console.log('Signup Status:', signupRes.status);
        console.log('Signup Body:', signupRes.body);

        if (!signupRes.body.success) {
            console.error('Signup Failed');
            return;
        }

        console.log('\nTesting Login...');
        const loginRes = await request('/api/auth/login', 'POST', {
            email: user.email,
            password: user.password
        });
        console.log('Login Status:', loginRes.status);
        console.log('Login Body:', loginRes.body);

        if (!loginRes.body.success || !loginRes.body.token) {
            console.error('Login Failed');
            return;
        }

        const token = loginRes.body.token;
        console.log('\nTesting Session (Me)...');
        const meRes = await request('/api/auth/me', 'GET', null, token);
        console.log('Me Status:', meRes.status);
        console.log('Me Body:', meRes.body);

        if (meRes.body.success && meRes.body.user.email === user.email) {
            console.log('\n✅ VERIFICATION SUCCESSFUL');
        } else {
            console.error('\n❌ VERIFICATION FAILED');
        }

    } catch (err) {
        console.error('Test Error:', err);
    }
}

// Wait for server to start (manual delay or just run)
setTimeout(runTests, 2000);
