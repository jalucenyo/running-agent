import {
  PROTOCOL_VERSION,
  PROFILE_VERSION,
  BASE_TYPE,
  type FieldDef,
} from './types.js';
import { computeCrc } from './crc.js';

const HEADER_SIZE = 14;

function getInvalidValue(baseType: number, size: number): number {
  if (baseType === BASE_TYPE.SINT8) return 0x7f;
  if (baseType === BASE_TYPE.SINT16) return 0x7fff;
  if (baseType === BASE_TYPE.SINT32) return 0x7fffffff;
  if (size === 1) return 0xff;
  if (size === 2) return 0xffff;
  return 0xffffffff;
}

export class FitEncoder {
  private chunks: Buffer[] = [];
  private dataSize = 0;
  private fieldDefs = new Map<number, FieldDef[]>();

  open(): void {
    this.chunks = [];
    this.dataSize = 0;
    this.fieldDefs.clear();

    const header = Buffer.alloc(HEADER_SIZE, 0);
    header.writeUInt8(HEADER_SIZE, 0);
    header.writeUInt8(PROTOCOL_VERSION, 1);
    header.writeUInt16LE(PROFILE_VERSION, 2);
    header.writeUInt32LE(0, 4); // data size placeholder
    header.write('.FIT', 8, 'ascii');
    header.writeUInt16LE(computeCrc(header, 0, 12), 12);

    this.chunks.push(header);
  }

  writeDefinition(
    localMesgNum: number,
    globalMesgNum: number,
    fields: FieldDef[],
  ): void {
    this.fieldDefs.set(localMesgNum, fields);

    // record header byte: bit6 set = definition message
    const recordHeader = 0x40 | (localMesgNum & 0x0f);
    const buf = Buffer.alloc(6 + fields.length * 3);
    let off = 0;

    buf.writeUInt8(recordHeader, off++);
    buf.writeUInt8(0, off++); // reserved
    buf.writeUInt8(0, off++); // architecture: little-endian
    buf.writeUInt16LE(globalMesgNum, off);
    off += 2;
    buf.writeUInt8(fields.length, off++);

    for (const f of fields) {
      buf.writeUInt8(f.defNum, off++);
      buf.writeUInt8(f.size, off++);
      buf.writeUInt8(f.baseType, off++);
    }

    this.chunks.push(buf);
    this.dataSize += buf.length;
  }

  writeData(localMesgNum: number, values: (number | null)[]): void {
    const fields = this.fieldDefs.get(localMesgNum);
    if (!fields) {
      throw new Error(`No definition for local message type ${localMesgNum}`);
    }

    const totalSize = 1 + fields.reduce((sum, f) => sum + f.size, 0);
    const buf = Buffer.alloc(totalSize);
    let off = 0;

    buf.writeUInt8(localMesgNum & 0x0f, off++);

    for (let i = 0; i < fields.length; i++) {
      const { baseType, size } = fields[i];
      const raw = values[i];
      const v =
        raw === null || raw === undefined
          ? getInvalidValue(baseType, size)
          : raw;

      const signed =
        baseType === BASE_TYPE.SINT8 ||
        baseType === BASE_TYPE.SINT16 ||
        baseType === BASE_TYPE.SINT32;

      if (size === 1) {
        if (signed) buf.writeInt8(v, off);
        else buf.writeUInt8(v >>> 0, off);
      } else if (size === 2) {
        if (signed) buf.writeInt16LE(v, off);
        else buf.writeUInt16LE(v >>> 0, off);
      } else if (size === 4) {
        if (signed) buf.writeInt32LE(v, off);
        else buf.writeUInt32LE(v >>> 0, off);
      }

      off += size;
    }

    this.chunks.push(buf);
    this.dataSize += buf.length;
  }

  close(): Buffer {
    // Update data size in the header
    const headerBuf = this.chunks[0];
    headerBuf.writeUInt32LE(this.dataSize, 4);
    headerBuf.writeUInt16LE(computeCrc(headerBuf, 0, 12), 12);

    const allData = Buffer.concat(this.chunks);

    // Append 2-byte CRC over all data records (bytes after the header)
    const fileCrc = computeCrc(allData, HEADER_SIZE);
    const crcBuf = Buffer.alloc(2);
    crcBuf.writeUInt16LE(fileCrc, 0);

    return Buffer.concat([allData, crcBuf]);
  }
}
