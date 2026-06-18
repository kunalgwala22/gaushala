/**
 * Converts a number to its word representation in Indian currency format.
 */
export function numberToWords(num: number): string {
  const singleDigits = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const doubleDigits = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

  if (num === 0) return "Zero Rupees Only";

  const convertHelper = (n: number): string => {
    let temp = "";
    if (n >= 100) {
      temp += singleDigits[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 10 && n < 20) {
      temp += teens[n - 10] + " ";
    } else if (n >= 20) {
      temp += doubleDigits[Math.floor(n / 10)] + " " + singleDigits[n % 10] + " ";
    } else if (n > 0) {
      temp += singleDigits[n] + " ";
    }
    return temp.trim();
  };

  let wordStr = "";
  // Indian currency numbering system (Crore, Lakh, Thousand, Hundred)
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  
  if (crore > 0) {
    wordStr += convertHelper(crore) + " Crore ";
  }
  if (lakh > 0) {
    wordStr += convertHelper(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    wordStr += convertHelper(thousand) + " Thousand ";
  }
  if (num > 0) {
    wordStr += convertHelper(num);
  }
  
  return wordStr.trim() + " Rupees Only";
}
