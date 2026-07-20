const DAY_MILLISECONDS = 86_400_000;
const MIN_FOUR_DIGIT_YEAR_MILLISECONDS = -62_167_219_200_000;
const MAX_FOUR_DIGIT_YEAR_MILLISECONDS = 253_402_300_799_999;

const isoInstantPattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|([+-])(\d{2}):(\d{2}))$/;

export type TrajectoryTimestampErrorV2 =
  | "invalid_timestamp"
  | "unsupported_timestamp_precision"
  | "timestamp_outside_four_digit_year_domain";

export type TrajectoryInstantV2 = {
  epochMilliseconds: number;
  isoTimestamp: string;
};

export type TrajectoryTimestampResultV2 =
  | { ok: true; value: TrajectoryInstantV2 }
  | { ok: false; errorCode: TrajectoryTimestampErrorV2 };

function validCalendarParts(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  offsetHour: number,
  offsetMinute: number,
) {
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysByMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysByMonth[month - 1]! &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 59 &&
    offsetHour <= 23 &&
    offsetMinute <= 59
  );
}

function instantFromEpoch(epochMilliseconds: number): TrajectoryTimestampResultV2 {
  if (
    !Number.isSafeInteger(epochMilliseconds) ||
    epochMilliseconds < MIN_FOUR_DIGIT_YEAR_MILLISECONDS ||
    epochMilliseconds > MAX_FOUR_DIGIT_YEAR_MILLISECONDS
  ) {
    return { ok: false, errorCode: "timestamp_outside_four_digit_year_domain" };
  }
  const isoTimestamp = new Date(epochMilliseconds).toISOString();
  return /^\d{4}-/.test(isoTimestamp)
    ? { ok: true, value: { epochMilliseconds, isoTimestamp } }
    : { ok: false, errorCode: "timestamp_outside_four_digit_year_domain" };
}

export function parseTrajectoryInstantV2(value: unknown): TrajectoryTimestampResultV2 {
  if (typeof value !== "string") {
    return { ok: false, errorCode: "invalid_timestamp" };
  }
  const match = isoInstantPattern.exec(value);
  if (!match) return { ok: false, errorCode: "invalid_timestamp" };

  const fraction = match[7] ?? "";
  if (fraction.length > 3 && /[1-9]/.test(fraction.slice(3))) {
    return { ok: false, errorCode: "unsupported_timestamp_precision" };
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const offsetHour = Number(match[10] ?? 0);
  const offsetMinute = Number(match[11] ?? 0);
  if (
    !validCalendarParts(
      year,
      month,
      day,
      hour,
      minute,
      second,
      offsetHour,
      offsetMinute,
    )
  ) {
    return { ok: false, errorCode: "invalid_timestamp" };
  }

  const millisecond = `${fraction}000`.slice(0, 3);
  const canonical = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.${millisecond}${match[8]}`;
  const epochMilliseconds = Date.parse(canonical);
  return Number.isFinite(epochMilliseconds)
    ? instantFromEpoch(epochMilliseconds)
    : { ok: false, errorCode: "invalid_timestamp" };
}

export function addTrajectoryDaysV2(
  instant: TrajectoryInstantV2,
  days: number,
): TrajectoryTimestampResultV2 {
  if (!Number.isInteger(days) || days < 0) {
    return { ok: false, errorCode: "invalid_timestamp" };
  }
  return instantFromEpoch(instant.epochMilliseconds + days * DAY_MILLISECONDS);
}
