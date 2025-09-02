// Custom plugin to resolve expo-notifications module in GitHub CI
const withNotifications = (config) => {
  // Make sure the plugins array exists
  if (!config.plugins) {
    config.plugins = [];
  }
  
  // Add or update the expo-notifications configuration
  // Find if expo-notifications already exists in plugins
  const notificationsPluginIndex = config.plugins.findIndex(plugin => 
    (Array.isArray(plugin) && plugin[0] === 'expo-notifications') ||
    plugin === 'expo-notifications'
  );
  
  // Define the notifications plugin configuration
  const notificationsPlugin = [
    'expo-notifications',
    {
      icon: './assets/icon.png',
      color: '#4CAF50',
      sounds: []
    }
  ];
  
  // Either update or add the plugin
  if (notificationsPluginIndex !== -1) {
    config.plugins[notificationsPluginIndex] = notificationsPlugin;
  } else {
    config.plugins.push(notificationsPlugin);
  }
  
  return config;
};

module.exports = withNotifications;