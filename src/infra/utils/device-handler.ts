export interface DeviceInfo {
  deviceType: string;
  browser: string;
}

export const getDeviceInfo = (userAgentInfo: any): DeviceInfo => {
  return userAgentInfo
    ? {
        deviceType: userAgentInfo.isDesktop
          ? 'Desktop'
          : userAgentInfo.isMobile
            ? 'Mobile'
            : userAgentInfo.isTablet
              ? 'Tablet'
              : 'Unknown',
        browser: userAgentInfo.browser || 'Unknown',
      }
    : {
        deviceType: 'Unknown',
        browser: 'Unknown',
      };
};
