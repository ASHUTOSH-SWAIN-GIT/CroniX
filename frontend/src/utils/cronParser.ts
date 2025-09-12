/**
 * Utility functions for parsing cron expressions and calculating intervals
 */

export interface CronParts {
  seconds?: string;
  minutes: string;
  hours: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

/**
 * Parse a cron expression into its component parts
 * Supports both 5-field (standard) and 6-field (with seconds) cron expressions
 */
export function parseCronExpression(cronExpression: string): CronParts {
  const parts = cronExpression.trim().split(/\s+/);
  
  if (parts.length === 5) {
    // Standard 5-field cron: minute hour day month dayOfWeek
    return {
      minutes: parts[0],
      hours: parts[1],
      dayOfMonth: parts[2],
      month: parts[3],
      dayOfWeek: parts[4],
    };
  } else if (parts.length === 6) {
    // 6-field cron with seconds: second minute hour day month dayOfWeek
    return {
      seconds: parts[0],
      minutes: parts[1],
      hours: parts[2],
      dayOfMonth: parts[3],
      month: parts[4],
      dayOfWeek: parts[5],
    };
  } else {
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }
}

/**
 * Calculate the minimum execution interval in milliseconds for a cron expression
 * This is used to determine how often we should refresh the logs
 */
export function calculateMinInterval(cronExpression: string): number {
  try {
    const parts = parseCronExpression(cronExpression);
    
    // If seconds are specified and not *, check for sub-minute intervals
    if (parts.seconds && parts.seconds !== '*') {
      // Check for every N seconds patterns
      if (parts.seconds.includes('/')) {
        const interval = parseInt(parts.seconds.split('/')[1]);
        if (!isNaN(interval) && interval > 0) {
          return interval * 1000; // Convert to milliseconds
        }
      }
      
      // Check for specific seconds or ranges
      if (parts.seconds.includes(',') || parts.seconds.includes('-') || /^\d+$/.test(parts.seconds)) {
        return 60000; // At least every minute
      }
    }
    
    // Check for minute intervals
    if (parts.minutes.includes('/')) {
      const interval = parseInt(parts.minutes.split('/')[1]);
      if (!isNaN(interval) && interval > 0) {
        return interval * 60000; // Convert to milliseconds
      }
    }
    
    // Check for specific minutes
    if (parts.minutes !== '*') {
      return 60000; // At least every minute
    }
    
    // Check for hour intervals
    if (parts.hours.includes('/')) {
      const interval = parseInt(parts.hours.split('/')[1]);
      if (!isNaN(interval) && interval > 0) {
        return interval * 3600000; // Convert to milliseconds
      }
    }
    
    // Check for specific hours
    if (parts.hours !== '*') {
      return 3600000; // At least every hour
    }
    
    // Default to daily if no specific pattern found
    return 86400000; // 24 hours in milliseconds
  } catch (error) {
    console.warn('Error parsing cron expression:', error);
    // Default to 30 seconds for safety
    return 30000;
  }
}

/**
 * Get an appropriate refresh interval for the logs page
 * Returns a reasonable refresh rate based on the job's execution frequency
 */
export function getRefreshInterval(cronExpression: string): number {
  const minInterval = calculateMinInterval(cronExpression);
  
  // For very frequent jobs (< 1 minute), refresh every 5 seconds
  if (minInterval < 60000) {
    return 5000;
  }
  
  // For jobs that run every 1-5 minutes, refresh every 10 seconds
  if (minInterval <= 300000) {
    return 10000;
  }
  
  // For jobs that run every 5-30 minutes, refresh every 30 seconds
  if (minInterval <= 1800000) {
    return 30000;
  }
  
  // For jobs that run every 30 minutes to 2 hours, refresh every minute
  if (minInterval <= 7200000) {
    return 60000;
  }
  
  // For less frequent jobs, refresh every 5 minutes
  return 300000;
}

/**
 * Format a cron expression for display
 */
export function formatCronExpression(cronExpression: string): string {
  try {
    const parts = parseCronExpression(cronExpression);
    
    // Handle common patterns
    if (parts.seconds === '*/10' && parts.minutes === '*' && parts.hours === '*') {
      return 'Every 10 seconds';
    }
    
    if (parts.seconds === '*/30' && parts.minutes === '*' && parts.hours === '*') {
      return 'Every 30 seconds';
    }
    
    if (parts.minutes === '*/1' && parts.hours === '*') {
      return 'Every minute';
    }
    
    if (parts.minutes === '*/5' && parts.hours === '*') {
      return 'Every 5 minutes';
    }
    
    if (parts.minutes === '*/10' && parts.hours === '*') {
      return 'Every 10 minutes';
    }
    
    if (parts.minutes === '*/30' && parts.hours === '*') {
      return 'Every 30 minutes';
    }
    
    if (parts.minutes === '0' && parts.hours === '*') {
      return 'Every hour';
    }
    
    // Default to showing the raw expression
    return cronExpression;
  } catch (error) {
    return cronExpression;
  }
}

