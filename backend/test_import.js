const fs = require('fs');
const path = require('path');

async function testImport() {
    console.log('🚀 Starting Import Engine Verification...');
    
    // 1. Get Token
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ceo@accounta.pk', password: 'admin123' })
    });
    const { data } = await loginRes.json();
    const token = data.token;

    // 2. Prepare Form Data
    const formData = new FormData();
    const csvContent = fs.readFileSync(path.join(__dirname, 'sample_leads.csv'));
    const blob = new Blob([csvContent], { type: 'text/csv' });
    formData.append('file', blob, 'sample_leads.csv');

    // 3. Request
    try {
        const res = await fetch('http://localhost:5000/api/import/leads', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const result = await res.json();
        console.log('📊 Import Result:', JSON.stringify(result, null, 2));
        
        if (result.success && result.summary.success === 3) {
            console.log('✅ Import Engine Verified!');
        } else {
            console.error('❌ Import Failed or mismatched count');
        }
    } catch (e) {
        console.error('❌ Import Request Error:', e.message);
    }
}

testImport();
