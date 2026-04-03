// FIT CRC-16 algorithm from the FIT protocol specification.
const CRC_TABLE: readonly number[] = [
  0x0000, 0xcc01, 0xd801, 0x1400, 0xf001, 0x3c00, 0x2800, 0xe401,
  0xa001, 0x6c00, 0x7800, 0xb401, 0x5000, 0x9c01, 0x8801, 0x4400,
];

function computeByteCrc(crc: number, byte: number): number {
  let tmp = CRC_TABLE[crc & 0xf];
  crc = (crc >> 4) & 0x0fff;
  crc = crc ^ tmp ^ CRC_TABLE[byte & 0xf];

  tmp = CRC_TABLE[crc & 0xf];
  crc = (crc >> 4) & 0x0fff;
  crc = crc ^ tmp ^ CRC_TABLE[(byte >> 4) & 0xf];

  return crc;
}

export function computeCrc(data: Buffer, start = 0, end?: number): number {
  const stop = end ?? data.length;
  let crc = 0;
  for (let i = start; i < stop; i++) {
    crc = computeByteCrc(crc, data[i]);
  }
  return crc;
}
