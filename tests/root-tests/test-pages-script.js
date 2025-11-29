// Test script to check all pages
const pages = [
  '/',
  '/login',
  '/register',
  '/individual/dashboard',
  '/individual/create-shipment',
  '/individual/shipments',
  '/individual/my-shipments',
  '/individual/offers',
  '/individual/messages',
  '/individual/notifications',
  '/individual/settings',
  '/corporate/dashboard',
  '/corporate/create-shipment',
  '/corporate/shipments',
  '/corporate/offers',
  '/corporate/messages',
  '/corporate/notifications',
  '/nakliyeci/dashboard',
  '/nakliyeci/open-shipments',
  '/nakliyeci/offers',
  '/nakliyeci/shipments',
  '/tasiyici/dashboard',
  '/tasiyici/jobs',
  '/tasiyici/active-jobs',
  '/tasiyici/completed-jobs',
];

console.log('Test edilecek sayfalar:', pages.length);
pages.forEach(page => console.log(`- ${page}`));
