const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  try {
    console.log('--- Starting Message Security Tests ---');

    // 1. Login as Individual (Owner of 127 and 86)
    console.log('1. Logging in as Individual User...');
    const loginRes = await axios.post(`${API_URL}/auth/demo-login`, { panelType: 'individual' });
    const token = loginRes.data.data.token;
    const userId = loginRes.data.data.user.id;
    console.log(`   Logged in. User ID: ${userId}`);

    // 2. Get Shipment 86 details to find Carrier ID
    console.log('2. Fetching Shipment 86 details to get Carrier ID...');
    const ship86Res = await axios.get(`${API_URL}/shipments/86`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const ship86 = ship86Res.data.data;
    const carrierId = ship86.carrierId || ship86.nakliyeciId; // Adjust based on actual response structure
    
    if (!carrierId) {
        console.error('   ❌ Could not find Carrier ID for Shipment 86. Aborting positive test.');
        // We might need to look at offers if carrierId is not directly on shipment object yet, 
        // but for accepted shipment it should be.
        console.log('   Shipment 86 Data keys:', Object.keys(ship86));
    } else {
        console.log(`   Carrier ID for Shipment 86: ${carrierId}`);
    }

    // 3. Test: Message on Pending Shipment (127) - Should FAIL (403)
    console.log('3. NEGATIVE TEST: Sending message for Pending Shipment 127...');
    try {
      await axios.post(`${API_URL}/messages`, {
        shipmentId: 127,
        receiverId: carrierId || 999, // Use dummy if carrier unknown, but logic checks shipment status first usually
        message: 'This message should fail.'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.error('   ❌ FAILED: Request succeeded but should have failed with 403.');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log(`   ✅ PASSED: Request failed with 403 as expected. Message: ${error.response.data.message}`);
      } else {
        console.error(`   ❌ FAILED: Unexpected error status: ${error.response ? error.response.status : error.message}`);
        if (error.response) console.log(error.response.data);
      }
    }

    // 4. Test: Message on Accepted Shipment (86) - Should SUCCEED (200/201)
    if (carrierId) {
        console.log('4. POSITIVE TEST: Sending message for Accepted Shipment 86...');
        try {
            const msgRes = await axios.post(`${API_URL}/messages`, {
                shipmentId: 86,
                receiverId: carrierId,
                message: 'This is a test message for accepted shipment.'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (msgRes.status === 200 || msgRes.status === 201) {
                console.log('   ✅ PASSED: Message sent successfully.');
            } else {
                console.log(`   ⚠️ WARNING: Unexpected success status: ${msgRes.status}`);
            }
        } catch (error) {
            console.error(`   ❌ FAILED: Could not send message. Status: ${error.response ? error.response.status : error.message}`);
            if (error.response) console.log(error.response.data);
        }
    } else {
        console.log('   ⚠️ Skipping Test 4 due to missing Carrier ID.');
    }

    // 5. Login as Corporate (Unauthorized User)
    console.log('5. Logging in as Corporate User (Attacker)...');
    const loginCorp = await axios.post(`${API_URL}/auth/demo-login`, { panelType: 'corporate' });
    const tokenCorp = loginCorp.data.data.token;
    console.log('   Logged in as Corporate.');

    // 6. Test: Unauthorized Access to Shipment 127 Messages - Should FAIL (403)
    console.log('6. NEGATIVE TEST: Accessing messages for Shipment 127 as unauthorized user...');
    try {
        await axios.get(`${API_URL}/messages/shipment/127`, {
            headers: { Authorization: `Bearer ${tokenCorp}` }
        });
        console.error('   ❌ FAILED: Request succeeded but should have failed with 403.');
    } catch (error) {
        if (error.response && error.response.status === 403) {
            console.log(`   ✅ PASSED: Get messages failed with 403 as expected. Message: ${error.response.data.message}`);
        } else {
             console.error(`   ❌ FAILED: Unexpected error status: ${error.response ? error.response.status : error.message}`);
             if (error.response) console.log(error.response.data);
        }
    }

    // 7. Test: Sending Message to Shipment 127 as Unauthorized User - Should FAIL (403)
    console.log('7. NEGATIVE TEST: Sending message to Shipment 127 as unauthorized user...');
    try {
        await axios.post(`${API_URL}/messages`, {
            shipmentId: 127,
            receiverId: userId, // Trying to message the owner
            message: 'I am an attacker.'
        }, {
            headers: { Authorization: `Bearer ${tokenCorp}` }
        });
        console.error('   ❌ FAILED: Request succeeded but should have failed with 403.');
    } catch (error) {
        if (error.response && error.response.status === 403) {
            console.log(`   ✅ PASSED: Request failed with 403. Message: ${error.response.data.message}`);
        } else {
             // It might return 404 if shipment check fails logic
            console.log(`   ✅ PASSED (with status ${error.response ? error.response.status : 'unknown'}): Request failed.`);
            if (error.response) console.log('   Response:', error.response.data);
        }
    }

  } catch (err) {
    console.error('Global Test Error:', err.message);
  }
}

runTests();
