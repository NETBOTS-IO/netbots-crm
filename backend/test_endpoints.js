const fs = require('fs');
const BASE_URL = 'http://localhost:5000/api';

async function testEndpoints() {
    const report = {
        timestamp: new Date().toISOString(),
        tests: []
    };
    
    console.log('🚀 Starting Endpoint Verification Test...\n');
    let token = '';

    // 1. Login Test
    try {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'saqlain@netbots.io', password: 'SaqlainShah@110' })
        });
        const loginData = await loginRes.json();
        if (loginData.success) {
            token = loginData.data.token;
            report.tests.push({ module: 'AUTH', action: 'Login', success: true });
        } else {
            report.tests.push({ module: 'AUTH', action: 'Login', success: false, error: loginData.error });
            fs.writeFileSync('test_report.json', JSON.stringify(report, null, 2));
            return;
        }
    } catch (e) {
        report.tests.push({ module: 'AUTH', action: 'Login', success: false, error: e.message });
        fs.writeFileSync('test_report.json', JSON.stringify(report, null, 2));
        return;
    }

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    await testGet('/auth/me', 'AUTH', 'Me', headers, report);
    await testGet('/leads', 'LEADS', 'GetAll', headers, report);
    await testGet('/clients', 'CLIENTS', 'GetAll', headers, report);
    await testGet('/analytics/overview', 'ANALYTICS', 'Overview', headers, report);
    await testGet('/analytics/funnel', 'ANALYTICS', 'Funnel', headers, report);
    await testGet('/team', 'TEAM', 'Members', headers, report);
    await testGet('/team/leaderboard', 'TEAM', 'Leaderboard', headers, report);
    await testGet('/commissions', 'COMMISSIONS', 'Ledger', headers, report);
    await testGet('/payouts', 'PAYOUTS', 'Batches', headers, report);

    fs.writeFileSync('test_report.json', JSON.stringify(report, null, 2));
    console.log('\n🏁 Report saved to test_report.json');
}

async function testGet(endpoint, module, action, headers, report) {
    try {
        const res = await fetch(`${BASE_URL}${endpoint}`, { headers });
        const data = await res.json();
        report.tests.push({ 
            module, 
            action, 
            success: data.success, 
            results: Array.isArray(data.data) ? data.data.length : (data.data ? 1 : 0),
            error: data.success ? null : data.error
        });
    } catch (e) {
        report.tests.push({ module, action, success: false, error: e.message });
    }
}

testEndpoints();
