import { Toaster as SonnerToaster } from 'sonner';

export const Toaster = () => (
  <SonnerToaster
    theme="dark"
    position="bottom-right"
    toastOptions={{
      className: 'rounded-md bg-surface-1 border border-border text-white text-sm',
    }}
  />
);
