// src/reportWebVitals.js

const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Core Web Vitals metrics
      getCLS(onPerfEntry);  // Cumulative Layout Shift
      getFID(onPerfEntry);  // First Input Delay
      getLCP(onPerfEntry);  // Largest Contentful Paint
      
      // Additional metrics
      getFCP(onPerfEntry);  // First Contentful Paint
      getTTFB(onPerfEntry); // Time to First Byte
    }).catch((error) => {
      console.error('Error loading web-vitals:', error);
    });
  }
};

export default reportWebVitals;
