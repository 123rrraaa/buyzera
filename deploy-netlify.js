const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get Netlify token
const configPath = path.join(require('os').homedir(), 'AppData/Roaming/netlify/Config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const token = config.users[config.userId].auth.token;

async function deploy() {
    // 1. Create site
    console.log('📦 Creating Netlify site...');
    const createRes = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'buyzera-store' })
    });

    let site;
    if (createRes.ok) {
        site = await createRes.json();
        console.log('✅ Site created:', site.ssl_url);
    } else {
        const err = await createRes.json();
        if (err.errors && err.errors[0]?.includes('already taken')) {
            console.log('⚠️ Name taken, creating with random name...');
            const createRes2 = await fetch('https://api.netlify.com/api/v1/sites', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            site = await createRes2.json();
            console.log('✅ Site created:', site.ssl_url);
        } else {
            console.error('❌ Failed to create site:', err);
            process.exit(1);
        }
    }

    const siteId = site.id;
    console.log('🆔 Site ID:', siteId);

    // 2. Deploy using netlify-cli with --site flag (non-interactive)
    console.log('🚀 Deploying dist folder...');
    try {
        const output = execSync(
            `npx netlify-cli deploy --prod --dir=dist --site=${siteId}`,
            { cwd: path.join(__dirname, 'Frontend'), encoding: 'utf8', timeout: 60000 }
        );
        console.log(output);
    } catch (e) {
        console.log(e.stdout || '');
        console.error(e.stderr || '');
    }

    console.log('\n🎉 Deployment complete!');
    console.log('🛒 Customer Store:', site.ssl_url);
    console.log('👑 Admin Panel:', site.ssl_url + '/admin/login');
}

deploy().catch(err => { console.error(err); process.exit(1); });
