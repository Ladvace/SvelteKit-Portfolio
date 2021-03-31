import {randomBytes, createHash} from "crypto";
import http from "http";
import https from "https";
import zlib from "zlib";
import Stream, {PassThrough, pipeline} from "stream";
import {types} from "util";
import {format, parse, resolve, URLSearchParams as URLSearchParams$1} from "url";
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
var src = dataUriToBuffer;
const {Readable} = Stream;
const wm = new WeakMap();
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
class Blob {
  constructor(blobParts = [], options = {type: ""}) {
    let size = 0;
    const parts = blobParts.map((element) => {
      let buffer;
      if (element instanceof Buffer) {
        buffer = element;
      } else if (ArrayBuffer.isView(element)) {
        buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
      } else if (element instanceof ArrayBuffer) {
        buffer = Buffer.from(element);
      } else if (element instanceof Blob) {
        buffer = element;
      } else {
        buffer = Buffer.from(typeof element === "string" ? element : String(element));
      }
      size += buffer.length || buffer.size || 0;
      return buffer;
    });
    const type = options.type === void 0 ? "" : String(options.type).toLowerCase();
    wm.set(this, {
      type: /[^\u0020-\u007E]/.test(type) ? "" : type,
      size,
      parts
    });
  }
  get size() {
    return wm.get(this).size;
  }
  get type() {
    return wm.get(this).type;
  }
  async text() {
    return Buffer.from(await this.arrayBuffer()).toString();
  }
  async arrayBuffer() {
    const data = new Uint8Array(this.size);
    let offset = 0;
    for await (const chunk of this.stream()) {
      data.set(chunk, offset);
      offset += chunk.length;
    }
    return data.buffer;
  }
  stream() {
    return Readable.from(read(wm.get(this).parts));
  }
  slice(start = 0, end = this.size, type = "") {
    const {size} = this;
    let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
    let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
    const span = Math.max(relativeEnd - relativeStart, 0);
    const parts = wm.get(this).parts.values();
    const blobParts = [];
    let added = 0;
    for (const part of parts) {
      const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
      if (relativeStart && size2 <= relativeStart) {
        relativeStart -= size2;
        relativeEnd -= size2;
      } else {
        const chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
        blobParts.push(chunk);
        added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
        relativeStart = 0;
        if (added >= span) {
          break;
        }
      }
    }
    const blob = new Blob([], {type});
    Object.assign(wm.get(blob), {size: span, parts: blobParts});
    return blob;
  }
  get [Symbol.toStringTag]() {
    return "Blob";
  }
  static [Symbol.hasInstance](object) {
    return typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
  }
}
Object.defineProperties(Blob.prototype, {
  size: {enumerable: true},
  type: {enumerable: true},
  slice: {enumerable: true}
});
var fetchBlob = Blob;
class FetchBaseError extends Error {
  constructor(message, type) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.type = type;
  }
  get name() {
    return this.constructor.name;
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
}
class FetchError extends FetchBaseError {
  constructor(message, type, systemError) {
    super(message, type);
    if (systemError) {
      this.code = this.errno = systemError.code;
      this.erroredSysCall = systemError.syscall;
    }
  }
}
const NAME = Symbol.toStringTag;
const isURLSearchParameters = (object) => {
  return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
};
const isBlob = (object) => {
  return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
};
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
const isAbortSignal = (object) => {
  return typeof object === "object" && object[NAME] === "AbortSignal";
};
const carriage = "\r\n";
const dashes = "-".repeat(2);
const carriageLength = Buffer.byteLength(carriage);
const getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
const getBoundary = () => randomBytes(8).toString("hex");
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    if (isBlob(value)) {
      length += value.size;
    } else {
      length += Buffer.byteLength(String(value));
    }
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
const INTERNALS$2 = Symbol("Body internals");
class Body {
  constructor(body, {
    size = 0
  } = {}) {
    let boundary = null;
    if (body === null) {
      body = null;
    } else if (isURLSearchParameters(body)) {
      body = Buffer.from(body.toString());
    } else if (isBlob(body))
      ;
    else if (Buffer.isBuffer(body))
      ;
    else if (types.isAnyArrayBuffer(body)) {
      body = Buffer.from(body);
    } else if (ArrayBuffer.isView(body)) {
      body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    } else if (body instanceof Stream)
      ;
    else if (isFormData(body)) {
      boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
      body = Stream.Readable.from(formDataIterator(body, boundary));
    } else {
      body = Buffer.from(String(body));
    }
    this[INTERNALS$2] = {
      body,
      boundary,
      disturbed: false,
      error: null
    };
    this.size = size;
    if (body instanceof Stream) {
      body.on("error", (err) => {
        const error2 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
        this[INTERNALS$2].error = error2;
      });
    }
  }
  get body() {
    return this[INTERNALS$2].body;
  }
  get bodyUsed() {
    return this[INTERNALS$2].disturbed;
  }
  async arrayBuffer() {
    const {buffer, byteOffset, byteLength} = await consumeBody(this);
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }
  async blob() {
    const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
    const buf = await this.buffer();
    return new fetchBlob([buf], {
      type: ct
    });
  }
  async json() {
    const buffer = await consumeBody(this);
    return JSON.parse(buffer.toString());
  }
  async text() {
    const buffer = await consumeBody(this);
    return buffer.toString();
  }
  buffer() {
    return consumeBody(this);
  }
}
Object.defineProperties(Body.prototype, {
  body: {enumerable: true},
  bodyUsed: {enumerable: true},
  arrayBuffer: {enumerable: true},
  blob: {enumerable: true},
  json: {enumerable: true},
  text: {enumerable: true}
});
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let {body} = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof Stream)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const err = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error2) {
    if (error2 instanceof FetchBaseError) {
      throw error2;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error2.message}`, "system", error2);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error2) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error2.message}`, "system", error2);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
const clone = (instance, highWaterMark) => {
  let p1;
  let p2;
  let {body} = instance;
  if (instance.bodyUsed) {
    throw new Error("cannot clone body after it is used");
  }
  if (body instanceof Stream && typeof body.getBoundary !== "function") {
    p1 = new PassThrough({highWaterMark});
    p2 = new PassThrough({highWaterMark});
    body.pipe(p1);
    body.pipe(p2);
    instance[INTERNALS$2].body = p1;
    body = p2;
  }
  return body;
};
const extractContentType = (body, request) => {
  if (body === null) {
    return null;
  }
  if (typeof body === "string") {
    return "text/plain;charset=UTF-8";
  }
  if (isURLSearchParameters(body)) {
    return "application/x-www-form-urlencoded;charset=UTF-8";
  }
  if (isBlob(body)) {
    return body.type || null;
  }
  if (Buffer.isBuffer(body) || types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
    return null;
  }
  if (body && typeof body.getBoundary === "function") {
    return `multipart/form-data;boundary=${body.getBoundary()}`;
  }
  if (isFormData(body)) {
    return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
  }
  if (body instanceof Stream) {
    return null;
  }
  return "text/plain;charset=UTF-8";
};
const getTotalBytes = (request) => {
  const {body} = request;
  if (body === null) {
    return 0;
  }
  if (isBlob(body)) {
    return body.size;
  }
  if (Buffer.isBuffer(body)) {
    return body.length;
  }
  if (body && typeof body.getLengthSync === "function") {
    return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
  }
  if (isFormData(body)) {
    return getFormDataLength(request[INTERNALS$2].boundary);
  }
  return null;
};
const writeToStream = (dest, {body}) => {
  if (body === null) {
    dest.end();
  } else if (isBlob(body)) {
    body.stream().pipe(dest);
  } else if (Buffer.isBuffer(body)) {
    dest.write(body);
    dest.end();
  } else {
    body.pipe(dest);
  }
};
const validateHeaderName = typeof http.validateHeaderName === "function" ? http.validateHeaderName : (name) => {
  if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
    const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
    Object.defineProperty(err, "code", {value: "ERR_INVALID_HTTP_TOKEN"});
    throw err;
  }
};
const validateHeaderValue = typeof http.validateHeaderValue === "function" ? http.validateHeaderValue : (name, value) => {
  if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
    const err = new TypeError(`Invalid character in header content ["${name}"]`);
    Object.defineProperty(err, "code", {value: "ERR_INVALID_CHAR"});
    throw err;
  }
};
class Headers extends URLSearchParams {
  constructor(init2) {
    let result = [];
    if (init2 instanceof Headers) {
      const raw = init2.raw();
      for (const [name, values] of Object.entries(raw)) {
        result.push(...values.map((value) => [name, value]));
      }
    } else if (init2 == null)
      ;
    else if (typeof init2 === "object" && !types.isBoxedPrimitive(init2)) {
      const method = init2[Symbol.iterator];
      if (method == null) {
        result.push(...Object.entries(init2));
      } else {
        if (typeof method !== "function") {
          throw new TypeError("Header pairs must be iterable");
        }
        result = [...init2].map((pair) => {
          if (typeof pair !== "object" || types.isBoxedPrimitive(pair)) {
            throw new TypeError("Each header pair must be an iterable object");
          }
          return [...pair];
        }).map((pair) => {
          if (pair.length !== 2) {
            throw new TypeError("Each header pair must be a name/value tuple");
          }
          return [...pair];
        });
      }
    } else {
      throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
    }
    result = result.length > 0 ? result.map(([name, value]) => {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return [String(name).toLowerCase(), String(value)];
    }) : void 0;
    super(result);
    return new Proxy(this, {
      get(target, p, receiver) {
        switch (p) {
          case "append":
          case "set":
            return (name, value) => {
              validateHeaderName(name);
              validateHeaderValue(name, String(value));
              return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase(), String(value));
            };
          case "delete":
          case "has":
          case "getAll":
            return (name) => {
              validateHeaderName(name);
              return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase());
            };
          case "keys":
            return () => {
              target.sort();
              return new Set(URLSearchParams.prototype.keys.call(target)).keys();
            };
          default:
            return Reflect.get(target, p, receiver);
        }
      }
    });
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
  toString() {
    return Object.prototype.toString.call(this);
  }
  get(name) {
    const values = this.getAll(name);
    if (values.length === 0) {
      return null;
    }
    let value = values.join(", ");
    if (/^content-encoding$/i.test(name)) {
      value = value.toLowerCase();
    }
    return value;
  }
  forEach(callback) {
    for (const name of this.keys()) {
      callback(this.get(name), name);
    }
  }
  *values() {
    for (const name of this.keys()) {
      yield this.get(name);
    }
  }
  *entries() {
    for (const name of this.keys()) {
      yield [name, this.get(name)];
    }
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  raw() {
    return [...this.keys()].reduce((result, key) => {
      result[key] = this.getAll(key);
      return result;
    }, {});
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return [...this.keys()].reduce((result, key) => {
      const values = this.getAll(key);
      if (key === "host") {
        result[key] = values[0];
      } else {
        result[key] = values.length > 1 ? values : values[0];
      }
      return result;
    }, {});
  }
}
Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
  result[property] = {enumerable: true};
  return result;
}, {}));
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch (e) {
      return false;
    }
  }));
}
const redirectStatus = new Set([301, 302, 303, 307, 308]);
const isRedirect = (code) => {
  return redirectStatus.has(code);
};
const INTERNALS$1 = Symbol("Response internals");
class Response extends Body {
  constructor(body = null, options = {}) {
    super(body, options);
    const status = options.status || 200;
    const headers = new Headers(options.headers);
    if (body !== null && !headers.has("Content-Type")) {
      const contentType = extractContentType(body);
      if (contentType) {
        headers.append("Content-Type", contentType);
      }
    }
    this[INTERNALS$1] = {
      url: options.url,
      status,
      statusText: options.statusText || "",
      headers,
      counter: options.counter,
      highWaterMark: options.highWaterMark
    };
  }
  get url() {
    return this[INTERNALS$1].url || "";
  }
  get status() {
    return this[INTERNALS$1].status;
  }
  get ok() {
    return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
  }
  get redirected() {
    return this[INTERNALS$1].counter > 0;
  }
  get statusText() {
    return this[INTERNALS$1].statusText;
  }
  get headers() {
    return this[INTERNALS$1].headers;
  }
  get highWaterMark() {
    return this[INTERNALS$1].highWaterMark;
  }
  clone() {
    return new Response(clone(this, this.highWaterMark), {
      url: this.url,
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      ok: this.ok,
      redirected: this.redirected,
      size: this.size
    });
  }
  static redirect(url, status = 302) {
    if (!isRedirect(status)) {
      throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
    }
    return new Response(null, {
      headers: {
        location: new URL(url).toString()
      },
      status
    });
  }
  get [Symbol.toStringTag]() {
    return "Response";
  }
}
Object.defineProperties(Response.prototype, {
  url: {enumerable: true},
  status: {enumerable: true},
  ok: {enumerable: true},
  redirected: {enumerable: true},
  statusText: {enumerable: true},
  headers: {enumerable: true},
  clone: {enumerable: true}
});
const getSearch = (parsedURL) => {
  if (parsedURL.search) {
    return parsedURL.search;
  }
  const lastOffset = parsedURL.href.length - 1;
  const hash = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
  return parsedURL.href[lastOffset - hash.length] === "?" ? "?" : "";
};
const INTERNALS = Symbol("Request internals");
const isRequest = (object) => {
  return typeof object === "object" && typeof object[INTERNALS] === "object";
};
class Request extends Body {
  constructor(input, init2 = {}) {
    let parsedURL;
    if (isRequest(input)) {
      parsedURL = new URL(input.url);
    } else {
      parsedURL = new URL(input);
      input = {};
    }
    let method = init2.method || input.method || "GET";
    method = method.toUpperCase();
    if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
      throw new TypeError("Request with GET/HEAD method cannot have body");
    }
    const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
    super(inputBody, {
      size: init2.size || input.size || 0
    });
    const headers = new Headers(init2.headers || input.headers || {});
    if (inputBody !== null && !headers.has("Content-Type")) {
      const contentType = extractContentType(inputBody, this);
      if (contentType) {
        headers.append("Content-Type", contentType);
      }
    }
    let signal = isRequest(input) ? input.signal : null;
    if ("signal" in init2) {
      signal = init2.signal;
    }
    if (signal !== null && !isAbortSignal(signal)) {
      throw new TypeError("Expected signal to be an instanceof AbortSignal");
    }
    this[INTERNALS] = {
      method,
      redirect: init2.redirect || input.redirect || "follow",
      headers,
      parsedURL,
      signal
    };
    this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
    this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
    this.counter = init2.counter || input.counter || 0;
    this.agent = init2.agent || input.agent;
    this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
    this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
  }
  get method() {
    return this[INTERNALS].method;
  }
  get url() {
    return format(this[INTERNALS].parsedURL);
  }
  get headers() {
    return this[INTERNALS].headers;
  }
  get redirect() {
    return this[INTERNALS].redirect;
  }
  get signal() {
    return this[INTERNALS].signal;
  }
  clone() {
    return new Request(this);
  }
  get [Symbol.toStringTag]() {
    return "Request";
  }
}
Object.defineProperties(Request.prototype, {
  method: {enumerable: true},
  url: {enumerable: true},
  headers: {enumerable: true},
  redirect: {enumerable: true},
  clone: {enumerable: true},
  signal: {enumerable: true}
});
const getNodeRequestOptions = (request) => {
  const {parsedURL} = request[INTERNALS];
  const headers = new Headers(request[INTERNALS].headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "*/*");
  }
  let contentLengthValue = null;
  if (request.body === null && /^(post|put)$/i.test(request.method)) {
    contentLengthValue = "0";
  }
  if (request.body !== null) {
    const totalBytes = getTotalBytes(request);
    if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
      contentLengthValue = String(totalBytes);
    }
  }
  if (contentLengthValue) {
    headers.set("Content-Length", contentLengthValue);
  }
  if (!headers.has("User-Agent")) {
    headers.set("User-Agent", "node-fetch");
  }
  if (request.compress && !headers.has("Accept-Encoding")) {
    headers.set("Accept-Encoding", "gzip,deflate,br");
  }
  let {agent} = request;
  if (typeof agent === "function") {
    agent = agent(parsedURL);
  }
  if (!headers.has("Connection") && !agent) {
    headers.set("Connection", "close");
  }
  const search = getSearch(parsedURL);
  const requestOptions = {
    path: parsedURL.pathname + search,
    pathname: parsedURL.pathname,
    hostname: parsedURL.hostname,
    protocol: parsedURL.protocol,
    port: parsedURL.port,
    hash: parsedURL.hash,
    search: parsedURL.search,
    query: parsedURL.query,
    href: parsedURL.href,
    method: request.method,
    headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
    insecureHTTPParser: request.insecureHTTPParser,
    agent
  };
  return requestOptions;
};
class AbortError extends FetchBaseError {
  constructor(message, type = "aborted") {
    super(message, type);
  }
}
const supportedSchemas = new Set(["data:", "http:", "https:"]);
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options.protocol === "data:") {
      const data = src(request.url);
      const response2 = new Response(data, {headers: {"Content-Type": data.typeFull}});
      resolve2(response2);
      return;
    }
    const send = (options.protocol === "https:" ? https : http).request;
    const {signal} = request;
    let response = null;
    const abort = () => {
      const error2 = new AbortError("The operation was aborted.");
      reject(error2);
      if (request.body && request.body instanceof Stream.Readable) {
        request.body.destroy(error2);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error2);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (err) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              try {
                headers.set("Location", locationURL);
              } catch (error2) {
                reject(error2);
              }
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof Stream.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = pipeline(response_, new PassThrough(), (error2) => {
        reject(error2);
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: zlib.Z_SYNC_FLUSH,
        finishFlush: zlib.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = pipeline(body, zlib.createGunzip(zlibOptions), (error2) => {
          reject(error2);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = pipeline(response_, new PassThrough(), (error2) => {
          reject(error2);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = pipeline(body, zlib.createInflate(), (error2) => {
              reject(error2);
            });
          } else {
            body = pipeline(body, zlib.createInflateRaw(), (error2) => {
              reject(error2);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = pipeline(body, zlib.createBrotliDecompress(), (error2) => {
          reject(error2);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
function noop$1() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
const subscriber_queue = [];
function writable(value, start = noop$1) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s = subscribers[i];
          s[1]();
          subscriber_queue.push(s, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop$1) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop$1;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return {set, update, subscribe: subscribe2};
}
function normalize(loaded) {
  if (loaded.error) {
    const error2 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    const status = loaded.status;
    if (!(error2 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return {status: 500, error: error2};
    }
    return {status, error: error2};
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
async function get_response({request, options, $session, route, status = 200, error: error2}) {
  const host = options.host || request.headers[options.host_header];
  const dependencies = {};
  const serialized_session = try_serialize($session, (error3) => {
    throw new Error(`Failed to serialize session data: ${error3.message}`);
  });
  const serialized_data = [];
  const match = route && route.pattern.exec(request.path);
  const params = route && route.params(match);
  const page2 = {
    host,
    path: request.path,
    query: request.query,
    params
  };
  let uses_credentials = false;
  const fetcher = async (resource, opts = {}) => {
    let url;
    if (typeof resource === "string") {
      url = resource;
    } else {
      url = resource.url;
      opts = {
        method: resource.method,
        headers: resource.headers,
        body: resource.body,
        mode: resource.mode,
        credentials: resource.credentials,
        cache: resource.cache,
        redirect: resource.redirect,
        referrer: resource.referrer,
        integrity: resource.integrity,
        ...opts
      };
    }
    if (options.local && url.startsWith(options.paths.assets)) {
      url = url.replace(options.paths.assets, "");
    }
    const parsed = parse(url);
    if (opts.credentials !== "omit") {
      uses_credentials = true;
    }
    let response;
    if (parsed.protocol) {
      response = await fetch(parsed.href, opts);
    } else {
      const resolved = resolve(request.path, parsed.pathname);
      const filename = resolved.slice(1);
      const filename_html = `${filename}/index.html`;
      const asset = options.manifest.assets.find((d) => d.file === filename || d.file === filename_html);
      if (asset) {
        if (options.get_static_file) {
          response = new Response(options.get_static_file(asset.file), {
            headers: {
              "content-type": asset.type
            }
          });
        } else {
          response = await fetch(`http://${page2.host}/${asset.file}`, opts);
        }
      }
      if (!response) {
        const rendered2 = await ssr({
          host: request.host,
          method: opts.method || "GET",
          headers: opts.headers || {},
          path: resolved,
          body: opts.body,
          query: new URLSearchParams$1(parsed.query || "")
        }, {
          ...options,
          fetched: url,
          initiator: route
        });
        if (rendered2) {
          dependencies[resolved] = rendered2;
          response = new Response(rendered2.body, {
            status: rendered2.status,
            headers: rendered2.headers
          });
        }
      }
    }
    if (response) {
      const clone2 = response.clone();
      const headers2 = {};
      clone2.headers.forEach((value, key) => {
        if (key !== "etag")
          headers2[key] = value;
      });
      const payload = JSON.stringify({
        status: clone2.status,
        statusText: clone2.statusText,
        headers: headers2,
        body: await clone2.text()
      });
      serialized_data.push({url, payload});
      return response;
    }
    return new Response("Not found", {
      status: 404
    });
  };
  const component_promises = error2 ? [options.manifest.layout()] : [options.manifest.layout(), ...route.parts.map((part) => part.load())];
  const components2 = [];
  const props_promises = [];
  let context = {};
  let maxage;
  if (options.only_render_prerenderable_pages) {
    if (error2)
      return;
    const mod = await component_promises[component_promises.length - 1];
    if (!mod.prerender)
      return;
  }
  for (let i = 0; i < component_promises.length; i += 1) {
    let loaded;
    try {
      const mod = await component_promises[i];
      components2[i] = mod.default;
      if (mod.preload) {
        throw new Error("preload has been deprecated in favour of load. Please consult the documentation: https://kit.svelte.dev/docs#load");
      }
      if (mod.load) {
        loaded = await mod.load.call(null, {
          page: page2,
          get session() {
            uses_credentials = true;
            return $session;
          },
          fetch: fetcher,
          context: {...context}
        });
        if (!loaded)
          return;
      }
    } catch (e) {
      if (error2)
        throw e instanceof Error ? e : new Error(e);
      loaded = {
        error: e instanceof Error ? e : {name: "Error", message: e.toString()},
        status: 500
      };
    }
    if (loaded) {
      loaded = normalize(loaded);
      if (loaded.error) {
        return await get_response({
          request,
          options,
          $session,
          route,
          status: loaded.status,
          error: loaded.error
        });
      }
      if (loaded.redirect) {
        return {
          status: loaded.status,
          headers: {
            location: loaded.redirect
          }
        };
      }
      if (loaded.context) {
        context = {
          ...context,
          ...loaded.context
        };
      }
      maxage = loaded.maxage || 0;
      props_promises[i] = loaded.props;
    }
  }
  const session = writable($session);
  let session_tracking_active = false;
  const unsubscribe = session.subscribe(() => {
    if (session_tracking_active)
      uses_credentials = true;
  });
  session_tracking_active = true;
  if (error2) {
    if (options.dev) {
      error2.stack = await options.get_stack(error2);
    } else {
      error2.stack = String(error2);
    }
  }
  const props = {
    status,
    error: error2,
    stores: {
      page: writable(null),
      navigating: writable(null),
      session
    },
    page: page2,
    components: components2
  };
  for (let i = 0; i < props_promises.length; i += 1) {
    props[`props_${i}`] = await props_promises[i];
  }
  let rendered;
  try {
    rendered = options.root.render(props);
  } catch (e) {
    if (error2)
      throw e instanceof Error ? e : new Error(e);
    return await get_response({
      request,
      options,
      $session,
      route,
      status: 500,
      error: e instanceof Error ? e : {name: "Error", message: e.toString()}
    });
  }
  unsubscribe();
  const js_deps = route ? route.js : [];
  const css_deps = route ? route.css : [];
  const style = route ? route.style : "";
  const s = JSON.stringify;
  const prefix = `${options.paths.assets}/${options.app_dir}`;
  const links = options.amp ? `<style amp-custom>${style || (await Promise.all(css_deps.map((dep) => options.get_amp_css(dep)))).join("\n")}</style>` : [
    ...js_deps.map((dep) => `<link rel="modulepreload" href="${prefix}/${dep}">`),
    ...css_deps.map((dep) => `<link rel="stylesheet" href="${prefix}/${dep}">`)
  ].join("\n			");
  const init2 = options.amp ? `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"></script>` : `
		<script type="module">
			import { start } from ${s(options.entry)};
			start({
				target: ${options.target ? `document.querySelector(${s(options.target)})` : "document.body"},
				paths: ${s(options.paths)},
				status: ${status},
				error: ${serialize_error(error2)},
				session: ${serialized_session},
				nodes: [
					${(route ? route.parts : []).map((part) => `import(${s(options.get_component_path(part.id))})`).join(",\n					")}
				],
				page: {
					host: ${host ? s(host) : "location.host"},
					path: ${s(request.path)},
					query: new URLSearchParams(${s(request.query.toString())}),
					params: ${s(params)}
				}
			});
		</script>`;
  const head = [
    rendered.head,
    style && !options.amp ? `<style data-svelte>${style}</style>` : "",
    links,
    init2
  ].join("\n\n");
  const body = options.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({url, payload}) => `<script type="svelte-data" url="${url}">${payload}</script>`).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${uses_credentials ? "private" : "public"}, max-age=${maxage}`;
  }
  return {
    status,
    headers,
    body: options.template({head, body}),
    dependencies
  };
}
async function render_page(request, route, context, options) {
  if (options.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const $session = await (options.setup.getSession && options.setup.getSession({context}));
  const response = await get_response({
    request,
    options,
    $session,
    route,
    status: route ? 200 : 404,
    error: route ? null : new Error(`Not found: ${request.path}`)
  });
  if (response) {
    return response;
  }
  if (options.fetched) {
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${options.fetched}`
    };
  }
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error2) {
  if (!error2)
    return null;
  let serialized = try_serialize(error2);
  if (!serialized) {
    const {name, message, stack} = error2;
    serialized = try_serialize({name, message, stack});
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
async function render_route(request, route, context, options) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (handler) {
    const match = route.pattern.exec(request.path);
    const params = route.params(match);
    const response = await handler({
      host: options.host || request.headers[options.host_header || "host"],
      path: request.path,
      headers: request.headers,
      query: request.query,
      body: request.body,
      params
    }, context);
    if (response) {
      if (typeof response !== "object" || response.body == null) {
        return {
          status: 500,
          body: `Invalid response from route ${request.path}; ${response.body == null ? "body is missing" : `expected an object, got ${typeof response}`}`,
          headers: {}
        };
      }
      let {status = 200, body, headers = {}} = response;
      headers = lowercase_keys(headers);
      if (typeof body === "object" && !("content-type" in headers) || headers["content-type"] === "application/json") {
        headers = {...headers, "content-type": "application/json"};
        body = JSON.stringify(body);
      }
      return {status, body, headers};
    }
  }
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function md5(body) {
  return createHash("md5").update(body).digest("hex");
}
async function ssr(request, options) {
  if (request.path.endsWith("/") && request.path !== "/") {
    const q = request.query.toString();
    return {
      status: 301,
      headers: {
        location: request.path.slice(0, -1) + (q ? `?${q}` : "")
      }
    };
  }
  const {context, headers = {}} = await (options.setup.prepare && options.setup.prepare({headers: request.headers})) || {};
  try {
    for (const route of options.manifest.routes) {
      if (route.pattern.test(request.path)) {
        const response = route.type === "endpoint" ? await render_route(request, route, context, options) : await render_page(request, route, context, options);
        if (response) {
          if (response.status === 200) {
            if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
              const etag = `"${md5(response.body)}"`;
              if (request.headers["if-none-match"] === etag) {
                return {
                  status: 304,
                  headers: {},
                  body: null
                };
              }
              response.headers["etag"] = etag;
            }
          }
          return {
            status: response.status,
            headers: {...headers, ...response.headers},
            body: response.body,
            dependencies: response.dependencies
          };
        }
      }
    }
    return await render_page(request, null, context, options);
  } catch (e) {
    if (e && e.stack) {
      e.stack = await options.get_stack(e);
    }
    console.error(e && e.stack || e);
    return {
      status: 500,
      headers,
      body: options.dev ? e.stack : e.message
    };
  }
}
function noop() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function null_to_empty(value) {
  return value == null ? "" : value;
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
  get_current_component().$$.after_update.push(fn);
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
function getContext(key) {
  return get_current_component().$$.context.get(key);
}
const boolean_attributes = new Set([
  "allowfullscreen",
  "allowpaymentrequest",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "formnovalidate",
  "hidden",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected"
]);
const invalid_attribute_name_character = /[\s'">/=\u{FDD0}-\u{FDEF}\u{FFFE}\u{FFFF}\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}]/u;
function spread(args, classes_to_add) {
  const attributes = Object.assign({}, ...args);
  if (classes_to_add) {
    if (attributes.class == null) {
      attributes.class = classes_to_add;
    } else {
      attributes.class += " " + classes_to_add;
    }
  }
  let str = "";
  Object.keys(attributes).forEach((name) => {
    if (invalid_attribute_name_character.test(name))
      return;
    const value = attributes[name];
    if (value === true)
      str += " " + name;
    else if (boolean_attributes.has(name.toLowerCase())) {
      if (value)
        str += " " + name;
    } else if (value != null) {
      str += ` ${name}="${String(value).replace(/"/g, "&#34;").replace(/'/g, "&#39;")}"`;
    }
  });
  return str;
}
const escaped = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
const missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
let on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({$$});
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, options = {}) => {
      on_destroy = [];
      const result = {title: "", head: "", css: new Set()};
      const html = $$render(result, props, {}, options);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
}
const Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {status} = $$props;
  let {error: error2} = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
    $$bindings.error(error2);
  return `<h1>${escape(status)}</h1>

<p>${escape(error2.message)}</p>


${error2.stack ? `<pre>${escape(error2.stack)}</pre>` : ``}`;
});
var error = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Error$1
});
var root_svelte = "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}";
const css$7 = {
  code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\timport ErrorComponent from \\"..\\\\\\\\components\\\\\\\\error.svelte\\";\\n\\n\\t// error handling\\n\\texport let status = undefined;\\n\\texport let error = undefined;\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\n\\tconst Layout = components[0];\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title;\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n</script>\\n\\n<Layout {...(props_0 || {})}>\\n\\t{#if error}\\n\\t\\t<ErrorComponent {status} {error}/>\\n\\t{:else}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}/>\\n\\t{/if}\\n</Layout>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\tNavigated to {title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>\\n\\t#svelte-announcer {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 0;\\n\\t\\tclip: rect(0 0 0 0);\\n\\t\\tclip-path: inset(50%);\\n\\t\\toverflow: hidden;\\n\\t\\twhite-space: nowrap;\\n\\t\\twidth: 1px;\\n\\t\\theight: 1px;\\n\\t}\\n</style>"],"names":[],"mappings":"AA0DC,iBAAiB,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,SAAS,CAAE,MAAM,GAAG,CAAC,CACrB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,AACZ,CAAC"}`
};
const Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {status = void 0} = $$props;
  let {error: error2 = void 0} = $$props;
  let {stores} = $$props;
  let {page: page2} = $$props;
  let {components: components2} = $$props;
  let {props_0 = null} = $$props;
  let {props_1 = null} = $$props;
  const Layout = components2[0];
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  let mounted = false;
  let navigated = false;
  let title = null;
  onMount(() => {
    const unsubscribe = stores.page.subscribe(() => {
      if (mounted) {
        navigated = true;
        title = document.title;
      }
    });
    mounted = true;
    return unsubscribe;
  });
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
    $$bindings.error(error2);
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page2 !== void 0)
    $$bindings.page(page2);
  if ($$props.components === void 0 && $$bindings.components && components2 !== void 0)
    $$bindings.components(components2);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  $$result.css.add(css$7);
  {
    stores.page.set(page2);
  }
  return `


${validate_component(Layout, "Layout").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${error2 ? `${validate_component(Error$1, "ErrorComponent").$$render($$result, {status, error: error2}, {}, {})}` : `${validate_component(components2[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {})}`}`
  })}

${mounted ? `<div id="${"svelte-announcer"}" aria-live="${"assertive"}" aria-atomic="${"true"}" class="${"svelte-1j55zn5"}">${navigated ? `Navigated to ${escape(title)}` : ``}</div>` : ``}`;
});
var setup = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
const template = ({head, body}) => '<!DOCTYPE html>\r\n<html lang="en">\r\n	<head>\r\n		<meta charset="utf-8" />\r\n		<link rel="icon" href="/favicon.ico" />\r\n		<link rel="preconnect" href="https://fonts.gstatic.com" />\r\n		<link\r\n			href="https://fonts.googleapis.com/css2?family=B612:ital,wght@0,400;0,700;1,400;1,700&display=swap"\r\n			rel="stylesheet"\r\n		/>\r\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\r\n		' + head + '\r\n	</head>\r\n	<body>\r\n		<div id="svelte">' + body + "</div>\r\n	</body>\r\n</html>\r\n";
function init({paths}) {
}
const empty = () => ({});
const components = [
  () => Promise.resolve().then(function() {
    return index;
  }),
  () => Promise.resolve().then(function() {
    return projects;
  }),
  () => Promise.resolve().then(function() {
    return about;
  })
];
const client_component_lookup = {".svelte/build/runtime/internal/start.js": "start-58b01723.js", "src/routes/index.svelte": "pages\\index.svelte-efb5a03a.js", "src/routes/projects.svelte": "pages\\projects.svelte-1ff6320e.js", "src/routes/about.svelte": "pages\\about.svelte-abea13c9.js"};
const manifest = {
  assets: [{file: "favicon.ico", size: 1150, type: "image/vnd.microsoft.icon"}, {file: "robots.txt", size: 70, type: "text/plain"}],
  layout: () => Promise.resolve().then(function() {
    return $layout$1;
  }),
  error: () => Promise.resolve().then(function() {
    return error;
  }),
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      parts: [{id: "src/routes/index.svelte", load: components[0]}],
      css: ["assets/start-834c2e7d.css", "assets/pages\\index.svelte-dd340878.css"],
      js: ["start-58b01723.js", "chunks/index-fa90cfb2.js", "pages\\index.svelte-efb5a03a.js"]
    },
    {
      type: "page",
      pattern: /^\/projects\/?$/,
      params: empty,
      parts: [{id: "src/routes/projects.svelte", load: components[1]}],
      css: ["assets/start-834c2e7d.css", "assets/pages\\projects.svelte-569ed795.css"],
      js: ["start-58b01723.js", "chunks/index-fa90cfb2.js", "pages\\projects.svelte-1ff6320e.js"]
    },
    {
      type: "page",
      pattern: /^\/about\/?$/,
      params: empty,
      parts: [{id: "src/routes/about.svelte", load: components[2]}],
      css: ["assets/start-834c2e7d.css", "assets/pages\\projects.svelte-569ed795.css"],
      js: ["start-58b01723.js", "chunks/index-fa90cfb2.js", "pages\\about.svelte-abea13c9.js"]
    }
  ]
};
function render(request, {
  paths = {base: "", assets: "/."},
  local = false,
  only_render_prerenderable_pages = false,
  get_static_file
} = {}) {
  return ssr(request, {
    paths,
    local,
    template,
    manifest,
    target: "#svelte",
    entry: "/./_app/start-58b01723.js",
    root: Root,
    setup,
    dev: false,
    amp: false,
    only_render_prerenderable_pages,
    app_dir: "_app",
    host: null,
    host_header: null,
    get_component_path: (id) => "/./_app/" + client_component_lookup[id],
    get_stack: (error2) => error2.stack,
    get_static_file,
    get_amp_css: (dep) => amp_css_lookup[dep]
  });
}
/*!
 * Font Awesome Free 5.15.3 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 */
var faEnvelope = {
  prefix: "fas",
  iconName: "envelope",
  icon: [512, 512, [], "f0e0", "M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z"]
};
/*!
 * Font Awesome Free 5.15.3 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 */
var faGithub = {
  prefix: "fab",
  iconName: "github",
  icon: [496, 512, [], "f09b", "M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"]
};
var faInstagram = {
  prefix: "fab",
  iconName: "instagram",
  icon: [448, 512, [], "f16d", "M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"]
};
var faLinkedin = {
  prefix: "fab",
  iconName: "linkedin",
  icon: [448, 512, [], "f08c", "M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"]
};
const Path = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {id = ""} = $$props;
  let {data = {}} = $$props;
  if ($$props.id === void 0 && $$bindings.id && id !== void 0)
    $$bindings.id(id);
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  return `<path${spread([{key: "path-" + escape(id)}, data])}></path>`;
});
const Polygon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {id = ""} = $$props;
  let {data = {}} = $$props;
  if ($$props.id === void 0 && $$bindings.id && id !== void 0)
    $$bindings.id(id);
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  return `<polygon${spread([{key: "polygon-" + escape(id)}, data])}></polygon>`;
});
const Raw = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let cursor = 870711;
  function getId() {
    cursor += 1;
    return `fa-${cursor.toString(16)}`;
  }
  let raw;
  let {data} = $$props;
  function getRaw(data2) {
    if (!data2 || !data2.raw) {
      return null;
    }
    let rawData = data2.raw;
    const ids = {};
    rawData = rawData.replace(/\s(?:xml:)?id=["']?([^"')\s]+)/g, (match, id) => {
      const uniqueId = getId();
      ids[id] = uniqueId;
      return ` id="${uniqueId}"`;
    });
    rawData = rawData.replace(/#(?:([^'")\s]+)|xpointer\(id\((['"]?)([^')]+)\2\)\))/g, (match, rawId, _, pointerId) => {
      const id = rawId || pointerId;
      if (!id || !ids[id]) {
        return match;
      }
      return `#${ids[id]}`;
    });
    return rawData;
  }
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  raw = getRaw(data);
  return `<g>${raw}</g>`;
});
var Svg_svelte = ".fa-icon.svelte-1dof0an{display:inline-block;fill:currentColor}.fa-flip-horizontal.svelte-1dof0an{transform:scale(-1, 1)}.fa-flip-vertical.svelte-1dof0an{transform:scale(1, -1)}.fa-spin.svelte-1dof0an{animation:svelte-1dof0an-fa-spin 1s 0s infinite linear}.fa-inverse.svelte-1dof0an{color:#fff}.fa-pulse.svelte-1dof0an{animation:svelte-1dof0an-fa-spin 1s infinite steps(8)}@keyframes svelte-1dof0an-fa-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}";
const css$6 = {
  code: ".fa-icon.svelte-1dof0an{display:inline-block;fill:currentColor}.fa-flip-horizontal.svelte-1dof0an{transform:scale(-1, 1)}.fa-flip-vertical.svelte-1dof0an{transform:scale(1, -1)}.fa-spin.svelte-1dof0an{animation:svelte-1dof0an-fa-spin 1s 0s infinite linear}.fa-inverse.svelte-1dof0an{color:#fff}.fa-pulse.svelte-1dof0an{animation:svelte-1dof0an-fa-spin 1s infinite steps(8)}@keyframes svelte-1dof0an-fa-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}",
  map: `{"version":3,"file":"Svg.svelte","sources":["Svg.svelte"],"sourcesContent":["<svg version=\\"1.1\\" class=\\"fa-icon {className}\\"\\n  class:fa-spin={spin} class:fa-pulse={pulse} class:fa-inverse={inverse}\\n  class:fa-flip-horizontal=\\"{flip === 'horizontal'}\\" class:fa-flip-vertical=\\"{flip === 'vertical'}\\"\\n  {x} {y} {width} {height}\\n  aria-label={label}\\n  role=\\"{ label ? 'img' : 'presentation' }\\"\\n  viewBox={box} style={style}\\n  >\\n  <slot></slot>\\n</svg>\\n\\n<style>\\n.fa-icon {\\n  display: inline-block;\\n  fill: currentColor;\\n}\\n.fa-flip-horizontal {\\n  transform: scale(-1, 1);\\n}\\n.fa-flip-vertical {\\n  transform: scale(1, -1);\\n}\\n.fa-spin {\\n  animation: fa-spin 1s 0s infinite linear;\\n}\\n.fa-inverse {\\n  color: #fff;\\n}\\n.fa-pulse {\\n  animation: fa-spin 1s infinite steps(8);\\n}\\n@keyframes fa-spin {\\n  0% {\\n    transform: rotate(0deg);\\n  }\\n  100% {\\n    transform: rotate(360deg);\\n  }\\n}\\n</style>\\n\\n<script>\\n  let className;\\n\\n  export { className as class };\\n\\n  export let width;\\n  export let height;\\n  export let box;\\n\\n  export let spin = false;\\n  export let inverse = false;\\n  export let pulse = false;\\n  export let flip = null;\\n\\n  // optionals\\n  export let x = undefined;\\n  export let y = undefined;\\n  export let style = undefined;\\n  export let label = undefined;\\n</script>\\n"],"names":[],"mappings":"AAYA,QAAQ,eAAC,CAAC,AACR,OAAO,CAAE,YAAY,CACrB,IAAI,CAAE,YAAY,AACpB,CAAC,AACD,mBAAmB,eAAC,CAAC,AACnB,SAAS,CAAE,MAAM,EAAE,CAAC,CAAC,CAAC,CAAC,AACzB,CAAC,AACD,iBAAiB,eAAC,CAAC,AACjB,SAAS,CAAE,MAAM,CAAC,CAAC,CAAC,EAAE,CAAC,AACzB,CAAC,AACD,QAAQ,eAAC,CAAC,AACR,SAAS,CAAE,sBAAO,CAAC,EAAE,CAAC,EAAE,CAAC,QAAQ,CAAC,MAAM,AAC1C,CAAC,AACD,WAAW,eAAC,CAAC,AACX,KAAK,CAAE,IAAI,AACb,CAAC,AACD,SAAS,eAAC,CAAC,AACT,SAAS,CAAE,sBAAO,CAAC,EAAE,CAAC,QAAQ,CAAC,MAAM,CAAC,CAAC,AACzC,CAAC,AACD,WAAW,sBAAQ,CAAC,AAClB,EAAE,AAAC,CAAC,AACF,SAAS,CAAE,OAAO,IAAI,CAAC,AACzB,CAAC,AACD,IAAI,AAAC,CAAC,AACJ,SAAS,CAAE,OAAO,MAAM,CAAC,AAC3B,CAAC,AACH,CAAC"}`
};
const Svg = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {class: className} = $$props;
  let {width} = $$props;
  let {height} = $$props;
  let {box} = $$props;
  let {spin = false} = $$props;
  let {inverse = false} = $$props;
  let {pulse = false} = $$props;
  let {flip = null} = $$props;
  let {x = void 0} = $$props;
  let {y = void 0} = $$props;
  let {style = void 0} = $$props;
  let {label = void 0} = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0)
    $$bindings.class(className);
  if ($$props.width === void 0 && $$bindings.width && width !== void 0)
    $$bindings.width(width);
  if ($$props.height === void 0 && $$bindings.height && height !== void 0)
    $$bindings.height(height);
  if ($$props.box === void 0 && $$bindings.box && box !== void 0)
    $$bindings.box(box);
  if ($$props.spin === void 0 && $$bindings.spin && spin !== void 0)
    $$bindings.spin(spin);
  if ($$props.inverse === void 0 && $$bindings.inverse && inverse !== void 0)
    $$bindings.inverse(inverse);
  if ($$props.pulse === void 0 && $$bindings.pulse && pulse !== void 0)
    $$bindings.pulse(pulse);
  if ($$props.flip === void 0 && $$bindings.flip && flip !== void 0)
    $$bindings.flip(flip);
  if ($$props.x === void 0 && $$bindings.x && x !== void 0)
    $$bindings.x(x);
  if ($$props.y === void 0 && $$bindings.y && y !== void 0)
    $$bindings.y(y);
  if ($$props.style === void 0 && $$bindings.style && style !== void 0)
    $$bindings.style(style);
  if ($$props.label === void 0 && $$bindings.label && label !== void 0)
    $$bindings.label(label);
  $$result.css.add(css$6);
  return `<svg version="${"1.1"}" class="${[
    "fa-icon " + escape(className) + " svelte-1dof0an",
    (spin ? "fa-spin" : "") + " " + (pulse ? "fa-pulse" : "") + " " + (inverse ? "fa-inverse" : "") + " " + (flip === "horizontal" ? "fa-flip-horizontal" : "") + " " + (flip === "vertical" ? "fa-flip-vertical" : "")
  ].join(" ").trim()}"${add_attribute("x", x, 0)}${add_attribute("y", y, 0)}${add_attribute("width", width, 0)}${add_attribute("height", height, 0)}${add_attribute("aria-label", label, 0)}${add_attribute("role", label ? "img" : "presentation", 0)}${add_attribute("viewBox", box, 0)}${add_attribute("style", style, 0)}>${slots.default ? slots.default({}) : ``}</svg>`;
});
let outerScale = 1;
function normaliseData(data) {
  if ("iconName" in data && "icon" in data) {
    let normalisedData = {};
    let faIcon = data.icon;
    let name = data.iconName;
    let width = faIcon[0];
    let height = faIcon[1];
    let paths = faIcon[4];
    let iconData = {width, height, paths: [{d: paths}]};
    normalisedData[name] = iconData;
    return normalisedData;
  }
  return data;
}
const Icon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {class: className = ""} = $$props;
  let {data} = $$props;
  let {scale = 1} = $$props;
  let {spin = false} = $$props;
  let {inverse = false} = $$props;
  let {pulse = false} = $$props;
  let {flip = null} = $$props;
  let {label = null} = $$props;
  let {self = null} = $$props;
  let {style = null} = $$props;
  let width;
  let height;
  let combinedStyle;
  let box;
  function init2() {
    if (typeof data === "undefined") {
      return;
    }
    const normalisedData = normaliseData(data);
    const [name] = Object.keys(normalisedData);
    const icon = normalisedData[name];
    if (!icon.paths) {
      icon.paths = [];
    }
    if (icon.d) {
      icon.paths.push({d: icon.d});
    }
    if (!icon.polygons) {
      icon.polygons = [];
    }
    if (icon.points) {
      icon.polygons.push({points: icon.points});
    }
    self = icon;
  }
  function normalisedScale() {
    let numScale = 1;
    if (typeof scale !== "undefined") {
      numScale = Number(scale);
    }
    if (isNaN(numScale) || numScale <= 0) {
      console.warn('Invalid prop: prop "scale" should be a number over 0.');
      return outerScale;
    }
    return numScale * outerScale;
  }
  function calculateBox() {
    if (self) {
      return `0 0 ${self.width} ${self.height}`;
    }
    return `0 0 ${width} ${height}`;
  }
  function calculateRatio() {
    if (!self) {
      return 1;
    }
    return Math.max(self.width, self.height) / 16;
  }
  function calculateWidth() {
    if (self) {
      return self.width / calculateRatio() * normalisedScale();
    }
    return 0;
  }
  function calculateHeight() {
    if (self) {
      return self.height / calculateRatio() * normalisedScale();
    }
    return 0;
  }
  function calculateStyle() {
    let combined = "";
    if (style !== null) {
      combined += style;
    }
    let size = normalisedScale();
    if (size === 1) {
      return combined;
    }
    if (combined !== "" && !combined.endsWith(";")) {
      combined += "; ";
    }
    return `${combined}font-size: ${size}em`;
  }
  if ($$props.class === void 0 && $$bindings.class && className !== void 0)
    $$bindings.class(className);
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  if ($$props.scale === void 0 && $$bindings.scale && scale !== void 0)
    $$bindings.scale(scale);
  if ($$props.spin === void 0 && $$bindings.spin && spin !== void 0)
    $$bindings.spin(spin);
  if ($$props.inverse === void 0 && $$bindings.inverse && inverse !== void 0)
    $$bindings.inverse(inverse);
  if ($$props.pulse === void 0 && $$bindings.pulse && pulse !== void 0)
    $$bindings.pulse(pulse);
  if ($$props.flip === void 0 && $$bindings.flip && flip !== void 0)
    $$bindings.flip(flip);
  if ($$props.label === void 0 && $$bindings.label && label !== void 0)
    $$bindings.label(label);
  if ($$props.self === void 0 && $$bindings.self && self !== void 0)
    $$bindings.self(self);
  if ($$props.style === void 0 && $$bindings.style && style !== void 0)
    $$bindings.style(style);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    {
      {
        init2();
        width = calculateWidth();
        height = calculateHeight();
        combinedStyle = calculateStyle();
        box = calculateBox();
      }
    }
    $$rendered = `${validate_component(Svg, "Svg").$$render($$result, {
      label,
      width,
      height,
      box,
      style: combinedStyle,
      spin,
      flip,
      inverse,
      pulse,
      class: className
    }, {}, {
      default: () => `${slots.default ? slots.default({}) : `
    ${self ? `${self.paths ? `${each(self.paths, (path, i) => `${validate_component(Path, "Path").$$render($$result, {id: i, data: path}, {}, {})}`)}` : ``}
      ${self.polygons ? `${each(self.polygons, (polygon, i) => `${validate_component(Polygon, "Polygon").$$render($$result, {id: i, data: polygon}, {}, {})}`)}` : ``}
      ${self.raw ? `${validate_component(Raw, "Raw").$$render($$result, {data: self}, {
        data: ($$value) => {
          self = $$value;
          $$settled = false;
        }
      }, {})}` : ``}` : ``}
  `}`
    })}`;
  } while (!$$settled);
  return $$rendered;
});
var Slider_svelte = ".item.svelte-280do5.svelte-280do5{position:relative;width:300px;height:100px;pointer-events:auto;transform-origin:50% 50% 0px;padding-left:32px;padding-right:32px;box-sizing:border-box;display:grid;align-items:center;text-align:center;border-radius:5px;box-shadow:0px 10px 10px -5px rgba(0, 0, 0, 0.2);-webkit-user-select:none;user-select:none}.fg.svelte-280do5.svelte-280do5{cursor:-webkit-grab;background-color:#272727;color:rgba(255, 255, 255, 0.8);position:absolute;height:100%;width:100%;display:grid;align-items:center;text-align:center;border-radius:5px;box-shadow:0px 10px 30px -5px rgba(0, 0, 0, 0.2);font-size:3em;font-weight:600;transition:box-shadow 0.75s}.fg.svelte-280do5.svelte-280do5:active{cursor:-webkit-grabbing;box-shadow:0px 15px 30px -5px rgba(0, 0, 0, 0.4)}.fg.svelte-280do5>.svelte-280do5{pointer-events:none}.av.svelte-280do5.svelte-280do5{width:60px;height:60px;border-radius:50%;background-color:white}";
var index_svelte = "a.svelte-11f89ju.svelte-11f89ju{color:white;text-decoration:none}main.svelte-11f89ju.svelte-11f89ju{text-align:center;padding:0;margin:0 auto;text-align:center}h1.svelte-11f89ju.svelte-11f89ju{font-weight:700}main.svelte-11f89ju>h1.svelte-11f89ju{margin:50px 0 0 0;font-size:36px}.icons.svelte-11f89ju.svelte-11f89ju{margin:50px 0 0;cursor:pointer;font-size:30px}.icons.svelte-11f89ju .icon{cursor:pointer;transition:color 0.2s ease-in-out}.icons.svelte-11f89ju .icon:hover{color:linear-gradient(43deg, #4158d0 0%, #c850c0 46%, #ffcc70 100%)}.card.svelte-11f89ju.svelte-11f89ju{font-weight:700;border:1px dashed transparent;display:flex;flex-direction:column;background-color:#1b1c22;color:white;padding:1rem;border-radius:5px;transition:transform 0.2s ease-in-out, background 0.2s ease-in-out;text-align:left;border-radius:25px;background:linear-gradient(155deg, rgba(255, 255, 255, 0.15), transparent);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);-webkit-animation:cardWobble 10000ms infinite;animation:cardWobble 10000ms infinite;box-shadow:2px 4px 6px rgba(0, 0, 0, 0.1), inset 0 0 0 2px rgba(255, 255, 255, 0.1)}.card.svelte-11f89ju h2.svelte-11f89ju{margin:0}.card.svelte-11f89ju p.svelte-11f89ju{margin:0;font-weight:100}.card.svelte-11f89ju.svelte-11f89ju:hover{transform:scale(1.03);cursor:pointer}.cards.svelte-11f89ju.svelte-11f89ju{margin:50px 10px;display:grid;grid-gap:1rem}@media(min-width: 900px){main.svelte-11f89ju>h1.svelte-11f89ju{font-size:48px}.icons.svelte-11f89ju.svelte-11f89ju{font-size:40px}.cards.svelte-11f89ju.svelte-11f89ju{grid-template-columns:repeat(3, 1fr);margin:50px auto}.card.svelte-11f89ju.svelte-11f89ju{display:flex;justify-content:center;align-items:center}.cards.svelte-11f89ju .card.svelte-11f89ju{min-height:200px}}@media(min-width: 600px){main.svelte-11f89ju.svelte-11f89ju{max-width:none}.cards.svelte-11f89ju.svelte-11f89ju{grid-template-columns:repeat(2, 1fr)}}";
const css$5 = {
  code: "a.svelte-11f89ju.svelte-11f89ju{color:white;text-decoration:none}main.svelte-11f89ju.svelte-11f89ju{text-align:center;padding:0;margin:0 auto;text-align:center}h1.svelte-11f89ju.svelte-11f89ju{font-weight:700}main.svelte-11f89ju>h1.svelte-11f89ju{margin:50px 0 0 0;font-size:36px}.icons.svelte-11f89ju.svelte-11f89ju{margin:50px 0 0;cursor:pointer;font-size:30px}.icons.svelte-11f89ju .icon{cursor:pointer;transition:color 0.2s ease-in-out}.icons.svelte-11f89ju .icon:hover{color:linear-gradient(43deg, #4158d0 0%, #c850c0 46%, #ffcc70 100%)}.card.svelte-11f89ju.svelte-11f89ju{font-weight:700;border:1px dashed transparent;display:flex;flex-direction:column;background-color:#1b1c22;color:white;padding:1rem;border-radius:5px;transition:transform 0.2s ease-in-out, background 0.2s ease-in-out;text-align:left;border-radius:25px;background:linear-gradient(155deg, rgba(255, 255, 255, 0.15), transparent);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);-webkit-animation:cardWobble 10000ms infinite;animation:cardWobble 10000ms infinite;box-shadow:2px 4px 6px rgba(0, 0, 0, 0.1), inset 0 0 0 2px rgba(255, 255, 255, 0.1)}.card.svelte-11f89ju h2.svelte-11f89ju{margin:0}.card.svelte-11f89ju p.svelte-11f89ju{margin:0;font-weight:100}.card.svelte-11f89ju.svelte-11f89ju:hover{transform:scale(1.03);cursor:pointer}.cards.svelte-11f89ju.svelte-11f89ju{margin:50px 10px;display:grid;grid-gap:1rem}@media(min-width: 900px){main.svelte-11f89ju>h1.svelte-11f89ju{font-size:48px}.icons.svelte-11f89ju.svelte-11f89ju{font-size:40px}.cards.svelte-11f89ju.svelte-11f89ju{grid-template-columns:repeat(3, 1fr);margin:50px auto}.card.svelte-11f89ju.svelte-11f89ju{display:flex;justify-content:center;align-items:center}.cards.svelte-11f89ju .card.svelte-11f89ju{min-height:200px}}@media(min-width: 600px){main.svelte-11f89ju.svelte-11f89ju{max-width:none}.cards.svelte-11f89ju.svelte-11f89ju{grid-template-columns:repeat(2, 1fr)}}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script>\\r\\n\\t// import { onMount } from 'svelte';\\r\\n\\timport { faEnvelope } from '@fortawesome/free-solid-svg-icons';\\r\\n\\timport { faGithub, faLinkedin, faInstagram } from '@fortawesome/free-brands-svg-icons';\\r\\n\\timport Icon from 'svelte-awesome';\\r\\n\\timport Slider from '$lib/components/Slider.svelte';\\r\\n\\t// import PageTransition from '$lib/components/PageTransition.svelte';\\r\\n\\r\\n\\t// \\tlet visible = false\\r\\n\\r\\n\\t// onMount(() => {\\r\\n\\t// \\tvisible = true\\r\\n\\t// })\\r\\n</script>\\r\\n\\r\\n<!-- <PageTransition> -->\\r\\n<main>\\r\\n\\t<h1>Hi!\u270B I'm Davide a Software Engineer \u{1F4BB} based in Italy</h1>\\r\\n\\t<div class=\\"icons\\">\\r\\n\\t\\t<a href=\\"mailto:cavallogianmarco@gmail.com\\" target=\\"_blank\\">\\r\\n\\t\\t\\t<Icon class=\\"icon\\" data={faEnvelope} scale=\\"2.5\\" />\\r\\n\\t\\t</a>\\r\\n\\t\\t<a href=\\"https://github.com/Ladvace\\" target=\\"_blank\\">\\r\\n\\t\\t\\t<Icon class=\\"icon\\" data={faGithub} scale=\\"2.5\\" />\\r\\n\\t\\t</a>\\r\\n\\t\\t<a href=\\"https://www.linkedin.com/in/ladvace/\\" target=\\"_blank\\">\\r\\n\\t\\t\\t<Icon class=\\"icon\\" data={faLinkedin} scale=\\"2.5\\" />\\r\\n\\t\\t</a>\\r\\n\\t\\t<a href=\\"https://www.linkedin.com/in/ladvace/\\" target=\\"_blank\\">\\r\\n\\t\\t\\t<Icon class=\\"icon\\" data={faInstagram} scale=\\"2.5\\" />\\r\\n\\t\\t</a>\\r\\n\\t</div>\\r\\n\\t<!-- <Slider>TEst</Slider> -->\\r\\n\\t<div class=\\"cards\\">\\r\\n\\t\\t<a href=\\"/projects\\">\\r\\n\\t\\t\\t<div class=\\"card\\">\\r\\n\\t\\t\\t\\t<h2>Projects</h2>\\r\\n\\t\\t\\t\\t<p>List of projects</p>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</a>\\r\\n\\t\\t<a href=\\"/about\\">\\r\\n\\t\\t\\t<div class=\\"card\\">\\r\\n\\t\\t\\t\\t<h2>About</h2>\\r\\n\\t\\t\\t\\t<p>Somethings more about me</p>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</a>\\r\\n\\t\\t<a href=\\"/about\\">\\r\\n\\t\\t\\t<div class=\\"card\\">\\r\\n\\t\\t\\t\\t<h2>Blog</h2>\\r\\n\\t\\t\\t\\t<p>Somethings more about me</p>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</a>\\r\\n\\t\\t<a href=\\"/about\\">\\r\\n\\t\\t\\t<div class=\\"card\\">\\r\\n\\t\\t\\t\\t<h2>Resume</h2>\\r\\n\\t\\t\\t\\t<p>Somethings more about me</p>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</a>\\r\\n\\t</div>\\r\\n</main>\\r\\n\\r\\n<!-- </PageTransition> -->\\r\\n<style>\\r\\n\\ta {\\r\\n\\t\\tcolor: white;\\r\\n\\t\\ttext-decoration: none;\\r\\n\\t}\\r\\n\\tmain {\\r\\n\\t\\ttext-align: center;\\r\\n\\t\\tpadding: 0;\\r\\n\\t\\tmargin: 0 auto;\\r\\n\\t\\ttext-align: center;\\r\\n\\t}\\r\\n\\r\\n\\th1 {\\r\\n\\t\\tfont-weight: 700;\\r\\n\\t}\\r\\n\\r\\n\\tmain > h1 {\\r\\n\\t\\tmargin: 50px 0 0 0;\\r\\n\\t\\tfont-size: 36px;\\r\\n\\t}\\r\\n\\r\\n\\t.icons {\\r\\n\\t\\tmargin: 50px 0 0;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\tfont-size: 30px;\\r\\n\\t}\\r\\n\\t.icons :global(.icon) {\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\ttransition: color 0.2s ease-in-out;\\r\\n\\t}\\r\\n\\t.icons :global(.icon):hover {\\r\\n\\t\\t/* color: #f3a712; */\\r\\n\\t\\tcolor: linear-gradient(43deg, #4158d0 0%, #c850c0 46%, #ffcc70 100%);\\r\\n\\t}\\r\\n\\t.card {\\r\\n\\t\\tfont-weight: 700;\\r\\n\\t\\tborder: 1px dashed transparent;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\tbackground-color: #1b1c22;\\r\\n\\t\\tcolor: white;\\r\\n\\t\\tpadding: 1rem;\\r\\n\\t\\tborder-radius: 5px;\\r\\n\\t\\ttransition: transform 0.2s ease-in-out, background 0.2s ease-in-out;\\r\\n\\t\\ttext-align: left;\\r\\n\\r\\n\\t\\tborder-radius: 25px;\\r\\n\\t\\tbackground: linear-gradient(155deg, rgba(255, 255, 255, 0.15), transparent);\\r\\n\\t\\t-webkit-backdrop-filter: blur(20px);\\r\\n\\t\\tbackdrop-filter: blur(20px);\\r\\n\\t\\t-webkit-animation: cardWobble 10000ms infinite;\\r\\n\\t\\tanimation: cardWobble 10000ms infinite;\\r\\n\\t\\tbox-shadow: 2px 4px 6px rgba(0, 0, 0, 0.1), inset 0 0 0 2px rgba(255, 255, 255, 0.1);\\r\\n\\t}\\r\\n\\r\\n\\t.card h2 {\\r\\n\\t\\tmargin: 0;\\r\\n\\t}\\r\\n\\t.card p {\\r\\n\\t\\tmargin: 0;\\r\\n\\t\\tfont-weight: 100;\\r\\n\\t}\\r\\n\\r\\n\\t.card:hover {\\r\\n\\t\\t/* border: 1px dashed white; */\\r\\n\\t\\ttransform: scale(1.03);\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\t/* background: #24262d; */\\r\\n\\t}\\r\\n\\r\\n\\t.cards {\\r\\n\\t\\tmargin: 50px 10px;\\r\\n\\t\\tdisplay: grid;\\r\\n\\t\\tgrid-gap: 1rem;\\r\\n\\t}\\r\\n\\t@media (min-width: 900px) {\\r\\n\\t\\tmain > h1 {\\r\\n\\t\\t\\tfont-size: 48px;\\r\\n\\t\\t}\\r\\n\\r\\n\\t\\t.icons {\\r\\n\\t\\t\\tfont-size: 40px;\\r\\n\\t\\t}\\r\\n\\r\\n\\t\\t.cards {\\r\\n\\t\\t\\tgrid-template-columns: repeat(3, 1fr);\\r\\n\\t\\t\\tmargin: 50px auto;\\r\\n\\t\\t}\\r\\n\\r\\n\\t\\t.card {\\r\\n\\t\\t\\tdisplay: flex;\\r\\n\\t\\t\\tjustify-content: center;\\r\\n\\t\\t\\talign-items: center;\\r\\n\\t\\t}\\r\\n\\t\\t.cards .card {\\r\\n\\t\\t\\tmin-height: 200px;\\r\\n\\t\\t}\\r\\n\\t}\\r\\n\\r\\n\\t@media (min-width: 600px) {\\r\\n\\t\\tmain {\\r\\n\\t\\t\\tmax-width: none;\\r\\n\\t\\t}\\r\\n\\t\\t.cards {\\r\\n\\t\\t\\tgrid-template-columns: repeat(2, 1fr);\\r\\n\\t\\t}\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"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"}`
};
const Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$5);
  return `
<main class="${"svelte-11f89ju"}"><h1 class="${"svelte-11f89ju"}">Hi!\u270B I&#39;m Davide a Software Engineer \u{1F4BB} based in Italy</h1>
	<div class="${"icons svelte-11f89ju"}"><a href="${"mailto:cavallogianmarco@gmail.com"}" target="${"_blank"}" class="${"svelte-11f89ju"}">${validate_component(Icon, "Icon").$$render($$result, {
    class: "icon",
    data: faEnvelope,
    scale: "2.5"
  }, {}, {})}</a>
		<a href="${"https://github.com/Ladvace"}" target="${"_blank"}" class="${"svelte-11f89ju"}">${validate_component(Icon, "Icon").$$render($$result, {
    class: "icon",
    data: faGithub,
    scale: "2.5"
  }, {}, {})}</a>
		<a href="${"https://www.linkedin.com/in/ladvace/"}" target="${"_blank"}" class="${"svelte-11f89ju"}">${validate_component(Icon, "Icon").$$render($$result, {
    class: "icon",
    data: faLinkedin,
    scale: "2.5"
  }, {}, {})}</a>
		<a href="${"https://www.linkedin.com/in/ladvace/"}" target="${"_blank"}" class="${"svelte-11f89ju"}">${validate_component(Icon, "Icon").$$render($$result, {
    class: "icon",
    data: faInstagram,
    scale: "2.5"
  }, {}, {})}</a></div>
	
	<div class="${"cards svelte-11f89ju"}"><a href="${"/projects"}" class="${"svelte-11f89ju"}"><div class="${"card svelte-11f89ju"}"><h2 class="${"svelte-11f89ju"}">Projects</h2>
				<p class="${"svelte-11f89ju"}">List of projects</p></div></a>
		<a href="${"/about"}" class="${"svelte-11f89ju"}"><div class="${"card svelte-11f89ju"}"><h2 class="${"svelte-11f89ju"}">About</h2>
				<p class="${"svelte-11f89ju"}">Somethings more about me</p></div></a>
		<a href="${"/about"}" class="${"svelte-11f89ju"}"><div class="${"card svelte-11f89ju"}"><h2 class="${"svelte-11f89ju"}">Blog</h2>
				<p class="${"svelte-11f89ju"}">Somethings more about me</p></div></a>
		<a href="${"/about"}" class="${"svelte-11f89ju"}"><div class="${"card svelte-11f89ju"}"><h2 class="${"svelte-11f89ju"}">Resume</h2>
				<p class="${"svelte-11f89ju"}">Somethings more about me</p></div></a></div></main>

`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Routes
});
var projects_svelte = ".container.svelte-jr3cfz{max-width:900px;display:flex;justify-content:center}";
const css$4 = {
  code: ".container.svelte-jr3cfz{max-width:900px;display:flex;justify-content:center}",
  map: '{"version":3,"file":"projects.svelte","sources":["projects.svelte"],"sourcesContent":["<script>\\r\\n</script>\\r\\n\\r\\n<main class=\\"container\\">\\r\\n\\t<h1>Projects</h1>\\r\\n</main>\\r\\n\\r\\n<style>\\r\\n\\t.container {\\r\\n\\t\\tmax-width: 900px;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAQC,UAAU,cAAC,CAAC,AACX,SAAS,CAAE,KAAK,CAChB,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,AACxB,CAAC"}'
};
const Projects = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$4);
  return `<main class="${"container svelte-jr3cfz"}"><h1>Projects</h1>
</main>`;
});
var projects = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Projects
});
var about_svelte = ".container.svelte-jr3cfz{max-width:900px;display:flex;justify-content:center}";
const css$3 = {
  code: ".container.svelte-jr3cfz{max-width:900px;display:flex;justify-content:center}",
  map: '{"version":3,"file":"about.svelte","sources":["about.svelte"],"sourcesContent":["<script>\\r\\n</script>\\r\\n\\r\\n<main class=\\"container\\">\\r\\n\\t<h1>About</h1>\\r\\n</main>\\r\\n\\r\\n<style>\\r\\n\\t.container {\\r\\n\\t\\tmax-width: 900px;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAQC,UAAU,cAAC,CAAC,AACX,SAAS,CAAE,KAAK,CAChB,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,AACxB,CAAC"}'
};
const About = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$3);
  return `<main class="${"container svelte-jr3cfz"}"><h1>About</h1>
</main>`;
});
var about = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: About
});
var Hamburger_svelte = "svg.svelte-mairjn.svelte-mairjn{min-height:24px;transition:transform 0.3s ease-in-out}svg.svelte-mairjn line.svelte-mairjn{stroke:currentColor;stroke-width:3;transition:transform 0.3s ease-in-out}button.svelte-mairjn.svelte-mairjn{color:white;background:transparent;border:transparent;display:flex;justify-content:center;align-items:center;z-index:20}.open.svelte-mairjn svg.svelte-mairjn{transform:scale(0.7)}.open.svelte-mairjn #top.svelte-mairjn{transform:translate(6px, 0px) rotate(45deg)}.open.svelte-mairjn #middle.svelte-mairjn{stroke-dasharray:0;stroke-dashoffset:0;animation:svelte-mairjn-fade 1s ease-in alternate forwards}@keyframes svelte-mairjn-fade{to{stroke-dashoffset:1000;stroke-dasharray:1000}}.open.svelte-mairjn #bottom.svelte-mairjn{transform:translate(-12px, 9px) rotate(-45deg)}";
const css$2 = {
  code: "svg.svelte-mairjn.svelte-mairjn{min-height:24px;transition:transform 0.3s ease-in-out}svg.svelte-mairjn line.svelte-mairjn{stroke:currentColor;stroke-width:3;transition:transform 0.3s ease-in-out}button.svelte-mairjn.svelte-mairjn{color:white;background:transparent;border:transparent;display:flex;justify-content:center;align-items:center;z-index:20}.open.svelte-mairjn svg.svelte-mairjn{transform:scale(0.7)}.open.svelte-mairjn #top.svelte-mairjn{transform:translate(6px, 0px) rotate(45deg)}.open.svelte-mairjn #middle.svelte-mairjn{stroke-dasharray:0;stroke-dashoffset:0;animation:svelte-mairjn-fade 1s ease-in alternate forwards}@keyframes svelte-mairjn-fade{to{stroke-dashoffset:1000;stroke-dasharray:1000}}.open.svelte-mairjn #bottom.svelte-mairjn{transform:translate(-12px, 9px) rotate(-45deg)}",
  map: '{"version":3,"file":"Hamburger.svelte","sources":["Hamburger.svelte"],"sourcesContent":["<script>\\r\\n  export let open = false;\\r\\n</script>\\r\\n\\r\\n<button\\r\\n  class=\\"text-gray-500 hover:text-gray-700 cursor-pointer mr-4 border-none focus:outline-none\\"\\r\\n  class:open\\r\\n  on:click={() => (open = !open)}\\r\\n>\\r\\n  <svg width=\\"32\\" height=\\"24\\">\\r\\n    <line id=\\"top\\" x1=\\"0\\" y1=\\"2\\" x2=\\"32\\" y2=\\"2\\" />\\r\\n    <line id=\\"middle\\" x1=\\"0\\" y1=\\"12\\" x2=\\"32\\" y2=\\"12\\" />\\r\\n    <line id=\\"bottom\\" x1=\\"0\\" y1=\\"22\\" x2=\\"32\\" y2=\\"22\\" />\\r\\n  </svg>\\r\\n</button>\\r\\n\\r\\n<style>\\r\\n  svg {\\r\\n    min-height: 24px;\\r\\n    transition: transform 0.3s ease-in-out;\\r\\n  }\\r\\n\\r\\n  svg line {\\r\\n    stroke: currentColor;\\r\\n    stroke-width: 3;\\r\\n    transition: transform 0.3s ease-in-out;\\r\\n  }\\r\\n\\r\\n  button {\\r\\n    color: white;\\r\\n    background: transparent;\\r\\n    border: transparent;\\r\\n    display: flex;\\r\\n    justify-content: center;\\r\\n    align-items: center;\\r\\n    z-index: 20;\\r\\n  }\\r\\n\\r\\n  .open svg {\\r\\n    transform: scale(0.7);\\r\\n  }\\r\\n\\r\\n  .open #top {\\r\\n    transform: translate(6px, 0px) rotate(45deg);\\r\\n  }\\r\\n\\r\\n  .open #middle {\\r\\n    /* opacity: 0; */\\r\\n    stroke-dasharray: 0;\\r\\n    stroke-dashoffset: 0;\\r\\n    /* animation: dash 1s linear forwards; */\\r\\n    animation: fade 1s ease-in alternate forwards;\\r\\n  }\\r\\n\\r\\n  @keyframes fade {\\r\\n    to {\\r\\n      stroke-dashoffset: 1000;\\r\\n      stroke-dasharray: 1000;\\r\\n    }\\r\\n  }\\r\\n\\r\\n  .open #bottom {\\r\\n    transform: translate(-12px, 9px) rotate(-45deg);\\r\\n  }\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAiBE,GAAG,4BAAC,CAAC,AACH,UAAU,CAAE,IAAI,CAChB,UAAU,CAAE,SAAS,CAAC,IAAI,CAAC,WAAW,AACxC,CAAC,AAED,iBAAG,CAAC,IAAI,cAAC,CAAC,AACR,MAAM,CAAE,YAAY,CACpB,YAAY,CAAE,CAAC,CACf,UAAU,CAAE,SAAS,CAAC,IAAI,CAAC,WAAW,AACxC,CAAC,AAED,MAAM,4BAAC,CAAC,AACN,KAAK,CAAE,KAAK,CACZ,UAAU,CAAE,WAAW,CACvB,MAAM,CAAE,WAAW,CACnB,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,OAAO,CAAE,EAAE,AACb,CAAC,AAED,mBAAK,CAAC,GAAG,cAAC,CAAC,AACT,SAAS,CAAE,MAAM,GAAG,CAAC,AACvB,CAAC,AAED,mBAAK,CAAC,IAAI,cAAC,CAAC,AACV,SAAS,CAAE,UAAU,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,OAAO,KAAK,CAAC,AAC9C,CAAC,AAED,mBAAK,CAAC,OAAO,cAAC,CAAC,AAEb,gBAAgB,CAAE,CAAC,CACnB,iBAAiB,CAAE,CAAC,CAEpB,SAAS,CAAE,kBAAI,CAAC,EAAE,CAAC,OAAO,CAAC,SAAS,CAAC,QAAQ,AAC/C,CAAC,AAED,WAAW,kBAAK,CAAC,AACf,EAAE,AAAC,CAAC,AACF,iBAAiB,CAAE,IAAI,CACvB,gBAAgB,CAAE,IAAI,AACxB,CAAC,AACH,CAAC,AAED,mBAAK,CAAC,OAAO,cAAC,CAAC,AACb,SAAS,CAAE,UAAU,KAAK,CAAC,CAAC,GAAG,CAAC,CAAC,OAAO,MAAM,CAAC,AACjD,CAAC"}'
};
const Hamburger = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {open = false} = $$props;
  if ($$props.open === void 0 && $$bindings.open && open !== void 0)
    $$bindings.open(open);
  $$result.css.add(css$2);
  return `<button class="${[
    "text-gray-500 hover:text-gray-700 cursor-pointer mr-4 border-none focus:outline-none svelte-mairjn",
    open ? "open" : ""
  ].join(" ").trim()}"><svg width="${"32"}" height="${"24"}" class="${"svelte-mairjn"}"><line id="${"top"}" x1="${"0"}" y1="${"2"}" x2="${"32"}" y2="${"2"}" class="${"svelte-mairjn"}"></line><line id="${"middle"}" x1="${"0"}" y1="${"12"}" x2="${"32"}" y2="${"12"}" class="${"svelte-mairjn"}"></line><line id="${"bottom"}" x1="${"0"}" y1="${"22"}" x2="${"32"}" y2="${"22"}" class="${"svelte-mairjn"}"></line></svg>
</button>`;
});
var NavBar_svelte = "h1.svelte-sponun.svelte-sponun{width:30px;margin:0;color:white}.open.svelte-sponun.svelte-sponun{flex-direction:column !important;align-items:center !important;height:250px !important;transition:height 0.2s cubic-bezier(0.455, 0.03, 0.515, 0.955)}.selected.svelte-sponun.svelte-sponun{position:relative}.selected.svelte-sponun.svelte-sponun:after{content:'';background:linear-gradient(315deg, #4158d0 0%, #c850c0 46%, #ffcc70 100%);display:block;height:3px;width:100%;position:absolute;bottom:0}.innerContainer.svelte-sponun.svelte-sponun{display:flex;justify-content:space-between;align-items:center;width:100%;max-width:900px;box-sizing:border-box}.innerContainer.svelte-sponun a{height:30px}.NavBar.svelte-sponun.svelte-sponun{display:flex;flex-direction:column;justify-content:space-between;align-items:center;width:100%;max-width:900px;box-sizing:border-box;padding:20px;height:80px;overflow:hidden;transition:height 0.2s cubic-bezier(0.455, 0.03, 0.515, 0.955)}.responsiveButtons.svelte-sponun.svelte-sponun{display:none !important;margin-top:20px}.buttons.svelte-sponun.svelte-sponun{display:none;justify-content:space-between;align-items:center}.responsiveButtons.svelte-sponun.svelte-sponun{width:100%;display:flex !important;flex-direction:column}.responsiveButtons.svelte-sponun .button.svelte-sponun{width:100%;text-align:center}.buttons.svelte-sponun .button.svelte-sponun{padding:0;cursor:pointer;transition:color 0.2s ease-in-out;text-decoration:none;color:white;position:relative}.button.svelte-sponun div.svelte-sponun{padding:0;margin:10px}.button.svelte-sponun div.svelte-sponun:hover{color:white;cursor:pointer;background:linear-gradient(155deg, rgba(255, 255, 255, 0.15), transparent);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);-webkit-animation:cardWobble 10000ms infinite;animation:cardWobble 10000ms infinite}.burger.svelte-sponun button{margin:0}@media(min-width: 900px){.NavBar.svelte-sponun.svelte-sponun{display:flex;flex-direction:column;justify-content:center;align-items:center;max-width:900px;margin:0 auto}.buttons.svelte-sponun.svelte-sponun{display:flex}.NavBar.svelte-sponun .burger.svelte-sponun{display:none !important}.responsiveButtons.svelte-sponun.svelte-sponun{display:none !important}}";
const css$1 = {
  code: "h1.svelte-sponun.svelte-sponun{width:30px;margin:0;color:white}.open.svelte-sponun.svelte-sponun{flex-direction:column !important;align-items:center !important;height:250px !important;transition:height 0.2s cubic-bezier(0.455, 0.03, 0.515, 0.955)}.selected.svelte-sponun.svelte-sponun{position:relative}.selected.svelte-sponun.svelte-sponun:after{content:'';background:linear-gradient(315deg, #4158d0 0%, #c850c0 46%, #ffcc70 100%);display:block;height:3px;width:100%;position:absolute;bottom:0}.innerContainer.svelte-sponun.svelte-sponun{display:flex;justify-content:space-between;align-items:center;width:100%;max-width:900px;box-sizing:border-box}.innerContainer.svelte-sponun a{height:30px}.NavBar.svelte-sponun.svelte-sponun{display:flex;flex-direction:column;justify-content:space-between;align-items:center;width:100%;max-width:900px;box-sizing:border-box;padding:20px;height:80px;overflow:hidden;transition:height 0.2s cubic-bezier(0.455, 0.03, 0.515, 0.955)}.responsiveButtons.svelte-sponun.svelte-sponun{display:none !important;margin-top:20px}.buttons.svelte-sponun.svelte-sponun{display:none;justify-content:space-between;align-items:center}.responsiveButtons.svelte-sponun.svelte-sponun{width:100%;display:flex !important;flex-direction:column}.responsiveButtons.svelte-sponun .button.svelte-sponun{width:100%;text-align:center}.buttons.svelte-sponun .button.svelte-sponun{padding:0;cursor:pointer;transition:color 0.2s ease-in-out;text-decoration:none;color:white;position:relative}.button.svelte-sponun div.svelte-sponun{padding:0;margin:10px}.button.svelte-sponun div.svelte-sponun:hover{color:white;cursor:pointer;background:linear-gradient(155deg, rgba(255, 255, 255, 0.15), transparent);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);-webkit-animation:cardWobble 10000ms infinite;animation:cardWobble 10000ms infinite}.burger.svelte-sponun button{margin:0}@media(min-width: 900px){.NavBar.svelte-sponun.svelte-sponun{display:flex;flex-direction:column;justify-content:center;align-items:center;max-width:900px;margin:0 auto}.buttons.svelte-sponun.svelte-sponun{display:flex}.NavBar.svelte-sponun .burger.svelte-sponun{display:none !important}.responsiveButtons.svelte-sponun.svelte-sponun{display:none !important}}",
  map: `{"version":3,"file":"NavBar.svelte","sources":["NavBar.svelte"],"sourcesContent":["<!-- <script context=\\"module\\" \u2702prettier:content\u2702=\\"CglleHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZCh7IHBhZ2UgfSkgewoJCXJldHVybiB7IHByb3BzOiB7IHBhZ2UgfSB9OwoJfQo=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\" \u2702prettier:content\u2702=\\"e30=\\">{}</script> -->\\r\\n<script>\\r\\n\\timport Burger from './Hamburger.svelte';\\r\\n\\r\\n\\tlet opened = false;\\r\\n\\texport let segment;\\r\\n\\r\\n\\t$: console.log(segment);\\r\\n</script>\\r\\n\\r\\n<nav class={opened ? 'NavBar open' : 'NavBar'}>\\r\\n\\t<div class=\\"innerContainer\\">\\r\\n\\t\\t<a href=\\"/\\">\\r\\n\\t\\t\\t<h1>DC</h1>\\r\\n\\t\\t</a>\\r\\n\\t\\t<div class=\\"burger\\">\\r\\n\\t\\t\\t<Burger bind:open={opened} />\\r\\n\\t\\t</div>\\r\\n\\t\\t<div class=\\"buttons\\">\\r\\n\\t\\t\\t<a class=\\"button\\" href=\\"/\\"><div class={segment === '/' && 'selected'}>Home</div></a>\\r\\n\\t\\t\\t<a class=\\"button\\" href=\\"/projects\\"\\r\\n\\t\\t\\t\\t><div class={segment === '/projects' && 'selected'}>Projects</div>\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t\\t<a class=\\"button\\" href=\\"/about\\"><div class={segment === '/about' && 'selected'}>About</div></a\\r\\n\\t\\t\\t>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n\\t<div class=\\"responsiveButtons buttons\\">\\r\\n\\t\\t<a class=\\"button\\" href=\\"/\\"><div class={segment === '/' && 'selected'}>Home</div></a>\\r\\n\\t\\t<a class=\\"button\\" href=\\"/projects\\"\\r\\n\\t\\t\\t><div class={segment === '/projects' && 'selected'}>Projects</div></a\\r\\n\\t\\t>\\r\\n\\t\\t<a class=\\"button\\" href=\\"/about\\"><div class={segment === '/about' && 'selected'}>About</div></a>\\r\\n\\t</div>\\r\\n</nav>\\r\\n\\r\\n<style>\\r\\n\\th1 {\\r\\n\\t\\twidth: 30px;\\r\\n\\t\\tmargin: 0;\\r\\n\\t\\tcolor: white;\\r\\n\\t}\\r\\n\\r\\n\\t.open {\\r\\n\\t\\tflex-direction: column !important;\\r\\n\\t\\talign-items: center !important;\\r\\n\\t\\theight: 250px !important;\\r\\n\\t\\ttransition: height 0.2s cubic-bezier(0.455, 0.03, 0.515, 0.955);\\r\\n\\t}\\r\\n\\r\\n\\t.selected {\\r\\n\\t\\tposition: relative;\\r\\n\\t}\\r\\n\\t.selected:after {\\r\\n\\t\\tcontent: '';\\r\\n\\t\\tbackground: linear-gradient(315deg, #4158d0 0%, #c850c0 46%, #ffcc70 100%);\\r\\n\\t\\tdisplay: block;\\r\\n\\t\\theight: 3px;\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\tbottom: 0;\\r\\n\\t}\\r\\n\\r\\n\\t.innerContainer {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tjustify-content: space-between;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tmax-width: 900px;\\r\\n\\t\\tbox-sizing: border-box;\\r\\n\\t}\\r\\n\\t.innerContainer :global(a) {\\r\\n\\t\\theight: 30px;\\r\\n\\t}\\r\\n\\r\\n\\t.NavBar {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\tjustify-content: space-between;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tmax-width: 900px;\\r\\n\\t\\tbox-sizing: border-box;\\r\\n\\t\\tpadding: 20px;\\r\\n\\t\\theight: 80px;\\r\\n\\t\\toverflow: hidden;\\r\\n\\t\\ttransition: height 0.2s cubic-bezier(0.455, 0.03, 0.515, 0.955);\\r\\n\\t}\\r\\n\\r\\n\\t.responsiveButtons {\\r\\n\\t\\tdisplay: none !important;\\r\\n\\t\\tmargin-top: 20px;\\r\\n\\t}\\r\\n\\t.buttons {\\r\\n\\t\\tdisplay: none;\\r\\n\\t\\tjustify-content: space-between;\\r\\n\\t\\talign-items: center;\\r\\n\\t}\\r\\n\\r\\n\\t.responsiveButtons {\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tdisplay: flex !important;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t}\\r\\n\\r\\n\\t.responsiveButtons .button {\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\ttext-align: center;\\r\\n\\t}\\r\\n\\r\\n\\t.buttons .button {\\r\\n\\t\\t/* padding: 10px; */\\r\\n\\t\\tpadding: 0;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\ttransition: color 0.2s ease-in-out;\\r\\n\\t\\ttext-decoration: none;\\r\\n\\t\\tcolor: white;\\r\\n\\t\\t/* line-height: 1.75; */\\r\\n\\t\\tposition: relative;\\r\\n\\t}\\r\\n\\r\\n\\t.button div {\\r\\n\\t\\tpadding: 0;\\r\\n\\t\\tmargin: 10px;\\r\\n\\t}\\r\\n\\t.button div:hover {\\r\\n\\t\\tcolor: white;\\r\\n\\t\\tcursor: pointer;\\r\\n\\r\\n\\t\\tbackground: linear-gradient(155deg, rgba(255, 255, 255, 0.15), transparent);\\r\\n\\t\\t-webkit-backdrop-filter: blur(20px);\\r\\n\\t\\tbackdrop-filter: blur(20px);\\r\\n\\t\\t-webkit-animation: cardWobble 10000ms infinite;\\r\\n\\t\\tanimation: cardWobble 10000ms infinite;\\r\\n\\t}\\r\\n\\r\\n\\t.burger :global(button) {\\r\\n\\t\\tmargin: 0;\\r\\n\\t}\\r\\n\\t@media (min-width: 900px) {\\r\\n\\t\\t.NavBar {\\r\\n\\t\\t\\t/* padding: 20px 0 0 0; */\\r\\n\\t\\t\\tdisplay: flex;\\r\\n\\t\\t\\tflex-direction: column;\\r\\n\\t\\t\\tjustify-content: center;\\r\\n\\t\\t\\talign-items: center;\\r\\n\\t\\t\\tmax-width: 900px;\\r\\n\\t\\t\\tmargin: 0 auto;\\r\\n\\t\\t}\\r\\n\\r\\n\\t\\t.buttons {\\r\\n\\t\\t\\tdisplay: flex;\\r\\n\\t\\t}\\r\\n\\r\\n\\t\\t.NavBar .burger {\\r\\n\\t\\t\\tdisplay: none !important;\\r\\n\\t\\t}\\r\\n\\t\\t.responsiveButtons {\\r\\n\\t\\t\\tdisplay: none !important;\\r\\n\\t\\t}\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"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"}`
};
const NavBar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let opened = false;
  let {segment} = $$props;
  if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0)
    $$bindings.segment(segment);
  $$result.css.add(css$1);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    {
      console.log(segment);
    }
    $$rendered = `


<nav class="${escape(null_to_empty(opened ? "NavBar open" : "NavBar")) + " svelte-sponun"}"><div class="${"innerContainer svelte-sponun"}"><a href="${"/"}"><h1 class="${"svelte-sponun"}">DC</h1></a>
		<div class="${"burger svelte-sponun"}">${validate_component(Hamburger, "Burger").$$render($$result, {open: opened}, {
      open: ($$value) => {
        opened = $$value;
        $$settled = false;
      }
    }, {})}</div>
		<div class="${"buttons svelte-sponun"}"><a class="${"button svelte-sponun"}" href="${"/"}"><div class="${escape(null_to_empty(segment === "/" && "selected")) + " svelte-sponun"}">Home</div></a>
			<a class="${"button svelte-sponun"}" href="${"/projects"}"><div class="${escape(null_to_empty(segment === "/projects" && "selected")) + " svelte-sponun"}">Projects</div></a>
			<a class="${"button svelte-sponun"}" href="${"/about"}"><div class="${escape(null_to_empty(segment === "/about" && "selected")) + " svelte-sponun"}">About</div></a></div></div>
	<div class="${"responsiveButtons buttons svelte-sponun"}"><a class="${"button svelte-sponun"}" href="${"/"}"><div class="${escape(null_to_empty(segment === "/" && "selected")) + " svelte-sponun"}">Home</div></a>
		<a class="${"button svelte-sponun"}" href="${"/projects"}"><div class="${escape(null_to_empty(segment === "/projects" && "selected")) + " svelte-sponun"}">Projects</div></a>
		<a class="${"button svelte-sponun"}" href="${"/about"}"><div class="${escape(null_to_empty(segment === "/about" && "selected")) + " svelte-sponun"}">About</div></a></div>
</nav>`;
  } while (!$$settled);
  return $$rendered;
});
const getStores = () => {
  const stores = getContext("__svelte__");
  return {
    page: {
      subscribe: stores.page.subscribe
    },
    navigating: {
      subscribe: stores.navigating.subscribe
    },
    get preloading() {
      console.error("stores.preloading is deprecated; use stores.navigating instead");
      return {
        subscribe: stores.navigating.subscribe
      };
    },
    session: stores.session
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
var $layout_svelte = ".svelte-vxg1bn.svelte-vxg1bn{box-sizing:border-box;font-family:'B612', sans-serif}#svelte{width:100%;height:100%;max-width:900px;display:flex;flex-direction:column;justify-content:space-between}html,body{position:relative;width:100%;height:100%;overflow:auto;font-family:'B612', sans-serif}@keyframes svelte-vxg1bn-gradient{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}body{background:linear-gradient(43deg, #4158d0 0%, #c850c0 46%, #ffcc70 100%);background-size:200% 200%;animation:svelte-vxg1bn-gradient 10s ease infinite;color:white;margin:0;box-sizing:border-box;display:grid;line-height:1.75;place-items:center;height:100%}h1{border:0}::selection{color:white;background:#f3a712}::-webkit-scrollbar{width:8px;height:8px;border-radius:1px}::-webkit-scrollbar-thumb{background-color:#fafffd;border-radius:3px}::-webkit-scrollbar-track{background-color:transparent;border-radius:1px}@media(min-width: 900px){body{padding:0 100px}}a{text-decoration:none}a{text-decoration:none}a.svelte-vxg1bn.svelte-vxg1bn{color:rgb(0, 100, 200);text-decoration:none}a.svelte-vxg1bn.svelte-vxg1bn:hover{text-decoration:underline}a.svelte-vxg1bn.svelte-vxg1bn:visited{color:rgb(0, 80, 160)}footer.svelte-vxg1bn.svelte-vxg1bn{font-size:16px;font-weight:400;padding:10px 0;max-width:900px;text-align:center;width:100%}footer.svelte-vxg1bn .svelte.svelte-vxg1bn{color:#ff3e00}a.svelte-vxg1bn.svelte-vxg1bn{text-decoration:none;color:#f3a712}";
const css = {
  code: ".svelte-vxg1bn.svelte-vxg1bn{box-sizing:border-box;font-family:'B612', sans-serif}#svelte{width:100%;height:100%;max-width:900px;display:flex;flex-direction:column;justify-content:space-between}html,body{position:relative;width:100%;height:100%;overflow:auto;font-family:'B612', sans-serif}@keyframes svelte-vxg1bn-gradient{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}body{background:linear-gradient(43deg, #4158d0 0%, #c850c0 46%, #ffcc70 100%);background-size:200% 200%;animation:svelte-vxg1bn-gradient 10s ease infinite;color:white;margin:0;box-sizing:border-box;display:grid;line-height:1.75;place-items:center;height:100%}h1{border:0}::selection{color:white;background:#f3a712}::-webkit-scrollbar{width:8px;height:8px;border-radius:1px}::-webkit-scrollbar-thumb{background-color:#fafffd;border-radius:3px}::-webkit-scrollbar-track{background-color:transparent;border-radius:1px}@media(min-width: 900px){body{padding:0 100px}}a{text-decoration:none}a{text-decoration:none}a.svelte-vxg1bn.svelte-vxg1bn{color:rgb(0, 100, 200);text-decoration:none}a.svelte-vxg1bn.svelte-vxg1bn:hover{text-decoration:underline}a.svelte-vxg1bn.svelte-vxg1bn:visited{color:rgb(0, 80, 160)}footer.svelte-vxg1bn.svelte-vxg1bn{font-size:16px;font-weight:400;padding:10px 0;max-width:900px;text-align:center;width:100%}footer.svelte-vxg1bn .svelte.svelte-vxg1bn{color:#ff3e00}a.svelte-vxg1bn.svelte-vxg1bn{text-decoration:none;color:#f3a712}",
  map: `{"version":3,"file":"$layout.svelte","sources":["$layout.svelte"],"sourcesContent":["<script>\\r\\n\\timport Navbar from '$lib/components/NavBar.svelte';\\r\\n\\timport { fly } from 'svelte/transition';\\r\\n\\t// import PageTransitions from '$lib/components/PageTransitions.svelte';\\r\\n\\timport { page } from '$app/stores';\\r\\n</script>\\r\\n\\r\\n<Navbar segment={$page.path} />\\r\\n<!-- <PageTransitions refresh={$page.path}> -->\\r\\n\\r\\n<slot />\\r\\n\\r\\n<!-- </PageTransitions> -->\\r\\n\\r\\n<footer>\\r\\n\\tCreated by <a class=\\"me\\" href=\\"about\\">Me</a> \u2764\uFE0F with\\r\\n\\t<span class=\\"svelte\\">Svelte</span>\\r\\n</footer>\\r\\n\\r\\n<style>\\r\\n\\t* {\\r\\n\\t\\tbox-sizing: border-box;\\r\\n\\t\\tfont-family: 'B612', sans-serif;\\r\\n\\t}\\r\\n\\r\\n\\t:global(#svelte) {\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\theight: 100%;\\r\\n\\t\\tmax-width: 900px;\\r\\n\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\tjustify-content: space-between;\\r\\n\\t}\\r\\n\\r\\n\\t:global(html),\\r\\n\\t:global(body) {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\theight: 100%;\\r\\n\\t\\toverflow: auto;\\r\\n\\t\\tfont-family: 'B612', sans-serif;\\r\\n\\t}\\r\\n\\r\\n\\t@keyframes gradient {\\r\\n\\t\\t0% {\\r\\n\\t\\t\\tbackground-position: 0% 50%;\\r\\n\\t\\t}\\r\\n\\t\\t50% {\\r\\n\\t\\t\\tbackground-position: 100% 50%;\\r\\n\\t\\t}\\r\\n\\t\\t100% {\\r\\n\\t\\t\\tbackground-position: 0% 50%;\\r\\n\\t\\t}\\r\\n\\t}\\r\\n\\r\\n\\t:global(body) {\\r\\n\\t\\t/* background-color: #4158d0; */\\r\\n\\t\\tbackground: linear-gradient(43deg, #4158d0 0%, #c850c0 46%, #ffcc70 100%);\\r\\n\\t\\tbackground-size: 200% 200%;\\r\\n\\t\\tanimation: gradient 10s ease infinite;\\r\\n\\t\\tcolor: white;\\r\\n\\t\\tmargin: 0;\\r\\n\\t\\tbox-sizing: border-box;\\r\\n\\t\\tdisplay: grid;\\r\\n\\t\\tline-height: 1.75;\\r\\n\\t\\tplace-items: center;\\r\\n\\t\\theight: 100%;\\r\\n\\t}\\r\\n\\r\\n\\t:global(h1) {\\r\\n\\t\\tborder: 0;\\r\\n\\t}\\r\\n\\r\\n\\t:global(::selection) {\\r\\n\\t\\tcolor: white;\\r\\n\\t\\tbackground: #f3a712;\\r\\n\\t}\\r\\n\\r\\n\\t:global(::-webkit-scrollbar) {\\r\\n\\t\\twidth: 8px;\\r\\n\\t\\theight: 8px;\\r\\n\\t\\tborder-radius: 1px;\\r\\n\\t}\\r\\n\\r\\n\\t:global(::-webkit-scrollbar-thumb) {\\r\\n\\t\\tbackground-color: #fafffd;\\r\\n\\t\\tborder-radius: 3px;\\r\\n\\t}\\r\\n\\r\\n\\t:global(::-webkit-scrollbar-track) {\\r\\n\\t\\tbackground-color: transparent;\\r\\n\\t\\tborder-radius: 1px;\\r\\n\\t}\\r\\n\\r\\n\\t@media (min-width: 900px) {\\r\\n\\t\\t:global(body) {\\r\\n\\t\\t\\tpadding: 0 100px;\\r\\n\\t\\t}\\r\\n\\t}\\r\\n\\r\\n\\t:global(a) {\\r\\n\\t\\ttext-decoration: none;\\r\\n\\t}\\r\\n\\r\\n\\t:global(a) {\\r\\n\\t\\ttext-decoration: none;\\r\\n\\t}\\r\\n\\r\\n\\ta {\\r\\n\\t\\tcolor: rgb(0, 100, 200);\\r\\n\\t\\ttext-decoration: none;\\r\\n\\t}\\r\\n\\r\\n\\ta:hover {\\r\\n\\t\\ttext-decoration: underline;\\r\\n\\t}\\r\\n\\r\\n\\ta:visited {\\r\\n\\t\\tcolor: rgb(0, 80, 160);\\r\\n\\t}\\r\\n\\r\\n\\t.container {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tmax-width: 900px;\\r\\n\\t}\\r\\n\\r\\n\\tfooter {\\r\\n\\t\\tfont-size: 16px;\\r\\n\\t\\tfont-weight: 400;\\r\\n\\t\\tpadding: 10px 0;\\r\\n\\t\\tmax-width: 900px;\\r\\n\\t\\ttext-align: center;\\r\\n\\t\\twidth: 100%;\\r\\n\\t}\\r\\n\\r\\n\\tfooter .svelte {\\r\\n\\t\\tcolor: #ff3e00;\\r\\n\\t}\\r\\n\\r\\n\\ta {\\r\\n\\t\\ttext-decoration: none;\\r\\n\\t\\tcolor: #f3a712;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"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"}`
};
const $layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$result.css.add(css);
  $$unsubscribe_page();
  return `${validate_component(NavBar, "Navbar").$$render($$result, {segment: $page.path}, {}, {})}


${slots.default ? slots.default({}) : ``}



<footer class="${"svelte-vxg1bn"}">Created by <a class="${"me svelte-vxg1bn"}" href="${"about"}">Me</a> \u2764\uFE0F with
	<span class="${"svelte svelte-vxg1bn"}">Svelte</span>
</footer>`;
});
var $layout$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: $layout
});
export {init, render};
