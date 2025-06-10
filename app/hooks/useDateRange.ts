import { useState, useEffect, useCallback } from "react";
import { getDateRangeString } from "~/utils/recordUtils";

/**
 * カスタムフック: 日付範囲の状態管理
 * 
 * @param initialFrom 初期開始日
 * @param initialTo 初期終了日
 * @returns 日付範囲の状態と更新関数
 */
export function useDateRange(initialFrom: string, initialTo: string) {
  // 日付の各コンポーネントの状態
  const [startYear, setStartYear] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [startDay, setStartDay] = useState("");
  const [endYear, setEndYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endDay, setEndDay] = useState("");

  // 従来の日付文字列の状態（互換性のため）
  const [startDate, setStartDate] = useState(initialFrom);
  const [endDate, setEndDate] = useState(initialTo);

  // 初期値から年、月、日を設定
  useEffect(() => {
    if (initialFrom) {
      const [year, month, day] = initialFrom.split('-');
      setStartYear(year);
      setStartMonth(month);
      setStartDay(day);
    }

    if (initialTo) {
      const [year, month, day] = initialTo.split('-');
      setEndYear(year);
      setEndMonth(month);
      setEndDay(day);
    }
  }, [initialFrom, initialTo]);

  // 年、月、日が変更されたときに日付文字列を更新
  useEffect(() => {
    if (startYear && startMonth && startDay) {
      setStartDate(`${startYear}-${startMonth}-${startDay}`);
    }
  }, [startYear, startMonth, startDay]);

  useEffect(() => {
    if (endYear && endMonth && endDay) {
      setEndDate(`${endYear}-${endMonth}-${endDay}`);
    }
  }, [endYear, endMonth, endDay]);

  // 開始日が変更されたら終了日を1ヶ月後に自動設定
  const updateStartDate = useCallback((year: string, month: string, day: string) => {
    setStartYear(year);
    setStartMonth(month);
    setStartDay(day);

    // 終了日を1ヶ月後に設定
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    date.setMonth(date.getMonth() + 1);

    setEndYear(date.getFullYear().toString());
    setEndMonth((date.getMonth() + 1).toString().padStart(2, '0'));
    setEndDay(date.getDate().toString().padStart(2, '0')); // 月によって日数が異なるため、自動調整
  }, []);

  // 従来のsetStartDate関数をオーバーライド（互換性のため）
  const handleSetStartDate = useCallback((dateStr: string) => {
    setStartDate(dateStr);
    if (dateStr) {
      const [year, month, day] = dateStr.split('-');
      setStartYear(year);
      setStartMonth(month);
      setStartDay(day);

      // updateStartDate関数を使用して終了日を1ヶ月後に設定
      updateStartDate(year, month, day);
    }
  }, [updateStartDate]);

  // 従来のsetEndDate関数をオーバーライド（互換性のため）
  const handleSetEndDate = useCallback((dateStr: string) => {
    setEndDate(dateStr);
    if (dateStr) {
      const [year, month, day] = dateStr.split('-');
      setEndYear(year);
      setEndMonth(month);
      setEndDay(day);
    }
  }, []);

  /**
   * 日付をフォーマットする
   * @param date 日付オブジェクト
   * @returns YYYY-MM-DD形式の文字列
   */
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * CSVダウンロード用のURLを生成
   * @returns CSVダウンロード用のURL
   */
  const getCsvUrl = (): string => {
    if (!startDate || !endDate) return "/csv";
    return `/csv?from=${startDate}&to=${endDate}`;
  };

  return {
    // 従来のインターフェース（互換性のため）
    startDate,
    setStartDate: handleSetStartDate,
    endDate,
    setEndDate: handleSetEndDate,

    // 新しいインターフェース
    startYear,
    setStartYear,
    startMonth,
    setStartMonth,
    startDay,
    setStartDay,
    endYear,
    setEndYear,
    endMonth,
    setEndMonth,
    endDay,
    setEndDay,
    updateStartDate,

    // ユーティリティ関数
    formatDateForInput,
    getCsvUrl,
    getDateRangeString
  };
}
