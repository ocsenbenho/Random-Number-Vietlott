const nums = [4, 2, 4, 2, 4, 2];
const isUnique = new Set(nums).size === nums.length;
const isRangeValid = nums.every(n => n >= 1 && n <= 35);

console.log(`Nums: ${JSON.stringify(nums)}`);
console.log(`Length: ${nums.length}`);
console.log(`Unique Set Size: ${new Set(nums).size}`);
console.log(`isUnique: ${isUnique}`);
console.log(`isRangeValid: ${isRangeValid}`);

if (nums.length >= 5 && isUnique && isRangeValid) {
    console.log("ACCEPTED");
} else {
    console.log("REJECTED");
}
