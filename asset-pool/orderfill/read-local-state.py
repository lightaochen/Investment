"""Read only the asset-pool storage key from a Chromium LevelDB table."""
import json
import struct
import sys
from pathlib import Path
import snappy

sys.stdout.reconfigure(encoding="utf-8")

def varint(buf, pos):
    value = shift = 0
    while True:
        byte = buf[pos]
        pos += 1
        value |= (byte & 127) << shift
        if byte < 128:
            return value, pos
        shift += 7

def entries(block):
    count = struct.unpack_from('<I', block, len(block) - 4)[0]
    end = len(block) - 4 - count * 4
    pos, previous = 0, b''
    while pos < end:
        shared, pos = varint(block, pos)
        unshared, pos = varint(block, pos)
        size, pos = varint(block, pos)
        key = previous[:shared] + block[pos:pos+unshared]
        pos += unshared
        yield key, block[pos:pos+size]
        pos += size
        previous = key

def read_table(path):
    buf = Path(path).read_bytes()
    def block(handle):
        offset, p = varint(handle, 0)
        size, p = varint(handle, p)
        payload = buf[offset:offset+size]
        if buf[offset+size] == 1:
            payload = snappy.decompress(payload)
        elif buf[offset+size] != 0:
            raise ValueError('Unknown compression')
        return payload
    footer = buf[-48:]
    _, p = varint(footer, 0)
    _, p = varint(footer, p)
    for _, handle in entries(block(footer[p:])):
        for key, value in entries(block(handle)):
            if key[:-8].endswith(b'\x01asset-pool-v1'):
                sequence = int.from_bytes(key[-8:], 'little') >> 8
                text = value[1:].decode('utf-16-le' if value[0] == 0 else 'latin1')
                yield dict(sequence=sequence, origin=key[:-8].split(b'\0')[0].decode('utf8'), store=json.loads(text))

if __name__ == '__main__':
    records = list(read_table(sys.argv[1]))
    print(json.dumps(sorted(records, key=lambda r: r['sequence']), ensure_ascii=False))
