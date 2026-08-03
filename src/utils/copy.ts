export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!text) return false;

  // Method 1: Try Modern Clipboard API
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard API writeText failed, attempting fallback...', err);
  }

  // Method 2: Fallback using temporary textarea element and execCommand('copy')
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Keep off-screen and invisible
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    
    // Select text
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 99999); // For mobile devices

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback execCommand copy failed:', err);
    return false;
  }
};
