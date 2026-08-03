const levels = ['debug', 'info', 'log', 'warn', 'error'];

function serialize(value) {
  if (value instanceof Error) return value.stack || `${value.name}: ${value.message}`;
  if (typeof value === 'string') return value;
  try {
    const json = JSON.stringify(value);
    return json === undefined ? String(value) : json;
  } catch {
    return String(value);
  }
}

export function clientLogRecord(level, values) {
  return {
    level: levels.includes(level) ? level : 'log',
    message: values.map(serialize).join(' '),
  };
}

export function installClientLogBridge({ consoleObject, windowObject, send }) {
  const originals = new Map(levels.map((level) => [level, consoleObject[level].bind(consoleObject)]));
  const dispatch = (record) => {
    try {
      Promise.resolve(send(record)).catch(() => {});
    } catch {
      // The terminal bridge must never create another browser failure.
    }
  };

  for (const level of levels) {
    consoleObject[level] = (...values) => {
      originals.get(level)(...values);
      dispatch(clientLogRecord(level, values));
    };
  }

  const onError = (event) => dispatch(clientLogRecord('error', [event.error ?? event.message ?? 'Unknown browser error']));
  const onUnhandledRejection = (event) => dispatch(clientLogRecord('error', [event.reason ?? 'Unhandled promise rejection']));
  windowObject.addEventListener('error', onError);
  windowObject.addEventListener('unhandledrejection', onUnhandledRejection);

  return () => {
    for (const [level, original] of originals) consoleObject[level] = original;
    windowObject.removeEventListener('error', onError);
    windowObject.removeEventListener('unhandledrejection', onUnhandledRejection);
  };
}
