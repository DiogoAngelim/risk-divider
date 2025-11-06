export default function gaussianSmooth(
  values: number[],
  radius = 4,
  sigma = 2
): number[] {
  const kernel = [];
  for (let x = -radius; x <= radius; x++) {
    kernel.push(Math.exp(-(x * x) / (2 * sigma * sigma)));
  }

  const sum = kernel.reduce((a, b) => a + b, 0);
  const normalized = kernel.map(k => k / sum);

  return values.map((_, i, arr) => {
    let smoothed = 0;
    for (let k = -radius; k <= radius; k++) {
      const idx = Math.min(arr.length - 1, Math.max(0, i + k));
      smoothed += arr[idx] * normalized[k + radius];
    }
    return smoothed;
  });
}
