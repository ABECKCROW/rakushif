// Test script to verify that the timezone handling is correct
// This script simulates the scenario described in the issue:
// A record with a timestamp of 0:00 on June 7th

// Import the necessary functions
const DAYS_OF_WEEK_JP = ["日", "月", "火", "水", "木", "金", "土"];

// Create a function to format dates for display
const formatDate = (date) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = DAYS_OF_WEEK_JP[date.getDay()];
  return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}(${dayOfWeek})`;
};

// Create a function to group records by date
// This is the original function that had the issue
const groupRecordsByDateOriginal = (records) => {
  const groups = {};

  records.forEach(record => {
    const date = new Date(record.timestamp);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }

    groups[dateStr].push(record);
  });

  return groups;
};

// Create a function to group records by date
// This is the fixed function
const groupRecordsByDateFixed = (records) => {
  const groups = {};

  records.forEach(record => {
    const date = new Date(record.timestamp);
    // JST (UTC+9) での日付を取得
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD

    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }

    groups[dateStr].push(record);
  });

  return groups;
};

// Create a test record with a timestamp of 0:00 on June 7th
const testRecord = {
  id: 1,
  userId: 1,
  type: "START_WORK",
  timestamp: new Date("2025-06-07T00:00:00+09:00"), // JST midnight
  isModified: true
};

// Group the record using the original function
const groupedOriginal = groupRecordsByDateOriginal([testRecord]);
console.log("Grouped using original function:");
for (const dateStr in groupedOriginal) {
  console.log(`Date: ${dateStr}`);
  console.log(`Records: ${groupedOriginal[dateStr].length}`);
  console.log(`Record timestamp: ${groupedOriginal[dateStr][0].timestamp.toISOString()}`);
  console.log(`Record local date: ${formatDate(groupedOriginal[dateStr][0].timestamp)}`);
}

// Group the record using the fixed function
const groupedFixed = groupRecordsByDateFixed([testRecord]);
console.log("\nGrouped using fixed function:");
for (const dateStr in groupedFixed) {
  console.log(`Date: ${dateStr}`);
  console.log(`Records: ${groupedFixed[dateStr].length}`);
  console.log(`Record timestamp: ${groupedFixed[dateStr][0].timestamp.toISOString()}`);
  console.log(`Record local date: ${formatDate(groupedFixed[dateStr][0].timestamp)}`);
}

// Create a test record with a timestamp of 0:00 on June 7th using the original timestamp creation method
const dateStr = "2025-06-07";
const timeStr = "00:00";
const timestampOriginal = new Date(`${dateStr}T${timeStr}:00`);
console.log("\nTimestamp created using original method:");
console.log(`Timestamp: ${timestampOriginal.toISOString()}`);
console.log(`Local date: ${formatDate(timestampOriginal)}`);

// Create a test record with a timestamp of 0:00 on June 7th using the fixed timestamp creation method
const [year, month, day] = dateStr.split('-').map(Number);
const [hours, minutes] = timeStr.split(':').map(Number);
const timestampFixed = new Date(year, month - 1, day, hours, minutes, 0);
console.log("\nTimestamp created using fixed method:");
console.log(`Timestamp: ${timestampFixed.toISOString()}`);
console.log(`Local date: ${formatDate(timestampFixed)}`);