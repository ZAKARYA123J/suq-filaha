export default async function sendViaIAMAPI(phoneNumber, message) {
    try {
        const response = await fetch('https://api.sms.to/sms/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2F1dGg6ODA4MC9hcGkvdjEvdXNlcnMvYXBpL2tleXMvZ2VuZXJhdGUiLCJpYXQiOjE3Njg2OTMzNDEsIm5iZiI6MTc2ODY5MzM0MSwianRpIjoiQW4zendaNnMxNEU1T0RMMyIsInN1YiI6NDkzODg1LCJwcnYiOiIyM2JkNWM4OTQ5ZjYwMGFkYjM5ZTcwMWM0MDA4NzJkYjdhNTk3NmY3In0.236BiasVrmbONSEX1SVWVyZU-7DyN02eKrJNP80J_lM`, // Your API key
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                to: phoneNumber, // Format: +212XXXXXXXXX for Morocco
                sender_id: 'SuqFilaha', // Optional: Your brand name (max 11 chars)
                bypass_optout: true // For transactional messages like OTP
            })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('SMS API Error Details:', errorData);
            throw new Error(`SMS API responded with status: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success) {
            console.error('SMS.to API reported failure:', result);
            throw new Error(`SMS failed: ${result.message || 'Unknown error'}`);
        }
        console.log('SMS sent successfully:', result);
        return result;
    }
    catch (error) {
        console.error('Error sending SMS:', error);
        throw new Error('Failed to send SMS');
    }
}
