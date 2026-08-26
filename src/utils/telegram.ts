export async function sendTelegramAlert(type: string, message: string, details?: Record<string, any>) {
  try {
    let formattedText = message;
    if (details && Object.keys(details).length > 0) {
      const detailsList = Object.entries(details)
        .filter(([_, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `• <b>${k}</b>: ${v}`)
        .join('\n');
      if (detailsList) {
        formattedText = `${message}\n\n<b>Details:</b>\n${detailsList}`;
      }
    }

    await fetch('/api/telegram/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, message: formattedText })
    });
  } catch (err) {
    console.error('Failed to send Telegram notification:', err);
  }
}
