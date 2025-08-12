// Test utility to verify webhook connectivity
export const testWebhookConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://primary-production-903a.up.railway.app/webhook/ce39975d-f592-43d2-9680-76dd8f26af23', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: true,
        message: 'Connection test from upload manager'
      })
    });
    
    console.log('Webhook test response:', response.status, response.statusText);
    return response.ok;
  } catch (error) {
    console.error('Webhook connection test failed:', error);
    return false;
  }
};

// Test the webhook connection on module load (for development)
if (import.meta.env.DEV) {
  testWebhookConnection().then(success => {
    console.log(`Webhook connection test: ${success ? 'SUCCESS' : 'FAILED'}`);
  });
}
