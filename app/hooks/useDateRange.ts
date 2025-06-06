import { useState, useEffect } from "react";
import { getDateRangeString } from "~/utils/recordUtils";

/**
 * カスタムフック: 日付範囲の状態管理
 * 
 * @param initialFrom 初期開始日
 * @param initialTo 初期終了日
 * @returns 日付範囲の状態と更新関数
 */
export function useDateRange(initialFrom: string, initialTo: string) {
  const [startDate, setStartDate] = useState(initialFrom);
  const [endDate, setEndDate] = useState(initialTo);

  // 初期値が変更されたら状態を更新
  useEffect(() => {
    setStartDate(initialFrom);
    setEndDate(initialTo);
  }, [initialFrom, initialTo]);

  /**
   * 日付をフォーマットする
   * @param date 日付オブジェクト
   * @returns YYYY-MM-DD形式の文字列
   */
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
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
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    formatDateForInput,
    getCsvUrl,
    getDateRangeString
  };
}
