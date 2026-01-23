/**
 * Generate a valid TCKN (Turkish ID Number) with correct checksum
 */
function generateValidTCKN() {
  // Generate first 9 digits (first digit cannot be 0)
  const first9 = [Math.floor(Math.random() * 9) + 1]; // 1-9
  for (let i = 1; i < 9; i++) {
    first9.push(Math.floor(Math.random() * 10)); // 0-9
  }
  
  // Calculate 10th digit (checksum 1)
  const sum1 = first9[0] + first9[2] + first9[4] + first9[6] + first9[8];
  const sum2 = first9[1] + first9[3] + first9[5] + first9[7];
  const q1 = (7 * sum1 - sum2) % 10;
  const digit10 = q1 < 0 ? q1 + 10 : q1;
  
  // Calculate 11th digit (checksum 2)
  const sumAll = first9.reduce((a, b) => a + b, 0) + digit10;
  const digit11 = sumAll % 10;
  
  return first9.join('') + digit10 + digit11;
}

// Test the function
const tckn = generateValidTCKN();
console.log('Generated TCKN:', tckn);
console.log('Length:', tckn.length);
console.log('First digit:', tckn[0]);

