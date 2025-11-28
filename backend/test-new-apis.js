const http = require('http');

// Use valid UUID format for testing
const testUUID = '00000000-0000-0000-0000-000000000000';

const tests = [
    { name: 'Works List', path: '/api/works' },
    { name: 'Health Check', path: '/api/health' }
];

console.log('🧪 Testing API endpoints...\n');

let completed = 0;

tests.forEach(test => {
    const req = http.get('http://localhost:3000' + test.path, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const status = res.statusCode === 200 ? '✅ OK' : '⚠️ ' + res.statusCode;
            console.log(test.name + ': ' + status);
            completed++;
            if (completed === tests.length) {
                console.log('\n✨ Test complete!');
            }
        });
    });
    req.on('error', e => {
        console.log(test.name + ': ❌ ' + e.message);
        completed++;
    });
});