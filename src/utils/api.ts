// API URL helper to dynamically route requests to the live backend server
// when running inside native Android (Capacitor/WebView) or web environment.

const BACKEND_URL = 'https://ais-dev-l6afs53p7hhhp64rewakdk-45073816214.us-west2.run.app';

export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If in browser dev or production served by Express
  if (typeof window !== 'undefined') {
    const isCapacitor = 
      window.location.protocol === 'capacitor:' || 
      window.location.protocol === 'ionic:' ||
      window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '';
    
    // In Capacitor native runtime, route to the live cloud backend
    if (isCapacitor || (window as any).Capacitor?.isNativePlatform?.()) {
      return `${BACKEND_URL}${cleanEndpoint}`;
    }
  }

  return cleanEndpoint;
}
