import dynamic from 'next/dynamic';

export const createDynamicComponent = (importFn, options = {}) => {
  return dynamic(importFn, {
    ssr: options.ssr ?? true,
    loading: options.loading || (() => (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px' 
      }}>
        Loading...
      </div>
    )),
    ...options,
  });
};

export const createLazyComponent = (importFn) => {
  return dynamic(importFn, {
    ssr: false,
    loading: () => null,
  });
};
