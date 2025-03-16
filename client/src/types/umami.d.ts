interface UmamiWindow extends Window {
  umami?: {
    track: (eventName: string, eventData?: Record<string, any>) => void;
  };
}

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, any>) => void;
    };
  }
}

export {}; 