// Test script to verify that multiple break pairs are handled correctly

// Create test records with multiple break pairs
const testRecords = [
  { type: "END_WORK", timestamp: new Date("2025-06-06T09:22:00+09:00") },
  { type: "START_WORK", timestamp: new Date("2025-06-06T09:00:00+09:00") },
  { type: "END_BREAK", timestamp: new Date("2025-06-06T09:20:00+09:00") },
  { type: "START_BREAK", timestamp: new Date("2025-06-06T09:15:00+09:00") },
  { type: "END_BREAK", timestamp: new Date("2025-06-06T09:10:00+09:00") },
  { type: "START_BREAK", timestamp: new Date("2025-06-06T09:05:00+09:00") }
];

// Group records by date
const recordsByDate = {};
testRecords.forEach(record => {
  const date = record.timestamp;
  // Use local date (JST) instead of UTC
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD

  if (!recordsByDate[dateStr]) {
    recordsByDate[dateStr] = [];
  }

  recordsByDate[dateStr].push(record);
});

// Print the grouped records
console.log("Grouped records:");
for (const dateStr in recordsByDate) {
  console.log(`Date: ${dateStr}`);
  console.log(`Records: ${recordsByDate[dateStr].length}`);
  console.log("START_WORK count:", recordsByDate[dateStr].filter(r => r.type === "START_WORK").length);
  console.log("END_WORK count:", recordsByDate[dateStr].filter(r => r.type === "END_WORK").length);
  console.log("START_BREAK count:", recordsByDate[dateStr].filter(r => r.type === "START_BREAK").length);
  console.log("END_BREAK count:", recordsByDate[dateStr].filter(r => r.type === "END_BREAK").length);
  console.log("Records:", recordsByDate[dateStr].map(r => `${r.type} ${r.timestamp.toISOString()}`));
  console.log("---");
}

// Simulate the calculateDailyData function
const DAYS_OF_WEEK_JP = ["日", "月", "火", "水", "木", "金", "土"];

const calculateDailyData = (recordsByDate) => {
  const result = [];

  for (const dateStr in recordsByDate) {
    const records = recordsByDate[dateStr];
    const date = new Date(dateStr);

    // 日付の表示形式: mm/dd(曜日)
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = DAYS_OF_WEEK_JP[date.getDay()];
    const formattedDate = `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}(${dayOfWeek})`;

    // レコードを時間順にソート
    records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // 出勤・退勤・休憩時間を抽出
    const workPairs = [];
    const breakPairs = [];
    const startWorkRecords = []; // 出勤記録を保存する配列
    let currentBreakPair = null;
    let notes = [];

    // 出勤・退勤・休憩時間のペアを抽出
    let unpairedEndWorkCount = 0;
    let unpairedStartBreakCount = 0;
    let unpairedEndBreakCount = 0;

    // 出勤・退勤記録の数をカウント
    let startWorkCount = 0;
    let endWorkCount = 0;

    // まず記録の種類ごとの数をカウント
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (record.type === "START_WORK") {
        startWorkCount++;
      } else if (record.type === "END_WORK") {
        endWorkCount++;
      }
    }

    // 通常の処理を続行
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const time = record.timestamp;

      if (record.type === "START_WORK") {
        // 出勤記録を配列に追加
        startWorkRecords.push({ time: time, paired: false });
      } else if (record.type === "END_WORK") {
        // 最も古い未ペアの出勤記録を探す
        const unpaired = startWorkRecords.filter(r => !r.paired)[0];
        if (unpaired) {
          unpaired.paired = true;
          workPairs.push({ start: unpaired.time, end: time });
        } else {
          // 出勤なしで退勤がある場合
          unpairedEndWorkCount++;
        }
      } else if (record.type === "START_BREAK") {
        if (currentBreakPair) {
          // 前の休憩開始に対する休憩終了がない場合
          unpairedStartBreakCount++;
        }
        currentBreakPair = { start: time, end: null };
      } else if (record.type === "END_BREAK") {
        if (currentBreakPair) {
          currentBreakPair.end = time;
          breakPairs.push(currentBreakPair);
          currentBreakPair = null;
        } else {
          // 休憩開始なしで休憩終了がある場合
          unpairedEndBreakCount++;
        }
      }
    }

    // エラーメッセージを生成
    let errorMessages = [];

    // 複数の出勤・退勤ペアがある場合（先に判定）
    if (workPairs.length > 1) {
      errorMessages.push("複数の出勤・退勤ペアが存在します");
    }

    // 未ペアの出勤記録がある場合
    // 実際の出勤記録の数と退勤記録の数から計算
    const unpairedStartWorkCount = startWorkCount - workPairs.length;
    if (unpairedStartWorkCount > 0) {
      errorMessages.push(`${unpairedStartWorkCount}件の出勤記録に対応する退勤記録がありません`);
    }

    // 未ペアの退勤記録がある場合
    // 実際の退勤記録の数と出勤記録の数から計算
    const actualUnpairedEndWorkCount = endWorkCount - workPairs.length;
    if (actualUnpairedEndWorkCount > 0) {
      errorMessages.push(`${actualUnpairedEndWorkCount}件の退勤記録に対応する出勤記録がありません`);
    }

    // 未ペアの休憩開始記録がある場合
    let currentBreakUnpaired = currentBreakPair ? 1 : 0;
    let totalUnpairedStartBreak = unpairedStartBreakCount + currentBreakUnpaired;
    if (totalUnpairedStartBreak > 0) {
      errorMessages.push(`${totalUnpairedStartBreak}件の休憩開始記録に対応する休憩終了記録がありません`);
    }

    // 未ペアの休憩終了記録がある場合
    if (unpairedEndBreakCount > 0) {
      errorMessages.push(`${unpairedEndBreakCount}件の休憩終了記録に対応する休憩開始記録がありません`);
    }

    // エラーメッセージを結合
    if (errorMessages.length > 0) {
      notes = errorMessages;
    }

    // 時刻のフォーマット関数
    const formatTime = (date) => {
      if (!date) return "";
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    // 労働時間と休憩時間を計算
    let workMinutes = 0;
    let breakMinutes = 0;
    let startWorkTime = null;
    let endWorkTime = null;

    if (workPairs.length > 0) {
      // 最も早い出勤時刻と最も遅い退勤時刻を使用
      startWorkTime = workPairs.reduce((earliest, pair) => 
        pair.start.getTime() < earliest.getTime() ? pair.start : earliest, 
        workPairs[0].start);

      endWorkTime = workPairs.reduce((latest, pair) => 
        pair.end.getTime() > latest.getTime() ? pair.end : latest, 
        workPairs[0].end);

      // 総時間（ミリ秒）
      const totalMs = endWorkTime.getTime() - startWorkTime.getTime();

      // 休憩時間（ミリ秒）
      let breakMs = 0;
      // 複数の休憩ペアがある場合は、すべての休憩時間を合計する
      if (breakPairs.length > 0) {
        breakPairs.forEach(breakPair => {
          breakMs += breakPair.end.getTime() - breakPair.start.getTime();
        });

        // 複数の休憩ペアがある場合は、その旨をnotesに追加
        if (breakPairs.length > 1) {
          notes.push(`${breakPairs.length}件の休憩ペアの合計時間を表示しています`);
        }
      }

      // 労働時間 = 総時間 - 休憩時間
      workMinutes = Math.max(0, Math.floor((totalMs - breakMs) / (1000 * 60)));
      breakMinutes = Math.floor(breakMs / (1000 * 60));
    }

    // 時間のフォーマット（例: 8時間30分 -> 8:30）
    const formatDuration = (minutes) => {
      if (minutes < 0) return "";
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}:${mins.toString().padStart(2, '0')}`;
    };

    // 日給の計算（MINUTE_UNITで指定された分数単位で切り捨て）
    const effectiveWorkHours = Math.floor(workMinutes / 60);
    const dailyWage = effectiveWorkHours * 1500;

    result.push({
      dateStr: formattedDate,
      startTime: formatTime(startWorkTime),
      endTime: formatTime(endWorkTime),
      workHours: formatDuration(workMinutes),
      breakTime: formatDuration(breakMinutes),
      dailyWage: dailyWage,
      notes: notes.join(", "),
      breakPairs: breakPairs.map(pair => ({
        start: formatTime(pair.start),
        end: formatTime(pair.end),
        duration: formatDuration(Math.floor((pair.end.getTime() - pair.start.getTime()) / (1000 * 60)))
      }))
    });
  }

  return result;
};

// Calculate daily data
const dailyData = calculateDailyData(recordsByDate);

// Print the results
console.log("Daily data:");
console.log(JSON.stringify(dailyData, null, 2));
