export type StayDatesValidation =
  | { valid: true; startDate: string; endDate: string }
  | { valid: false; message: string };

export function validateStayDates(
  startDate: string | undefined,
  endDate: string | undefined,
): StayDatesValidation {
  if (!startDate || !endDate) {
    return { valid: false, message: "Start date and end date are required" };
  }
  if (!isValidDateOnly(startDate) || !isValidDateOnly(endDate)) {
    return { valid: false, message: "Start and end dates must use YYYY-MM-DD format" };
  }
  if (endDate <= startDate) {
    return { valid: false, message: "End date must be after the start date" };
  }
  if (startDate < new Date().toISOString().slice(0, 10)) {
    return { valid: false, message: "Stays cannot start in the past" };
  }
  return { valid: true, startDate, endDate };
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
