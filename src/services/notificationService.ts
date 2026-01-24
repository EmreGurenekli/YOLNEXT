// Notification service - temporarily disabled
const notificationService = {
  show: () => {},
  hide: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
  connect: () => {},
  disconnect: () => {},
  initialize: () => {},
  requestPermission: () => Promise.resolve(true),
  isEnabled: true,
  getPermissionStatus: () => 'granted' as NotificationPermission,
  sendNotification: () => {},
};

export default notificationService;









