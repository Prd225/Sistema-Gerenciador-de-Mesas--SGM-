const fs = require('fs');

const path = 'Firefox 2026-07-05 01.22 profile.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// Find the content thread with the most samples (usually the active tab)
let targetThread = null;
let maxSamples = 0;

for (const t of data.threads) {
  if (t.name === 'GeckoMain' && t.processType === 'tab') {
    const samplesCount = Array.isArray(t.samples) ? t.samples.length : (t.samples && t.samples.data ? t.samples.data.length : (t.samples && t.samples.length ? t.samples.length : 0));
    if (samplesCount > maxSamples) {
      maxSamples = samplesCount;
      targetThread = t;
    }
  }
}

if (!targetThread) {
  console.log("No tab thread found with samples.");
  process.exit(1);
}

const funcTable = targetThread.funcTable;
const stringTable = targetThread.stringTable;
const stackTable = targetThread.stackTable;
const frameTable = targetThread.frameTable;
const samples = targetThread.samples;
const samplesData = Array.isArray(samples) ? samples : samples.data;

if (!samplesData || samplesData.length === 0) {
  console.log("No sample data");
  process.exit(1);
}

const funcTime = {};

// samples can be array of integers (stackIds) or array of arrays
const stackIdx = samples.schema ? samples.schema.stack : 0;

for (let i = 0; i < samplesData.length; i++) {
  const sample = samplesData[i];
  const stackId = typeof sample === 'number' ? sample : sample[stackIdx];
  if (stackId === null || stackId === undefined) continue;
  
  let currentStack = stackId;
  const seenInSample = new Set();
  
  while (currentStack !== null && currentStack !== undefined) {
    const frameId = stackTable.data ? stackTable.data[currentStack][stackTable.schema.frame] : stackTable[currentStack];
    // if stackTable is array of objects or arrays, we need schema
    const fId = stackTable.data ? frameId : currentStack; // simplified, actually needs schema
    
    // just try standard gecko profile schema
    try {
        const frameRow = stackTable.data[currentStack];
        const actualFrameId = frameRow[stackTable.schema.frame];
        const funcId = frameTable.data[actualFrameId][frameTable.schema.func];
        
        if (!seenInSample.has(funcId)) {
          seenInSample.add(funcId);
          funcTime[funcId] = (funcTime[funcId] || 0) + 1;
        }
        
        currentStack = frameRow[stackTable.schema.prefix];
    } catch(e) {
        break; // skip if we can't parse
    }
  }
}

const sortedFuncs = Object.keys(funcTime).sort((a, b) => funcTime[b] - funcTime[a]);

console.log("Top 20 most frequent functions in samples for thread:", targetThread.name, "pid:", targetThread.pid);
for (let i = 0; i < Math.min(20, sortedFuncs.length); i++) {
  const funcId = sortedFuncs[i];
  const nameIdx = funcTable.data[funcId][funcTable.schema.name];
  const name = stringTable[nameIdx];
  console.log(`${name}: ${funcTime[funcId]} samples`);
}
