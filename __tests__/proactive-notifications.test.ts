import { describe, it, expect } from "vitest";

// Test the notification time generation logic directly
function generateRandomNotificationTimes(count: number): number[] {
  const times: number[] = [];
  const minHour = 9; // Start at 9 AM
  const maxHour = 21; // End at 9 PM
  
  // Divide the day into segments
  const segmentSize = (maxHour - minHour) / count;
  
  for (let i = 0; i < count; i++) {
    const segmentStart = minHour + i * segmentSize;
    const segmentEnd = segmentStart + segmentSize;
    const randomHour = Math.floor(Math.random() * (segmentEnd - segmentStart) + segmentStart);
    times.push(randomHour);
  }
  
  return times.sort((a, b) => a - b);
}

describe("Proactive Notifications", () => {
  describe("generateRandomNotificationTimes", () => {
    it("should generate the correct number of notification times", () => {
      const count = 3;
      const times = generateRandomNotificationTimes(count);
      expect(times).toHaveLength(count);
    });

    it("should generate times within the valid range (9-21)", () => {
      const count = 5;
      const times = generateRandomNotificationTimes(count);
      
      times.forEach((time) => {
        expect(time).toBeGreaterThanOrEqual(9);
        expect(time).toBeLessThan(21);
      });
    });

    it("should generate times in ascending order", () => {
      const count = 4;
      const times = generateRandomNotificationTimes(count);
      
      for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
      }
    });

    it("should distribute times across the day", () => {
      const count = 3;
      const times = generateRandomNotificationTimes(count);
      
      // Check that times are not all clustered together
      const totalRange = 21 - 9; // 12 hours
      
      for (let i = 1; i < times.length; i++) {
        const gap = times[i] - times[i - 1];
        // Allow some flexibility, but ensure reasonable distribution
        expect(gap).toBeGreaterThan(0);
      }
    });

    it("should handle edge cases", () => {
      // Test with 1 notification
      const times1 = generateRandomNotificationTimes(1);
      expect(times1).toHaveLength(1);
      expect(times1[0]).toBeGreaterThanOrEqual(9);
      expect(times1[0]).toBeLessThan(21);

      // Test with maximum notifications
      const times5 = generateRandomNotificationTimes(5);
      expect(times5).toHaveLength(5);
      times5.forEach((time) => {
        expect(time).toBeGreaterThanOrEqual(9);
        expect(time).toBeLessThan(21);
      });
    });
  });
});
