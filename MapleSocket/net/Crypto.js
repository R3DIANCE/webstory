var Crypto = function Crypto(version, locale) {
  this.version = version;
  this.locale = locale;
  this.useMapleCrypto = !(locale == 6 || locale == 4 || locale == 5 || locale == 3 || (locale == 8 && version >= 149) || (locale == 1 && version >= 221));
};

Crypto.prototype.decryptData = function(data, sequence) {
  this.transformAES(data, sequence);

  if (this.useMapleCrypto) {
    this.decryptMapleCrypto(data);
  }
};

Crypto.prototype.encryptData = function(data, sequence) {
  if (this.useMapleCrypto) {
    this.encryptMapleCrypto(data);
  }

  this.transformAES(data, sequence);
};

Crypto.prototype.getLengthFromHeader = function(data) {
  var length = data[0] | (data[1] << 8) | (data[2] << 16) | (data[3] << 24);
  return ((length >>> 16) ^ (length & 0xFFFF)) & 0xFFFF;
};

Crypto.prototype.generateHeader = function(data, sequence, length) {
  var a = sequence[2] | (sequence[3] << 8);
  a ^= this.version;
  var b = a ^ length;

  data[0] = a & 0xFF;
  data[1] = (a >>> 8) & 0xFF;
  data[2] = b & 0xFF;
  data[3] = (b >>> 8) & 0xFF;
};

var sequenceShiftingKey = new Uint8Array([ 0xEC, 0x3F, 0x77, 0xA4, 0x45, 0xD0, 0x71, 0xBF, 0xB7, 0x98, 0x20, 0xFC,
  0x4B, 0xE9, 0xB3, 0xE1, 0x5C, 0x22, 0xF7, 0x0C, 0x44, 0x1B, 0x81, 0xBD, 0x63, 0x8D, 0xD4, 0xC3, 0xF2, 0x10, 0x19,
  0xE0, 0xFB, 0xA1, 0x6E, 0x66, 0xEA, 0xAE, 0xD6, 0xCE, 0x06, 0x18, 0x4E, 0xEB, 0x78, 0x95, 0xDB, 0xBA, 0xB6, 0x42,
  0x7A, 0x2A, 0x83, 0x0B, 0x54, 0x67, 0x6D, 0xE8, 0x65, 0xE7, 0x2F, 0x07, 0xF3, 0xAA, 0x27, 0x7B, 0x85, 0xB0, 0x26,
  0xFD, 0x8B, 0xA9, 0xFA, 0xBE, 0xA8, 0xD7, 0xCB, 0xCC, 0x92, 0xDA, 0xF9, 0x93, 0x60, 0x2D, 0xDD, 0xD2, 0xA2, 0x9B,
  0x39, 0x5F, 0x82, 0x21, 0x4C, 0x69, 0xF8, 0x31, 0x87, 0xEE, 0x8E, 0xAD, 0x8C, 0x6A, 0xBC, 0xB5, 0x6B, 0x59, 0x13,
  0xF1, 0x04, 0x00, 0xF6, 0x5A, 0x35, 0x79, 0x48, 0x8F, 0x15, 0xCD, 0x97, 0x57, 0x12, 0x3E, 0x37, 0xFF, 0x9D, 0x4F,
  0x51, 0xF5, 0xA3, 0x70, 0xBB, 0x14, 0x75, 0xC2, 0xB8, 0x72, 0xC0, 0xED, 0x7D, 0x68, 0xC9, 0x2E, 0x0D, 0x62, 0x46,
  0x17, 0x11, 0x4D, 0x6C, 0xC4, 0x7E, 0x53, 0xC1, 0x25, 0xC7, 0x9A, 0x1C, 0x88, 0x58, 0x2C, 0x89, 0xDC, 0x02, 0x64,
  0x40, 0x01, 0x5D, 0x38, 0xA5, 0xE2, 0xAF, 0x55, 0xD5, 0xEF, 0x1A, 0x7C, 0xA7, 0x5B, 0xA6, 0x6F, 0x86, 0x9F, 0x73,
  0xE6, 0x0A, 0xDE, 0x2B, 0x99, 0x4A, 0x47, 0x9C, 0xDF, 0x09, 0x76, 0x9E, 0x30, 0x0E, 0xE4, 0xB2, 0x94, 0xA0, 0x3B,
  0x34, 0x1D, 0x28, 0x0F, 0x36, 0xE3, 0x23, 0xB4, 0x03, 0xD8, 0x90, 0xC8, 0x3C, 0xFE, 0x5E, 0x32, 0x24, 0x50, 0x1F,
  0x3A, 0x43, 0x8A, 0x96, 0x41, 0x74, 0xAC, 0x52, 0x33, 0xF0, 0xD9, 0x29, 0x80, 0xB1, 0x16, 0xD3, 0xAB, 0x91, 0xB9,
  0x84, 0x7F, 0x61, 0x1E, 0xCF, 0xC5, 0xD1, 0x56, 0x3D, 0xCA, 0xF4, 0x05, 0xC6, 0xE5, 0x08, 0x49 ]);

Crypto.prototype.morphSequence = function(currentSequence) {
  var newSequence = new Uint8Array([ 0xF2, 0x53, 0x50, 0xC6 ]);

  for (var i = 0; i < 4; i++) {
    var input = currentSequence[i];
    var tableInput = sequenceShiftingKey[input];
    newSequence[0] += (sequenceShiftingKey[newSequence[1]] - input);
    newSequence[1] -= (newSequence[2] ^ tableInput);
    newSequence[2] ^= (sequenceShiftingKey[newSequence[3]] + input);
    newSequence[3] -= (newSequence[0] - tableInput);

    var val = (newSequence[0] | (newSequence[1] & 0xFF) << 8 | (newSequence[2] & 0xFF) << 16 | (newSequence[3] & 0xFF) << 24) >>> 0;
    var val2 = val >>> 0x1D;
    val = (val << 0x03) >>> 0;
    val2 |= val;
    newSequence[0] = (val2 & 0xFF);
    newSequence[1] = ((val2 >> 8) & 0xFF);
    newSequence[2] = ((val2 >> 16) & 0xFF);
    newSequence[3] = ((val2 >> 24) & 0xFF);
  }

  return newSequence;
};

function rollLeft(value, shift) {
  var overflow = ((value >>> 0) << (shift % 8)) >>> 0;
  var ret = ((overflow & 0xFF) | (overflow >>> 8)) & 0xFF;
  return ret;
}

function rollRight(value, shift) {
  var overflow = (((value >>> 0) << 8) >>> (shift % 8));
  var ret = ((overflow & 0xFF) | (overflow >>> 8)) & 0xFF;
  return ret;
}

Crypto.prototype.encryptMapleCrypto = function(data) {
  var length = data.length, j;
  var a, c;
  for (var i = 0; i < 3; i++) {
    a = 0;
    for (j = length; j > 0; j--) {
      c = data[length - j];
      c = rollLeft(c, 3);
      c += j;
      c &= 0xFF; // Addition
      c ^= a;
      a = c;
      c = rollRight(a, j);
      c ^= 0xFF;
      c += 0x48;
      c &= 0xFF; // Addition
      data[length - j] = c;
    }
    a = 0;
    for (j = length; j > 0; j--) {
      c = data[j - 1];
      c = rollLeft(c, 4);
      c += j;
      c &= 0xFF; // Addition
      c ^= a;
      a = c;
      c ^= 0x13;
      c = rollRight(c, 3);
      data[j - 1] = c;
    }
  }
};

Crypto.prototype.decryptMapleCrypto = function(data) {
  var length = data.length, j;
  var a, b, c;
  for (var i = 0; i < 3; i++) {
    a = 0;
    b = 0;
    for (j = length; j > 0; j--) {
      c = data[j - 1];
      c = rollLeft(c, 3);
      c ^= 0x13;
      a = c;
      c ^= b;
      c -= j;
      c &= 0xFF; // Addition
      c = rollRight(c, 4);
      b = a;
      data[j - 1] = c;
    }
    a = 0;
    b = 0;
    for (j = length; j > 0; j--) {
      c = data[length - j];
      c -= 0x48;
      c &= 0xFF; // Addition
      c ^= 0xFF;
      c = rollLeft(c, j);
      a = c;
      c ^= b;
      c -= j;
      c &= 0xFF; // Addition
      c = rollRight(c, 3);
      b = a;
      data[length - j] = c;
    }
  }
};

// OLD AES KEY!!!
var aesKey = new Buffer([ 0x13, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0xB4, 0x00, 0x00,
  0x00, 0x1B, 0x00, 0x00, 0x00, 0x0F, 0x00, 0x00, 0x00, 0x33, 0x00, 0x00, 0x00, 0x52, 0x00, 0x00, 0x00 ]);

var crypto = require('crypto');
var aes = null;

Crypto.prototype.changeAESKey = function(key) {
  if (key === null) {
    return;
  }

  console.log('Changing key to: ');
  console.log(key);
  aes = crypto.createCipheriv('aes-256-ecb', key, '');
};

Crypto.prototype.transformAES = function transformAES(data, sequence) {
  if (aes === null) {
    this.changeAESKey(aesKey);
  }

  var length = data.length;
  var sequenceCopy = new Buffer([ sequence[0], sequence[1], sequence[2], sequence[3], sequence[0], sequence[1],
    sequence[2], sequence[3], sequence[0], sequence[1], sequence[2], sequence[3], sequence[0], sequence[1],
    sequence[2], sequence[3] ]);

  for (var i = 0; i < length;) {
    var block = Math.min(length - i, (i === 0 ? 1456 : 1460));

    var xorKey = sequenceCopy.slice();

    for (var j = 0; j < block; j++) {
      if ((j % 16) === 0) {
        xorKey = aes.update(xorKey);
      }

      data[i + j] ^= xorKey[j % 16];
    }

    i += block;
  }
};

module.exports.Crypto = Crypto;
