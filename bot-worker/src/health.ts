import { ENV } from "./config/env";
import { getExecutionStatus } from "./bot";

export interface HealthCheckResult {
  status: "healthy" | "unhealthy" | "executing";
  workerId: string;
  deviceUdid: string;
  uptime: number;
  isExecuting: boolean;
  hasDriver: boolean;
  timestamp: string;
  appiumHost: string;
  appiumPort: number;
}

/**
 * Perform health check on the bot worker
 */
export async function healthCheck(): Promise<HealthCheckResult> {
  const status = getExecutionStatus();
  const uptime = process.uptime();

  // Determine health status
  let healthStatus: "healthy" | "unhealthy" | "executing";
  if (status.isExecuting) {
    healthStatus = "executing";
  } else {
    healthStatus = "healthy";
  }

  return {
    status: healthStatus,
    workerId: ENV.WORKER_ID,
    deviceUdid: ENV.DEVICE_UDID,
    uptime,
    isExecuting: status.isExecuting,
    hasDriver: status.hasDriver,
    timestamp: new Date().toISOString(),
    appiumHost: ENV.APPIUM_HOST,
    appiumPort: ENV.APPIUM_PORT,
  };
}

/**
 * Check if Appium server is reachable
 */
export async function checkAppiumConnection(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`http://${ENV.APPIUM_HOST}:${ENV.APPIUM_PORT}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}
